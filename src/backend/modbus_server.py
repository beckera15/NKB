"""
Modbus TCP Server for Rockwell PLC Integration

Exposes LIDAR measurement results via Modbus TCP for integration with
Rockwell ControlLogix/CompactLogix PLCs via Studio 5000.

Register Map (Holding Registers - Function Code 3/6/16):
=========================================================

System Status (40001-40010):
  40001: System Status (0=Offline, 1=Running, 2=Error)
  40002: Active Product ID
  40003: Overall Result (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error)
  40004: Zone Count
  40005-40006: Evaluation Count (32-bit)
  40007-40008: Good Count (32-bit)
  40009-40010: Bad Count (32-bit)

Zone 1 (40101-40120):
  40101: Zone ID
  40102: Zone Enabled (0/1)
  40103: Zone Result (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error)
  40104: In Tolerance (0/1)
  40105-40106: Measurement (32-bit float, IEEE 754)
  40107-40108: Expected Distance (32-bit float)
  40109-40110: Tolerance Plus (32-bit float)
  40111-40112: Tolerance Minus (32-bit float)
  40113-40114: Point Count (32-bit)

Zone 2-16: Same pattern at 40201, 40301, etc.

Coils (Function Code 1/5):
  00001: System Running
  00002: Overall Result Good
  00003: Overall Result Bad
  00011-00026: Zone 1-16 Good
  00031-00046: Zone 1-16 Bad

Control Registers (Write):
  40901: Reset Statistics (write 1 to reset)
  40902: Set Active Product ID
"""

import asyncio
import struct
import threading
import logging
from typing import Optional, Dict, List
import socket

logger = logging.getLogger(__name__)

# Try to import pymodbus library
try:
    from pymodbus.server import StartAsyncTcpServer
    from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
    from pymodbus.datastore import ModbusSequentialDataBlock
    from pymodbus.device import ModbusDeviceIdentification
    MODBUS_AVAILABLE = True
except ImportError:
    MODBUS_AVAILABLE = False
    logger.warning("pymodbus library not installed. Modbus server disabled.")
    logger.warning("Install with: pip install pymodbus")


class ModbusDataStore:
    """
    Custom Modbus data store for LIDAR measurements

    Provides a mapping between measurement results and Modbus registers.
    """

    # Register base addresses
    STATUS_BASE = 0      # 40001
    ZONE_BASE = 100      # 40101, 40201, etc.
    ZONE_SIZE = 100      # Registers per zone
    CONTROL_BASE = 900   # 40901

    # Coil addresses
    COIL_SYSTEM_RUNNING = 0
    COIL_OVERALL_GOOD = 1
    COIL_OVERALL_BAD = 2
    COIL_ZONE_GOOD_BASE = 10    # 00011-00026
    COIL_ZONE_BAD_BASE = 30     # 00031-00046

    MAX_ZONES = 16

    def __init__(self):
        # Initialize data blocks
        # Holding registers (40001-41000)
        self.holding_registers = [0] * 1000

        # Coils (00001-00100)
        self.coils = [False] * 100

        # Input registers (30001-31000) - read only
        self.input_registers = [0] * 1000

        # Thread lock
        self._lock = threading.Lock()

    def update_from_product(self, product, stats: dict) -> None:
        """
        Update Modbus registers from product measurement results

        Args:
            product: ProductConfig with results
            stats: Statistics dictionary
        """
        with self._lock:
            # System status
            self.holding_registers[0] = 1  # Running
            self.holding_registers[1] = product.id if product else 0
            self.holding_registers[2] = int(product.last_result) if product else 0
            self.holding_registers[3] = len(product.zones) if product else 0

            # Statistics (32-bit values split into 2 registers)
            eval_count = stats.get('evaluation_count', 0)
            good_count = stats.get('good_count', 0)
            bad_count = stats.get('bad_count', 0)

            self.holding_registers[4] = (eval_count >> 16) & 0xFFFF  # High word
            self.holding_registers[5] = eval_count & 0xFFFF          # Low word
            self.holding_registers[6] = (good_count >> 16) & 0xFFFF
            self.holding_registers[7] = good_count & 0xFFFF
            self.holding_registers[8] = (bad_count >> 16) & 0xFFFF
            self.holding_registers[9] = bad_count & 0xFFFF

            # Update coils
            self.coils[self.COIL_SYSTEM_RUNNING] = True
            overall_good = product and product.last_result == 1
            self.coils[self.COIL_OVERALL_GOOD] = overall_good
            self.coils[self.COIL_OVERALL_BAD] = product and product.last_result == 2

            # Update zones
            if product:
                for i, zone in enumerate(product.zones[:self.MAX_ZONES]):
                    self._update_zone_registers(i, zone)

                # Clear unused zones
                for i in range(len(product.zones), self.MAX_ZONES):
                    self._clear_zone_registers(i)

    def _update_zone_registers(self, zone_index: int, zone) -> None:
        """Update registers for a single zone"""
        base = self.ZONE_BASE + (zone_index * self.ZONE_SIZE)

        self.holding_registers[base + 0] = zone.id
        self.holding_registers[base + 1] = 1 if zone.enabled else 0
        self.holding_registers[base + 2] = int(zone.last_result)
        self.holding_registers[base + 3] = 1 if zone.last_result == 1 else 0

        # Measurement as 32-bit float (2 registers)
        measurement_bytes = struct.pack('>f', zone.last_measurement)
        self.holding_registers[base + 4] = struct.unpack('>H', measurement_bytes[0:2])[0]
        self.holding_registers[base + 5] = struct.unpack('>H', measurement_bytes[2:4])[0]

        # Expected distance as 32-bit float
        expected_bytes = struct.pack('>f', zone.expected_distance)
        self.holding_registers[base + 6] = struct.unpack('>H', expected_bytes[0:2])[0]
        self.holding_registers[base + 7] = struct.unpack('>H', expected_bytes[2:4])[0]

        # Tolerance plus as 32-bit float
        tol_plus_bytes = struct.pack('>f', zone.tolerance_plus)
        self.holding_registers[base + 8] = struct.unpack('>H', tol_plus_bytes[0:2])[0]
        self.holding_registers[base + 9] = struct.unpack('>H', tol_plus_bytes[2:4])[0]

        # Tolerance minus as 32-bit float
        tol_minus_bytes = struct.pack('>f', zone.tolerance_minus)
        self.holding_registers[base + 10] = struct.unpack('>H', tol_minus_bytes[0:2])[0]
        self.holding_registers[base + 11] = struct.unpack('>H', tol_minus_bytes[2:4])[0]

        # Point count as 32-bit
        self.holding_registers[base + 12] = (zone.point_count >> 16) & 0xFFFF
        self.holding_registers[base + 13] = zone.point_count & 0xFFFF

        # Update zone coils
        zone_good = zone.last_result == 1
        self.coils[self.COIL_ZONE_GOOD_BASE + zone_index] = zone_good
        self.coils[self.COIL_ZONE_BAD_BASE + zone_index] = zone.last_result == 2

    def _clear_zone_registers(self, zone_index: int) -> None:
        """Clear registers for an unused zone"""
        base = self.ZONE_BASE + (zone_index * self.ZONE_SIZE)

        for i in range(14):
            self.holding_registers[base + i] = 0

        self.coils[self.COIL_ZONE_GOOD_BASE + zone_index] = False
        self.coils[self.COIL_ZONE_BAD_BASE + zone_index] = False

    def get_holding_registers(self, address: int, count: int) -> List[int]:
        """Get holding register values"""
        with self._lock:
            return self.holding_registers[address:address + count]

    def get_coils(self, address: int, count: int) -> List[bool]:
        """Get coil values"""
        with self._lock:
            return self.coils[address:address + count]

    def set_holding_register(self, address: int, value: int) -> None:
        """Set a holding register value"""
        with self._lock:
            if 0 <= address < len(self.holding_registers):
                self.holding_registers[address] = value

    def set_coil(self, address: int, value: bool) -> None:
        """Set a coil value"""
        with self._lock:
            if 0 <= address < len(self.coils):
                self.coils[address] = value


class ModbusTCPServer:
    """
    Modbus TCP Server for PLC integration

    Provides simple Modbus TCP server implementation for Rockwell PLCs.
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 502):
        """
        Initialize Modbus TCP server

        Args:
            host: Host to bind to
            port: Modbus TCP port (default 502)
        """
        self.host = host
        self.port = port
        self.data_store = ModbusDataStore()
        self._running = False
        self._server_socket: Optional[socket.socket] = None
        self._thread: Optional[threading.Thread] = None

        # Callbacks for control registers
        self._reset_stats_callback = None
        self._set_product_callback = None

    def set_reset_stats_callback(self, callback) -> None:
        """Set callback for reset statistics command"""
        self._reset_stats_callback = callback

    def set_product_callback(self, callback) -> None:
        """Set callback for set active product command"""
        self._set_product_callback = callback

    def start(self) -> bool:
        """Start the Modbus TCP server"""
        if self._running:
            logger.warning("Modbus server already running")
            return True

        try:
            self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self._server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self._server_socket.bind((self.host, self.port))
            self._server_socket.listen(5)
            self._server_socket.settimeout(1.0)

            self._running = True
            self._thread = threading.Thread(target=self._server_loop, daemon=True)
            self._thread.start()

            logger.info(f"Modbus TCP server started on {self.host}:{self.port}")
            return True

        except Exception as e:
            logger.error(f"Failed to start Modbus server: {e}")
            return False

    def stop(self) -> None:
        """Stop the Modbus TCP server"""
        self._running = False

        if self._server_socket:
            self._server_socket.close()

        if self._thread:
            self._thread.join(timeout=2.0)

        logger.info("Modbus TCP server stopped")

    def _server_loop(self) -> None:
        """Main server loop"""
        while self._running:
            try:
                client_socket, address = self._server_socket.accept()
                logger.debug(f"Modbus client connected: {address}")

                # Handle client in separate thread
                client_thread = threading.Thread(
                    target=self._handle_client,
                    args=(client_socket, address),
                    daemon=True
                )
                client_thread.start()

            except socket.timeout:
                continue
            except Exception as e:
                if self._running:
                    logger.error(f"Server loop error: {e}")

    def _handle_client(self, client_socket: socket.socket, address) -> None:
        """Handle a Modbus TCP client connection"""
        client_socket.settimeout(30.0)

        try:
            while self._running:
                # Receive MBAP header (7 bytes) + PDU
                data = client_socket.recv(260)
                if not data:
                    break

                if len(data) < 8:
                    continue

                # Parse MBAP header
                transaction_id = struct.unpack('>H', data[0:2])[0]
                protocol_id = struct.unpack('>H', data[2:4])[0]
                length = struct.unpack('>H', data[4:6])[0]
                unit_id = data[6]
                function_code = data[7]

                # Handle request
                response = self._process_request(function_code, data[8:])

                if response:
                    # Build response with MBAP header
                    resp_length = len(response) + 2  # +2 for unit_id and function_code
                    mbap = struct.pack('>HHHB', transaction_id, protocol_id, resp_length, unit_id)
                    client_socket.send(mbap + bytes([function_code]) + response)

        except socket.timeout:
            pass
        except Exception as e:
            logger.debug(f"Client handler error: {e}")
        finally:
            client_socket.close()
            logger.debug(f"Modbus client disconnected: {address}")

    def _process_request(self, function_code: int, data: bytes) -> Optional[bytes]:
        """Process a Modbus request and return response data"""

        # Read Coils (FC 01)
        if function_code == 0x01:
            if len(data) < 4:
                return None
            start_addr = struct.unpack('>H', data[0:2])[0]
            count = struct.unpack('>H', data[2:4])[0]

            coils = self.data_store.get_coils(start_addr, count)
            byte_count = (count + 7) // 8
            result = [0] * byte_count

            for i, coil in enumerate(coils):
                if coil:
                    result[i // 8] |= (1 << (i % 8))

            return bytes([byte_count]) + bytes(result)

        # Read Holding Registers (FC 03)
        elif function_code == 0x03:
            if len(data) < 4:
                return None
            start_addr = struct.unpack('>H', data[0:2])[0]
            count = struct.unpack('>H', data[2:4])[0]

            registers = self.data_store.get_holding_registers(start_addr, count)
            byte_count = count * 2
            result = struct.pack('>B', byte_count)

            for reg in registers:
                result += struct.pack('>H', reg)

            return result

        # Write Single Coil (FC 05)
        elif function_code == 0x05:
            if len(data) < 4:
                return None
            address = struct.unpack('>H', data[0:2])[0]
            value = struct.unpack('>H', data[2:4])[0] == 0xFF00

            self.data_store.set_coil(address, value)
            return data[:4]  # Echo request

        # Write Single Register (FC 06)
        elif function_code == 0x06:
            if len(data) < 4:
                return None
            address = struct.unpack('>H', data[0:2])[0]
            value = struct.unpack('>H', data[2:4])[0]

            # Handle control registers
            if address == ModbusDataStore.CONTROL_BASE:  # Reset stats
                if value == 1 and self._reset_stats_callback:
                    self._reset_stats_callback()
            elif address == ModbusDataStore.CONTROL_BASE + 1:  # Set product
                if self._set_product_callback:
                    self._set_product_callback(value)

            self.data_store.set_holding_register(address, value)
            return data[:4]  # Echo request

        # Write Multiple Registers (FC 16)
        elif function_code == 0x10:
            if len(data) < 5:
                return None
            start_addr = struct.unpack('>H', data[0:2])[0]
            count = struct.unpack('>H', data[2:4])[0]
            byte_count = data[4]

            for i in range(count):
                if 5 + i * 2 + 2 <= len(data):
                    value = struct.unpack('>H', data[5 + i * 2:7 + i * 2])[0]
                    self.data_store.set_holding_register(start_addr + i, value)

            return data[:4]  # Echo start address and count

        return None

    def update_from_product(self, product, stats: dict) -> None:
        """Update Modbus data from product results"""
        self.data_store.update_from_product(product, stats)

    def is_running(self) -> bool:
        """Check if server is running"""
        return self._running


# Alternative: Use pymodbus async server if available
class PyModbusServer:
    """
    Modbus TCP Server using pymodbus library

    More robust implementation using the pymodbus library.
    """

    def __init__(self, host: str = "0.0.0.0", port: int = 502):
        self.host = host
        self.port = port
        self.data_store = ModbusDataStore()
        self._running = False
        self._context = None
        self._server = None

    async def start(self) -> bool:
        """Start the pymodbus server"""
        if not MODBUS_AVAILABLE:
            logger.error("pymodbus library not available")
            return False

        try:
            # Create data blocks
            coils = ModbusSequentialDataBlock(0, [0] * 100)
            discrete_inputs = ModbusSequentialDataBlock(0, [0] * 100)
            holding_registers = ModbusSequentialDataBlock(0, [0] * 1000)
            input_registers = ModbusSequentialDataBlock(0, [0] * 1000)

            # Create slave context
            store = ModbusSlaveContext(
                di=discrete_inputs,
                co=coils,
                hr=holding_registers,
                ir=input_registers
            )
            self._context = ModbusServerContext(slaves=store, single=True)

            # Server identity
            identity = ModbusDeviceIdentification()
            identity.VendorName = 'MRS1000 LIDAR'
            identity.ProductCode = 'LIDAR-VIZ'
            identity.VendorUrl = 'http://localhost'
            identity.ProductName = 'LIDAR Measurement Server'
            identity.ModelName = 'MRS1000'

            # Start server
            self._server = await StartAsyncTcpServer(
                context=self._context,
                identity=identity,
                address=(self.host, self.port)
            )

            self._running = True
            logger.info(f"pymodbus TCP server started on {self.host}:{self.port}")
            return True

        except Exception as e:
            logger.error(f"Failed to start pymodbus server: {e}")
            return False

    async def stop(self) -> None:
        """Stop the server"""
        if self._server:
            self._server.shutdown()
            self._running = False
            logger.info("pymodbus server stopped")

    def update_from_product(self, product, stats: dict) -> None:
        """Update registers from product results"""
        if not self._context:
            return

        # Update data store
        self.data_store.update_from_product(product, stats)

        # Copy to pymodbus context
        store = self._context[0]

        # Update holding registers
        for i, val in enumerate(self.data_store.holding_registers[:1000]):
            store.setValues(3, i, [val])  # 3 = holding registers

        # Update coils
        for i, val in enumerate(self.data_store.coils[:100]):
            store.setValues(1, i, [1 if val else 0])  # 1 = coils

    def is_running(self) -> bool:
        return self._running

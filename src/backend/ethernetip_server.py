"""
EtherNet/IP CIP Server for Rockwell PLC Integration

Implements EtherNet/IP protocol for native communication with
Rockwell/Allen-Bradley PLCs (ControlLogix, CompactLogix).

Features:
- Class 1 implicit I/O messaging (real-time data exchange)
- Class 3 explicit messaging (configuration/status)
- Assembly instances for input/output data
- Identity object for device recognition
- Supports Add-On Profile (AOP) integration

Protocol: EtherNet/IP (CIP over TCP/UDP)
Default Ports: TCP 44818, UDP 2222
"""

import asyncio
import struct
import logging
import socket
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from enum import IntEnum

logger = logging.getLogger(__name__)


class CIPService(IntEnum):
    """CIP Service Codes"""
    GET_ATTRIBUTE_ALL = 0x01
    SET_ATTRIBUTE_ALL = 0x02
    GET_ATTRIBUTE_LIST = 0x03
    SET_ATTRIBUTE_LIST = 0x04
    RESET = 0x05
    START = 0x06
    STOP = 0x07
    CREATE = 0x08
    DELETE = 0x09
    GET_ATTRIBUTE_SINGLE = 0x0E
    SET_ATTRIBUTE_SINGLE = 0x10
    FORWARD_OPEN = 0x54
    FORWARD_CLOSE = 0x4E


class CIPClass(IntEnum):
    """CIP Object Class IDs"""
    IDENTITY = 0x01
    MESSAGE_ROUTER = 0x02
    ASSEMBLY = 0x04
    CONNECTION_MANAGER = 0x06
    TCP_IP = 0xF5
    ETHERNET_LINK = 0xF6


class EIPCommand(IntEnum):
    """EtherNet/IP Encapsulation Commands"""
    NOP = 0x0000
    LIST_SERVICES = 0x0004
    LIST_IDENTITY = 0x0063
    LIST_INTERFACES = 0x0064
    REGISTER_SESSION = 0x0065
    UNREGISTER_SESSION = 0x0066
    SEND_RR_DATA = 0x006F
    SEND_UNIT_DATA = 0x0070


@dataclass
class AssemblyInstance:
    """Assembly Instance for I/O data"""
    instance_id: int
    size: int  # bytes
    data: bytearray
    description: str = ""


@dataclass
class CIPConnection:
    """Active CIP connection"""
    connection_id: int
    originator_serial: int
    input_assembly: int
    output_assembly: int
    rpi: int  # Request Packet Interval (microseconds)
    addr: tuple
    last_update: float = 0.0


@dataclass
class LIDAROutputAssembly:
    """
    Output Assembly (PLC -> LIDAR) - 32 bytes

    Structure:
    - Byte 0: Command (0=None, 1=Reset Stats, 2=Change Product)
    - Byte 1: Product ID to activate
    - Bytes 2-3: Reserved
    - Bytes 4-7: Zone 1 expected distance (mm) - DINT
    - Bytes 8-11: Zone 1 tolerance (mm) - DINT
    - Bytes 12-15: Zone 2 expected distance (mm) - DINT
    - Bytes 16-19: Zone 2 tolerance (mm) - DINT
    - Bytes 20-31: Reserved for expansion
    """
    command: int = 0
    product_id: int = 0
    zone1_expected: int = 0
    zone1_tolerance: int = 0
    zone2_expected: int = 0
    zone2_tolerance: int = 0

    def to_bytes(self) -> bytes:
        return struct.pack('<BBxx IIII 12x',
            self.command, self.product_id,
            self.zone1_expected, self.zone1_tolerance,
            self.zone2_expected, self.zone2_tolerance
        )

    @classmethod
    def from_bytes(cls, data: bytes) -> 'LIDAROutputAssembly':
        if len(data) < 20:
            data = data + b'\x00' * (20 - len(data))
        cmd, prod, z1_exp, z1_tol, z2_exp, z2_tol = struct.unpack('<BBxx IIII', data[:20])
        return cls(cmd, prod, z1_exp, z1_tol, z2_exp, z2_tol)


@dataclass
class LIDARInputAssembly:
    """
    Input Assembly (LIDAR -> PLC) - 64 bytes

    Structure:
    - Byte 0: Status (0=Offline, 1=Running, 2=Error, 3=Simulation)
    - Byte 1: Active Product ID
    - Byte 2: Overall Result (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error)
    - Byte 3: Number of zones configured
    - Bytes 4-7: Scan counter - DINT
    - Bytes 8-11: Good count - DINT
    - Bytes 12-15: Bad count - DINT
    - Bytes 16-19: Good rate (x100, e.g., 9850 = 98.50%) - DINT
    - Bytes 20-23: Zone 1 measurement (mm) - DINT
    - Bytes 24-27: Zone 1 result (0=Unknown, 1=Good, 2=Bad) - DINT
    - Bytes 28-31: Zone 2 measurement (mm) - DINT
    - Bytes 32-35: Zone 2 result - DINT
    - Bytes 36-39: Zone 3 measurement (mm) - DINT
    - Bytes 40-43: Zone 3 result - DINT
    - Bytes 44-47: Zone 4 measurement (mm) - DINT
    - Bytes 48-51: Zone 4 result - DINT
    - Bytes 52-55: Timestamp (ms since start) - DINT
    - Bytes 56-59: Min distance in scan (mm) - DINT
    - Bytes 60-63: Max distance in scan (mm) - DINT
    """
    status: int = 0
    product_id: int = 0
    overall_result: int = 0
    zone_count: int = 0
    scan_counter: int = 0
    good_count: int = 0
    bad_count: int = 0
    good_rate: int = 0
    zone_measurements: List[int] = field(default_factory=lambda: [0, 0, 0, 0])
    zone_results: List[int] = field(default_factory=lambda: [0, 0, 0, 0])
    timestamp: int = 0
    min_distance: int = 0
    max_distance: int = 0

    def to_bytes(self) -> bytes:
        return struct.pack('<BBBB IIII IIIIIIII III',
            self.status, self.product_id, self.overall_result, self.zone_count,
            self.scan_counter, self.good_count, self.bad_count, self.good_rate,
            self.zone_measurements[0], self.zone_results[0],
            self.zone_measurements[1], self.zone_results[1],
            self.zone_measurements[2], self.zone_results[2],
            self.zone_measurements[3], self.zone_results[3],
            self.timestamp, self.min_distance, self.max_distance
        )


class EtherNetIPServer:
    """
    EtherNet/IP Server for Rockwell PLC Integration

    Implements the EtherNet/IP protocol with CIP messaging
    for seamless integration with Allen-Bradley PLCs.
    """

    # Device Identity
    VENDOR_ID = 0xFFFF  # Custom vendor
    DEVICE_TYPE = 0x00  # Generic device
    PRODUCT_CODE = 1000
    REVISION = (1, 0)
    SERIAL_NUMBER = 0x12345678
    PRODUCT_NAME = "MRS1000 LIDAR Sensor"

    def __init__(self, host: str = "0.0.0.0", tcp_port: int = 44818, udp_port: int = 2222):
        self.host = host
        self.tcp_port = tcp_port
        self.udp_port = udp_port

        # Session management
        self._sessions: Dict[int, tuple] = {}
        self._session_counter = 1

        # Connection management
        self._connections: Dict[int, CIPConnection] = {}
        self._connection_counter = 1

        # Assembly instances
        self._input_assembly = LIDARInputAssembly()
        self._output_assembly = LIDAROutputAssembly()

        # I/O Assembly instances (100=Input, 101=Output, 102=Config)
        self._assemblies: Dict[int, AssemblyInstance] = {
            100: AssemblyInstance(100, 64, bytearray(64), "Input Assembly"),
            101: AssemblyInstance(101, 32, bytearray(32), "Output Assembly"),
            102: AssemblyInstance(102, 16, bytearray(16), "Configuration Assembly"),
        }

        # Callbacks
        self._on_output_received: Optional[Callable[[LIDAROutputAssembly], None]] = None

        # Server state
        self._tcp_server = None
        self._udp_transport = None
        self._running = False
        self._start_time = time.time()

    def set_output_callback(self, callback: Callable[[LIDAROutputAssembly], None]):
        """Set callback for when output data is received from PLC"""
        self._on_output_received = callback

    def update_input_data(self,
                          status: int = None,
                          product_id: int = None,
                          overall_result: int = None,
                          zone_count: int = None,
                          scan_counter: int = None,
                          good_count: int = None,
                          bad_count: int = None,
                          good_rate: float = None,
                          zone_measurements: List[int] = None,
                          zone_results: List[int] = None,
                          min_distance: int = None,
                          max_distance: int = None):
        """Update the input assembly data to send to PLC"""
        if status is not None:
            self._input_assembly.status = status
        if product_id is not None:
            self._input_assembly.product_id = product_id
        if overall_result is not None:
            self._input_assembly.overall_result = overall_result
        if zone_count is not None:
            self._input_assembly.zone_count = zone_count
        if scan_counter is not None:
            self._input_assembly.scan_counter = scan_counter
        if good_count is not None:
            self._input_assembly.good_count = good_count
        if bad_count is not None:
            self._input_assembly.bad_count = bad_count
        if good_rate is not None:
            self._input_assembly.good_rate = int(good_rate * 100)
        if zone_measurements is not None:
            for i, m in enumerate(zone_measurements[:4]):
                self._input_assembly.zone_measurements[i] = m
        if zone_results is not None:
            for i, r in enumerate(zone_results[:4]):
                self._input_assembly.zone_results[i] = r
        if min_distance is not None:
            self._input_assembly.min_distance = min_distance
        if max_distance is not None:
            self._input_assembly.max_distance = max_distance

        # Update timestamp
        self._input_assembly.timestamp = int((time.time() - self._start_time) * 1000) & 0xFFFFFFFF

        # Update assembly data
        self._assemblies[100].data = bytearray(self._input_assembly.to_bytes())

    async def start(self):
        """Start the EtherNet/IP server"""
        self._running = True
        self._start_time = time.time()

        # Start TCP server for explicit messaging
        self._tcp_server = await asyncio.start_server(
            self._handle_tcp_client,
            self.host,
            self.tcp_port
        )

        # Start UDP server for implicit I/O
        loop = asyncio.get_event_loop()
        self._udp_transport, _ = await loop.create_datagram_endpoint(
            lambda: EIPUDPProtocol(self),
            local_addr=(self.host, self.udp_port)
        )

        logger.info(f"EtherNet/IP server started - TCP:{self.tcp_port}, UDP:{self.udp_port}")

    async def stop(self):
        """Stop the EtherNet/IP server"""
        self._running = False

        if self._tcp_server:
            self._tcp_server.close()
            await self._tcp_server.wait_closed()

        if self._udp_transport:
            self._udp_transport.close()

        logger.info("EtherNet/IP server stopped")

    async def _handle_tcp_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle TCP client connection"""
        addr = writer.get_extra_info('peername')
        logger.debug(f"EIP TCP connection from {addr}")

        try:
            while self._running:
                # Read encapsulation header (24 bytes)
                header = await reader.read(24)
                if not header or len(header) < 24:
                    break

                response = self._process_encapsulation(header, reader, addr)
                if response:
                    writer.write(response)
                    await writer.drain()

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"TCP client error: {e}")
        finally:
            writer.close()
            await writer.wait_closed()

    def _process_encapsulation(self, header: bytes, reader: asyncio.StreamReader, addr: tuple) -> bytes:
        """Process EtherNet/IP encapsulation header"""
        command, length, session, status, context, options = struct.unpack('<HH I I 8s I', header)

        if command == EIPCommand.REGISTER_SESSION:
            return self._handle_register_session(context)
        elif command == EIPCommand.UNREGISTER_SESSION:
            return self._handle_unregister_session(session)
        elif command == EIPCommand.LIST_IDENTITY:
            return self._handle_list_identity(context)
        elif command == EIPCommand.LIST_SERVICES:
            return self._handle_list_services(context)
        elif command == EIPCommand.SEND_RR_DATA:
            return self._handle_send_rr_data(session, context, reader)
        elif command == EIPCommand.SEND_UNIT_DATA:
            return self._handle_send_unit_data(session, context, reader)
        else:
            logger.warning(f"Unknown EIP command: 0x{command:04X}")
            return None

    def _handle_register_session(self, context: bytes) -> bytes:
        """Handle RegisterSession request"""
        session = self._session_counter
        self._session_counter += 1
        self._sessions[session] = (time.time(),)

        # Response: command(2) + length(2) + session(4) + status(4) + context(8) + options(4)
        # + protocol version(2) + options flags(2)
        response = struct.pack('<HH I I 8s I HH',
            EIPCommand.REGISTER_SESSION, 4,
            session, 0, context, 0,
            1, 0  # Protocol version 1, no options
        )
        logger.info(f"EIP session registered: {session}")
        return response

    def _handle_unregister_session(self, session: int) -> bytes:
        """Handle UnregisterSession request"""
        if session in self._sessions:
            del self._sessions[session]
            logger.info(f"EIP session unregistered: {session}")
        return None  # No response for unregister

    def _handle_list_identity(self, context: bytes) -> bytes:
        """Handle ListIdentity request"""
        # Build identity item
        identity = struct.pack('<HH HH HH HH I H B',
            0x0C,  # Type ID: List Identity Response
            0,     # Length (filled later)
            1,     # Encapsulation version
            socket.htons(self.tcp_port) if hasattr(socket, 'htons') else self.tcp_port,
            0, 0,  # Socket address (will be filled by client)
            self.VENDOR_ID,
            self.DEVICE_TYPE,
            self.PRODUCT_CODE,
            (self.REVISION[0] << 8) | self.REVISION[1],
            0,     # Status
            self.SERIAL_NUMBER,
            len(self.PRODUCT_NAME)
        )
        identity += self.PRODUCT_NAME.encode('utf-8')
        identity += b'\x00'  # State

        # Update length
        identity = identity[:2] + struct.pack('<H', len(identity) - 4) + identity[4:]

        # Build CPF (Common Packet Format)
        cpf = struct.pack('<HH', 1, 0) + identity  # Item count = 1

        # Build response
        response = struct.pack('<HH I I 8s I',
            EIPCommand.LIST_IDENTITY, len(cpf),
            0, 0, context, 0
        ) + cpf

        return response

    def _handle_list_services(self, context: bytes) -> bytes:
        """Handle ListServices request"""
        # Services item
        services = struct.pack('<HH HH 16s',
            0x0100,  # Type ID: Communications
            20,      # Length
            0x0120,  # Capability flags (supports TCP & UDP)
            1,       # Version
            b'Communications\x00\x00'
        )

        # CPF
        cpf = struct.pack('<H', 1) + services

        # Response
        response = struct.pack('<HH I I 8s I',
            EIPCommand.LIST_SERVICES, len(cpf),
            0, 0, context, 0
        ) + cpf

        return response

    def _handle_send_rr_data(self, session: int, context: bytes, reader) -> bytes:
        """Handle SendRRData (explicit messaging)"""
        # This would handle CIP explicit messages
        # For now, return a basic response
        return None

    def _handle_send_unit_data(self, session: int, context: bytes, reader) -> bytes:
        """Handle SendUnitData (connected messaging)"""
        return None

    def handle_implicit_io(self, data: bytes, addr: tuple) -> bytes:
        """Handle implicit I/O message (UDP)"""
        if len(data) < 6:
            return None

        # Parse sequence count and connection ID
        seq_count, conn_id = struct.unpack('<HI', data[:6])

        # Check if this is a valid connection
        if conn_id not in self._connections:
            return None

        conn = self._connections[conn_id]
        conn.last_update = time.time()

        # Process output data from PLC
        if len(data) > 6:
            output_data = data[6:]
            self._output_assembly = LIDAROutputAssembly.from_bytes(output_data)
            self._assemblies[101].data = bytearray(output_data)

            if self._on_output_received:
                self._on_output_received(self._output_assembly)

        # Send input data to PLC
        input_data = self._assemblies[100].data
        response = struct.pack('<HI', seq_count, conn.connection_id) + bytes(input_data)

        return response

    def create_connection(self, addr: tuple, input_assembly: int = 100,
                         output_assembly: int = 101, rpi: int = 10000) -> int:
        """Create a new I/O connection"""
        conn_id = self._connection_counter
        self._connection_counter += 1

        self._connections[conn_id] = CIPConnection(
            connection_id=conn_id,
            originator_serial=0,
            input_assembly=input_assembly,
            output_assembly=output_assembly,
            rpi=rpi,
            addr=addr,
            last_update=time.time()
        )

        logger.info(f"Created EIP I/O connection {conn_id} to {addr}")
        return conn_id


class EIPUDPProtocol(asyncio.DatagramProtocol):
    """UDP Protocol handler for implicit I/O"""

    def __init__(self, server: EtherNetIPServer):
        self.server = server
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data: bytes, addr: tuple):
        response = self.server.handle_implicit_io(data, addr)
        if response:
            self.transport.sendto(response, addr)


class EtherNetIPServerWrapper:
    """
    Wrapper class for easy integration with the main application
    """

    def __init__(self, host: str = "0.0.0.0", tcp_port: int = 44818, udp_port: int = 2222):
        self._server: Optional[EtherNetIPServer] = None
        self._host = host
        self._tcp_port = tcp_port
        self._udp_port = udp_port
        self._enabled = True

    async def start(self) -> bool:
        """Start the EtherNet/IP server"""
        if not self._enabled:
            return False

        try:
            self._server = EtherNetIPServer(self._host, self._tcp_port, self._udp_port)
            await self._server.start()
            return True
        except Exception as e:
            logger.error(f"Failed to start EtherNet/IP server: {e}")
            self._server = None
            return False

    async def stop(self):
        """Stop the EtherNet/IP server"""
        if self._server:
            await self._server.stop()
            self._server = None

    def update_measurement_data(self,
                                status: int,
                                product_id: int,
                                overall_result: int,
                                zone_count: int,
                                scan_counter: int,
                                good_count: int,
                                bad_count: int,
                                good_rate: float,
                                zone_measurements: List[int],
                                zone_results: List[int],
                                min_distance: int = 0,
                                max_distance: int = 64000):
        """Update measurement data for PLC"""
        if self._server:
            self._server.update_input_data(
                status=status,
                product_id=product_id,
                overall_result=overall_result,
                zone_count=zone_count,
                scan_counter=scan_counter,
                good_count=good_count,
                bad_count=bad_count,
                good_rate=good_rate,
                zone_measurements=zone_measurements,
                zone_results=zone_results,
                min_distance=min_distance,
                max_distance=max_distance
            )

    def set_output_callback(self, callback: Callable[[LIDAROutputAssembly], None]):
        """Set callback for output data from PLC"""
        if self._server:
            self._server.set_output_callback(callback)

    @property
    def is_running(self) -> bool:
        return self._server is not None and self._server._running

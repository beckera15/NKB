"""
UDP Receiver for SICK MRS1000 LIDAR

This module handles UDP communication with the MRS1000 sensor.
The sensor typically broadcasts scan data on port 2112 (configurable).
"""

import socket
import threading
import queue
import time
from typing import Callable, Optional, List
from dataclasses import dataclass
import logging

from mrs1000_parser import MRS1000Parser, ScanData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ReceiverConfig:
    """Configuration for the UDP receiver"""
    listen_ip: str = "0.0.0.0"      # IP to listen on (0.0.0.0 for all interfaces)
    listen_port: int = 2112          # Default SICK SOPAS port
    buffer_size: int = 65535         # Maximum UDP packet size
    timeout: float = 1.0             # Socket timeout in seconds
    sensor_ip: Optional[str] = None  # Optional: filter by sensor IP


class MRS1000Receiver:
    """
    UDP receiver for SICK MRS1000 LIDAR data

    Receives UDP packets from the sensor and parses them into scan data.
    Provides both callback and queue-based interfaces for data consumption.
    """

    def __init__(self, config: Optional[ReceiverConfig] = None):
        """
        Initialize the receiver

        Args:
            config: Receiver configuration (uses defaults if not provided)
        """
        self.config = config or ReceiverConfig()
        self.parser = MRS1000Parser()
        self.socket: Optional[socket.socket] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._callbacks: List[Callable[[ScanData], None]] = []
        self._data_queue: queue.Queue = queue.Queue(maxsize=100)

        # Statistics
        self.packets_received = 0
        self.scans_parsed = 0
        self.bytes_received = 0
        self.errors = 0
        self.last_scan_time = 0.0

    def add_callback(self, callback: Callable[[ScanData], None]) -> None:
        """
        Add a callback function to be called when scan data is received

        Args:
            callback: Function that takes a ScanData object
        """
        self._callbacks.append(callback)

    def remove_callback(self, callback: Callable[[ScanData], None]) -> None:
        """Remove a callback function"""
        if callback in self._callbacks:
            self._callbacks.remove(callback)

    def get_scan(self, timeout: Optional[float] = None) -> Optional[ScanData]:
        """
        Get the next scan from the queue

        Args:
            timeout: How long to wait for data (None = blocking)

        Returns:
            ScanData or None if timeout
        """
        try:
            return self._data_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def start(self) -> None:
        """Start receiving data from the sensor"""
        if self._running:
            logger.warning("Receiver already running")
            return

        # Create UDP socket
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.settimeout(self.config.timeout)

        try:
            self.socket.bind((self.config.listen_ip, self.config.listen_port))
            logger.info(f"Listening on {self.config.listen_ip}:{self.config.listen_port}")
        except OSError as e:
            logger.error(f"Failed to bind socket: {e}")
            raise

        self._running = True
        self._thread = threading.Thread(target=self._receive_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stop receiving data"""
        self._running = False

        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None

        if self.socket:
            self.socket.close()
            self.socket = None

        logger.info("Receiver stopped")

    def _receive_loop(self) -> None:
        """Main receive loop running in a separate thread"""
        logger.info("Receive loop started")

        while self._running:
            try:
                data, addr = self.socket.recvfrom(self.config.buffer_size)

                # Filter by sensor IP if configured
                if self.config.sensor_ip and addr[0] != self.config.sensor_ip:
                    continue

                self.packets_received += 1
                self.bytes_received += len(data)

                # Parse the received data
                scans = self.parser.feed(data)

                for scan in scans:
                    self.scans_parsed += 1
                    self.last_scan_time = time.time()

                    # Add to queue (non-blocking, drop oldest if full)
                    try:
                        self._data_queue.put_nowait(scan)
                    except queue.Full:
                        try:
                            self._data_queue.get_nowait()  # Remove oldest
                            self._data_queue.put_nowait(scan)
                        except:
                            pass

                    # Call registered callbacks
                    for callback in self._callbacks:
                        try:
                            callback(scan)
                        except Exception as e:
                            logger.error(f"Callback error: {e}")

            except socket.timeout:
                continue
            except Exception as e:
                self.errors += 1
                logger.error(f"Receive error: {e}")
                time.sleep(0.1)

        logger.info("Receive loop ended")

    def get_stats(self) -> dict:
        """Get receiver statistics"""
        return {
            'packets_received': self.packets_received,
            'scans_parsed': self.scans_parsed,
            'bytes_received': self.bytes_received,
            'errors': self.errors,
            'last_scan_time': self.last_scan_time,
            'running': self._running,
        }


class MRS1000Commander:
    """
    Send commands to the MRS1000 sensor

    The MRS1000 can be configured and controlled via SOPAS commands.
    This class provides methods to configure scan output and start/stop scanning.
    """

    # Default SOPAS port for commands
    DEFAULT_COMMAND_PORT = 2111

    def __init__(self, sensor_ip: str, port: int = DEFAULT_COMMAND_PORT):
        """
        Initialize the commander

        Args:
            sensor_ip: IP address of the MRS1000 sensor
            port: Command port (default 2111)
        """
        self.sensor_ip = sensor_ip
        self.port = port
        self.socket: Optional[socket.socket] = None

    def connect(self) -> bool:
        """Connect to the sensor"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5.0)
            self.socket.connect((self.sensor_ip, self.port))
            logger.info(f"Connected to sensor at {self.sensor_ip}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False

    def disconnect(self) -> None:
        """Disconnect from the sensor"""
        if self.socket:
            self.socket.close()
            self.socket = None

    def _send_command(self, command: str) -> Optional[bytes]:
        """
        Send a SOPAS command and receive response

        Args:
            command: SOPAS command string (without framing)

        Returns:
            Response data or None on error
        """
        if not self.socket:
            logger.error("Not connected")
            return None

        # Build SOPAS telegram
        payload = command.encode('ascii')
        length = len(payload)
        checksum = 0
        for byte in payload:
            checksum ^= byte

        telegram = (
            b'\x02\x02\x02\x02' +  # STX
            length.to_bytes(4, 'big') +  # Length
            payload +  # Payload
            bytes([checksum])  # Checksum
        )

        try:
            self.socket.send(telegram)

            # Receive response
            response = self.socket.recv(4096)
            return response

        except Exception as e:
            logger.error(f"Command failed: {e}")
            return None

    def start_scan_output(self, output_ip: str, output_port: int = 2112) -> bool:
        """
        Configure and start scan data output

        Args:
            output_ip: IP address to send scan data to
            output_port: UDP port for scan data

        Returns:
            True if successful
        """
        # Configure output destination
        cmd = f"sWN ScanDataDestination {output_ip} {output_port}"
        response = self._send_command(cmd)

        if response is None:
            return False

        # Start scan output
        cmd = "sMN LMCstartmeas"
        response = self._send_command(cmd)

        return response is not None

    def stop_scan_output(self) -> bool:
        """Stop scan data output"""
        cmd = "sMN LMCstopmeas"
        response = self._send_command(cmd)
        return response is not None

    def set_scan_frequency(self, frequency: float) -> bool:
        """
        Set scan frequency

        Args:
            frequency: Scan frequency in Hz (e.g., 12.5, 25.0, 50.0)

        Returns:
            True if successful
        """
        # MRS1000 supports 12.5, 25, or 50 Hz
        freq_val = int(frequency * 100)
        cmd = f"sWN ScanFrequency {freq_val}"
        response = self._send_command(cmd)
        return response is not None

    def get_device_info(self) -> Optional[dict]:
        """Get device information"""
        info = {}

        # Get device name
        response = self._send_command("sRN DeviceIdent")
        if response:
            info['device_ident'] = response.decode('ascii', errors='ignore')

        # Get firmware version
        response = self._send_command("sRN FirmwareVersion")
        if response:
            info['firmware'] = response.decode('ascii', errors='ignore')

        return info if info else None


# Example usage and testing
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MRS1000 UDP Receiver Test")
    parser.add_argument("--ip", default="0.0.0.0", help="Listen IP address")
    parser.add_argument("--port", type=int, default=2112, help="Listen port")
    parser.add_argument("--sensor", help="Sensor IP (optional filter)")
    args = parser.parse_args()

    config = ReceiverConfig(
        listen_ip=args.ip,
        listen_port=args.port,
        sensor_ip=args.sensor,
    )

    receiver = MRS1000Receiver(config)

    def on_scan(scan: ScanData):
        print(f"Scan #{scan.scan_number}: {len(scan.points)} points, "
              f"freq={scan.frequency:.1f}Hz")

    receiver.add_callback(on_scan)

    try:
        receiver.start()
        print("Receiver started. Press Ctrl+C to stop.")

        while True:
            time.sleep(1)
            stats = receiver.get_stats()
            print(f"Stats: {stats['packets_received']} packets, "
                  f"{stats['scans_parsed']} scans, "
                  f"{stats['bytes_received']} bytes")

    except KeyboardInterrupt:
        print("\nStopping...")
        receiver.stop()

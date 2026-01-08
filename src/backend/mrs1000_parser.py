"""
SICK MRS1000 LIDAR Telegram Parser

This module parses SOPAS (SICK Open Protocol for Automation Systems) telegrams
from the SICK MRS1000 3D LIDAR sensor.

The MRS1000 is a multi-layer LIDAR with:
- 4 scan layers at different vertical angles (-2.5°, -0.833°, +0.833°, +2.5°)
- 275° horizontal field of view
- Angular resolution: 0.25° (1100 points per layer)
- Range: 0.1m to 64m
"""

import struct
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from enum import IntEnum
import math


class MRS1000Layer(IntEnum):
    """Layer indices for MRS1000 (4 layers)"""
    LAYER_1 = 0  # -2.5°
    LAYER_2 = 1  # -0.833°
    LAYER_3 = 2  # +0.833°
    LAYER_4 = 3  # +2.5°


# Layer vertical angles in degrees
LAYER_ANGLES = {
    MRS1000Layer.LAYER_1: -2.5,
    MRS1000Layer.LAYER_2: -0.833,
    MRS1000Layer.LAYER_3: 0.833,
    MRS1000Layer.LAYER_4: 2.5,
}


@dataclass
class ScanPoint:
    """Represents a single LIDAR scan point"""
    distance: float  # Distance in meters
    angle_h: float   # Horizontal angle in degrees
    angle_v: float   # Vertical angle in degrees
    rssi: int        # Received Signal Strength Indicator (reflectivity)
    layer: int       # Layer index (0-3)

    @property
    def x(self) -> float:
        """X coordinate in meters (forward)"""
        h_rad = math.radians(self.angle_h)
        v_rad = math.radians(self.angle_v)
        return self.distance * math.cos(v_rad) * math.cos(h_rad)

    @property
    def y(self) -> float:
        """Y coordinate in meters (left)"""
        h_rad = math.radians(self.angle_h)
        v_rad = math.radians(self.angle_v)
        return self.distance * math.cos(v_rad) * math.sin(h_rad)

    @property
    def z(self) -> float:
        """Z coordinate in meters (up)"""
        v_rad = math.radians(self.angle_v)
        return self.distance * math.sin(v_rad)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'distance': round(self.distance, 3),
            'angle_h': round(self.angle_h, 2),
            'angle_v': round(self.angle_v, 2),
            'rssi': self.rssi,
            'layer': self.layer,
            'x': round(self.x, 3),
            'y': round(self.y, 3),
            'z': round(self.z, 3),
        }


@dataclass
class ScanData:
    """Complete scan data from MRS1000"""
    timestamp: int              # Timestamp in microseconds
    scan_number: int           # Scan counter
    telegram_count: int        # Telegram counter
    device_status: int         # Device status flags
    frequency: float           # Scan frequency in Hz
    points: List[ScanPoint] = field(default_factory=list)

    # Scan configuration
    start_angle: float = -137.5  # Start angle in degrees
    end_angle: float = 137.5     # End angle in degrees
    angular_resolution: float = 0.25  # Angular resolution in degrees

    def get_layer_points(self, layer: int) -> List[ScanPoint]:
        """Get points for a specific layer"""
        return [p for p in self.points if p.layer == layer]

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'timestamp': self.timestamp,
            'scan_number': self.scan_number,
            'telegram_count': self.telegram_count,
            'device_status': self.device_status,
            'frequency': round(self.frequency, 2),
            'start_angle': self.start_angle,
            'end_angle': self.end_angle,
            'angular_resolution': self.angular_resolution,
            'point_count': len(self.points),
            'points': [p.to_dict() for p in self.points],
            'layers': {
                str(layer): [p.to_dict() for p in self.get_layer_points(layer)]
                for layer in range(4)
            }
        }

    def to_compact_dict(self) -> dict:
        """Convert to compact format for efficient transmission"""
        # Group points by layer and only send essential data
        layers_data = {}
        for layer in range(4):
            layer_points = self.get_layer_points(layer)
            layers_data[str(layer)] = {
                'distances': [round(p.distance, 3) for p in layer_points],
                'angles': [round(p.angle_h, 2) for p in layer_points],
                'rssi': [p.rssi for p in layer_points],
            }

        return {
            'timestamp': self.timestamp,
            'scan_number': self.scan_number,
            'frequency': round(self.frequency, 2),
            'config': {
                'start_angle': self.start_angle,
                'end_angle': self.end_angle,
                'resolution': self.angular_resolution,
            },
            'layers': layers_data,
        }


class MRS1000Parser:
    """
    Parser for SICK MRS1000 SOPAS telegrams

    The MRS1000 sends data in SOPAS Binary format via UDP.
    Telegram structure:
    - STX (0x02 0x02 0x02 0x02)
    - Length (4 bytes, big-endian)
    - Payload
    - Checksum (1 byte XOR)
    """

    # SOPAS protocol constants
    STX = b'\x02\x02\x02\x02'

    # Command types
    CMD_SCAN_DATA = b'sRA LMDscandata'
    CMD_SCAN_DATA_CONFIG = b'sRA LMDscandatacfg'

    def __init__(self):
        self.buffer = bytearray()
        self.scan_count = 0

    def feed(self, data: bytes) -> List[ScanData]:
        """
        Feed raw data to the parser and return any complete scans

        Args:
            data: Raw bytes received from the sensor

        Returns:
            List of complete ScanData objects
        """
        self.buffer.extend(data)
        scans = []

        while True:
            scan = self._try_parse_telegram()
            if scan is None:
                break
            scans.append(scan)

        return scans

    def _try_parse_telegram(self) -> Optional[ScanData]:
        """Try to parse a complete telegram from the buffer"""
        # Find STX marker
        stx_pos = self.buffer.find(self.STX)
        if stx_pos == -1:
            self.buffer.clear()
            return None

        # Remove any garbage before STX
        if stx_pos > 0:
            del self.buffer[:stx_pos]

        # Need at least header (4 STX + 4 length)
        if len(self.buffer) < 8:
            return None

        # Parse length (big-endian uint32 after STX)
        payload_length = struct.unpack('>I', self.buffer[4:8])[0]

        # Check if we have complete telegram (header + payload + checksum)
        total_length = 8 + payload_length + 1
        if len(self.buffer) < total_length:
            return None

        # Extract payload
        payload = bytes(self.buffer[8:8 + payload_length])
        checksum = self.buffer[8 + payload_length]

        # Verify checksum (XOR of all payload bytes)
        calculated_checksum = 0
        for byte in payload:
            calculated_checksum ^= byte

        if calculated_checksum != checksum:
            # Invalid checksum, skip this STX and try again
            del self.buffer[:4]
            return self._try_parse_telegram()

        # Remove processed telegram from buffer
        del self.buffer[:total_length]

        # Parse the payload
        return self._parse_scan_data(payload)

    def _parse_scan_data(self, payload: bytes) -> Optional[ScanData]:
        """Parse scan data payload"""
        try:
            # Check command type (ASCII part at start)
            # Format: "sRA LMDscandata " followed by binary data

            # Find the space after command
            space_pos = payload.find(b' ', 4)
            if space_pos == -1:
                return None

            # Binary data starts after command
            cmd = payload[:space_pos]
            if b'LMDscandata' not in cmd:
                return None

            # Parse binary scan data after command
            data = payload[space_pos + 1:]
            return self._parse_binary_scan_data(data)

        except Exception as e:
            print(f"Error parsing scan data: {e}")
            return None

    def _parse_binary_scan_data(self, data: bytes) -> Optional[ScanData]:
        """
        Parse binary scan data from MRS1000

        Binary format (big-endian):
        - Version number (2 bytes)
        - Device number (2 bytes)
        - Serial number (4 bytes)
        - Device status (2 bytes)
        - Telegram count (2 bytes)
        - Scan count (2 bytes)
        - Time since startup (4 bytes, microseconds)
        - Time of transmission (4 bytes, microseconds)
        - Scan frequency (4 bytes, 1/100 Hz)
        - Measurement frequency (4 bytes, 1/100 Hz)
        - Encoder data (variable)
        - Number of 16-bit channels (2 bytes)
        - For each channel:
            - Channel content descriptor
            - Scale factor
            - Scale offset
            - Start angle (4 bytes, 1/10000 degrees)
            - Angular step (2 bytes, 1/10000 degrees)
            - Number of data points (2 bytes)
            - Data values
        """
        try:
            offset = 0

            # Skip version, device number, serial number
            offset += 2 + 2 + 4

            # Device status
            device_status = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2

            # Telegram count
            telegram_count = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2

            # Scan count
            scan_count = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2

            # Time since startup (microseconds)
            timestamp = struct.unpack('>I', data[offset:offset + 4])[0]
            offset += 4

            # Time of transmission (skip)
            offset += 4

            # Scan frequency (1/100 Hz)
            freq_raw = struct.unpack('>I', data[offset:offset + 4])[0]
            frequency = freq_raw / 100.0
            offset += 4

            # Measurement frequency (skip)
            offset += 4

            # Skip encoder data section
            # Number of encoders (2 bytes)
            num_encoders = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2
            # Skip encoder values (6 bytes each: position + speed)
            offset += num_encoders * 6

            # Number of 16-bit channels
            num_16bit_channels = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2

            scan_data = ScanData(
                timestamp=timestamp,
                scan_number=scan_count,
                telegram_count=telegram_count,
                device_status=device_status,
                frequency=frequency,
            )

            # Parse each channel
            for channel_idx in range(num_16bit_channels):
                offset = self._parse_channel(data, offset, scan_data, channel_idx)

            # Parse 8-bit channels (RSSI data)
            if offset < len(data):
                num_8bit_channels = struct.unpack('>H', data[offset:offset + 2])[0]
                offset += 2

                for channel_idx in range(num_8bit_channels):
                    offset = self._parse_rssi_channel(data, offset, scan_data, channel_idx)

            self.scan_count += 1
            return scan_data

        except Exception as e:
            print(f"Error parsing binary scan data: {e}")
            return None

    def _parse_channel(self, data: bytes, offset: int, scan_data: ScanData, channel_idx: int) -> int:
        """Parse a 16-bit data channel (distance data)"""
        # Channel content (5 ASCII chars)
        content_type = data[offset:offset + 5].decode('ascii', errors='ignore')
        offset += 5

        # Scale factor (4 bytes float)
        scale_factor = struct.unpack('>f', data[offset:offset + 4])[0]
        offset += 4

        # Scale offset (4 bytes float)
        scale_offset = struct.unpack('>f', data[offset:offset + 4])[0]
        offset += 4

        # Start angle (4 bytes, 1/10000 degrees)
        start_angle_raw = struct.unpack('>i', data[offset:offset + 4])[0]
        start_angle = start_angle_raw / 10000.0
        offset += 4

        # Angular step (2 bytes, 1/10000 degrees)
        angular_step_raw = struct.unpack('>H', data[offset:offset + 2])[0]
        angular_step = angular_step_raw / 10000.0
        offset += 2

        # Number of data points
        num_points = struct.unpack('>H', data[offset:offset + 2])[0]
        offset += 2

        # Update scan configuration
        scan_data.start_angle = start_angle
        scan_data.angular_resolution = angular_step
        scan_data.end_angle = start_angle + (num_points - 1) * angular_step

        # Determine layer from channel index
        layer = channel_idx % 4
        vertical_angle = LAYER_ANGLES.get(MRS1000Layer(layer), 0.0)

        # Parse distance values
        for i in range(num_points):
            if offset + 2 > len(data):
                break

            distance_raw = struct.unpack('>H', data[offset:offset + 2])[0]
            offset += 2

            # Convert to meters
            distance = (distance_raw * scale_factor + scale_offset) / 1000.0

            # Calculate horizontal angle
            angle_h = start_angle + i * angular_step

            point = ScanPoint(
                distance=distance,
                angle_h=angle_h,
                angle_v=vertical_angle,
                rssi=0,  # Will be filled by RSSI channel
                layer=layer,
            )
            scan_data.points.append(point)

        return offset

    def _parse_rssi_channel(self, data: bytes, offset: int, scan_data: ScanData, channel_idx: int) -> int:
        """Parse an 8-bit RSSI channel"""
        # Channel content (5 ASCII chars)
        content_type = data[offset:offset + 5].decode('ascii', errors='ignore')
        offset += 5

        # Scale factor (4 bytes float)
        scale_factor = struct.unpack('>f', data[offset:offset + 4])[0]
        offset += 4

        # Scale offset (4 bytes float)
        scale_offset = struct.unpack('>f', data[offset:offset + 4])[0]
        offset += 4

        # Start angle (4 bytes)
        offset += 4

        # Angular step (2 bytes)
        offset += 2

        # Number of data points
        num_points = struct.unpack('>H', data[offset:offset + 2])[0]
        offset += 2

        # Determine which layer this RSSI data belongs to
        layer = channel_idx % 4
        layer_points = scan_data.get_layer_points(layer)

        # Parse RSSI values
        for i in range(num_points):
            if offset >= len(data):
                break

            rssi = data[offset]
            offset += 1

            # Update corresponding point's RSSI
            if i < len(layer_points):
                layer_points[i].rssi = rssi

        return offset


class MRS1000SimulatedParser:
    """
    Simulated MRS1000 parser for testing without actual hardware

    Generates realistic scan data patterns for visualization testing.
    """

    def __init__(self):
        self.scan_count = 0
        self.time_us = 0

    def generate_scan(self) -> ScanData:
        """Generate a simulated scan"""
        import random

        scan = ScanData(
            timestamp=self.time_us,
            scan_number=self.scan_count,
            telegram_count=self.scan_count,
            device_status=0,
            frequency=12.5,
            start_angle=-137.5,
            end_angle=137.5,
            angular_resolution=0.25,
        )

        # Generate points for each layer
        for layer in range(4):
            vertical_angle = LAYER_ANGLES[MRS1000Layer(layer)]

            angle = -137.5
            while angle <= 137.5:
                # Simulate various obstacles
                distance = self._simulate_distance(angle, layer)

                # Add some noise
                if distance < 64.0:
                    distance += random.gauss(0, 0.02)
                    distance = max(0.1, min(64.0, distance))

                # Simulate RSSI (stronger for closer objects)
                rssi = int(200 - (distance / 64.0) * 150) if distance < 64.0 else 0
                rssi = max(0, min(255, rssi + random.randint(-10, 10)))

                point = ScanPoint(
                    distance=distance,
                    angle_h=angle,
                    angle_v=vertical_angle,
                    rssi=rssi,
                    layer=layer,
                )
                scan.points.append(point)

                angle += 0.25

        self.scan_count += 1
        self.time_us += 80000  # 80ms per scan at 12.5Hz

        return scan

    def _simulate_distance(self, angle: float, layer: int) -> float:
        """Simulate distance measurements with various obstacles"""
        import math
        import random

        # Default: max range (no obstacle)
        distance = 64.0

        # Simulate a wall on the left side (-120° to -60°)
        if -120 <= angle <= -60:
            wall_dist = 5.0 / abs(math.cos(math.radians(angle + 90)))
            distance = min(distance, wall_dist)

        # Simulate a wall on the right side (60° to 120°)
        if 60 <= angle <= 120:
            wall_dist = 5.0 / abs(math.cos(math.radians(angle - 90)))
            distance = min(distance, wall_dist)

        # Simulate a box/obstacle in front (-30° to 30°)
        if -30 <= angle <= 30:
            box_dist = 3.0 + 0.5 * math.sin(math.radians(angle * 6))
            distance = min(distance, box_dist)

        # Simulate a person/cylinder at -45°
        person_angle = -45 + 5 * math.sin(self.scan_count * 0.1)  # Moving person
        if abs(angle - person_angle) < 5:
            person_dist = 2.0 + (1 - abs(angle - person_angle) / 5) * 0.3
            distance = min(distance, person_dist)

        # Simulate another moving object at 45°
        obj_angle = 45 + 10 * math.sin(self.scan_count * 0.15)
        if abs(angle - obj_angle) < 8:
            obj_dist = 4.0 + (1 - abs(angle - obj_angle) / 8) * 0.5
            distance = min(distance, obj_dist)

        # Random noise/dust particles (occasional spurious readings)
        if random.random() < 0.005:
            distance = min(distance, random.uniform(0.5, 3.0))

        return distance

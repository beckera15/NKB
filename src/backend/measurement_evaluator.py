"""
Product Measurement Evaluation System

Defines measurement zones and evaluates LIDAR scan data against
expected product distances. Outputs GOOD/BAD results for each zone.

Used with:
- Ignition SCADA (via OPC-UA)
- Rockwell Studio 5000 (via Modbus TCP / EtherNet/IP)
"""

import json
import math
import time
import threading
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Callable
from enum import IntEnum
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class MeasurementResult(IntEnum):
    """Measurement result status"""
    UNKNOWN = 0
    GOOD = 1
    BAD = 2
    NO_TARGET = 3  # No object detected in zone
    ERROR = 4


@dataclass
class MeasurementZone:
    """
    Defines a measurement zone in the LIDAR field of view

    A zone is a wedge-shaped area defined by angular and distance bounds.
    The LIDAR measurement in this zone is compared against expected distances.
    """
    id: int
    name: str
    enabled: bool = True

    # Angular bounds (degrees, relative to sensor forward direction)
    start_angle: float = -10.0  # Left bound
    end_angle: float = 10.0     # Right bound

    # Layer selection (which layers to include)
    layers: List[int] = field(default_factory=lambda: [0, 1, 2, 3])

    # Expected distance configuration
    expected_distance: float = 1.0  # Expected distance in meters
    tolerance_plus: float = 0.05    # Positive tolerance (+)
    tolerance_minus: float = 0.05   # Negative tolerance (-)

    # Distance bounds for valid measurements
    min_valid_distance: float = 0.1   # Minimum valid distance
    max_valid_distance: float = 10.0  # Maximum valid distance

    # Filtering options
    min_points: int = 5  # Minimum points required in zone for valid measurement
    use_median: bool = True  # Use median (True) or mean (False) for measurement
    outlier_rejection: bool = True  # Reject statistical outliers
    outlier_std_factor: float = 2.0  # Reject points > N std deviations from mean

    # Result
    last_measurement: float = 0.0
    last_result: MeasurementResult = MeasurementResult.UNKNOWN
    last_update_time: float = 0.0
    point_count: int = 0

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'enabled': self.enabled,
            'start_angle': self.start_angle,
            'end_angle': self.end_angle,
            'layers': self.layers,
            'expected_distance': self.expected_distance,
            'tolerance_plus': self.tolerance_plus,
            'tolerance_minus': self.tolerance_minus,
            'min_valid_distance': self.min_valid_distance,
            'max_valid_distance': self.max_valid_distance,
            'min_points': self.min_points,
            'use_median': self.use_median,
            'outlier_rejection': self.outlier_rejection,
            'outlier_std_factor': self.outlier_std_factor,
            'last_measurement': round(self.last_measurement, 4),
            'last_result': self.last_result,
            'last_result_name': MeasurementResult(self.last_result).name,
            'last_update_time': self.last_update_time,
            'point_count': self.point_count,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'MeasurementZone':
        """Create from dictionary"""
        return cls(
            id=data.get('id', 0),
            name=data.get('name', 'Zone'),
            enabled=data.get('enabled', True),
            start_angle=data.get('start_angle', -10.0),
            end_angle=data.get('end_angle', 10.0),
            layers=data.get('layers', [0, 1, 2, 3]),
            expected_distance=data.get('expected_distance', 1.0),
            tolerance_plus=data.get('tolerance_plus', 0.05),
            tolerance_minus=data.get('tolerance_minus', 0.05),
            min_valid_distance=data.get('min_valid_distance', 0.1),
            max_valid_distance=data.get('max_valid_distance', 10.0),
            min_points=data.get('min_points', 5),
            use_median=data.get('use_median', True),
            outlier_rejection=data.get('outlier_rejection', True),
            outlier_std_factor=data.get('outlier_std_factor', 2.0),
        )


@dataclass
class ProductConfig:
    """
    Product configuration containing multiple measurement zones
    """
    id: int
    name: str
    description: str = ""
    enabled: bool = True
    zones: List[MeasurementZone] = field(default_factory=list)

    # Overall product result (all zones must pass for GOOD)
    last_result: MeasurementResult = MeasurementResult.UNKNOWN
    last_update_time: float = 0.0

    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'enabled': self.enabled,
            'zones': [z.to_dict() for z in self.zones],
            'last_result': self.last_result,
            'last_result_name': MeasurementResult(self.last_result).name,
            'last_update_time': self.last_update_time,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'ProductConfig':
        """Create from dictionary"""
        zones = [MeasurementZone.from_dict(z) for z in data.get('zones', [])]
        return cls(
            id=data.get('id', 0),
            name=data.get('name', 'Product'),
            description=data.get('description', ''),
            enabled=data.get('enabled', True),
            zones=zones,
        )


class MeasurementEvaluator:
    """
    Evaluates LIDAR scan data against product measurement configurations

    Provides:
    - Zone-based measurement extraction from scan data
    - Good/Bad evaluation with configurable tolerances
    - Result callbacks for external systems (Ignition, PLC)
    - Persistent product configuration storage
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the measurement evaluator

        Args:
            config_path: Path to save/load product configurations
        """
        self.config_path = Path(config_path) if config_path else None
        self.products: Dict[int, ProductConfig] = {}
        self.active_product_id: Optional[int] = None

        # Result callbacks
        self._result_callbacks: List[Callable[[ProductConfig], None]] = []

        # Statistics
        self.evaluation_count = 0
        self.good_count = 0
        self.bad_count = 0

        # Thread safety
        self._lock = threading.Lock()

        # Load saved configuration
        if self.config_path and self.config_path.exists():
            self.load_config()

    def add_result_callback(self, callback: Callable[[ProductConfig], None]) -> None:
        """Add a callback for measurement results"""
        self._result_callbacks.append(callback)

    def remove_result_callback(self, callback: Callable[[ProductConfig], None]) -> None:
        """Remove a result callback"""
        if callback in self._result_callbacks:
            self._result_callbacks.remove(callback)

    def _notify_results(self, product: ProductConfig) -> None:
        """Notify all registered callbacks of new results"""
        for callback in self._result_callbacks:
            try:
                callback(product)
            except Exception as e:
                logger.error(f"Result callback error: {e}")

    def add_product(self, product: ProductConfig) -> None:
        """Add or update a product configuration"""
        with self._lock:
            self.products[product.id] = product
            if self.active_product_id is None:
                self.active_product_id = product.id
        self.save_config()

    def remove_product(self, product_id: int) -> bool:
        """Remove a product configuration"""
        with self._lock:
            if product_id in self.products:
                del self.products[product_id]
                if self.active_product_id == product_id:
                    self.active_product_id = next(iter(self.products.keys()), None)
                self.save_config()
                return True
        return False

    def get_product(self, product_id: int) -> Optional[ProductConfig]:
        """Get a product configuration"""
        return self.products.get(product_id)

    def get_active_product(self) -> Optional[ProductConfig]:
        """Get the currently active product"""
        if self.active_product_id is not None:
            return self.products.get(self.active_product_id)
        return None

    def set_active_product(self, product_id: int) -> bool:
        """Set the active product for evaluation"""
        if product_id in self.products:
            self.active_product_id = product_id
            return True
        return False

    def list_products(self) -> List[dict]:
        """List all product configurations"""
        return [p.to_dict() for p in self.products.values()]

    def evaluate_scan(self, scan_data) -> Optional[ProductConfig]:
        """
        Evaluate a scan against the active product configuration

        Args:
            scan_data: ScanData object from the parser

        Returns:
            ProductConfig with updated results, or None if no active product
        """
        product = self.get_active_product()
        if not product or not product.enabled:
            return None

        with self._lock:
            all_good = True
            current_time = time.time()

            for zone in product.zones:
                if not zone.enabled:
                    continue

                # Extract points in this zone
                zone_points = self._extract_zone_points(scan_data, zone)
                zone.point_count = len(zone_points)

                # Evaluate the zone
                result, measurement = self._evaluate_zone(zone, zone_points)

                zone.last_result = result
                zone.last_measurement = measurement
                zone.last_update_time = current_time

                if result != MeasurementResult.GOOD:
                    all_good = False

            # Update product overall result
            product.last_result = MeasurementResult.GOOD if all_good else MeasurementResult.BAD
            product.last_update_time = current_time

            # Update statistics
            self.evaluation_count += 1
            if all_good:
                self.good_count += 1
            else:
                self.bad_count += 1

        # Notify callbacks
        self._notify_results(product)

        return product

    def _extract_zone_points(self, scan_data, zone: MeasurementZone) -> List[float]:
        """Extract distance measurements from points within the zone"""
        distances = []

        for point in scan_data.points:
            # Check layer
            if point.layer not in zone.layers:
                continue

            # Check angular bounds
            angle = point.angle_h if hasattr(point, 'angle_h') else point.get('angle_h', point.get('angle', 0))
            if angle < zone.start_angle or angle > zone.end_angle:
                continue

            # Get distance
            distance = point.distance if hasattr(point, 'distance') else point.get('distance', 0)

            # Check distance validity
            if distance < zone.min_valid_distance or distance > zone.max_valid_distance:
                continue

            distances.append(distance)

        return distances

    def _evaluate_zone(self, zone: MeasurementZone, distances: List[float]) -> Tuple[MeasurementResult, float]:
        """
        Evaluate a measurement zone

        Returns:
            Tuple of (result, measured_distance)
        """
        if len(distances) < zone.min_points:
            return MeasurementResult.NO_TARGET, 0.0

        # Outlier rejection if enabled
        if zone.outlier_rejection and len(distances) > 3:
            distances = self._reject_outliers(distances, zone.outlier_std_factor)
            if len(distances) < zone.min_points:
                return MeasurementResult.NO_TARGET, 0.0

        # Calculate measurement
        if zone.use_median:
            distances_sorted = sorted(distances)
            n = len(distances_sorted)
            if n % 2 == 0:
                measurement = (distances_sorted[n//2 - 1] + distances_sorted[n//2]) / 2
            else:
                measurement = distances_sorted[n//2]
        else:
            measurement = sum(distances) / len(distances)

        # Evaluate against expected distance
        lower_bound = zone.expected_distance - zone.tolerance_minus
        upper_bound = zone.expected_distance + zone.tolerance_plus

        if lower_bound <= measurement <= upper_bound:
            return MeasurementResult.GOOD, measurement
        else:
            return MeasurementResult.BAD, measurement

    def _reject_outliers(self, distances: List[float], std_factor: float) -> List[float]:
        """Reject outliers using standard deviation method"""
        if len(distances) < 3:
            return distances

        mean = sum(distances) / len(distances)
        variance = sum((d - mean) ** 2 for d in distances) / len(distances)
        std = math.sqrt(variance)

        if std < 0.001:  # Essentially no variation
            return distances

        threshold = std_factor * std
        return [d for d in distances if abs(d - mean) <= threshold]

    def save_config(self) -> bool:
        """Save product configurations to file"""
        if not self.config_path:
            return False

        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                'active_product_id': self.active_product_id,
                'products': [p.to_dict() for p in self.products.values()],
            }

            with open(self.config_path, 'w') as f:
                json.dump(data, f, indent=2)

            logger.info(f"Configuration saved to {self.config_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False

    def load_config(self) -> bool:
        """Load product configurations from file"""
        if not self.config_path or not self.config_path.exists():
            return False

        try:
            with open(self.config_path, 'r') as f:
                data = json.load(f)

            self.products.clear()
            for p_data in data.get('products', []):
                product = ProductConfig.from_dict(p_data)
                self.products[product.id] = product

            self.active_product_id = data.get('active_product_id')

            logger.info(f"Loaded {len(self.products)} products from {self.config_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            return False

    def get_statistics(self) -> dict:
        """Get evaluation statistics"""
        return {
            'evaluation_count': self.evaluation_count,
            'good_count': self.good_count,
            'bad_count': self.bad_count,
            'good_rate': self.good_count / max(1, self.evaluation_count),
            'active_product': self.active_product_id,
            'product_count': len(self.products),
        }

    def reset_statistics(self) -> None:
        """Reset evaluation statistics"""
        self.evaluation_count = 0
        self.good_count = 0
        self.bad_count = 0


def create_example_product() -> ProductConfig:
    """Create an example product configuration for testing"""
    return ProductConfig(
        id=1,
        name="Example Product",
        description="Example product with 3 measurement zones",
        enabled=True,
        zones=[
            MeasurementZone(
                id=1,
                name="Front Center",
                start_angle=-15.0,
                end_angle=15.0,
                layers=[0, 1, 2, 3],
                expected_distance=2.0,
                tolerance_plus=0.1,
                tolerance_minus=0.1,
            ),
            MeasurementZone(
                id=2,
                name="Left Side",
                start_angle=-60.0,
                end_angle=-30.0,
                layers=[0, 1, 2, 3],
                expected_distance=3.0,
                tolerance_plus=0.15,
                tolerance_minus=0.15,
            ),
            MeasurementZone(
                id=3,
                name="Right Side",
                start_angle=30.0,
                end_angle=60.0,
                layers=[0, 1, 2, 3],
                expected_distance=3.0,
                tolerance_plus=0.15,
                tolerance_minus=0.15,
            ),
        ],
    )

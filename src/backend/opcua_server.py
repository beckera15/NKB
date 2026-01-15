"""
OPC-UA Server for Ignition Integration

Exposes LIDAR measurement results via OPC-UA for integration with
Ignition SCADA software.

Tags exposed:
- Product/ActiveProductId
- Product/ActiveProductName
- Product/OverallResult (1=GOOD, 2=BAD)
- Product/OverallResultString
- Zone[n]/Result
- Zone[n]/Measurement
- Zone[n]/ExpectedDistance
- Zone[n]/InTolerance
- Statistics/EvaluationCount
- Statistics/GoodCount
- Statistics/BadCount
- Statistics/GoodRate
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import opcua library
try:
    from asyncua import Server, ua
    from asyncua.common.methods import uamethod
    OPCUA_AVAILABLE = True
except ImportError:
    OPCUA_AVAILABLE = False
    logger.warning("asyncua library not installed. OPC-UA server disabled.")
    logger.warning("Install with: pip install asyncua")


class OPCUAServer:
    """
    OPC-UA Server for LIDAR measurement results

    Provides integration with Ignition SCADA and other OPC-UA clients.
    """

    def __init__(self, endpoint: str = "opc.tcp://0.0.0.0:4840/lidar/",
                 server_name: str = "MRS1000 LIDAR Server"):
        """
        Initialize OPC-UA server

        Args:
            endpoint: OPC-UA endpoint URL
            server_name: Server name for identification
        """
        self.endpoint = endpoint
        self.server_name = server_name
        self.server: Optional[Server] = None
        self._running = False

        # Node references
        self._nodes: Dict[str, Any] = {}
        self._idx: int = 0

        # Max zones to pre-create
        self.max_zones = 16

    async def start(self) -> bool:
        """Start the OPC-UA server"""
        if not OPCUA_AVAILABLE:
            logger.error("OPC-UA library not available")
            return False

        if self._running:
            logger.warning("OPC-UA server already running")
            return True

        try:
            # Create server
            self.server = Server()
            await self.server.init()

            # Configure server
            self.server.set_endpoint(self.endpoint)
            self.server.set_server_name(self.server_name)

            # Set security policies (allow anonymous for simplicity)
            self.server.set_security_policy([ua.SecurityPolicyType.NoSecurity])

            # Register namespace
            self._idx = await self.server.register_namespace("http://lidar.mrs1000/")

            # Create node structure
            await self._create_nodes()

            # Start server
            await self.server.start()
            self._running = True

            logger.info(f"OPC-UA server started at {self.endpoint}")
            return True

        except Exception as e:
            logger.error(f"Failed to start OPC-UA server: {e}")
            return False

    async def stop(self) -> None:
        """Stop the OPC-UA server"""
        if self.server and self._running:
            await self.server.stop()
            self._running = False
            logger.info("OPC-UA server stopped")

    async def _create_nodes(self) -> None:
        """Create the OPC-UA node structure"""
        objects = self.server.nodes.objects

        # Create main folder
        lidar_folder = await objects.add_folder(self._idx, "LIDAR")

        # Product folder
        product_folder = await lidar_folder.add_folder(self._idx, "Product")

        self._nodes['product_id'] = await product_folder.add_variable(
            self._idx, "ActiveProductId", 0, ua.VariantType.Int32
        )
        self._nodes['product_name'] = await product_folder.add_variable(
            self._idx, "ActiveProductName", "", ua.VariantType.String
        )
        self._nodes['overall_result'] = await product_folder.add_variable(
            self._idx, "OverallResult", 0, ua.VariantType.Int32
        )
        self._nodes['overall_result_string'] = await product_folder.add_variable(
            self._idx, "OverallResultString", "UNKNOWN", ua.VariantType.String
        )
        self._nodes['last_update'] = await product_folder.add_variable(
            self._idx, "LastUpdateTime", datetime.now(), ua.VariantType.DateTime
        )

        # Make product variables writable for testing
        await self._nodes['product_id'].set_writable()

        # Zones folder
        zones_folder = await lidar_folder.add_folder(self._idx, "Zones")
        self._nodes['zone_count'] = await zones_folder.add_variable(
            self._idx, "ZoneCount", 0, ua.VariantType.Int32
        )

        # Pre-create zone nodes
        for i in range(self.max_zones):
            zone_folder = await zones_folder.add_folder(self._idx, f"Zone{i+1}")

            self._nodes[f'zone{i}_id'] = await zone_folder.add_variable(
                self._idx, "ZoneId", 0, ua.VariantType.Int32
            )
            self._nodes[f'zone{i}_name'] = await zone_folder.add_variable(
                self._idx, "ZoneName", "", ua.VariantType.String
            )
            self._nodes[f'zone{i}_enabled'] = await zone_folder.add_variable(
                self._idx, "Enabled", False, ua.VariantType.Boolean
            )
            self._nodes[f'zone{i}_result'] = await zone_folder.add_variable(
                self._idx, "Result", 0, ua.VariantType.Int32
            )
            self._nodes[f'zone{i}_result_string'] = await zone_folder.add_variable(
                self._idx, "ResultString", "UNKNOWN", ua.VariantType.String
            )
            self._nodes[f'zone{i}_measurement'] = await zone_folder.add_variable(
                self._idx, "Measurement", 0.0, ua.VariantType.Float
            )
            self._nodes[f'zone{i}_expected'] = await zone_folder.add_variable(
                self._idx, "ExpectedDistance", 0.0, ua.VariantType.Float
            )
            self._nodes[f'zone{i}_tolerance_plus'] = await zone_folder.add_variable(
                self._idx, "TolerancePlus", 0.0, ua.VariantType.Float
            )
            self._nodes[f'zone{i}_tolerance_minus'] = await zone_folder.add_variable(
                self._idx, "ToleranceMinus", 0.0, ua.VariantType.Float
            )
            self._nodes[f'zone{i}_in_tolerance'] = await zone_folder.add_variable(
                self._idx, "InTolerance", False, ua.VariantType.Boolean
            )
            self._nodes[f'zone{i}_point_count'] = await zone_folder.add_variable(
                self._idx, "PointCount", 0, ua.VariantType.Int32
            )

        # Statistics folder
        stats_folder = await lidar_folder.add_folder(self._idx, "Statistics")

        self._nodes['eval_count'] = await stats_folder.add_variable(
            self._idx, "EvaluationCount", 0, ua.VariantType.Int64
        )
        self._nodes['good_count'] = await stats_folder.add_variable(
            self._idx, "GoodCount", 0, ua.VariantType.Int64
        )
        self._nodes['bad_count'] = await stats_folder.add_variable(
            self._idx, "BadCount", 0, ua.VariantType.Int64
        )
        self._nodes['good_rate'] = await stats_folder.add_variable(
            self._idx, "GoodRate", 0.0, ua.VariantType.Float
        )

        # Control folder
        control_folder = await lidar_folder.add_folder(self._idx, "Control")

        self._nodes['reset_stats'] = await control_folder.add_variable(
            self._idx, "ResetStatistics", False, ua.VariantType.Boolean
        )
        await self._nodes['reset_stats'].set_writable()

        logger.info("OPC-UA node structure created")

    async def update_product_result(self, product) -> None:
        """
        Update OPC-UA tags with product measurement results

        Args:
            product: ProductConfig with updated results
        """
        if not self._running or not product:
            return

        try:
            # Update product info
            await self._nodes['product_id'].write_value(product.id)
            await self._nodes['product_name'].write_value(product.name)
            await self._nodes['overall_result'].write_value(int(product.last_result))
            await self._nodes['overall_result_string'].write_value(
                product.last_result.name if hasattr(product.last_result, 'name')
                else str(product.last_result)
            )
            await self._nodes['last_update'].write_value(datetime.now())

            # Update zone count
            await self._nodes['zone_count'].write_value(len(product.zones))

            # Update zone info
            for i, zone in enumerate(product.zones[:self.max_zones]):
                await self._nodes[f'zone{i}_id'].write_value(zone.id)
                await self._nodes[f'zone{i}_name'].write_value(zone.name)
                await self._nodes[f'zone{i}_enabled'].write_value(zone.enabled)
                await self._nodes[f'zone{i}_result'].write_value(int(zone.last_result))
                await self._nodes[f'zone{i}_result_string'].write_value(
                    zone.last_result.name if hasattr(zone.last_result, 'name')
                    else str(zone.last_result)
                )
                await self._nodes[f'zone{i}_measurement'].write_value(
                    float(zone.last_measurement)
                )
                await self._nodes[f'zone{i}_expected'].write_value(
                    float(zone.expected_distance)
                )
                await self._nodes[f'zone{i}_tolerance_plus'].write_value(
                    float(zone.tolerance_plus)
                )
                await self._nodes[f'zone{i}_tolerance_minus'].write_value(
                    float(zone.tolerance_minus)
                )
                await self._nodes[f'zone{i}_in_tolerance'].write_value(
                    zone.last_result == 1  # GOOD
                )
                await self._nodes[f'zone{i}_point_count'].write_value(zone.point_count)

            # Clear unused zones
            for i in range(len(product.zones), self.max_zones):
                await self._nodes[f'zone{i}_enabled'].write_value(False)
                await self._nodes[f'zone{i}_name'].write_value("")

        except Exception as e:
            logger.error(f"Error updating OPC-UA tags: {e}")

    async def update_statistics(self, stats: dict) -> None:
        """
        Update statistics tags

        Args:
            stats: Statistics dictionary from MeasurementEvaluator
        """
        if not self._running:
            return

        try:
            await self._nodes['eval_count'].write_value(stats.get('evaluation_count', 0))
            await self._nodes['good_count'].write_value(stats.get('good_count', 0))
            await self._nodes['bad_count'].write_value(stats.get('bad_count', 0))
            await self._nodes['good_rate'].write_value(float(stats.get('good_rate', 0.0)))
        except Exception as e:
            logger.error(f"Error updating statistics tags: {e}")

    def is_running(self) -> bool:
        """Check if server is running"""
        return self._running


# Wrapper for non-async code
class OPCUAServerWrapper:
    """Wrapper to run OPC-UA server from synchronous code"""

    def __init__(self, endpoint: str = "opc.tcp://0.0.0.0:4840/lidar/"):
        self.server = OPCUAServer(endpoint) if OPCUA_AVAILABLE else None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def start(self, loop: asyncio.AbstractEventLoop) -> bool:
        """Start server in existing event loop"""
        if not self.server:
            return False
        self._loop = loop
        future = asyncio.run_coroutine_threadsafe(self.server.start(), loop)
        return future.result(timeout=10)

    def stop(self) -> None:
        """Stop the server"""
        if self.server and self._loop:
            future = asyncio.run_coroutine_threadsafe(self.server.stop(), self._loop)
            future.result(timeout=5)

    def update_product_result(self, product) -> None:
        """Update product result (thread-safe)"""
        if self.server and self._loop and self.server.is_running():
            asyncio.run_coroutine_threadsafe(
                self.server.update_product_result(product),
                self._loop
            )

    def update_statistics(self, stats: dict) -> None:
        """Update statistics (thread-safe)"""
        if self.server and self._loop and self.server.is_running():
            asyncio.run_coroutine_threadsafe(
                self.server.update_statistics(stats),
                self._loop
            )

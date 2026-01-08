"""
MRS1000 LIDAR Visualization Application

Main application that combines:
- UDP receiver for MRS1000 scan data
- WebSocket server for real-time data streaming to web clients
- HTTP server for serving the visualization frontend
- Optional simulation mode for testing without hardware

Designed to run on Red Lion Flex Edge industrial edge computing platform.
"""

import asyncio
import json
import logging
import os
import signal
import sys
import time
from pathlib import Path
from typing import Set, Optional
from dataclasses import dataclass
import argparse

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from aiohttp import web
import aiohttp

from mrs1000_parser import MRS1000Parser, MRS1000SimulatedParser, ScanData
from udp_receiver import MRS1000Receiver, ReceiverConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class AppConfig:
    """Application configuration"""
    # Server settings
    host: str = "0.0.0.0"
    http_port: int = 8080
    ws_port: int = 8081

    # Sensor settings
    sensor_ip: Optional[str] = None
    udp_port: int = 2112

    # Mode settings
    simulation_mode: bool = False
    simulation_rate: float = 12.5  # Hz

    # Data settings
    compact_mode: bool = True  # Send compact data format
    max_clients: int = 10

    # Paths
    static_path: str = "../frontend"


class LidarVisualizationApp:
    """
    Main application class for LIDAR visualization

    Handles:
    - Receiving LIDAR data (real or simulated)
    - WebSocket connections for real-time streaming
    - HTTP server for web frontend
    """

    def __init__(self, config: AppConfig):
        self.config = config
        self.receiver: Optional[MRS1000Receiver] = None
        self.simulator: Optional[MRS1000SimulatedParser] = None

        # WebSocket clients
        self.ws_clients: Set[web.WebSocketResponse] = set()

        # Latest scan data (for new clients)
        self.latest_scan: Optional[ScanData] = None

        # Statistics
        self.stats = {
            'scans_received': 0,
            'scans_sent': 0,
            'ws_messages_sent': 0,
            'start_time': time.time(),
        }

        # Control flags
        self._running = False
        self._simulation_task: Optional[asyncio.Task] = None

        # Determine static files path
        self.static_path = Path(__file__).parent / self.config.static_path
        if not self.static_path.exists():
            logger.warning(f"Static path not found: {self.static_path}")
            self.static_path = Path(__file__).parent.parent / "frontend"

    async def start(self) -> None:
        """Start the application"""
        logger.info("Starting MRS1000 LIDAR Visualization App")
        self._running = True

        if self.config.simulation_mode:
            logger.info("Running in SIMULATION mode")
            self.simulator = MRS1000SimulatedParser()
            self._simulation_task = asyncio.create_task(self._simulation_loop())
        else:
            logger.info("Running in LIVE mode")
            await self._start_receiver()

        # Start web server
        await self._start_web_server()

    async def stop(self) -> None:
        """Stop the application"""
        logger.info("Stopping application...")
        self._running = False

        # Stop simulation
        if self._simulation_task:
            self._simulation_task.cancel()
            try:
                await self._simulation_task
            except asyncio.CancelledError:
                pass

        # Stop receiver
        if self.receiver:
            self.receiver.stop()

        # Close all WebSocket connections
        for ws in list(self.ws_clients):
            await ws.close()

        logger.info("Application stopped")

    async def _start_receiver(self) -> None:
        """Start the UDP receiver for real sensor data"""
        config = ReceiverConfig(
            listen_ip="0.0.0.0",
            listen_port=self.config.udp_port,
            sensor_ip=self.config.sensor_ip,
        )

        self.receiver = MRS1000Receiver(config)
        self.receiver.add_callback(self._on_scan_received)
        self.receiver.start()

        logger.info(f"UDP receiver started on port {self.config.udp_port}")

    def _on_scan_received(self, scan: ScanData) -> None:
        """Callback when scan data is received from the sensor"""
        self.stats['scans_received'] += 1
        self.latest_scan = scan

        # Schedule async broadcast
        asyncio.run_coroutine_threadsafe(
            self._broadcast_scan(scan),
            asyncio.get_event_loop()
        )

    async def _simulation_loop(self) -> None:
        """Generate simulated scan data"""
        interval = 1.0 / self.config.simulation_rate

        while self._running:
            try:
                # Generate simulated scan
                scan = self.simulator.generate_scan()
                self.stats['scans_received'] += 1
                self.latest_scan = scan

                # Broadcast to clients
                await self._broadcast_scan(scan)

                # Wait for next scan
                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulation error: {e}")
                await asyncio.sleep(0.1)

    async def _broadcast_scan(self, scan: ScanData) -> None:
        """Broadcast scan data to all connected WebSocket clients"""
        if not self.ws_clients:
            return

        # Prepare data
        if self.config.compact_mode:
            data = scan.to_compact_dict()
        else:
            data = scan.to_dict()

        message = json.dumps({
            'type': 'scan',
            'data': data,
        })

        # Send to all clients
        dead_clients = set()
        for ws in self.ws_clients:
            try:
                await ws.send_str(message)
                self.stats['ws_messages_sent'] += 1
            except Exception as e:
                logger.debug(f"Failed to send to client: {e}")
                dead_clients.add(ws)

        # Remove dead clients
        self.ws_clients -= dead_clients
        self.stats['scans_sent'] += 1

    async def _start_web_server(self) -> None:
        """Start the HTTP and WebSocket server"""
        app = web.Application()

        # Routes
        app.router.add_get('/ws', self._handle_websocket)
        app.router.add_get('/api/status', self._handle_status)
        app.router.add_get('/api/config', self._handle_config)
        app.router.add_post('/api/config', self._handle_set_config)

        # Static files (frontend)
        if self.static_path.exists():
            app.router.add_static('/', self.static_path, name='static')
            app.router.add_get('/', self._handle_index)
            logger.info(f"Serving static files from: {self.static_path}")
        else:
            logger.warning("No static files directory found")

        runner = web.AppRunner(app)
        await runner.setup()

        site = web.TCPSite(runner, self.config.host, self.config.http_port)
        await site.start()

        logger.info(f"HTTP server started on http://{self.config.host}:{self.config.http_port}")
        logger.info(f"WebSocket available at ws://{self.config.host}:{self.config.http_port}/ws")

    async def _handle_index(self, request: web.Request) -> web.Response:
        """Serve index.html"""
        index_path = self.static_path / 'index.html'
        if index_path.exists():
            return web.FileResponse(index_path)
        return web.Response(text="Frontend not found", status=404)

    async def _handle_websocket(self, request: web.Request) -> web.WebSocketResponse:
        """Handle WebSocket connections"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        # Check client limit
        if len(self.ws_clients) >= self.config.max_clients:
            await ws.close(message=b"Too many clients")
            return ws

        self.ws_clients.add(ws)
        client_ip = request.remote
        logger.info(f"WebSocket client connected: {client_ip} "
                    f"(total: {len(self.ws_clients)})")

        # Send initial configuration
        await ws.send_str(json.dumps({
            'type': 'config',
            'data': {
                'simulation_mode': self.config.simulation_mode,
                'scan_rate': self.config.simulation_rate if self.config.simulation_mode else 12.5,
                'layers': 4,
                'fov_horizontal': 275,
                'fov_vertical': 5,
                'max_range': 64,
            }
        }))

        # Send latest scan if available
        if self.latest_scan:
            data = (self.latest_scan.to_compact_dict()
                    if self.config.compact_mode else self.latest_scan.to_dict())
            await ws.send_str(json.dumps({
                'type': 'scan',
                'data': data,
            }))

        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    # Handle client commands
                    try:
                        command = json.loads(msg.data)
                        await self._handle_client_command(ws, command)
                    except json.JSONDecodeError:
                        pass
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")

        finally:
            self.ws_clients.discard(ws)
            logger.info(f"WebSocket client disconnected: {client_ip} "
                        f"(remaining: {len(self.ws_clients)})")

        return ws

    async def _handle_client_command(self, ws: web.WebSocketResponse, command: dict) -> None:
        """Handle commands from WebSocket clients"""
        cmd_type = command.get('type')

        if cmd_type == 'ping':
            await ws.send_str(json.dumps({'type': 'pong', 'timestamp': time.time()}))

        elif cmd_type == 'get_status':
            status = self._get_status()
            await ws.send_str(json.dumps({'type': 'status', 'data': status}))

        elif cmd_type == 'set_compact_mode':
            self.config.compact_mode = command.get('value', True)
            await ws.send_str(json.dumps({'type': 'ack', 'command': 'set_compact_mode'}))

    async def _handle_status(self, request: web.Request) -> web.Response:
        """Handle status API request"""
        status = self._get_status()
        return web.json_response(status)

    async def _handle_config(self, request: web.Request) -> web.Response:
        """Handle config GET request"""
        config = {
            'simulation_mode': self.config.simulation_mode,
            'simulation_rate': self.config.simulation_rate,
            'udp_port': self.config.udp_port,
            'sensor_ip': self.config.sensor_ip,
            'compact_mode': self.config.compact_mode,
        }
        return web.json_response(config)

    async def _handle_set_config(self, request: web.Request) -> web.Response:
        """Handle config POST request"""
        try:
            data = await request.json()

            if 'compact_mode' in data:
                self.config.compact_mode = bool(data['compact_mode'])

            return web.json_response({'status': 'ok'})

        except Exception as e:
            return web.json_response({'error': str(e)}, status=400)

    def _get_status(self) -> dict:
        """Get current application status"""
        uptime = time.time() - self.stats['start_time']

        status = {
            'mode': 'simulation' if self.config.simulation_mode else 'live',
            'uptime_seconds': round(uptime, 1),
            'scans_received': self.stats['scans_received'],
            'scans_sent': self.stats['scans_sent'],
            'ws_clients': len(self.ws_clients),
            'ws_messages_sent': self.stats['ws_messages_sent'],
        }

        if self.receiver:
            receiver_stats = self.receiver.get_stats()
            status['receiver'] = receiver_stats

        return status


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="MRS1000 LIDAR Visualization for Red Lion Flex Edge"
    )
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8080,
                        help='HTTP port (default: 8080)')
    parser.add_argument('--udp-port', type=int, default=2112,
                        help='UDP port for sensor data (default: 2112)')
    parser.add_argument('--sensor-ip', type=str, default=None,
                        help='Sensor IP address (optional filter)')
    parser.add_argument('--simulate', action='store_true',
                        help='Run in simulation mode (no real sensor)')
    parser.add_argument('--sim-rate', type=float, default=12.5,
                        help='Simulation scan rate in Hz (default: 12.5)')
    parser.add_argument('--static', type=str, default='../frontend',
                        help='Path to static files')

    args = parser.parse_args()

    config = AppConfig(
        host=args.host,
        http_port=args.port,
        udp_port=args.udp_port,
        sensor_ip=args.sensor_ip,
        simulation_mode=args.simulate,
        simulation_rate=args.sim_rate,
        static_path=args.static,
    )

    app = LidarVisualizationApp(config)

    # Handle shutdown signals
    loop = asyncio.get_event_loop()

    def shutdown_handler():
        logger.info("Shutdown signal received")
        asyncio.create_task(app.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    try:
        await app.start()

        # Keep running until stopped
        while app._running:
            await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Application error: {e}")
    finally:
        await app.stop()


if __name__ == '__main__':
    asyncio.run(main())

# SICK MRS1000 LIDAR Visualization for Red Lion Flex Edge

A real-time 3D LIDAR visualization application designed for the SICK MRS1000 multi-layer scanner, optimized for deployment on Red Lion Flex Edge industrial edge computing platforms.

## Features

- **Real-time visualization** of MRS1000 LIDAR scan data
- **Multiple view modes**: 2D top-down, 3D point cloud, and layer-by-layer
- **Interactive controls**: Pan, zoom, rotate with mouse/touch
- **Color modes**: By layer, distance, intensity (RSSI), or height
- **Layer visibility toggles** for all 4 scan layers
- **Distance histogram** showing measurement distribution
- **Live statistics**: Scan rate, point count, min/max/avg distances
- **Simulation mode** for testing without hardware
- **Docker deployment** optimized for Red Lion Flex Edge
- **WebSocket streaming** for real-time data updates

## MRS1000 Sensor Specifications

The SICK MRS1000 is a 3D multi-layer LIDAR scanner with:

| Parameter | Value |
|-----------|-------|
| Horizontal FOV | 275° |
| Vertical FOV | 5° |
| Number of Layers | 4 |
| Layer Angles | -2.5°, -0.83°, +0.83°, +2.5° |
| Angular Resolution | 0.25° |
| Points per Layer | ~1100 |
| Max Range | 64 m |
| Scan Frequency | 12.5 / 25 / 50 Hz |
| Interface | Ethernet (UDP) |
| Protocol | SOPAS Binary |

## Project Structure

```
.
├── src/
│   ├── backend/
│   │   ├── app.py              # Main application server
│   │   ├── mrs1000_parser.py   # SOPAS telegram parser
│   │   └── udp_receiver.py     # UDP receiver for sensor data
│   └── frontend/
│       ├── index.html          # Main HTML page
│       ├── css/
│       │   └── style.css       # Styles
│       └── js/
│           ├── lidar-viewer.js     # WebSocket client
│           ├── visualization-2d.js # 2D canvas renderer
│           ├── visualization-3d.js # 3D WebGL renderer
│           ├── histogram.js        # Distance histogram
│           └── main.js             # Main application logic
├── config/
│   └── config.yaml             # Configuration file
├── docker/
│   ├── Dockerfile              # Docker build file
│   └── docker-compose.yml      # Docker Compose configuration
├── scripts/
│   └── deploy-flexedge.sh      # Deployment script
└── requirements.txt            # Python dependencies
```

## Quick Start

### Running Locally (Simulation Mode)

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the application in simulation mode:
   ```bash
   python src/backend/app.py --simulate
   ```

3. Open your browser to `http://localhost:8080`

### Running with Real Sensor

1. Configure your MRS1000 sensor to send scan data to your host IP on UDP port 2112

2. Start the application:
   ```bash
   python src/backend/app.py --udp-port 2112
   ```

3. Open your browser to `http://localhost:8080`

### Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -f docker/Dockerfile -t mrs1000-lidar-viz .

# Run in simulation mode
docker run -p 8080:8080 mrs1000-lidar-viz python backend/app.py --simulate

# Run with real sensor
docker run -p 8080:8080 -p 2112:2112/udp mrs1000-lidar-viz
```

Using Docker Compose:

```bash
cd docker

# Live mode
docker-compose up -d

# Simulation mode
docker-compose --profile simulation up -d lidar-simulation
```

## Red Lion Flex Edge Deployment

### Prerequisites

- Red Lion Flex Edge with Docker support enabled
- SSH access to the Flex Edge
- Network connectivity between Flex Edge and MRS1000 sensor

### Deployment Steps

1. Configure environment variables (optional):
   ```bash
   export FLEX_EDGE_HOST=192.168.1.1
   export FLEX_EDGE_USER=admin
   ```

2. Run the deployment script:
   ```bash
   ./scripts/deploy-flexedge.sh
   ```

3. Access the visualization at `http://<flex-edge-ip>:8080`

### Deployment Options

```bash
# Deploy to specific host
./scripts/deploy-flexedge.sh --host 192.168.1.100

# Deploy in simulation mode
./scripts/deploy-flexedge.sh --simulation

# Build only (no deployment)
./scripts/deploy-flexedge.sh --build-only
```

## Configuration

### Application Configuration

The application can be configured via command-line arguments or environment variables:

| Argument | Environment Variable | Default | Description |
|----------|---------------------|---------|-------------|
| `--host` | `LIDAR_HOST` | `0.0.0.0` | Server bind address |
| `--port` | `LIDAR_HTTP_PORT` | `8080` | HTTP/WebSocket port |
| `--udp-port` | `LIDAR_UDP_PORT` | `2112` | UDP port for sensor data |
| `--sensor-ip` | `LIDAR_SENSOR_IP` | (any) | Filter by sensor IP |
| `--simulate` | `LIDAR_SIMULATION` | `false` | Enable simulation mode |
| `--sim-rate` | `LIDAR_SIM_RATE` | `12.5` | Simulation scan rate (Hz) |

### MRS1000 Sensor Configuration

To configure the MRS1000 to send data to the Flex Edge:

1. Connect to the sensor via SOPAS Engineering Tool or web interface
2. Configure the scan data output:
   - Protocol: UDP
   - Destination IP: Flex Edge IP address
   - Destination Port: 2112
   - Data format: Binary (SOPAS)
3. Enable scan data output

Alternatively, use the `MRS1000Commander` class to configure programmatically.

## Visualization Controls

### View Modes

- **2D Top**: Top-down view of all layers combined
- **3D**: Interactive 3D point cloud view
- **Layers**: Layer-by-layer visualization (planned)

### Mouse/Touch Controls

| Action | 2D View | 3D View |
|--------|---------|---------|
| Pan | Click + Drag | - |
| Rotate | - | Click + Drag |
| Zoom | Mouse Wheel | Mouse Wheel |

### Color Modes

- **By Layer**: Each layer has a distinct color
- **By Distance**: Color gradient based on distance
- **By Intensity**: Grayscale based on RSSI value
- **By Height**: Color gradient based on Z coordinate

### Layer Visibility

Toggle visibility of individual layers (1-4) using the checkboxes in the left panel.

## API Endpoints

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web visualization interface |
| `/api/status` | GET | Application status and statistics |
| `/api/config` | GET | Current configuration |
| `/api/config` | POST | Update configuration |

### WebSocket Protocol

Connect to `/ws` for real-time scan data.

#### Message Types (Server → Client)

```json
// Configuration
{"type": "config", "data": {"simulation_mode": false, "scan_rate": 12.5, ...}}

// Scan data (compact format)
{"type": "scan", "data": {"timestamp": 123456, "scan_number": 1, "layers": {...}}}

// Status response
{"type": "status", "data": {"scans_received": 100, "ws_clients": 2, ...}}
```

#### Message Types (Client → Server)

```json
// Request status
{"type": "get_status"}

// Ping for latency measurement
{"type": "ping"}

// Set compact mode
{"type": "set_compact_mode", "value": true}
```

## Performance Considerations

### Optimizations for Flex Edge

- Compact data format reduces WebSocket bandwidth
- Single UDP receiver thread minimizes CPU usage
- Canvas rendering optimized for embedded displays
- Docker resource limits prevent system overload

### Resource Limits

The Docker container is configured with:
- CPU: 1 core max, 0.25 core reserved
- Memory: 512 MB max, 128 MB reserved

Adjust in `docker-compose.yml` if needed.

## Troubleshooting

### No Data Received

1. Verify sensor configuration (output IP and port)
2. Check network connectivity: `ping <sensor-ip>`
3. Verify UDP port is not blocked: `netstat -uln | grep 2112`
4. Check Docker port mapping: `-p 2112:2112/udp`

### High Latency

1. Reduce scan frequency on sensor (12.5 Hz recommended)
2. Enable compact data mode
3. Check network bandwidth
4. Reduce number of WebSocket clients

### WebSocket Connection Issues

1. Check if HTTP server is running
2. Verify firewall allows port 8080
3. Check browser console for errors
4. Try reconnecting using the "Reconnect" button

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Building Documentation

```bash
# Documentation is in markdown format
# View README.md for full documentation
```

## License

This project is provided as-is for industrial LIDAR visualization purposes.

## Acknowledgments

- SICK AG for the MRS1000 sensor documentation
- Red Lion Controls for the Flex Edge platform
- aiohttp for async WebSocket support

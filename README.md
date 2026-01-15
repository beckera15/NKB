# SICK MRS1000 LIDAR Visualization for Red Lion Flex Edge

A real-time 3D LIDAR visualization application designed for the SICK MRS1000 multi-layer scanner, optimized for deployment on Red Lion Flex Edge industrial edge computing platforms. Includes product measurement evaluation with GOOD/BAD outputs for integration with Ignition SCADA and Rockwell PLCs.

## Features

### Visualization
- **Real-time visualization** of MRS1000 LIDAR scan data
- **Multiple view modes**: 2D top-down, 3D point cloud, and layer-by-layer
- **Interactive controls**: Pan, zoom, rotate with mouse/touch
- **Color modes**: By layer, distance, intensity (RSSI), or height
- **Layer visibility toggles** for all 4 scan layers
- **Distance histogram** showing measurement distribution
- **Live statistics**: Scan rate, point count, min/max/avg distances

### Measurement Evaluation
- **Zone-based measurement** with configurable angular regions
- **GOOD/BAD output** based on expected distances and tolerances
- **Multiple measurement zones** per product configuration
- **Outlier rejection** with configurable parameters
- **Real-time statistics**: Evaluation count, good rate

### Industrial Integration
- **OPC-UA server** for Ignition SCADA integration
- **Modbus TCP server** for Rockwell PLC communication
- **EtherNet/IP server** for native Rockwell PLC integration
- **Add-On Profile (AOP)** for Studio 5000 device integration
- **Rockwell AOI** (Add-On Instruction) for Studio 5000
- **REST API** for configuration and monitoring

### Deployment
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
│   │   ├── app.py                  # Main application server
│   │   ├── mrs1000_parser.py       # SOPAS telegram parser
│   │   ├── udp_receiver.py         # UDP receiver for sensor data
│   │   ├── measurement_evaluator.py # Product measurement evaluation
│   │   ├── opcua_server.py         # OPC-UA server for Ignition
│   │   ├── modbus_server.py        # Modbus TCP server for PLCs
│   │   └── ethernetip_server.py    # EtherNet/IP server for Rockwell
│   └── frontend/
│       ├── index.html              # Main HTML page
│       ├── css/
│       │   └── style.css           # Styles
│       └── js/
│           ├── lidar-viewer.js     # WebSocket client
│           ├── visualization-2d.js # 2D canvas renderer
│           ├── visualization-3d.js # 3D WebGL renderer
│           ├── histogram.js        # Distance histogram
│           ├── measurement-ui.js   # Measurement results UI
│           └── main.js             # Main application logic
├── config/
│   └── config.yaml                 # Configuration file
├── docker/
│   ├── Dockerfile                  # Docker build file
│   └── docker-compose.yml          # Docker Compose configuration
├── plc/
│   └── rockwell/
│       ├── eds/
│       │   └── MRS1000_LIDAR.eds   # EDS file for device recognition
│       ├── aop/
│       │   ├── MRS1000_LIDAR_AOP.xml    # Add-On Profile definition
│       │   ├── MRS1000_DataTypes.L5X    # Data types for Studio 5000
│       │   ├── MRS1000_SampleProgram.L5X # Sample ladder logic
│       │   └── README_EtherNetIP.md     # EtherNet/IP guide
│       ├── MRS1000_LIDAR_AOI.L5X   # Rockwell AOI for Studio 5000
│       └── README_Rockwell.md      # Rockwell integration guide
├── scripts/
│   └── deploy-flexedge.sh          # Deployment script
└── requirements.txt                # Python dependencies
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

## Measurement Zone Configuration

### Configuring Zones via Web UI

1. Open the visualization in your browser
2. Click "Configure Zones" in the right panel
3. Set up measurement zones:
   - **Zone Name**: Descriptive name
   - **Expected Distance**: Target measurement in meters
   - **Tolerance +/-**: Acceptable deviation
   - **Start/End Angle**: Angular bounds of the zone
4. Click "Save" to apply

### Zone Configuration via API

```bash
# Get current products
curl http://localhost:8080/api/products

# Update product configuration
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "name": "My Product",
    "zones": [
      {
        "id": 1,
        "name": "Front Check",
        "start_angle": -15,
        "end_angle": 15,
        "expected_distance": 2.0,
        "tolerance_plus": 0.1,
        "tolerance_minus": 0.1
      }
    ]
  }'
```

## Industrial Integration

### Ignition SCADA (OPC-UA)

The application includes an OPC-UA server for Ignition integration.

**OPC-UA Endpoint:** `opc.tcp://<host>:4840/lidar/`

**Available Tags:**
- `LIDAR/Product/ActiveProductId` - Current product ID
- `LIDAR/Product/OverallResult` - 1=GOOD, 2=BAD
- `LIDAR/Product/OverallResultString` - "GOOD" or "BAD"
- `LIDAR/Zones/Zone1/Result` - Zone 1 result
- `LIDAR/Zones/Zone1/Measurement` - Zone 1 measured distance
- `LIDAR/Zones/Zone1/InTolerance` - Zone 1 in tolerance flag
- `LIDAR/Statistics/EvaluationCount` - Total evaluations
- `LIDAR/Statistics/GoodRate` - Good rate percentage

**Ignition Setup:**
1. Add OPC-UA connection to `opc.tcp://<flex-edge-ip>:4840/lidar/`
2. Browse tags under the LIDAR folder
3. Create tags or bind directly to displays

### Rockwell PLC (Modbus TCP)

The application includes a Modbus TCP server for Rockwell PLC integration.

**Modbus Server:** Port 502 (configurable)

**Register Map:**

| Register | Address | Description |
|----------|---------|-------------|
| 40001 | 0 | System Status (1=Running) |
| 40002 | 1 | Active Product ID |
| 40003 | 2 | Overall Result (1=GOOD, 2=BAD) |
| 40004 | 3 | Zone Count |
| 40101-40114 | 100-113 | Zone 1 Data |
| 40201-40214 | 200-213 | Zone 2 Data |

**Coils:**

| Coil | Description |
|------|-------------|
| 00002 | Overall GOOD |
| 00003 | Overall BAD |
| 00011-00026 | Zone 1-16 GOOD |
| 00031-00046 | Zone 1-16 BAD |

**Rockwell Studio 5000 Setup:**

1. Import the AOI from `plc/rockwell/MRS1000_LIDAR_AOI.L5X`
2. Configure MSG instructions to read Modbus registers
3. See `plc/rockwell/README_Rockwell.md` for detailed instructions

### Rockwell PLC (EtherNet/IP - Native)

For native Rockwell integration without Modbus, use the EtherNet/IP server.

**EtherNet/IP Server:** TCP 44818, UDP 2222

**Assembly Instances:**

| Instance | Type | Size | Description |
|----------|------|------|-------------|
| 100 | Input | 64 bytes | LIDAR → PLC (status, results, measurements) |
| 101 | Output | 32 bytes | PLC → LIDAR (commands, configuration) |
| 102 | Config | 16 bytes | Configuration data |

**Input Data (Instance 100):**

| Offset | Type | Description |
|--------|------|-------------|
| 0 | SINT | Status (0=Offline, 1=Running, 2=Error, 3=Sim) |
| 1 | SINT | Active Product ID |
| 2 | SINT | Overall Result (1=GOOD, 2=BAD) |
| 3 | SINT | Zone Count |
| 4-7 | DINT | Scan Counter |
| 8-11 | DINT | Good Count |
| 12-15 | DINT | Bad Count |
| 16-19 | DINT | Good Rate × 100 |
| 20-51 | DINT[] | Zone 1-4 Measurements & Results |
| 52-63 | DINT[] | Timestamp, Min/Max Distance |

**Rockwell Studio 5000 EtherNet/IP Setup:**

1. Install EDS file from `plc/rockwell/eds/MRS1000_LIDAR.eds`
2. Import data types from `plc/rockwell/aop/MRS1000_DataTypes.L5X`
3. Add Generic Ethernet Module with IP address and assembly instances
4. Import sample program from `plc/rockwell/aop/MRS1000_SampleProgram.L5X`
5. See `plc/rockwell/aop/README_EtherNetIP.md` for detailed instructions

## Configuration

### Command-Line Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--host` | `0.0.0.0` | Server bind address |
| `--port` | `8080` | HTTP/WebSocket port |
| `--udp-port` | `2112` | UDP port for sensor data |
| `--sensor-ip` | (any) | Filter by sensor IP |
| `--simulate` | `false` | Enable simulation mode |
| `--sim-rate` | `12.5` | Simulation scan rate (Hz) |
| `--no-opcua` | `false` | Disable OPC-UA server |
| `--opcua-port` | `4840` | OPC-UA server port |
| `--no-modbus` | `false` | Disable Modbus server |
| `--modbus-port` | `502` | Modbus TCP port |
| `--no-ethernetip` | `false` | Disable EtherNet/IP server |
| `--eip-tcp-port` | `44818` | EtherNet/IP TCP port |
| `--eip-udp-port` | `2222` | EtherNet/IP UDP port |
| `--config` | `../config/products.json` | Product config file |

### Example Configurations

```bash
# Full features with all servers
python src/backend/app.py --simulate

# Visualization only (no PLC integration)
python src/backend/app.py --simulate --no-opcua --no-modbus --no-ethernetip

# Rockwell only (EtherNet/IP native)
python src/backend/app.py --simulate --no-opcua --no-modbus

# Custom ports
python src/backend/app.py --port 8000 --opcua-port 4841 --modbus-port 5020 --eip-tcp-port 44819
```

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -f docker/Dockerfile -t mrs1000-lidar-viz .

# Run in simulation mode
docker run -p 8080:8080 -p 4840:4840 -p 502:502 -p 44818:44818 -p 2222:2222/udp \
  mrs1000-lidar-viz python backend/app.py --simulate

# Run with real sensor
docker run -p 8080:8080 -p 2112:2112/udp -p 4840:4840 -p 502:502 -p 44818:44818 -p 2222:2222/udp \
  mrs1000-lidar-viz
```

### Docker Compose

```bash
cd docker
docker-compose up -d
```

## Red Lion Flex Edge Deployment

### Prerequisites

- Red Lion Flex Edge with Docker support enabled
- SSH access to the Flex Edge
- Network connectivity between Flex Edge and MRS1000 sensor

### Deployment

```bash
# Deploy to Flex Edge
./scripts/deploy-flexedge.sh --host 192.168.1.100

# Deploy in simulation mode
./scripts/deploy-flexedge.sh --host 192.168.1.100 --simulation
```

### Access Points

After deployment:
- **Web UI:** `http://<flex-edge-ip>:8080`
- **OPC-UA:** `opc.tcp://<flex-edge-ip>:4840/lidar/`
- **Modbus TCP:** `<flex-edge-ip>:502`

## API Reference

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web visualization interface |
| `/api/status` | GET | Application status |
| `/api/config` | GET | Current configuration |
| `/api/products` | GET | List all products |
| `/api/products` | POST | Create product |
| `/api/products/{id}` | GET | Get product |
| `/api/products/{id}` | PUT | Update product |
| `/api/products/{id}` | DELETE | Delete product |
| `/api/products/{id}/activate` | POST | Set active product |
| `/api/measurements` | GET | Latest measurement results |
| `/api/statistics` | GET | Evaluation statistics |
| `/api/statistics/reset` | POST | Reset statistics |

### WebSocket Messages

**Server → Client:**
```json
// Measurement result
{
  "type": "measurement",
  "data": {
    "id": 1,
    "name": "Product 1",
    "last_result": 1,
    "last_result_name": "GOOD",
    "zones": [...]
  },
  "statistics": {
    "evaluation_count": 100,
    "good_count": 95,
    "good_rate": 0.95
  }
}
```

## Troubleshooting

### No Measurement Results

1. Verify a product is configured with zones
2. Check that zones cover angles where objects exist
3. Verify expected distances match actual objects

### OPC-UA Connection Issues

1. Install `asyncua` library: `pip install asyncua`
2. Check firewall allows port 4840
3. Verify OPC-UA is enabled (not `--no-opcua`)

### Modbus Communication Issues

1. Verify port 502 is accessible (may require root/admin)
2. Use alternative port: `--modbus-port 5020`
3. Check register addresses (0-based in most clients)

## License

This project is provided as-is for industrial LIDAR visualization purposes.

## Acknowledgments

- SICK AG for the MRS1000 sensor documentation
- Red Lion Controls for the Flex Edge platform
- Inductive Automation for Ignition SCADA
- Rockwell Automation for Studio 5000

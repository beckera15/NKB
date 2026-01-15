# MRS1000 LIDAR - Rockwell EtherNet/IP Integration Guide

This guide explains how to integrate the MRS1000 LIDAR sensor with Rockwell Automation PLCs (ControlLogix, CompactLogix) using native EtherNet/IP communication.

## Overview

The MRS1000 LIDAR system provides three communication options for Rockwell PLCs:

| Method | Protocol | Best For |
|--------|----------|----------|
| **EtherNet/IP** | CIP over TCP/UDP | Native Rockwell integration, fastest |
| **Modbus TCP** | Modbus over TCP | Simple integration, widely compatible |
| **OPC-UA** | OPC-UA over TCP | Integration with Ignition, FactoryTalk |

This guide focuses on **EtherNet/IP** for native Rockwell integration.

## Files Included

```
plc/rockwell/
├── eds/
│   └── MRS1000_LIDAR.eds       # Electronic Data Sheet for device recognition
├── aop/
│   ├── MRS1000_LIDAR_AOP.xml   # Add-On Profile definition
│   ├── MRS1000_DataTypes.L5X    # User-Defined Data Types (import first)
│   ├── MRS1000_SampleProgram.L5X # Sample ladder logic program
│   └── README_EtherNetIP.md     # This file
└── MRS1000_LIDAR_AOI.L5X       # Add-On Instruction (alternative method)
```

## Installation Steps

### Step 1: Install EDS File

1. Open **RSLinx Classic** or **FactoryTalk Linx**
2. Go to **Tools → EDS Hardware Installation Tool**
3. Click **Add** and browse to `eds/MRS1000_LIDAR.eds`
4. Follow the wizard to complete installation

### Step 2: Import Data Types

1. Open your project in **Studio 5000 Logix Designer**
2. In the Controller Organizer, expand **Data Types**
3. Right-click **User-Defined** → **Import Data Type...**
4. Select `aop/MRS1000_DataTypes.L5X`
5. Click **Import**

This creates the following data types:
- `MRS1000_Zone` - Single zone measurement data
- `MRS1000_Stats` - Statistics counters
- `MRS1000_Input` - Input assembly (64 bytes)
- `MRS1000_Output` - Output assembly (32 bytes)
- `MRS1000_Device` - Complete device structure

### Step 3: Add Generic Ethernet Module

1. In Controller Organizer, right-click **Ethernet** under I/O Configuration
2. Select **New Module...**
3. Choose **ETHERNET-MODULE** (Generic Ethernet Module)
4. Configure as follows:

| Parameter | Value |
|-----------|-------|
| Name | MRS1000_LIDAR |
| Comm Format | Data - SINT |
| IP Address | [Your LIDAR Gateway IP] |
| Input Assembly | Instance: 100, Size: 64 |
| Output Assembly | Instance: 101, Size: 32 |
| Configuration Assembly | Instance: 102, Size: 0 |
| RPI | 10ms (minimum 2ms) |

5. Click **OK**

### Step 4: Import Sample Program (Optional)

1. Right-click **Programs** in Controller Organizer
2. Select **Import Program...**
3. Select `aop/MRS1000_SampleProgram.L5X`
4. Map the imported tags to your module I/O

### Step 5: Configure Tag Mapping

Map the Generic Ethernet Module I/O to your program tags:

```
Module Input  → LIDAR_RawInput[0..63]
Module Output → LIDAR_RawOutput[0..31]
```

## Data Structures

### Input Assembly (LIDAR → PLC) - 64 bytes

| Offset | Size | Name | Description |
|--------|------|------|-------------|
| 0 | 1 | Status | 0=Offline, 1=Running, 2=Error, 3=Simulation |
| 1 | 1 | ActiveProductID | Current product configuration ID |
| 2 | 1 | OverallResult | 0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error |
| 3 | 1 | ZoneCount | Number of configured zones |
| 4 | 4 | ScanCounter | Total scans processed (DINT) |
| 8 | 4 | GoodCount | Good measurement count (DINT) |
| 12 | 4 | BadCount | Bad measurement count (DINT) |
| 16 | 4 | GoodRate | Good rate × 100 (9850 = 98.50%) (DINT) |
| 20 | 4 | Zone1_Measurement | Zone 1 measurement in mm (DINT) |
| 24 | 4 | Zone1_Result | Zone 1 result (DINT) |
| 28 | 4 | Zone2_Measurement | Zone 2 measurement in mm (DINT) |
| 32 | 4 | Zone2_Result | Zone 2 result (DINT) |
| 36 | 4 | Zone3_Measurement | Zone 3 measurement in mm (DINT) |
| 40 | 4 | Zone3_Result | Zone 3 result (DINT) |
| 44 | 4 | Zone4_Measurement | Zone 4 measurement in mm (DINT) |
| 48 | 4 | Zone4_Result | Zone 4 result (DINT) |
| 52 | 4 | Timestamp | Milliseconds since start (DINT) |
| 56 | 4 | MinDistance | Minimum distance in scan (mm) |
| 60 | 4 | MaxDistance | Maximum distance in scan (mm) |

### Output Assembly (PLC → LIDAR) - 32 bytes

| Offset | Size | Name | Description |
|--------|------|------|-------------|
| 0 | 1 | Command | 0=None, 1=ResetStats, 2=ChangeProduct |
| 1 | 1 | ProductID | Product ID to activate (with Command=2) |
| 2 | 2 | Reserved | Reserved for future use |
| 4 | 4 | Zone1_ExpectedDist | Zone 1 expected distance in mm |
| 8 | 4 | Zone1_Tolerance | Zone 1 tolerance ± mm |
| 12 | 4 | Zone2_ExpectedDist | Zone 2 expected distance in mm |
| 16 | 4 | Zone2_Tolerance | Zone 2 tolerance ± mm |
| 20 | 12 | Reserved | Reserved for expansion |

## Sample Ladder Logic

### Reading LIDAR Status

```
// Check if LIDAR is online and result is GOOD
XIC(LIDAR.Input.IsOnline)
XIC(LIDAR.Input.IsGood)
OTE(Part_Pass)
```

### Checking Zone Results

```
// Check Zone 1 measurement
EQU(LIDAR.Zone[0].Result, 1)     // Result = GOOD
OTE(Zone1_OK)

// Get actual measurement value
MOV(LIDAR.Zone[0].Measurement, Zone1_Distance)
```

### Resetting Statistics

```
// Reset stats on button press (one-shot)
XIC(Reset_Button)
ONS(Reset_OS)
MOV(1, LIDAR.Output.Command)
```

### Changing Product Configuration

```
// Change to product ID 2
XIC(Product_Select_2)
ONS(Product_OS)
MOV(2, LIDAR.Output.Command)
MOV(2, LIDAR.Output.ProductID)
```

## Network Configuration

### Default Ports

| Service | Port | Protocol |
|---------|------|----------|
| EtherNet/IP | 44818 | TCP |
| Implicit I/O | 2222 | UDP |

### Firewall Rules

Ensure these ports are open between the PLC and LIDAR gateway:
- TCP 44818 (explicit messaging)
- UDP 2222 (implicit I/O)

## Troubleshooting

### Module Shows "Faulted" Status

1. Verify IP address is correct
2. Check network connectivity: `ping [LIDAR_IP]`
3. Verify LIDAR application is running
4. Check assembly instance numbers match (100/101)

### No Data Updating

1. Verify RPI is appropriate (10ms recommended)
2. Check that LIDAR simulation or real sensor is active
3. Verify connection is "Exclusive Owner" type

### Incorrect Values

1. Ensure data types are SINT array for raw data
2. Verify byte order (little-endian)
3. Check COP instructions for DINT conversions

## Performance Recommendations

| RPI Setting | Use Case |
|-------------|----------|
| 2-5ms | High-speed inspection, critical timing |
| 10ms | Standard inspection applications |
| 20-50ms | Monitoring only, non-critical |
| 100ms+ | Logging, slow-moving applications |

## Support

For technical support:
1. Check the main README.md for application configuration
2. Review the web interface at `http://[LIDAR_IP]:8080`
3. Check application logs for error messages

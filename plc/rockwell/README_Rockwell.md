# MRS1000 LIDAR Integration with Rockwell Studio 5000

This guide explains how to integrate the MRS1000 LIDAR Visualization system with Rockwell ControlLogix/CompactLogix PLCs using Studio 5000.

## Overview

The LIDAR system exposes measurement results via Modbus TCP, which can be read by Rockwell PLCs using the MSG instruction. An Add-On Instruction (AOI) is provided to simplify data parsing.

## Files Included

- `MRS1000_LIDAR_AOI.L5X` - Add-On Instruction for Studio 5000
- `README_Rockwell.md` - This documentation file

## Modbus Register Map

### Holding Registers (Function Code 3)

| Register | Address | Description |
|----------|---------|-------------|
| 40001 | 0 | System Status (0=Offline, 1=Running, 2=Error) |
| 40002 | 1 | Active Product ID |
| 40003 | 2 | Overall Result (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error) |
| 40004 | 3 | Zone Count |
| 40005-40006 | 4-5 | Evaluation Count (32-bit, High:Low) |
| 40007-40008 | 6-7 | Good Count (32-bit) |
| 40009-40010 | 8-9 | Bad Count (32-bit) |

### Zone Registers (per zone)

Each zone uses 14 registers starting at:
- Zone 1: 40101-40114
- Zone 2: 40201-40214
- Zone 3: 40301-40314
- Zone 4: 40401-40414
- ... up to Zone 16

| Offset | Description |
|--------|-------------|
| +0 | Zone ID |
| +1 | Enabled (0/1) |
| +2 | Result (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error) |
| +3 | In Tolerance (0/1) |
| +4-5 | Measurement (32-bit IEEE 754 float) |
| +6-7 | Expected Distance (32-bit float) |
| +8-9 | Tolerance Plus (32-bit float) |
| +10-11 | Tolerance Minus (32-bit float) |
| +12-13 | Point Count (32-bit) |

### Coils (Function Code 1)

| Coil | Description |
|------|-------------|
| 00001 | System Running |
| 00002 | Overall Result GOOD |
| 00003 | Overall Result BAD |
| 00011-00026 | Zone 1-16 GOOD |
| 00031-00046 | Zone 1-16 BAD |

### Control Registers (Write - Function Code 6)

| Register | Description |
|----------|-------------|
| 40901 | Reset Statistics (write 1) |
| 40902 | Set Active Product ID |

## Setup Instructions

### Step 1: Import the AOI

1. Open Studio 5000 Logix Designer
2. Open your project or create a new one
3. Right-click on "Add-On Instructions" in the Controller Organizer
4. Select "Import Add-On Instruction..."
5. Browse to and select `MRS1000_LIDAR_AOI.L5X`
6. Click "Import"

### Step 2: Create the Modbus MSG Configuration

Create a Generic Ethernet Module for Modbus TCP communication:

1. Right-click on "Ethernet" under I/O Configuration
2. Select "New Module..."
3. Choose "ETHERNET-MODULE" (Generic Ethernet Module)
4. Configure:
   - Name: `LIDAR_Modbus`
   - IP Address: LIDAR system IP (e.g., `192.168.1.100`)
   - Connection Parameters:
     - Assembly Instance (Input): 100
     - Assembly Instance (Output): 101
     - Size: 100 (bytes)

### Step 3: Create Data Tags

Create the following tags in your controller:

```
// MSG instruction tags
LIDAR_MSG_Read : MESSAGE
LIDAR_MSG_ReadCoils : MESSAGE

// Modbus data buffers
LIDAR_StatusRegs : INT[10]      // Registers 40001-40010
LIDAR_Zone1Regs : INT[14]       // Registers 40101-40114
LIDAR_Zone2Regs : INT[14]       // Registers 40201-40214
LIDAR_Zone3Regs : INT[14]       // Registers 40301-40314
LIDAR_Zone4Regs : INT[14]       // Registers 40401-40414
LIDAR_Coils : BOOL[48]          // Coils 00001-00048

// AOI output
LIDAR_Data : MRS1000_Data       // Structured output from AOI
LIDAR_Valid : BOOL              // Data valid flag
LIDAR_Error : BOOL              // Error flag

// Control
LIDAR_Trigger : BOOL            // Trigger read
LIDAR_ReadDone : BOOL           // Read complete
```

### Step 4: Configure MSG Instructions

Configure MSG instructions to read Modbus data:

**MSG for Status Registers:**
```
Message Type: Modbus TCP
Service Type: Read Holding Registers (03)
Modbus Address: 0
Number of Elements: 10
Destination: LIDAR_StatusRegs[0]
Path: 1,192.168.1.100,2,502
```

**MSG for Zone 1 Registers:**
```
Message Type: Modbus TCP
Service Type: Read Holding Registers (03)
Modbus Address: 100
Number of Elements: 14
Destination: LIDAR_Zone1Regs[0]
Path: 1,192.168.1.100,2,502
```

### Step 5: Implement Ladder Logic

Example ladder logic for reading LIDAR data:

```
// Rung 0: Periodic trigger (every 100ms)
|----[TON Timer_100ms, 100, 0]----[OTE LIDAR_Trigger]---|
|----[/Timer_100ms.DN]-------------------------------------|

// Rung 1: Read status registers
|----[LIDAR_Trigger]----[/LIDAR_MSG_Read.EN]----[MSG LIDAR_MSG_Read]---|

// Rung 2: Read zone 1 (after status complete)
|----[LIDAR_MSG_Read.DN]----[MSG LIDAR_MSG_Zone1]---|

// Rung 3: Read zone 2 (after zone 1 complete)
|----[LIDAR_MSG_Zone1.DN]----[MSG LIDAR_MSG_Zone2]---|

// Rung 4: Call AOI when all reads complete
|----[LIDAR_MSG_Zone2.DN]----[MRS1000_LIDAR AOI_Instance
                              ModbusStatusRegs := LIDAR_StatusRegs
                              ModbusZone1Regs := LIDAR_Zone1Regs
                              ModbusZone2Regs := LIDAR_Zone2Regs
                              ModbusZone3Regs := LIDAR_Zone3Regs
                              ModbusZone4Regs := LIDAR_Zone4Regs
                              Data := LIDAR_Data
                              Valid := LIDAR_Valid
                              Error := LIDAR_Error]---|

// Rung 5: Use results
|----[LIDAR_Valid]----[LIDAR_Data.OverallGood]----[OTE Product_OK]---|
|----[LIDAR_Valid]----[LIDAR_Data.OverallBad]-----[OTE Product_Reject]---|
```

### Step 6: Float Conversion

To convert 32-bit floats from Modbus registers, use the COP instruction:

```
// Convert measurement float (registers at offset +4,+5)
COP(LIDAR_Zone1Regs[4], LIDAR_Data.Zones[0].Measurement, 1)
```

Note: Ensure byte order matches (Big Endian / Word Swap may be required).

## Alternative: Direct Coil Access

For fastest response, read coils directly for GOOD/BAD status:

```
// Read coils 00001-00048
MSG Type: Modbus TCP
Service: Read Coils (01)
Address: 0
Count: 48
Destination: LIDAR_Coils[0]
```

Then use directly:
```
|----[LIDAR_Coils[1]]----[OTE Overall_Good]---|    // Coil 00002
|----[LIDAR_Coils[2]]----[OTE Overall_Bad]---|     // Coil 00003
|----[LIDAR_Coils[10]]---[OTE Zone1_Good]---|      // Coil 00011
|----[LIDAR_Coils[30]]---[OTE Zone1_Bad]---|       // Coil 00031
```

## Troubleshooting

### No Communication

1. Verify IP address and port (default 502)
2. Check firewall settings
3. Verify LIDAR system is running
4. Check Ethernet cable connection

### Invalid Data

1. Verify register addresses (0-based in MSG)
2. Check byte order for floats
3. Verify MSG path configuration

### Slow Response

1. Reduce polling rate if needed
2. Use coils for quick GOOD/BAD checks
3. Only read zones that are configured

## Data Types Reference

### MRS1000_Zone Structure
```
MRS1000_Zone
├── ZoneID : DINT
├── Enabled : BOOL
├── Result : DINT (0=Unknown, 1=Good, 2=Bad, 3=NoTarget, 4=Error)
├── InTolerance : BOOL
├── Measurement : REAL (meters)
├── ExpectedDistance : REAL (meters)
├── TolerancePlus : REAL (meters)
├── ToleranceMinus : REAL (meters)
├── PointCount : DINT
├── Good : BOOL
└── Bad : BOOL
```

### MRS1000_Data Structure
```
MRS1000_Data
├── SystemStatus : DINT
├── ActiveProductID : DINT
├── OverallResult : DINT
├── ZoneCount : DINT
├── EvaluationCount : DINT
├── GoodCount : DINT
├── BadCount : DINT
├── OverallGood : BOOL
├── OverallBad : BOOL
├── Online : BOOL
└── Zones[16] : MRS1000_Zone
```

## Support

For issues with:
- LIDAR visualization system: Check system logs
- PLC communication: Verify network configuration
- AOI functionality: Review this documentation

## Version History

- v1.0 - Initial release with basic GOOD/BAD functionality

/**
 * MRS1000 LIDAR Viewer - Core Class
 *
 * Handles WebSocket communication and data management for the LIDAR visualization.
 */

class LidarViewer {
    constructor(options = {}) {
        this.options = {
            wsUrl: options.wsUrl || this._getDefaultWsUrl(),
            autoReconnect: options.autoReconnect !== false,
            reconnectDelay: options.reconnectDelay || 2000,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
        };

        // WebSocket
        this.ws = null;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;

        // Data
        this.latestScan = null;
        this.config = null;

        // Statistics
        this.stats = {
            messagesReceived: 0,
            bytesReceived: 0,
            lastMessageTime: 0,
            connectionStartTime: 0,
            scanRate: 0,
            latency: 0,
        };

        // Rate calculation
        this._scanTimes = [];
        this._lastBytesCount = 0;
        this._lastBytesTime = Date.now();

        // Event handlers
        this._eventHandlers = {
            connect: [],
            disconnect: [],
            scan: [],
            config: [],
            error: [],
            status: [],
            measurement: [],
        };

        // Layer colors
        this.layerColors = [
            '#ff4444',  // Layer 1 - Red
            '#44ff44',  // Layer 2 - Green
            '#4444ff',  // Layer 3 - Blue
            '#ffff44',  // Layer 4 - Yellow
        ];

        // Layer vertical angles
        this.layerAngles = [-2.5, -0.833, 0.833, 2.5];
    }

    /**
     * Get default WebSocket URL based on current location
     */
    _getDefaultWsUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }

    /**
     * Register an event handler
     */
    on(event, handler) {
        if (this._eventHandlers[event]) {
            this._eventHandlers[event].push(handler);
        }
        return this;
    }

    /**
     * Remove an event handler
     */
    off(event, handler) {
        if (this._eventHandlers[event]) {
            const index = this._eventHandlers[event].indexOf(handler);
            if (index !== -1) {
                this._eventHandlers[event].splice(index, 1);
            }
        }
        return this;
    }

    /**
     * Emit an event
     */
    _emit(event, data) {
        if (this._eventHandlers[event]) {
            this._eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`Event handler error (${event}):`, e);
                }
            });
        }
    }

    /**
     * Connect to the WebSocket server
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Already connected');
            return;
        }

        console.log(`Connecting to ${this.options.wsUrl}...`);

        try {
            this.ws = new WebSocket(this.options.wsUrl);

            this.ws.onopen = () => this._onOpen();
            this.ws.onclose = (event) => this._onClose(event);
            this.ws.onerror = (error) => this._onError(error);
            this.ws.onmessage = (event) => this._onMessage(event);

        } catch (error) {
            console.error('WebSocket connection error:', error);
            this._emit('error', error);
            this._scheduleReconnect();
        }
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        this.options.autoReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.close();
        }
    }

    /**
     * Handle WebSocket open
     */
    _onOpen() {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.stats.connectionStartTime = Date.now();
        this._emit('connect');
    }

    /**
     * Handle WebSocket close
     */
    _onClose(event) {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this._emit('disconnect', event);
        this._scheduleReconnect();
    }

    /**
     * Handle WebSocket error
     */
    _onError(error) {
        console.error('WebSocket error:', error);
        this._emit('error', error);
    }

    /**
     * Handle incoming WebSocket message
     */
    _onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.stats.messagesReceived++;
            this.stats.bytesReceived += event.data.length;
            this.stats.lastMessageTime = Date.now();

            switch (message.type) {
                case 'scan':
                    this._handleScanData(message.data);
                    break;
                case 'config':
                    this._handleConfig(message.data);
                    break;
                case 'status':
                    this._emit('status', message.data);
                    break;
                case 'pong':
                    this.stats.latency = Date.now() - message.timestamp * 1000;
                    break;
                case 'measurement':
                    this._emit('measurement', message);
                    break;
            }

        } catch (error) {
            console.error('Message parse error:', error);
        }
    }

    /**
     * Handle scan data from server
     */
    _handleScanData(data) {
        // Parse compact format into full scan data
        const scan = this._parseScanData(data);
        this.latestScan = scan;

        // Calculate scan rate
        const now = Date.now();
        this._scanTimes.push(now);

        // Keep only last second of scan times
        while (this._scanTimes.length > 0 && this._scanTimes[0] < now - 1000) {
            this._scanTimes.shift();
        }
        this.stats.scanRate = this._scanTimes.length;

        // Emit scan event
        this._emit('scan', scan);
    }

    /**
     * Parse scan data from compact format
     */
    _parseScanData(data) {
        const scan = {
            timestamp: data.timestamp,
            scanNumber: data.scan_number,
            frequency: data.frequency,
            config: data.config || {
                start_angle: -137.5,
                end_angle: 137.5,
                resolution: 0.25,
            },
            points: [],
            layers: {},
            stats: {
                minDistance: Infinity,
                maxDistance: 0,
                avgDistance: 0,
                validPoints: 0,
                totalPoints: 0,
            },
        };

        // Parse each layer
        let totalDistance = 0;
        let validCount = 0;

        for (let layer = 0; layer < 4; layer++) {
            const layerKey = String(layer);
            const layerData = data.layers?.[layerKey];

            if (!layerData) continue;

            scan.layers[layer] = [];
            const distances = layerData.distances || [];
            const angles = layerData.angles || [];
            const rssi = layerData.rssi || [];
            const verticalAngle = this.layerAngles[layer];

            for (let i = 0; i < distances.length; i++) {
                const distance = distances[i];
                const angle = angles[i] !== undefined ? angles[i] :
                    scan.config.start_angle + i * scan.config.resolution;
                const intensity = rssi[i] || 0;

                // Calculate 3D coordinates
                const hRad = angle * Math.PI / 180;
                const vRad = verticalAngle * Math.PI / 180;
                const x = distance * Math.cos(vRad) * Math.cos(hRad);
                const y = distance * Math.cos(vRad) * Math.sin(hRad);
                const z = distance * Math.sin(vRad);

                const point = {
                    distance,
                    angle,
                    verticalAngle,
                    rssi: intensity,
                    layer,
                    x,
                    y,
                    z,
                };

                scan.points.push(point);
                scan.layers[layer].push(point);
                scan.stats.totalPoints++;

                // Update statistics (only for valid readings)
                if (distance > 0.1 && distance < 64) {
                    scan.stats.validPoints++;
                    totalDistance += distance;
                    validCount++;

                    if (distance < scan.stats.minDistance) {
                        scan.stats.minDistance = distance;
                    }
                    if (distance > scan.stats.maxDistance) {
                        scan.stats.maxDistance = distance;
                    }
                }
            }
        }

        // Calculate average
        if (validCount > 0) {
            scan.stats.avgDistance = totalDistance / validCount;
        }

        // Handle edge cases
        if (scan.stats.minDistance === Infinity) {
            scan.stats.minDistance = 0;
        }

        return scan;
    }

    /**
     * Handle configuration from server
     */
    _handleConfig(data) {
        this.config = data;
        this._emit('config', data);
    }

    /**
     * Schedule a reconnection attempt
     */
    _scheduleReconnect() {
        if (!this.options.autoReconnect) return;
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        const delay = this.options.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
        this.reconnectAttempts++;

        console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Send a command to the server
     */
    send(type, data = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, ...data }));
        }
    }

    /**
     * Request server status
     */
    requestStatus() {
        this.send('get_status');
    }

    /**
     * Send ping to measure latency
     */
    ping() {
        this.send('ping');
    }

    /**
     * Get data rate in KB/s
     */
    getDataRate() {
        const now = Date.now();
        const elapsed = (now - this._lastBytesTime) / 1000;

        if (elapsed >= 1) {
            const bytes = this.stats.bytesReceived - this._lastBytesCount;
            this._lastBytesCount = this.stats.bytesReceived;
            this._lastBytesTime = now;
            return (bytes / 1024 / elapsed).toFixed(1);
        }

        return null;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Get connection state as string
     */
    getConnectionState() {
        if (!this.ws) return 'disconnected';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    /**
     * Set WebSocket URL
     */
    setUrl(url) {
        this.options.wsUrl = url;
    }
}

// Export for use in other modules
window.LidarViewer = LidarViewer;

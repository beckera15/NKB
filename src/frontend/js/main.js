/**
 * MRS1000 LIDAR Visualization - Main Application
 *
 * Initializes and coordinates all visualization components.
 */

(function() {
    'use strict';

    // Application state
    const state = {
        viewer: null,
        vis2d: null,
        vis3d: null,
        histogram: null,
        currentView: '2d',
        settings: {
            wsUrl: '',
            autoReconnect: true,
            showGrid: true,
            showRangeRings: true,
            gridSpacing: 5,
            bgColor: 'dark',
        },
    };

    // DOM elements
    const elements = {};

    /**
     * Initialize the application
     */
    function init() {
        // Get DOM elements
        cacheElements();

        // Load settings
        loadSettings();

        // Initialize components
        initViewer();
        initVisualizations();
        initHistogram();

        // Setup UI event handlers
        setupEventHandlers();

        // Start animation loop
        requestAnimationFrame(animate);

        // Update timestamp
        updateTimestamp();
        setInterval(updateTimestamp, 1000);

        // Connect to server
        state.viewer.connect();

        console.log('MRS1000 LIDAR Visualization initialized');
    }

    /**
     * Cache DOM element references
     */
    function cacheElements() {
        elements.connectionStatus = document.getElementById('connectionStatus');
        elements.statusDot = elements.connectionStatus.querySelector('.status-dot');
        elements.statusText = elements.connectionStatus.querySelector('.status-text');
        elements.modeBadge = document.getElementById('modeBadge');

        // Stats
        elements.scanRate = document.getElementById('scanRate');
        elements.pointCount = document.getElementById('pointCount');
        elements.scanNumber = document.getElementById('scanNumber');
        elements.latency = document.getElementById('latency');
        elements.minDistance = document.getElementById('minDistance');
        elements.maxDistance = document.getElementById('maxDistance');
        elements.avgDistance = document.getElementById('avgDistance');
        elements.validPoints = document.getElementById('validPoints');
        elements.msgCount = document.getElementById('msgCount');
        elements.dataRate = document.getElementById('dataRate');

        // Controls
        elements.rangeSlider = document.getElementById('rangeSlider');
        elements.rangeValue = document.getElementById('rangeValue');
        elements.pointSizeSlider = document.getElementById('pointSizeSlider');
        elements.pointSizeValue = document.getElementById('pointSizeValue');
        elements.colorMode = document.getElementById('colorMode');

        // Canvases
        elements.lidarCanvas = document.getElementById('lidarCanvas');
        elements.lidar3DCanvas = document.getElementById('lidar3DCanvas');
        elements.histogramCanvas = document.getElementById('histogramCanvas');

        // Coordinate display
        elements.coordDisplay = document.getElementById('coordDisplay');

        // Buttons
        elements.zoomIn = document.getElementById('zoomIn');
        elements.zoomOut = document.getElementById('zoomOut');
        elements.resetView = document.getElementById('resetView');
        elements.reconnectBtn = document.getElementById('reconnectBtn');
        elements.settingsBtn = document.getElementById('settingsBtn');

        // Settings modal
        elements.settingsModal = document.getElementById('settingsModal');
        elements.closeSettings = document.getElementById('closeSettings');
        elements.saveSettings = document.getElementById('saveSettings');
        elements.wsUrl = document.getElementById('wsUrl');
        elements.autoReconnect = document.getElementById('autoReconnect');
        elements.showGrid = document.getElementById('showGrid');
        elements.showRangeRings = document.getElementById('showRangeRings');
        elements.gridSpacing = document.getElementById('gridSpacing');
        elements.gridSpacingValue = document.getElementById('gridSpacingValue');
        elements.bgColor = document.getElementById('bgColor');

        // Timestamp
        elements.timestamp = document.getElementById('timestamp');
    }

    /**
     * Initialize the LIDAR viewer (WebSocket client)
     */
    function initViewer() {
        const wsUrl = state.settings.wsUrl || getDefaultWsUrl();

        state.viewer = new LidarViewer({
            wsUrl: wsUrl,
            autoReconnect: state.settings.autoReconnect,
        });

        // Event handlers
        state.viewer.on('connect', onConnect);
        state.viewer.on('disconnect', onDisconnect);
        state.viewer.on('scan', onScan);
        state.viewer.on('config', onConfig);
        state.viewer.on('error', onError);
    }

    /**
     * Initialize visualization components
     */
    function initVisualizations() {
        // 2D visualization
        state.vis2d = new Visualization2D(elements.lidarCanvas, {
            maxRange: parseInt(elements.rangeSlider.value),
            pointSize: parseInt(elements.pointSizeSlider.value),
            showGrid: state.settings.showGrid,
            showRangeRings: state.settings.showRangeRings,
            gridSpacing: state.settings.gridSpacing,
        });

        // 3D visualization
        state.vis3d = new Visualization3D(elements.lidar3DCanvas, {
            maxRange: parseInt(elements.rangeSlider.value),
            pointSize: parseInt(elements.pointSizeSlider.value) * 2,
        });
    }

    /**
     * Initialize histogram
     */
    function initHistogram() {
        state.histogram = new DistanceHistogram(elements.histogramCanvas, {
            maxRange: parseInt(elements.rangeSlider.value),
        });
    }

    /**
     * Setup UI event handlers
     */
    function setupEventHandlers() {
        // View mode buttons
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                setViewMode(btn.dataset.view);
            });
        });

        // Range slider
        elements.rangeSlider.addEventListener('input', () => {
            const value = parseInt(elements.rangeSlider.value);
            elements.rangeValue.textContent = value;
            state.vis2d.setMaxRange(value);
            state.vis3d.setMaxRange(value);
            state.histogram.setMaxRange(value);
        });

        // Point size slider
        elements.pointSizeSlider.addEventListener('input', () => {
            const value = parseInt(elements.pointSizeSlider.value);
            elements.pointSizeValue.textContent = value;
            state.vis2d.setPointSize(value);
            state.vis3d.setPointSize(value * 2);
        });

        // Color mode
        elements.colorMode.addEventListener('change', () => {
            state.vis2d.setColorMode(elements.colorMode.value);
            state.vis3d.setColorMode(elements.colorMode.value);
        });

        // Layer visibility checkboxes
        document.querySelectorAll('[data-layer]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const layer = parseInt(checkbox.dataset.layer);
                state.vis2d.setLayerVisibility(layer, checkbox.checked);
                state.vis3d.setLayerVisibility(layer, checkbox.checked);
            });
        });

        // Zoom controls
        elements.zoomIn.addEventListener('click', () => {
            if (state.currentView === '2d') {
                state.vis2d.zoomIn();
            } else if (state.currentView === '3d') {
                state.vis3d.zoomIn();
            }
        });

        elements.zoomOut.addEventListener('click', () => {
            if (state.currentView === '2d') {
                state.vis2d.zoomOut();
            } else if (state.currentView === '3d') {
                state.vis3d.zoomOut();
            }
        });

        elements.resetView.addEventListener('click', () => {
            if (state.currentView === '2d') {
                state.vis2d.resetView();
            } else if (state.currentView === '3d') {
                state.vis3d.resetView();
            }
        });

        // Reconnect button
        elements.reconnectBtn.addEventListener('click', () => {
            state.viewer.disconnect();
            setTimeout(() => {
                state.viewer.options.autoReconnect = true;
                state.viewer.reconnectAttempts = 0;
                state.viewer.connect();
            }, 500);
        });

        // Settings modal
        elements.settingsBtn.addEventListener('click', openSettings);
        elements.closeSettings.addEventListener('click', closeSettings);
        elements.saveSettings.addEventListener('click', saveSettings);

        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                closeSettings();
            }
        });

        // Grid spacing slider
        elements.gridSpacing.addEventListener('input', () => {
            elements.gridSpacingValue.textContent = elements.gridSpacing.value;
        });

        // Mouse move for coordinate display
        elements.lidarCanvas.addEventListener('mousemove', updateCoordinateDisplay);
    }

    /**
     * Set the visualization view mode
     */
    function setViewMode(mode) {
        state.currentView = mode;

        // Update button states
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });

        // Show/hide canvases
        if (mode === '2d' || mode === 'layers') {
            elements.lidarCanvas.style.display = 'block';
            elements.lidar3DCanvas.style.display = 'none';
        } else if (mode === '3d') {
            elements.lidarCanvas.style.display = 'none';
            elements.lidar3DCanvas.style.display = 'block';
        }
    }

    /**
     * Connection event handler
     */
    function onConnect() {
        elements.statusDot.className = 'status-dot connected';
        elements.statusText.textContent = 'Connected';
    }

    /**
     * Disconnection event handler
     */
    function onDisconnect() {
        elements.statusDot.className = 'status-dot disconnected';
        elements.statusText.textContent = 'Disconnected';
    }

    /**
     * Scan data event handler
     */
    function onScan(scan) {
        // Update stats
        updateStats(scan);

        // Update histogram
        state.histogram.update(scan);
        state.histogram.render();

        // Render visualization
        if (state.currentView === '2d' || state.currentView === 'layers') {
            state.vis2d.render(scan);
        } else if (state.currentView === '3d') {
            state.vis3d.render(scan);
        }
    }

    /**
     * Configuration event handler
     */
    function onConfig(config) {
        if (config.simulation_mode) {
            elements.modeBadge.textContent = 'SIMULATION';
            elements.modeBadge.classList.add('simulation');
        } else {
            elements.modeBadge.textContent = 'LIVE';
            elements.modeBadge.classList.remove('simulation');
        }
    }

    /**
     * Error event handler
     */
    function onError(error) {
        console.error('LIDAR viewer error:', error);
        elements.statusDot.className = 'status-dot connecting';
        elements.statusText.textContent = 'Reconnecting...';
    }

    /**
     * Update statistics display
     */
    function updateStats(scan) {
        elements.scanRate.textContent = `${state.viewer.stats.scanRate} Hz`;
        elements.pointCount.textContent = scan.stats.totalPoints.toLocaleString();
        elements.scanNumber.textContent = scan.scanNumber.toLocaleString();
        elements.latency.textContent = `${state.viewer.stats.latency.toFixed(0)} ms`;

        elements.minDistance.textContent = `${scan.stats.minDistance.toFixed(2)} m`;
        elements.maxDistance.textContent = `${scan.stats.maxDistance.toFixed(2)} m`;
        elements.avgDistance.textContent = `${scan.stats.avgDistance.toFixed(2)} m`;

        const validPercent = scan.stats.totalPoints > 0
            ? (scan.stats.validPoints / scan.stats.totalPoints * 100).toFixed(1)
            : 0;
        elements.validPoints.textContent = `${validPercent}%`;

        elements.msgCount.textContent = state.viewer.stats.messagesReceived.toLocaleString();

        const dataRate = state.viewer.getDataRate();
        if (dataRate) {
            elements.dataRate.textContent = `${dataRate} KB/s`;
        }
    }

    /**
     * Update coordinate display based on mouse position
     */
    function updateCoordinateDisplay() {
        if (state.currentView !== '2d') return;

        const coords = state.vis2d.getMouseWorldCoords();
        const distance = Math.sqrt(coords.x * coords.x + coords.y * coords.y);

        elements.coordDisplay.textContent =
            `X: ${coords.x.toFixed(2)}m, Y: ${coords.y.toFixed(2)}m, D: ${distance.toFixed(2)}m`;
    }

    /**
     * Animation loop
     */
    function animate() {
        // Periodic ping for latency measurement
        if (state.viewer.isConnected() && Math.random() < 0.05) {
            state.viewer.ping();
        }

        requestAnimationFrame(animate);
    }

    /**
     * Update timestamp display
     */
    function updateTimestamp() {
        const now = new Date();
        elements.timestamp.textContent = now.toLocaleTimeString();
    }

    /**
     * Get default WebSocket URL
     */
    function getDefaultWsUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }

    /**
     * Load settings from localStorage
     */
    function loadSettings() {
        try {
            const saved = localStorage.getItem('lidar-viewer-settings');
            if (saved) {
                Object.assign(state.settings, JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    function persistSettings() {
        try {
            localStorage.setItem('lidar-viewer-settings', JSON.stringify(state.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Open settings modal
     */
    function openSettings() {
        elements.wsUrl.value = state.settings.wsUrl || getDefaultWsUrl();
        elements.autoReconnect.checked = state.settings.autoReconnect;
        elements.showGrid.checked = state.settings.showGrid;
        elements.showRangeRings.checked = state.settings.showRangeRings;
        elements.gridSpacing.value = state.settings.gridSpacing;
        elements.gridSpacingValue.textContent = state.settings.gridSpacing;
        elements.bgColor.value = state.settings.bgColor;

        elements.settingsModal.classList.add('active');
    }

    /**
     * Close settings modal
     */
    function closeSettings() {
        elements.settingsModal.classList.remove('active');
    }

    /**
     * Save settings from modal
     */
    function saveSettings() {
        state.settings.wsUrl = elements.wsUrl.value;
        state.settings.autoReconnect = elements.autoReconnect.checked;
        state.settings.showGrid = elements.showGrid.checked;
        state.settings.showRangeRings = elements.showRangeRings.checked;
        state.settings.gridSpacing = parseInt(elements.gridSpacing.value);
        state.settings.bgColor = elements.bgColor.value;

        // Apply settings
        state.viewer.setUrl(state.settings.wsUrl);
        state.viewer.options.autoReconnect = state.settings.autoReconnect;
        state.vis2d.setShowGrid(state.settings.showGrid);
        state.vis2d.setShowRangeRings(state.settings.showRangeRings);
        state.vis2d.setGridSpacing(state.settings.gridSpacing);

        // Apply background color
        const bgColors = {
            dark: '#1a1a2e',
            light: '#f0f0f0',
            black: '#000000',
        };
        state.vis2d.setBackgroundColor(bgColors[state.settings.bgColor] || bgColors.dark);

        // Persist settings
        persistSettings();

        // Reconnect if URL changed
        if (state.viewer.options.wsUrl !== state.settings.wsUrl) {
            state.viewer.disconnect();
            state.viewer.connect();
        }

        closeSettings();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

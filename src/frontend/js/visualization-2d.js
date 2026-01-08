/**
 * MRS1000 LIDAR 2D Visualization
 *
 * Renders LIDAR scan data as a top-down 2D view using HTML5 Canvas.
 */

class Visualization2D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.options = {
            maxRange: options.maxRange || 64,
            pointSize: options.pointSize || 2,
            showGrid: options.showGrid !== false,
            showRangeRings: options.showRangeRings !== false,
            gridSpacing: options.gridSpacing || 5,
            backgroundColor: options.backgroundColor || '#1a1a2e',
            gridColor: options.gridColor || '#2a2a4e',
            ringColor: options.ringColor || '#3a3a6e',
            sensorColor: options.sensorColor || '#e94560',
            colorMode: options.colorMode || 'layer',
            layerVisibility: [true, true, true, true],
        };

        // Layer colors
        this.layerColors = [
            '#ff4444',  // Layer 1 - Red
            '#44ff44',  // Layer 2 - Green
            '#4444ff',  // Layer 3 - Blue
            '#ffff44',  // Layer 4 - Yellow
        ];

        // View state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.rotation = 0;

        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        // Performance optimization
        this._animationFrame = null;
        this._needsRedraw = true;

        // Initialize
        this._setupCanvas();
        this._setupEventListeners();
    }

    /**
     * Setup canvas for high-DPI displays
     */
    _setupCanvas() {
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    /**
     * Resize canvas to fit container
     */
    _resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        // Recalculate scale
        this._calculateScale();
        this._needsRedraw = true;
    }

    /**
     * Calculate the scale factor to fit the view
     */
    _calculateScale() {
        const minDim = Math.min(this.width, this.height);
        this.baseScale = minDim / (this.options.maxRange * 2) * 0.9;
        this.scale = this.baseScale * this.zoom;
    }

    /**
     * Setup mouse and touch event listeners
     */
    _setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this._onWheel(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e));
    }

    _onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.panX += dx;
            this.panY += dy;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this._needsRedraw = true;
        }
    }

    _onMouseUp(e) {
        this.isDragging = false;
    }

    _onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.1, Math.min(10, this.zoom * delta));
        this._calculateScale();
        this._needsRedraw = true;
    }

    _onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }

    _onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDragging) {
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            this.panX += dx;
            this.panY += dy;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
            this._needsRedraw = true;
        }
    }

    _onTouchEnd(e) {
        this.isDragging = false;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(x, y) {
        const centerX = this.width / 2 + this.panX;
        const centerY = this.height / 2 + this.panY;

        // Rotate
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rx = x * cos - y * sin;
        const ry = x * sin + y * cos;

        return {
            x: centerX + rx * this.scale,
            y: centerY - ry * this.scale,  // Flip Y axis
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(sx, sy) {
        const centerX = this.width / 2 + this.panX;
        const centerY = this.height / 2 + this.panY;

        const dx = (sx - centerX) / this.scale;
        const dy = -(sy - centerY) / this.scale;  // Flip Y axis

        // Reverse rotation
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);

        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos,
        };
    }

    /**
     * Get world coordinates at current mouse position
     */
    getMouseWorldCoords() {
        return this.screenToWorld(this.mouseX, this.mouseY);
    }

    /**
     * Render the visualization
     */
    render(scan) {
        if (!scan) return;

        // Clear canvas
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        if (this.options.showGrid) {
            this._drawGrid();
        }

        // Draw range rings
        if (this.options.showRangeRings) {
            this._drawRangeRings();
        }

        // Draw FOV lines
        this._drawFOV(scan.config);

        // Draw points
        this._drawPoints(scan);

        // Draw sensor position
        this._drawSensor();

        // Draw scale indicator
        this._drawScaleIndicator();
    }

    /**
     * Draw the grid
     */
    _drawGrid() {
        const spacing = this.options.gridSpacing;
        const range = this.options.maxRange;

        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();

        for (let i = -range; i <= range; i += spacing) {
            // Vertical lines
            const start1 = this.worldToScreen(i, -range);
            const end1 = this.worldToScreen(i, range);
            this.ctx.moveTo(start1.x, start1.y);
            this.ctx.lineTo(end1.x, end1.y);

            // Horizontal lines
            const start2 = this.worldToScreen(-range, i);
            const end2 = this.worldToScreen(range, i);
            this.ctx.moveTo(start2.x, start2.y);
            this.ctx.lineTo(end2.x, end2.y);
        }

        this.ctx.stroke();
    }

    /**
     * Draw range rings
     */
    _drawRangeRings() {
        const center = this.worldToScreen(0, 0);
        const spacing = this.options.gridSpacing;

        this.ctx.strokeStyle = this.options.ringColor;
        this.ctx.lineWidth = 0.5;
        this.ctx.font = '10px sans-serif';
        this.ctx.fillStyle = this.options.ringColor;

        for (let r = spacing; r <= this.options.maxRange; r += spacing) {
            const radius = r * this.scale;

            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Label
            this.ctx.fillText(`${r}m`, center.x + radius + 5, center.y);
        }
    }

    /**
     * Draw field of view indicator
     */
    _drawFOV(config) {
        if (!config) return;

        const center = this.worldToScreen(0, 0);
        const startAngle = (config.start_angle || -137.5) * Math.PI / 180;
        const endAngle = (config.end_angle || 137.5) * Math.PI / 180;
        const range = this.options.maxRange * this.scale;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        // Start angle line
        this.ctx.beginPath();
        this.ctx.moveTo(center.x, center.y);
        this.ctx.lineTo(
            center.x + range * Math.sin(startAngle),
            center.y - range * Math.cos(startAngle)
        );
        this.ctx.stroke();

        // End angle line
        this.ctx.beginPath();
        this.ctx.moveTo(center.x, center.y);
        this.ctx.lineTo(
            center.x + range * Math.sin(endAngle),
            center.y - range * Math.cos(endAngle)
        );
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw scan points
     */
    _drawPoints(scan) {
        const pointSize = this.options.pointSize;

        for (const point of scan.points) {
            // Check layer visibility
            if (!this.options.layerVisibility[point.layer]) continue;

            // Skip invalid points
            if (point.distance < 0.1 || point.distance > this.options.maxRange) continue;

            // Get screen position
            const screenPos = this.worldToScreen(point.y, point.x);

            // Get color based on mode
            const color = this._getPointColor(point, scan.stats);

            // Draw point
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, pointSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Get point color based on color mode
     */
    _getPointColor(point, stats) {
        switch (this.options.colorMode) {
            case 'layer':
                return this.layerColors[point.layer];

            case 'distance':
                const distRatio = point.distance / this.options.maxRange;
                return this._hslToRgb(240 - distRatio * 240, 100, 50);

            case 'intensity':
                const intensityRatio = point.rssi / 255;
                return this._hslToRgb(0, 0, intensityRatio * 100);

            case 'height':
                // Color by Z value
                const minZ = -2;
                const maxZ = 2;
                const zRatio = (point.z - minZ) / (maxZ - minZ);
                return this._hslToRgb(240 - zRatio * 240, 100, 50);

            default:
                return this.layerColors[point.layer];
        }
    }

    /**
     * Convert HSL to RGB color string
     */
    _hslToRgb(h, s, l) {
        h = Math.max(0, Math.min(360, h));
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `rgb(${r},${g},${b})`;
    }

    /**
     * Draw sensor position indicator
     */
    _drawSensor() {
        const center = this.worldToScreen(0, 0);

        // Draw sensor body
        this.ctx.fillStyle = this.options.sensorColor;
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw direction indicator (forward is +Y in world, which is +X in screen)
        this.ctx.strokeStyle = this.options.sensorColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(center.x, center.y);
        this.ctx.lineTo(center.x, center.y - 20);
        this.ctx.stroke();

        // Arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(center.x, center.y - 25);
        this.ctx.lineTo(center.x - 5, center.y - 18);
        this.ctx.lineTo(center.x + 5, center.y - 18);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw scale indicator
     */
    _drawScaleIndicator() {
        const x = 20;
        const y = this.height - 30;
        const scaleLength = 50;
        const worldLength = scaleLength / this.scale;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + scaleLength, y);
        this.ctx.moveTo(x, y - 5);
        this.ctx.lineTo(x, y + 5);
        this.ctx.moveTo(x + scaleLength, y - 5);
        this.ctx.lineTo(x + scaleLength, y + 5);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText(`${worldLength.toFixed(1)}m`, x, y - 10);
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom = Math.min(10, this.zoom * 1.2);
        this._calculateScale();
        this._needsRedraw = true;
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom = Math.max(0.1, this.zoom / 1.2);
        this._calculateScale();
        this._needsRedraw = true;
    }

    /**
     * Reset view
     */
    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.rotation = 0;
        this._calculateScale();
        this._needsRedraw = true;
    }

    /**
     * Set maximum range
     */
    setMaxRange(range) {
        this.options.maxRange = range;
        this._calculateScale();
        this._needsRedraw = true;
    }

    /**
     * Set point size
     */
    setPointSize(size) {
        this.options.pointSize = size;
        this._needsRedraw = true;
    }

    /**
     * Set color mode
     */
    setColorMode(mode) {
        this.options.colorMode = mode;
        this._needsRedraw = true;
    }

    /**
     * Set layer visibility
     */
    setLayerVisibility(layer, visible) {
        this.options.layerVisibility[layer] = visible;
        this._needsRedraw = true;
    }

    /**
     * Set grid visibility
     */
    setShowGrid(show) {
        this.options.showGrid = show;
        this._needsRedraw = true;
    }

    /**
     * Set range rings visibility
     */
    setShowRangeRings(show) {
        this.options.showRangeRings = show;
        this._needsRedraw = true;
    }

    /**
     * Set grid spacing
     */
    setGridSpacing(spacing) {
        this.options.gridSpacing = spacing;
        this._needsRedraw = true;
    }

    /**
     * Set background color
     */
    setBackgroundColor(color) {
        this.options.backgroundColor = color;
        this._needsRedraw = true;
    }
}

// Export for use in other modules
window.Visualization2D = Visualization2D;

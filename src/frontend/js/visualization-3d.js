/**
 * MRS1000 LIDAR 3D Visualization
 *
 * Renders LIDAR scan data as a 3D point cloud using WebGL.
 * This is a simple WebGL implementation without external dependencies.
 */

class Visualization3D {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.options = {
            maxRange: options.maxRange || 64,
            pointSize: options.pointSize || 3.0,
            backgroundColor: options.backgroundColor || [0.1, 0.1, 0.18, 1.0],
            colorMode: options.colorMode || 'layer',
            layerVisibility: [true, true, true, true],
        };

        // Layer colors (normalized RGB)
        this.layerColors = [
            [1.0, 0.27, 0.27],  // Red
            [0.27, 1.0, 0.27],  // Green
            [0.27, 0.27, 1.0],  // Blue
            [1.0, 1.0, 0.27],   // Yellow
        ];

        // Camera state
        this.camera = {
            distance: 30,
            rotationX: -0.5,  // Pitch (look down a bit)
            rotationY: 0,     // Yaw
            targetX: 0,
            targetY: 0,
            targetZ: 0,
        };

        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // WebGL resources
        this.program = null;
        this.buffers = null;
        this.pointCount = 0;

        // Initialize
        this._initWebGL();
        this._setupEventListeners();
        this._resizeCanvas();

        window.addEventListener('resize', () => this._resizeCanvas());
    }

    /**
     * Initialize WebGL shaders and program
     */
    _initWebGL() {
        const gl = this.gl;

        // Vertex shader
        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aColor;

            uniform mat4 uProjectionMatrix;
            uniform mat4 uViewMatrix;
            uniform float uPointSize;

            varying vec3 vColor;

            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
                gl_PointSize = uPointSize;
                vColor = aColor;
            }
        `;

        // Fragment shader
        const fsSource = `
            precision mediump float;

            varying vec3 vColor;

            void main() {
                // Make points circular
                vec2 coord = gl_PointCoord - vec2(0.5);
                if (length(coord) > 0.5) {
                    discard;
                }
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;

        // Compile shaders
        const vertexShader = this._compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fsSource);

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link failed:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Get attribute and uniform locations
        this.attribs = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            color: gl.getAttribLocation(this.program, 'aColor'),
        };

        this.uniforms = {
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(this.program, 'uViewMatrix'),
            pointSize: gl.getUniformLocation(this.program, 'uPointSize'),
        };

        // Create buffers
        this.buffers = {
            position: gl.createBuffer(),
            color: gl.createBuffer(),
        };

        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    /**
     * Compile a shader
     */
    _compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * Resize canvas for high-DPI displays
     */
    _resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        this.width = rect.width;
        this.height = rect.height;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Setup mouse event listeners
     */
    _setupEventListeners() {
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
        if (!this.isDragging) return;

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        this.camera.rotationY += dx * 0.01;
        this.camera.rotationX += dy * 0.01;

        // Clamp vertical rotation
        this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    _onMouseUp(e) {
        this.isDragging = false;
    }

    _onWheel(e) {
        e.preventDefault();
        this.camera.distance *= e.deltaY > 0 ? 1.1 : 0.9;
        this.camera.distance = Math.max(5, Math.min(100, this.camera.distance));
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
        if (!this.isDragging || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;

        this.camera.rotationY += dx * 0.01;
        this.camera.rotationX += dy * 0.01;
        this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));

        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
    }

    _onTouchEnd(e) {
        this.isDragging = false;
    }

    /**
     * Create projection matrix (perspective)
     */
    _createProjectionMatrix() {
        const fov = 60 * Math.PI / 180;
        const aspect = this.width / this.height;
        const near = 0.1;
        const far = 200;

        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0,
        ]);
    }

    /**
     * Create view matrix (camera)
     */
    _createViewMatrix() {
        const c = this.camera;

        // Calculate camera position
        const cosX = Math.cos(c.rotationX);
        const sinX = Math.sin(c.rotationX);
        const cosY = Math.cos(c.rotationY);
        const sinY = Math.sin(c.rotationY);

        const camX = c.targetX + c.distance * cosX * sinY;
        const camY = c.targetY + c.distance * sinX;
        const camZ = c.targetZ + c.distance * cosX * cosY;

        // Create look-at matrix
        return this._lookAt(camX, camY, camZ, c.targetX, c.targetY, c.targetZ);
    }

    /**
     * Create look-at matrix
     */
    _lookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ) {
        const upX = 0, upY = 1, upZ = 0;

        // Calculate forward vector
        let fx = targetX - eyeX;
        let fy = targetY - eyeY;
        let fz = targetZ - eyeZ;
        let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx /= len; fy /= len; fz /= len;

        // Calculate right vector
        let rx = fy * upZ - fz * upY;
        let ry = fz * upX - fx * upZ;
        let rz = fx * upY - fy * upX;
        len = Math.sqrt(rx * rx + ry * ry + rz * rz);
        rx /= len; ry /= len; rz /= len;

        // Calculate up vector
        const ux = ry * fz - rz * fy;
        const uy = rz * fx - rx * fz;
        const uz = rx * fy - ry * fx;

        return new Float32Array([
            rx, ux, -fx, 0,
            ry, uy, -fy, 0,
            rz, uz, -fz, 0,
            -(rx * eyeX + ry * eyeY + rz * eyeZ),
            -(ux * eyeX + uy * eyeY + uz * eyeZ),
            fx * eyeX + fy * eyeY + fz * eyeZ,
            1,
        ]);
    }

    /**
     * Update point data from scan
     */
    updateData(scan) {
        if (!scan || !this.gl) return;

        const positions = [];
        const colors = [];

        for (const point of scan.points) {
            // Check layer visibility
            if (!this.options.layerVisibility[point.layer]) continue;

            // Skip invalid points
            if (point.distance < 0.1 || point.distance > this.options.maxRange) continue;

            // Add position (swap Y and Z for proper 3D orientation)
            positions.push(point.y, point.z, point.x);

            // Get color
            const color = this._getPointColor(point, scan.stats);
            colors.push(...color);
        }

        this.pointCount = positions.length / 3;

        // Update buffers
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
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
                return this._hslToRgb(240 - distRatio * 240, 1, 0.5);

            case 'intensity':
                const intensityRatio = point.rssi / 255;
                return [intensityRatio, intensityRatio, intensityRatio];

            case 'height':
                const minZ = -2;
                const maxZ = 2;
                const zRatio = (point.z - minZ) / (maxZ - minZ);
                return this._hslToRgb(240 - zRatio * 240, 1, 0.5);

            default:
                return this.layerColors[point.layer];
        }
    }

    /**
     * Convert HSL to RGB (0-1 range)
     */
    _hslToRgb(h, s, l) {
        h = Math.max(0, Math.min(360, h)) / 360;
        s = Math.max(0, Math.min(1, s));
        l = Math.max(0, Math.min(1, l));

        if (s === 0) {
            return [l, l, l];
        }

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        return [
            hue2rgb(p, q, h + 1/3),
            hue2rgb(p, q, h),
            hue2rgb(p, q, h - 1/3),
        ];
    }

    /**
     * Render the 3D visualization
     */
    render(scan) {
        if (!this.gl || !this.program) return;

        // Update data if scan provided
        if (scan) {
            this.updateData(scan);
        }

        const gl = this.gl;

        // Clear
        const bg = this.options.backgroundColor;
        gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.pointCount === 0) return;

        // Use program
        gl.useProgram(this.program);

        // Set matrices
        gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, this._createProjectionMatrix());
        gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, this._createViewMatrix());
        gl.uniform1f(this.uniforms.pointSize, this.options.pointSize);

        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.enableVertexAttribArray(this.attribs.position);
        gl.vertexAttribPointer(this.attribs.position, 3, gl.FLOAT, false, 0, 0);

        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.enableVertexAttribArray(this.attribs.color);
        gl.vertexAttribPointer(this.attribs.color, 3, gl.FLOAT, false, 0, 0);

        // Draw points
        gl.drawArrays(gl.POINTS, 0, this.pointCount);

        // Draw reference grid
        this._drawGrid();
    }

    /**
     * Draw reference grid
     */
    _drawGrid() {
        // Simple grid would require additional shader setup
        // For now, we'll skip the grid in 3D mode
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.camera.distance = Math.max(5, this.camera.distance / 1.2);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.camera.distance = Math.min(100, this.camera.distance * 1.2);
    }

    /**
     * Reset view
     */
    resetView() {
        this.camera.distance = 30;
        this.camera.rotationX = -0.5;
        this.camera.rotationY = 0;
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        this.camera.targetZ = 0;
    }

    /**
     * Set options
     */
    setMaxRange(range) {
        this.options.maxRange = range;
    }

    setPointSize(size) {
        this.options.pointSize = size;
    }

    setColorMode(mode) {
        this.options.colorMode = mode;
    }

    setLayerVisibility(layer, visible) {
        this.options.layerVisibility[layer] = visible;
    }
}

// Export for use in other modules
window.Visualization3D = Visualization3D;

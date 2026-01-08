/**
 * MRS1000 LIDAR Distance Histogram
 *
 * Visualizes the distribution of distance measurements in the scan data.
 */

class DistanceHistogram {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.options = {
            maxRange: options.maxRange || 64,
            bins: options.bins || 32,
            backgroundColor: options.backgroundColor || '#1a1a2e',
            barColor: options.barColor || '#e94560',
            gridColor: options.gridColor || '#2a2a4e',
            textColor: options.textColor || '#a0a0a0',
            padding: options.padding || { top: 10, right: 10, bottom: 25, left: 35 },
        };

        // Histogram data
        this.data = new Array(this.options.bins).fill(0);
        this.maxCount = 0;

        // Initialize
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    /**
     * Resize canvas
     */
    _resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Get the CSS dimensions
        const cssWidth = this.canvas.offsetWidth || rect.width;
        const cssHeight = this.canvas.offsetHeight || 120;

        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;
        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;

        this.ctx.scale(dpr, dpr);
        this.width = cssWidth;
        this.height = cssHeight;
    }

    /**
     * Update histogram data from scan
     */
    update(scan) {
        if (!scan) return;

        // Reset bins
        this.data.fill(0);
        this.maxCount = 0;

        const binWidth = this.options.maxRange / this.options.bins;

        // Count points in each bin
        for (const point of scan.points) {
            if (point.distance < 0.1 || point.distance > this.options.maxRange) continue;

            const binIndex = Math.min(
                this.options.bins - 1,
                Math.floor(point.distance / binWidth)
            );

            this.data[binIndex]++;
        }

        // Find max count for scaling
        this.maxCount = Math.max(...this.data, 1);
    }

    /**
     * Render the histogram
     */
    render() {
        const ctx = this.ctx;
        const p = this.options.padding;

        // Clear
        ctx.fillStyle = this.options.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Calculate dimensions
        const chartWidth = this.width - p.left - p.right;
        const chartHeight = this.height - p.top - p.bottom;
        const barWidth = chartWidth / this.options.bins;

        // Draw grid lines
        ctx.strokeStyle = this.options.gridColor;
        ctx.lineWidth = 0.5;

        // Horizontal grid lines
        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = p.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(p.left, y);
            ctx.lineTo(this.width - p.right, y);
            ctx.stroke();
        }

        // Draw bars
        ctx.fillStyle = this.options.barColor;

        for (let i = 0; i < this.options.bins; i++) {
            const count = this.data[i];
            const barHeight = (count / this.maxCount) * chartHeight;
            const x = p.left + i * barWidth;
            const y = p.top + chartHeight - barHeight;

            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }

        // Draw axes
        ctx.strokeStyle = this.options.textColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.left, p.top);
        ctx.lineTo(p.left, p.top + chartHeight);
        ctx.lineTo(p.left + chartWidth, p.top + chartHeight);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = this.options.textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels (distance)
        const labelCount = 4;
        for (let i = 0; i <= labelCount; i++) {
            const x = p.left + (chartWidth / labelCount) * i;
            const distance = (this.options.maxRange / labelCount) * i;
            ctx.fillText(`${distance}m`, x, this.height - 5);
        }

        // Y-axis label
        ctx.save();
        ctx.textAlign = 'center';
        ctx.translate(10, p.top + chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Count', 0, 0);
        ctx.restore();

        // Max count label
        ctx.textAlign = 'left';
        ctx.fillText(this.maxCount.toString(), p.left + 5, p.top + 10);
    }

    /**
     * Set maximum range
     */
    setMaxRange(range) {
        this.options.maxRange = range;
    }
}

// Export for use in other modules
window.DistanceHistogram = DistanceHistogram;

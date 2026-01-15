/**
 * MRS1000 LIDAR Measurement UI
 *
 * Handles product/zone configuration and displays measurement results.
 */

class MeasurementUI {
    constructor(options = {}) {
        this.options = {
            apiBase: options.apiBase || '',
        };

        // Current state
        this.products = [];
        this.activeProductId = null;
        this.latestResult = null;
        this.statistics = null;

        // DOM elements (will be created)
        this.container = null;
        this.resultPanel = null;

        // Event handlers
        this._eventHandlers = {
            zoneSelected: [],
        };
    }

    /**
     * Initialize the measurement UI
     */
    async init() {
        // Create UI elements
        this._createResultPanel();

        // Load products
        await this.loadProducts();
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
     * Create the result panel in the sidebar
     */
    _createResultPanel() {
        // Find or create container
        const rightPanel = document.querySelector('.right-panel');
        if (!rightPanel) return;

        // Create measurement result section
        this.resultPanel = document.createElement('section');
        this.resultPanel.className = 'panel-section measurement-panel';
        this.resultPanel.innerHTML = `
            <h2>Measurement Result</h2>
            <div class="measurement-result">
                <div class="overall-result" id="overallResult">
                    <div class="result-indicator unknown">
                        <span class="result-icon">?</span>
                    </div>
                    <div class="result-text">
                        <span class="result-label">Overall</span>
                        <span class="result-value" id="overallResultText">UNKNOWN</span>
                    </div>
                </div>
                <div class="zone-results" id="zoneResults">
                    <!-- Zone results will be added here -->
                </div>
                <div class="measurement-stats">
                    <div class="stat-row">
                        <span>Evaluations:</span>
                        <span id="evalCount">0</span>
                    </div>
                    <div class="stat-row">
                        <span>Good Rate:</span>
                        <span id="goodRate">0%</span>
                    </div>
                </div>
            </div>
            <div class="measurement-controls">
                <button class="btn btn-sm" id="configureZonesBtn">Configure Zones</button>
                <button class="btn btn-sm" id="resetStatsBtn">Reset Stats</button>
            </div>
        `;

        // Insert before the Connection section
        const connectionSection = rightPanel.querySelector('.panel-section:last-child');
        if (connectionSection) {
            rightPanel.insertBefore(this.resultPanel, connectionSection);
        } else {
            rightPanel.appendChild(this.resultPanel);
        }

        // Add styles
        this._addStyles();

        // Setup event handlers
        document.getElementById('configureZonesBtn')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        document.getElementById('resetStatsBtn')?.addEventListener('click', () => {
            this.resetStatistics();
        });
    }

    /**
     * Add CSS styles for measurement UI
     */
    _addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .measurement-panel {
                max-height: 300px;
                overflow-y: auto;
            }

            .overall-result {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                margin-bottom: 12px;
            }

            .result-indicator {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
            }

            .result-indicator.good {
                background: #22c55e;
                color: white;
                box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
            }

            .result-indicator.bad {
                background: #ef4444;
                color: white;
                box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
                animation: pulse-bad 1s infinite;
            }

            .result-indicator.unknown {
                background: #6b7280;
                color: white;
            }

            @keyframes pulse-bad {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .result-icon {
                font-size: 20px;
            }

            .result-text {
                display: flex;
                flex-direction: column;
            }

            .result-label {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }

            .result-value {
                font-size: 1.25rem;
                font-weight: bold;
            }

            .zone-results {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .zone-result-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background var(--transition-fast);
            }

            .zone-result-item:hover {
                background: var(--bg-tertiary);
            }

            .zone-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .zone-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }

            .zone-status.good { background: #22c55e; }
            .zone-status.bad { background: #ef4444; }
            .zone-status.unknown { background: #6b7280; }

            .zone-name {
                font-size: 0.875rem;
                font-weight: 500;
            }

            .zone-measurement {
                font-family: 'Consolas', monospace;
                font-size: 0.875rem;
            }

            .zone-measurement.good { color: #22c55e; }
            .zone-measurement.bad { color: #ef4444; }

            .measurement-stats {
                padding: 8px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                margin-bottom: 12px;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.875rem;
                padding: 4px 0;
            }

            .measurement-controls {
                display: flex;
                gap: 8px;
            }

            /* Configuration Modal */
            .config-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1001;
            }

            .config-modal.active {
                display: flex;
            }

            .config-modal-content {
                background: var(--bg-secondary);
                border-radius: var(--radius-lg);
                width: 600px;
                max-width: 90vw;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .config-header {
                padding: 16px;
                border-bottom: 1px solid var(--bg-tertiary);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .config-body {
                padding: 16px;
                overflow-y: auto;
                flex: 1;
            }

            .config-footer {
                padding: 16px;
                border-top: 1px solid var(--bg-tertiary);
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }

            .zone-config-item {
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                padding: 12px;
                margin-bottom: 12px;
            }

            .zone-config-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .zone-config-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }

            .form-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .form-field label {
                font-size: 0.75rem;
                color: var(--text-secondary);
            }

            .form-field input {
                padding: 8px;
                background: var(--bg-primary);
                border: 1px solid var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-size: 0.875rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Load products from the API
     */
    async loadProducts() {
        try {
            const response = await fetch(`${this.options.apiBase}/api/products`);
            const data = await response.json();
            this.products = data.products || [];
            this.activeProductId = data.active_product_id;
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    /**
     * Update the UI with measurement results
     */
    updateResults(data) {
        if (!data) return;

        this.latestResult = data.data || data;
        this.statistics = data.statistics || this.statistics;

        const product = this.latestResult;

        // Update overall result
        const overallResult = document.getElementById('overallResult');
        const overallIndicator = overallResult?.querySelector('.result-indicator');
        const overallText = document.getElementById('overallResultText');

        if (overallIndicator && overallText) {
            const resultClass = product.last_result === 1 ? 'good' :
                               product.last_result === 2 ? 'bad' : 'unknown';
            overallIndicator.className = `result-indicator ${resultClass}`;
            overallIndicator.querySelector('.result-icon').textContent =
                product.last_result === 1 ? '✓' :
                product.last_result === 2 ? '✗' : '?';
            overallText.textContent = product.last_result_name || 'UNKNOWN';
        }

        // Update zone results
        const zoneResults = document.getElementById('zoneResults');
        if (zoneResults && product.zones) {
            zoneResults.innerHTML = product.zones.map(zone => `
                <div class="zone-result-item" data-zone-id="${zone.id}">
                    <div class="zone-info">
                        <div class="zone-status ${zone.last_result === 1 ? 'good' : zone.last_result === 2 ? 'bad' : 'unknown'}"></div>
                        <span class="zone-name">${zone.name}</span>
                    </div>
                    <span class="zone-measurement ${zone.last_result === 1 ? 'good' : zone.last_result === 2 ? 'bad' : ''}">
                        ${zone.last_measurement.toFixed(3)}m
                        <span style="color: var(--text-secondary); font-size: 0.75rem;">
                            (${zone.expected_distance.toFixed(2)}m ±${zone.tolerance_plus.toFixed(2)})
                        </span>
                    </span>
                </div>
            `).join('');

            // Add click handlers to zones
            zoneResults.querySelectorAll('.zone-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const zoneId = parseInt(item.dataset.zoneId);
                    const zone = product.zones.find(z => z.id === zoneId);
                    if (zone) {
                        this._eventHandlers.zoneSelected.forEach(h => h(zone));
                    }
                });
            });
        }

        // Update statistics
        if (this.statistics) {
            const evalCount = document.getElementById('evalCount');
            const goodRate = document.getElementById('goodRate');

            if (evalCount) {
                evalCount.textContent = this.statistics.evaluation_count?.toLocaleString() || '0';
            }
            if (goodRate) {
                const rate = (this.statistics.good_rate * 100).toFixed(1);
                goodRate.textContent = `${rate}%`;
            }
        }
    }

    /**
     * Show the zone configuration modal
     */
    async showConfigModal() {
        // Refresh products
        await this.loadProducts();

        // Create modal if it doesn't exist
        let modal = document.querySelector('.config-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'config-modal';
            modal.innerHTML = `
                <div class="config-modal-content">
                    <div class="config-header">
                        <h2>Zone Configuration</h2>
                        <button class="btn btn-icon config-close">&times;</button>
                    </div>
                    <div class="config-body" id="configBody">
                        <!-- Zone configuration will be added here -->
                    </div>
                    <div class="config-footer">
                        <button class="btn" id="addZoneBtn">Add Zone</button>
                        <button class="btn" id="saveConfigBtn">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close handlers
            modal.querySelector('.config-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            // Save handler
            modal.querySelector('#saveConfigBtn').addEventListener('click', () => {
                this.saveConfiguration();
                modal.classList.remove('active');
            });

            // Add zone handler
            modal.querySelector('#addZoneBtn').addEventListener('click', () => {
                this.addZoneToConfig();
            });
        }

        // Populate with current configuration
        this._populateConfigModal();

        // Show modal
        modal.classList.add('active');
    }

    /**
     * Populate the configuration modal with current zones
     */
    _populateConfigModal() {
        const configBody = document.getElementById('configBody');
        if (!configBody) return;

        const product = this.products.find(p => p.id === this.activeProductId);
        const zones = product?.zones || [];

        configBody.innerHTML = `
            <div class="form-field" style="margin-bottom: 16px;">
                <label>Product Name</label>
                <input type="text" id="productName" value="${product?.name || 'Product 1'}">
            </div>
            <h3 style="margin-bottom: 12px;">Measurement Zones</h3>
            <div id="zonesContainer">
                ${zones.map((zone, index) => this._createZoneConfigHTML(zone, index)).join('')}
            </div>
        `;
    }

    /**
     * Create HTML for a zone configuration item
     */
    _createZoneConfigHTML(zone, index) {
        return `
            <div class="zone-config-item" data-zone-index="${index}">
                <div class="zone-config-header">
                    <h4>Zone ${index + 1}: ${zone.name}</h4>
                    <button class="btn btn-sm btn-danger remove-zone-btn" data-index="${index}">Remove</button>
                </div>
                <div class="zone-config-grid">
                    <div class="form-field">
                        <label>Zone Name</label>
                        <input type="text" class="zone-name" value="${zone.name}">
                    </div>
                    <div class="form-field">
                        <label>Expected Distance (m)</label>
                        <input type="number" class="zone-expected" step="0.01" value="${zone.expected_distance}">
                    </div>
                    <div class="form-field">
                        <label>Start Angle (°)</label>
                        <input type="number" class="zone-start-angle" step="0.5" value="${zone.start_angle}">
                    </div>
                    <div class="form-field">
                        <label>End Angle (°)</label>
                        <input type="number" class="zone-end-angle" step="0.5" value="${zone.end_angle}">
                    </div>
                    <div class="form-field">
                        <label>Tolerance + (m)</label>
                        <input type="number" class="zone-tol-plus" step="0.01" value="${zone.tolerance_plus}">
                    </div>
                    <div class="form-field">
                        <label>Tolerance - (m)</label>
                        <input type="number" class="zone-tol-minus" step="0.01" value="${zone.tolerance_minus}">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Add a new zone to the configuration
     */
    addZoneToConfig() {
        const zonesContainer = document.getElementById('zonesContainer');
        if (!zonesContainer) return;

        const index = zonesContainer.querySelectorAll('.zone-config-item').length;
        const newZone = {
            id: index + 1,
            name: `Zone ${index + 1}`,
            start_angle: -10,
            end_angle: 10,
            expected_distance: 2.0,
            tolerance_plus: 0.1,
            tolerance_minus: 0.1,
        };

        const zoneHTML = this._createZoneConfigHTML(newZone, index);
        zonesContainer.insertAdjacentHTML('beforeend', zoneHTML);
    }

    /**
     * Save the zone configuration
     */
    async saveConfiguration() {
        const productName = document.getElementById('productName')?.value || 'Product';
        const zoneItems = document.querySelectorAll('.zone-config-item');

        const zones = Array.from(zoneItems).map((item, index) => ({
            id: index + 1,
            name: item.querySelector('.zone-name')?.value || `Zone ${index + 1}`,
            enabled: true,
            start_angle: parseFloat(item.querySelector('.zone-start-angle')?.value) || -10,
            end_angle: parseFloat(item.querySelector('.zone-end-angle')?.value) || 10,
            layers: [0, 1, 2, 3],
            expected_distance: parseFloat(item.querySelector('.zone-expected')?.value) || 2.0,
            tolerance_plus: parseFloat(item.querySelector('.zone-tol-plus')?.value) || 0.1,
            tolerance_minus: parseFloat(item.querySelector('.zone-tol-minus')?.value) || 0.1,
            min_valid_distance: 0.1,
            max_valid_distance: 64.0,
            min_points: 5,
            use_median: true,
        }));

        const product = {
            id: this.activeProductId || 1,
            name: productName,
            description: '',
            enabled: true,
            zones: zones,
        };

        try {
            const response = await fetch(
                `${this.options.apiBase}/api/products/${product.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product),
                }
            );

            if (response.ok) {
                console.log('Configuration saved');
                await this.loadProducts();
            } else {
                console.error('Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    }

    /**
     * Reset evaluation statistics
     */
    async resetStatistics() {
        try {
            await fetch(`${this.options.apiBase}/api/statistics/reset`, {
                method: 'POST',
            });
            console.log('Statistics reset');
        } catch (error) {
            console.error('Error resetting statistics:', error);
        }
    }
}

// Export for use in other modules
window.MeasurementUI = MeasurementUI;

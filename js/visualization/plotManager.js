/**
 * Plot Manager Module
 * Handles visualization of signals in time and frequency domains
 */
export class PlotManager {
    constructor() {
        this.timeChart = null;
        this.freqChart = null;
        this.initializePlots();
    }

    /**
     * Initialize time and frequency domain plots
     */
    initializePlots() {
        // Time domain plot
        const timeCtx = document.getElementById('timeCanvas').getContext('2d');
        this.timeChart = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Time Domain Signal',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Time: ${context.parsed.x.toFixed(3)}s, Amplitude: ${context.parsed.y.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Amplitude'
                        }
                    }
                }
            }
        });

        // Frequency domain plot
        const freqCtx = document.getElementById('freqCanvas').getContext('2d');
        this.freqChart = new Chart(freqCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Frequency Spectrum',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const dataIndex = context.dataIndex;
                                const phase = this.freqChart.data.datasets[0].phases?.[dataIndex];
                                return [
                                    `Frequency: ${context.parsed.x.toFixed(2)} Hz`,
                                    `Magnitude: ${context.parsed.y.toFixed(3)}`,
                                    phase !== undefined ? `Phase: ${phase.toFixed(2)}°` : ''
                                ].filter(Boolean);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Frequency (Hz)'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Magnitude'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update time domain plot
     * @param {Array} timePoints - Array of time points
     * @param {Array} signal - Array of signal values
     */
    updateTimePlot(timePoints, signal) {
        this.timeChart.data.labels = timePoints;
        this.timeChart.data.datasets[0].data = signal.map((y, i) => ({
            x: timePoints[i],
            y: y
        }));
        this.timeChart.update();
    }

    /**
     * Update frequency domain plot
     * @param {Array} frequencies - Array of frequency points
     * @param {Array} magnitudes - Array of magnitude values
     * @param {Object} options - Plot options
     * @param {Array} options.phases - Array of phase values
     * @param {boolean} options.logScale - Whether to use logarithmic scale
     * @param {Array} options.peaks - Array of peak objects
     */
    updateFreqPlot(frequencies, magnitudes, options = {}) {
        const { phases, logScale = false, peaks = [] } = options;

        // Update main frequency data
        this.freqChart.data.labels = frequencies;
        this.freqChart.data.datasets[0].data = magnitudes.map((y, i) => ({
            x: frequencies[i],
            y: logScale ? (y > 0 ? 20 * Math.log10(y) : -100) : y
        }));

        // Store phases for tooltip
        this.freqChart.data.datasets[0].phases = phases;

        // Update y-axis scale and label
        this.freqChart.options.scales.y.type = logScale ? 'logarithmic' : 'linear';
        this.freqChart.options.scales.y.title.text = logScale ? 'Magnitude (dB)' : 'Magnitude';

        // Add peak markers if available
        if (peaks.length > 0) {
            this.freqChart.data.datasets[1] = {
                label: 'Peaks',
                data: peaks.map(peak => ({
                    x: peak.frequency,
                    y: logScale ? (peak.magnitude > 0 ? 20 * Math.log10(peak.magnitude) : -100) : peak.magnitude
                })),
                backgroundColor: 'red',
                borderColor: 'red',
                pointRadius: 5,
                pointStyle: 'triangle',
                showLine: false
            };
        } else {
            this.freqChart.data.datasets = this.freqChart.data.datasets.slice(0, 1);
        }

        this.freqChart.update();
    }

    /**
     * Update peak table
     * @param {Array} peaks - Array of peak objects
     */
    updatePeakTable(peaks) {
        const tableBody = document.getElementById('peakTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = peaks.map(peak => `
            <tr>
                <td>${peak.frequency.toFixed(2)}</td>
                <td>${peak.magnitude.toFixed(3)}</td>
                <td>${peak.phase.toFixed(2)}</td>
            </tr>
        `).join('');
    }

    /**
     * Clear both plots
     */
    clearPlots() {
        this.timeChart.data.labels = [];
        this.timeChart.data.datasets[0].data = [];
        this.freqChart.data.labels = [];
        this.freqChart.data.datasets[0].data = [];
        
        this.timeChart.update();
        this.freqChart.update();

        const tableBody = document.getElementById('peakTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
        }
    }

    /**
     * Update plot titles and labels
     * @param {Object} options - Plot options
     * @param {string} options.timeTitle - Time domain plot title
     * @param {string} options.freqTitle - Frequency domain plot title
     */
    updatePlotOptions(options) {
        if (options.timeTitle) {
            this.timeChart.options.plugins.title = {
                display: true,
                text: options.timeTitle
            };
        }

        if (options.freqTitle) {
            this.freqChart.options.plugins.title = {
                display: true,
                text: options.freqTitle
            };
        }

        this.timeChart.update();
        this.freqChart.update();
    }
}
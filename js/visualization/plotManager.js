/**
 * Plot Manager Module
 * Handles visualization of signals in time and frequency domains
 */
class PlotManager {
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
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (s)'
                        }
                    },
                    y: {
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
        this.timeChart.data.datasets[0].data = signal;
        this.timeChart.update();
    }

    /**
     * Update frequency domain plot
     * @param {Array} frequencies - Array of frequency points
     * @param {Array} magnitudes - Array of magnitude values
     * @param {boolean} logScale - Whether to use logarithmic scale
     */
    updateFreqPlot(frequencies, magnitudes, logScale = false) {
        this.freqChart.data.labels = frequencies;
        this.freqChart.data.datasets[0].data = magnitudes;

        // Update y-axis scale if needed
        if (logScale) {
            this.freqChart.options.scales.y.type = 'logarithmic';
        } else {
            this.freqChart.options.scales.y.type = 'linear';
        }

        this.freqChart.update();
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
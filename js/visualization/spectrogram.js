/**
 * Spectrogram visualization component
 * Displays frequency content over time using a 2D heatmap
 */

export class Spectrogram {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.options = {
            width: options.width || this.canvas.width,
            height: options.height || this.canvas.height,
            colormap: options.colormap || 'viridis',
            minDecibels: options.minDecibels || -100,
            maxDecibels: options.maxDecibels || -30,
            timeRange: options.timeRange || 10, // seconds
            ...options
        };

        this.spectrogramData = [];
        this.initColormap();
    }

    initColormap() {
        this.colorMaps = {
            viridis: [
                [68, 1, 84],    // Dark purple
                [72, 35, 116],
                [64, 67, 135],
                [52, 94, 141],
                [41, 121, 142],
                [32, 144, 140],
                [34, 167, 132],
                [68, 190, 112],
                [121, 209, 81],
                [189, 223, 38],
                [253, 231, 37]  // Yellow
            ],
            jet: [
                [0, 0, 143],    // Dark blue
                [0, 0, 255],
                [0, 255, 255],
                [255, 255, 0],
                [255, 0, 0],    // Red
                [128, 0, 0]     // Dark red
            ],
            hot: [
                [0, 0, 0],      // Black
                [255, 0, 0],    // Red
                [255, 255, 0],  // Yellow
                [255, 255, 255] // White
            ]
        };
    }

    /**
     * Maps a value to a color using the selected colormap
     * @param {number} value - Value between 0 and 1
     * @returns {string} RGB color string
     */
    getColor(value) {
        try {
            // Validate inputs
            if (typeof value !== 'number' || isNaN(value)) {
                console.error('Invalid value passed to getColor:', value);
                return 'rgb(0, 0, 0)'; // Return black for invalid values
            }

            // Ensure value is in [0,1] range
            value = Math.max(0, Math.min(1, value));

            const colormap = this.colorMaps[this.options.colormap];
            if (!colormap || !Array.isArray(colormap)) {
                console.error('Invalid colormap:', this.options.colormap);
                return 'rgb(0, 0, 0)';
            }

            const position = value * (colormap.length - 1);
            const index = Math.floor(position);
            const fraction = position - index;

            if (index >= colormap.length - 1) {
                const color = colormap[colormap.length - 1];
                return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            }

            const color1 = colormap[index];
            const color2 = colormap[index + 1];

            if (!color1 || !color2 || !Array.isArray(color1) || !Array.isArray(color2)) {
                console.error('Invalid color values in colormap');
                return 'rgb(0, 0, 0)';
            }

            const r = Math.round(color1[0] + fraction * (color2[0] - color1[0]));
            const g = Math.round(color1[1] + fraction * (color2[1] - color1[1]));
            const b = Math.round(color1[2] + fraction * (color2[2] - color1[2]));

            return `rgb(${r}, ${g}, ${b})`;
        } catch (err) {
            console.error('Error in getColor:', err);
            return 'rgb(0, 0, 0)';
        }
    }

    /**
     * Updates the spectrogram with new frequency data
     * @param {Float32Array} frequencyData - Frequency domain data
     * @param {number} sampleRate - Sample rate in Hz
     */
    update(spectrogramMatrix, sampleRate) {
        if (!spectrogramMatrix || !spectrogramMatrix.length) {
            console.log('No spectrogram data provided');
            return;
        }

        // Initialize spectrogramData with normalized values
        this.spectrogramData = spectrogramMatrix.map(column => {
            return column.map(value => {
                // Value is already in dB from spectralAnalyzer
                const normalized = (value - this.options.minDecibels) /
                                 (this.options.maxDecibels - this.options.minDecibels);
                return Math.max(0, Math.min(1, normalized));
            });
        });

        this.draw();
    }

    /**
     * Draws the spectrogram on the canvas
     */
    draw() {
        const { width, height } = this.options;
        this.ctx.clearRect(0, 0, width, height);

        // Validate data exists and has proper structure
        if (!this.spectrogramData || this.spectrogramData.length === 0) {
            console.log('No spectrogram data available to draw');
            return;
        }

        // Validate data dimensions
        const numTimeSteps = this.spectrogramData.length;
        const numFreqBins = this.spectrogramData[0]?.length;
        if (!numFreqBins) {
            console.error('Invalid spectrogram data structure');
            return;
        }

        const columnWidth = width / numTimeSteps;
        const rowHeight = height / numFreqBins;

        try {
            // Draw frequency bins with error handling
            for (let i = 0; i < this.spectrogramData.length; i++) {
                const column = this.spectrogramData[i];
                if (!Array.isArray(column) && !(column instanceof Float32Array)) {
                    console.error(`Invalid column data at index ${i}`);
                    continue;
                }

                for (let j = 0; j < column.length; j++) {
                    const value = column[j];
                    if (typeof value !== 'number' || isNaN(value)) {
                        continue;  // Skip invalid values
                    }

                    try {
                        this.ctx.fillStyle = this.getColor(value);
                        this.ctx.fillRect(
                            i * columnWidth,
                            height - (j + 1) * rowHeight,
                            columnWidth + 1,
                            rowHeight + 1
                        );
                    } catch (err) {
                        console.error(`Error drawing spectrogram bin at (${i},${j}):`, err);
                    }
                }
            }

            // Draw axes and labels
        } catch (err) {
            console.error('Error drawing spectrogram:', err);
        }
        this.drawAxes();
    }

    /**
     * Draws axes and labels on the spectrogram
     */
    drawAxes() {
        const { width, height } = this.options;
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        
        // Draw time axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, height);
        this.ctx.lineTo(width, height);
        this.ctx.stroke();
        
        // Draw frequency axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, height);
        this.ctx.stroke();
        
        // Add labels
        this.ctx.fillText('Time (s)', width / 2, height - 5);
        this.ctx.save();
        this.ctx.translate(15, height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Frequency (Hz)', 0, 0);
        this.ctx.restore();
    }

    /**
     * Updates the spectrogram options
     * @param {Object} newOptions - New options to apply
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.draw();
    }

    /**
     * Resizes the spectrogram canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.options.width = width;
        this.options.height = height;
        this.draw();
    }

    /**
     * Clears the spectrogram data
     */
    clear() {
        this.spectrogramData = [];
        this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    }
}
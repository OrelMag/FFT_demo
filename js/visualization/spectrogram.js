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
        const colormap = this.colorMaps[this.options.colormap];
        const position = value * (colormap.length - 1);
        const index = Math.floor(position);
        const fraction = position - index;

        if (index >= colormap.length - 1) {
            const color = colormap[colormap.length - 1];
            return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        }

        const color1 = colormap[index];
        const color2 = colormap[index + 1];

        const r = Math.round(color1[0] + fraction * (color2[0] - color1[0]));
        const g = Math.round(color1[1] + fraction * (color2[1] - color1[1]));
        const b = Math.round(color1[2] + fraction * (color2[2] - color1[2]));

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Updates the spectrogram with new frequency data
     * @param {Float32Array} frequencyData - Frequency domain data
     * @param {number} sampleRate - Sample rate in Hz
     */
    update(frequencyData, sampleRate) {
        // Normalize frequency data to 0-1 range
        const normalizedData = new Float32Array(frequencyData.length);
        for (let i = 0; i < frequencyData.length; i++) {
            const db = 20 * Math.log10(Math.abs(frequencyData[i]));
            normalizedData[i] = (db - this.options.minDecibels) / 
                               (this.options.maxDecibels - this.options.minDecibels);
            normalizedData[i] = Math.max(0, Math.min(1, normalizedData[i]));
        }

        // Add new data column
        this.spectrogramData.unshift(normalizedData);

        // Remove old data to maintain time range
        const maxColumns = Math.floor(this.options.timeRange * sampleRate / frequencyData.length);
        if (this.spectrogramData.length > maxColumns) {
            this.spectrogramData.pop();
        }

        this.draw();
    }

    /**
     * Draws the spectrogram on the canvas
     */
    draw() {
        const { width, height } = this.options;
        this.ctx.clearRect(0, 0, width, height);

        const columnWidth = width / this.spectrogramData.length;
        const rowHeight = height / this.spectrogramData[0].length;

        // Draw frequency bins
        for (let i = 0; i < this.spectrogramData.length; i++) {
            const column = this.spectrogramData[i];
            for (let j = 0; j < column.length; j++) {
                const value = column[j];
                this.ctx.fillStyle = this.getColor(value);
                this.ctx.fillRect(
                    i * columnWidth,
                    height - (j + 1) * rowHeight,
                    columnWidth + 1,
                    rowHeight + 1
                );
            }
        }

        // Draw axes and labels
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
/**
 * Export Utilities Module
 * Handles data export functionality
 */
class ExportUtils {
    /**
     * Export data to CSV file
     * @param {Object} data - Data to export
     * @param {string} filename - Name of file to save
     */
    static exportToCSV(data, filename) {
        const csvContent = this.convertToCSV(data);
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    /**
     * Export data to JSON file
     * @param {Object} data - Data to export
     * @param {string} filename - Name of file to save
     */
    static exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    /**
     * Convert data to CSV format
     * @param {Object} data - Data to convert
     * @returns {string} CSV formatted string
     */
    static convertToCSV(data) {
        if (!data || !data.headers || !data.rows) {
            throw new Error('Invalid data format for CSV conversion');
        }

        const headers = data.headers.join(',');
        const rows = data.rows.map(row => row.join(',')).join('\n');
        
        return `${headers}\n${rows}`;
    }

    /**
     * Format FFT data for export
     * @param {Array} frequencies - Frequency array
     * @param {Array} magnitudes - Magnitude array
     * @param {Array} phases - Phase array (optional)
     * @returns {Object} Formatted data object
     */
    static formatFFTData(frequencies, magnitudes, phases = null) {
        const headers = phases ? 
            ['Frequency (Hz)', 'Magnitude', 'Phase (degrees)'] :
            ['Frequency (Hz)', 'Magnitude'];

        const rows = frequencies.map((freq, i) => {
            const row = [freq, magnitudes[i]];
            if (phases) {
                row.push(phases[i]);
            }
            return row;
        });

        return {
            headers,
            rows
        };
    }

    /**
     * Format peak data for export
     * @param {Array} peaks - Array of peak objects
     * @returns {Object} Formatted data object
     */
    static formatPeakData(peaks) {
        return {
            headers: ['Frequency (Hz)', 'Magnitude', 'Phase (degrees)'],
            rows: peaks.map(peak => [
                peak.frequency,
                peak.magnitude,
                peak.phase
            ])
        };
    }

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - Name of file
     * @param {string} type - MIME type
     */
    static downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export signal data
     * @param {Object} data - Signal data to export
     * @param {string} type - Export type ('fft' or 'peaks')
     */
    static exportSignalData(data, type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const format = 'csv'; // Can be extended to support different formats

        try {
            switch (type) {
                case 'fft': {
                    const { frequencies, magnitudes, phases } = data;
                    const formattedData = this.formatFFTData(frequencies, magnitudes, phases);
                    this.exportToCSV(formattedData, `fft_data_${timestamp}.${format}`);
                    break;
                }
                case 'peaks': {
                    const formattedData = this.formatPeakData(data.peaks);
                    this.exportToCSV(formattedData, `peak_data_${timestamp}.${format}`);
                    break;
                }
                default:
                    throw new Error(`Unsupported export type: ${type}`);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please check the console for details.');
        }
    }
}
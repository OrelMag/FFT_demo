/**
 * Data Loader Module
 * Handles loading and parsing of data files
 */
export class DataLoader {
    /**
     * Parse CSV data
     * @param {string} content - CSV file content
     * @returns {Array} Array of signal values
     */
    static parseCSV(content) {
        return content
            .trim()
            .split('\n')
            .map(line => {
                const values = line.trim().split(',');
                // If multiple columns, assume last column is signal value
                return parseFloat(values[values.length - 1]);
            })
            .filter(value => !isNaN(value));
    }

    /**
     * Parse TXT data
     * @param {string} content - TXT file content
     * @returns {Array} Array of signal values
     */
    static parseTXT(content) {
        return content
            .trim()
            .split(/[\n\r\s]+/)
            .map(value => parseFloat(value))
            .filter(value => !isNaN(value));
    }

    /**
     * Parse JSON data
     * @param {string} content - JSON file content
     * @returns {Array} Array of signal values
     */
    static parseJSON(content) {
        try {
            const data = JSON.parse(content);
            
            // Handle different JSON structures
            if (Array.isArray(data)) {
                // If array of numbers
                if (data.every(item => typeof item === 'number')) {
                    return data;
                }
                // If array of objects, try to find a numeric value
                if (data.every(item => typeof item === 'object')) {
                    const firstItem = data[0];
                    const numericKey = Object.keys(firstItem).find(key => 
                        typeof firstItem[key] === 'number'
                    );
                    if (numericKey) {
                        return data.map(item => item[numericKey]);
                    }
                }
            } else if (typeof data === 'object') {
                // Check for signal property first
                if (Array.isArray(data.signal)) {
                    console.log('Found signal array in JSON:', data.signal.length, 'points');
                    return data.signal;
                }
                // Fallback to data property
                if (Array.isArray(data.data)) {
                    console.log('Found data array in JSON:', data.data.length, 'points');
                    return data.data;
                }
                // Try to find any array property containing numbers
                const arrayProp = Object.keys(data).find(key =>
                    Array.isArray(data[key]) && data[key].every(item => typeof item === 'number')
                );
                if (arrayProp) {
                    console.log(`Found numeric array in property "${arrayProp}":`, data[arrayProp].length, 'points');
                    return data[arrayProp];
                }
            }
            throw new Error('No valid numeric array found in JSON');
        } catch (error) {
            throw new Error(`Error parsing JSON: ${error.message}`);
        }
    }

    /**
     * Load and parse file content
     * @param {File} file - File object to load
     * @returns {Promise} Promise resolving to array of signal values
     */
    static async loadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileType = file.name.split('.').pop().toLowerCase();

            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    let data;

                    switch (fileType) {
                        case 'csv':
                            data = this.parseCSV(content);
                            break;
                        case 'txt':
                            data = this.parseTXT(content);
                            break;
                        case 'json':
                            data = this.parseJSON(content);
                            break;
                        default:
                            throw new Error(`Unsupported file type: ${fileType}`);
                    }

                    if (!data || data.length === 0) {
                        throw new Error('No valid numeric data found in file');
                    }

                    // Filter out any non-numeric values and warn if any were found
                    const validData = data.filter(value => typeof value === 'number' && !isNaN(value));
                    if (validData.length < data.length) {
                        console.warn('Some invalid numeric values were filtered out');
                    }

                    resolve(validData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Generate time points for loaded data
     * @param {number} dataLength - Length of data array
     * @param {number} sampleRate - Sample rate in Hz
     * @returns {Array} Array of time points
     */
    static generateTimePoints(dataLength, sampleRate) {
        const timePoints = new Array(dataLength);
        const dt = 1 / sampleRate;
        
        for (let i = 0; i < dataLength; i++) {
            timePoints[i] = i * dt;
        }
        
        return timePoints;
    }

    /**
     * Validate loaded data
     * @param {Array} data - Array of signal values
     * @param {number} maxLength - Maximum allowed length
     * @returns {Array} Validated and potentially truncated data
     */
    static validateData(data, maxLength = 1000000) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: expected array');
        }

        if (data.length === 0) {
            throw new Error('Data array is empty');
        }

        if (data.length > maxLength) {
            console.warn(`Data length (${data.length}) exceeds maximum (${maxLength}). Truncating.`);
            return data.slice(0, maxLength);
        }

        return data;
    }
}
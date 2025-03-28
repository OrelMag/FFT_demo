/**
 * FFT Processing Module
 * Implements FFT analysis and related functionality
 */
class FFTProcessor {
    /**
     * Compute FFT of a signal
     * @param {Array} signal - Input signal array
     * @param {Object} options - FFT options
     * @param {string} options.windowType - Type of window function to apply
     * @param {number} options.sampleRate - Sample rate in Hz
     * @param {number} options.peakThreshold - Peak detection threshold (percentage of max magnitude)
     * @returns {Object} Object containing frequency, magnitude, and phase arrays, plus detected peaks
     */
    static computeFFT(signal, options) {
        const { windowType = 'none', sampleRate, peakThreshold = 10 } = options;
        
        // Apply window function if specified
        const windowedSignal = this.applyWindow(signal, windowType);
        
        // Pad array to power of 2 if needed
        const paddedLength = this.nextPowerOf2(signal.length);
        const paddedSignal = this.padSignal(windowedSignal, paddedLength);
        
        // Prepare complex input for FFT
        const complexSignal = paddedSignal.map(x => [x, 0]);
        
        // Compute FFT
        const fftResult = this.fft(complexSignal);
        
        // Calculate frequencies, magnitudes, and phases
        const frequencies = this.calculateFrequencies(paddedLength, sampleRate);
        const { magnitudes, phases } = this.calculateMagnitudesAndPhases(fftResult);
        
        // Detect peaks
        const peaks = this.detectPeaks(frequencies, magnitudes, phases, peakThreshold);

        return { frequencies, magnitudes, phases, peaks };
    }

    /**
     * Calculate next power of 2
     * @param {number} n - Input number
     * @returns {number} Next power of 2
     */
    static nextPowerOf2(n) {
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }

    /**
     * Pad signal array to desired length
     * @param {Array} signal - Input signal array
     * @param {number} targetLength - Desired length
     * @returns {Array} Padded signal array
     */
    static padSignal(signal, targetLength) {
        if (signal.length >= targetLength) return signal;
        
        const padded = new Array(targetLength).fill(0);
        padded.splice(0, signal.length, ...signal);
        return padded;
    }

    /**
     * FFT implementation (Cooley-Tukey algorithm)
     * @param {Array} input - Complex input array [[real, imag],...]
     * @returns {Array} Complex output array
     */
    static fft(input) {
        const n = input.length;
        
        // Base case
        if (n <= 1) return input;
        
        // Split into even and odd
        const even = Array(n/2);
        const odd = Array(n/2);
        for (let i = 0; i < n/2; i++) {
            even[i] = input[i*2];
            odd[i] = input[i*2+1];
        }
        
        // Recursive FFT on even and odd
        const evenFFT = this.fft(even);
        const oddFFT = this.fft(odd);
        
        // Combine results
        const result = Array(n);
        for (let k = 0; k < n/2; k++) {
            const angle = -2 * Math.PI * k / n;
            const t = [
                Math.cos(angle) * oddFFT[k][0] - Math.sin(angle) * oddFFT[k][1],
                Math.cos(angle) * oddFFT[k][1] + Math.sin(angle) * oddFFT[k][0]
            ];
            
            result[k] = [
                evenFFT[k][0] + t[0],
                evenFFT[k][1] + t[1]
            ];
            
            result[k + n/2] = [
                evenFFT[k][0] - t[0],
                evenFFT[k][1] - t[1]
            ];
        }
        
        return result;
    }

    /**
     * Calculate magnitudes and phases from FFT result
     * @param {Array} fftResult - Complex FFT result array
     * @returns {Object} Object containing magnitude and phase arrays
     */
    static calculateMagnitudesAndPhases(fftResult) {
        const n = fftResult.length;
        const magnitudes = new Array(n/2);
        const phases = new Array(n/2);
        
        for (let i = 0; i < n/2; i++) {
            const real = fftResult[i][0];
            const imag = fftResult[i][1];
            magnitudes[i] = Math.sqrt(real*real + imag*imag) / n;
            phases[i] = Math.atan2(imag, real) * 180 / Math.PI; // Convert to degrees
        }
        
        return { magnitudes, phases };
    }

    /**
     * Calculate frequency array
     * @param {number} n - FFT size
     * @param {number} sampleRate - Sample rate in Hz
     * @returns {Array} Frequency array
     */
    static calculateFrequencies(n, sampleRate) {
        const frequencies = new Array(n/2);
        const df = sampleRate / n;
        
        for (let i = 0; i < n/2; i++) {
            frequencies[i] = i * df;
        }
        
        return frequencies;
    }

    /**
     * Detect peaks in frequency spectrum
     * @param {Array} frequencies - Frequency array
     * @param {Array} magnitudes - Magnitude array
     * @param {Array} phases - Phase array
     * @param {number} threshold - Peak detection threshold (percentage of max magnitude)
     * @returns {Array} Array of peak objects
     */
    static detectPeaks(frequencies, magnitudes, phases, threshold) {
        const peaks = [];
        const maxMagnitude = Math.max(...magnitudes);
        const thresholdValue = maxMagnitude * (threshold / 100);
        
        // First and last points cannot be peaks
        for (let i = 1; i < magnitudes.length - 1; i++) {
            if (magnitudes[i] > thresholdValue &&
                magnitudes[i] > magnitudes[i-1] &&
                magnitudes[i] > magnitudes[i+1]) {
                
                peaks.push({
                    frequency: frequencies[i],
                    magnitude: magnitudes[i],
                    phase: phases[i]
                });
            }
        }
        
        // Sort peaks by magnitude (descending)
        return peaks.sort((a, b) => b.magnitude - a.magnitude);
    }

    /**
     * Apply window function to signal
     * @param {Array} signal - Input signal array
     * @param {string} windowType - Type of window function
     * @returns {Array} Windowed signal array
     */
    static applyWindow(signal, windowType) {
        const n = signal.length;
        const windowed = new Array(n);
        
        if (windowType === 'none') {
            return signal;
        }
        
        for (let i = 0; i < n; i++) {
            let windowValue;
            switch (windowType) {
                case 'rectangular':
                    windowValue = 1;
                    break;
                case 'hamming':
                    windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
                    break;
                case 'hanning':
                    windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
                    break;
                case 'blackman':
                    windowValue = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) 
                               + 0.08 * Math.cos(4 * Math.PI * i / (n - 1));
                    break;
                case 'kaiser':
                    // Simple approximation of Kaiser window
                    const beta = 3.0;
                    const r = 2 * i / (n - 1) - 1;
                    windowValue = Math.sqrt(1 - r * r);
                    break;
                default:
                    return signal;
            }
            windowed[i] = signal[i] * windowValue;
        }
        
        return windowed;
    }
}
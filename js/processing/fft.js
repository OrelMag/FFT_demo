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
     * @returns {Object} Object containing frequency and magnitude arrays
     */
    static computeFFT(signal, options) {
        const { windowType = 'none', sampleRate } = options;
        
        // Apply window function if specified
        const windowedSignal = this.applyWindow(signal, windowType);
        
        // Pad array to power of 2 if needed
        const paddedLength = this.nextPowerOf2(signal.length);
        const paddedSignal = this.padSignal(windowedSignal, paddedLength);
        
        // Prepare complex input for FFT
        const complexSignal = paddedSignal.map(x => [x, 0]);
        
        // Compute FFT
        const fftResult = this.fft(complexSignal);
        
        // Calculate magnitudes and frequencies
        const magnitudes = this.calculateMagnitudes(fftResult);
        const frequencies = this.calculateFrequencies(paddedLength, sampleRate);
        
        return { frequencies, magnitudes };
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
     * Calculate magnitude spectrum
     * @param {Array} fftResult - Complex FFT result array
     * @returns {Array} Magnitude array
     */
    static calculateMagnitudes(fftResult) {
        const n = fftResult.length;
        const magnitudes = new Array(n/2);
        
        for (let i = 0; i < n/2; i++) {
            const real = fftResult[i][0];
            const imag = fftResult[i][1];
            magnitudes[i] = Math.sqrt(real*real + imag*imag) / n;
        }
        
        return magnitudes;
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
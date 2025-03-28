/**
 * Advanced spectral analysis utilities
 */
import { FFTProcessor } from './fft.js';

export class SpectralAnalyzer {
    constructor() {
        this.fftSize = 2048;
        this.overlap = 0.5;
    }

    /**
     * Computes the power spectral density
     * @param {Float32Array} signal - Input signal
     * @param {number} sampleRate - Sampling rate in Hz
     * @returns {Object} Power spectral density data
     */
    computePSD(signal, sampleRate) {
        const segments = this._segmentSignal(signal);
        const windowedSegments = segments.map(seg => this._applyWindow(seg, 'hanning'));
        const ffts = windowedSegments.map(seg => this._computeFFT(seg));
        
        // Average the periodograms
        const psd = new Float32Array(this.fftSize / 2);
        for (let i = 0; i < psd.length; i++) {
            psd[i] = ffts.reduce((sum, fft) => sum + Math.pow(Math.abs(fft[i]), 2), 0) / ffts.length;
        }

        const frequencies = new Float32Array(psd.length);
        for (let i = 0; i < frequencies.length; i++) {
            frequencies[i] = (i * sampleRate) / this.fftSize;
        }

        return { frequencies, psd };
    }

    /**
     * Computes the spectrogram
     * @param {Float32Array} signal - Input signal
     * @param {number} sampleRate - Sampling rate in Hz
     * @returns {Object} Spectrogram data
     */
    computeSpectrogram(signal, sampleRate) {
        if (!signal || !sampleRate) {
            console.error('Invalid input to computeSpectrogram');
            return null;
        }

        try {
            // Convert signal to Float32Array if it isn't already
            const signalArray = signal instanceof Float32Array ? signal : new Float32Array(signal);
            
            // Ensure minimum signal length
            if (signalArray.length < this.fftSize) {
                console.error('Signal too short for spectrogram analysis');
                return null;
            }

            const segments = this._segmentSignal(signalArray);
            if (!segments || segments.length === 0) {
                console.error('Failed to segment signal');
                return null;
            }

            // Process segments with error handling
            const spectrogramData = segments.map((segment, i) => {
                try {
                    const windowed = this._applyWindow(segment, 'hanning');
                    const fft = this._computeFFT(windowed);
                    if (!fft) return null;
                    
                    return Array.from(fft.slice(0, this.fftSize / 2))
                        .map(val => {
                            const magnitude = Math.abs(val);
                            return magnitude === 0 ? -100 : 20 * Math.log10(magnitude);
                        });
                } catch (err) {
                    console.error(`Error processing segment ${i}:`, err);
                    return null;
                }
            }).filter(Boolean); // Remove any null segments

            if (spectrogramData.length === 0) {
                console.error('No valid segments processed');
                return null;
            }

            const timeSteps = spectrogramData.length;
            const frequencies = new Float32Array(this.fftSize / 2);
            for (let i = 0; i < frequencies.length; i++) {
                frequencies[i] = (i * sampleRate) / this.fftSize;
            }

            return {
                data: spectrogramData,
                frequencies,
                timeSteps,
                timeResolution: (this.fftSize * (1 - this.overlap)) / sampleRate
            };
        } catch (err) {
            console.error('Error computing spectrogram:', err);
            return null;
        }
    }

    /**
     * Computes cross-correlation between two signals
     * @param {Float32Array} signal1 - First input signal
     * @param {Float32Array} signal2 - Second input signal
     * @returns {Float32Array} Cross-correlation result
     */
    computeCrossCorrelation(signal1, signal2) {
        const n = signal1.length;
        const result = new Float32Array(2 * n - 1);
        
        for (let lag = -n + 1; lag < n; lag++) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                if (i - lag >= 0 && i - lag < n) {
                    sum += signal1[i] * signal2[i - lag];
                }
            }
            result[lag + n - 1] = sum;
        }
        
        return result;
    }

    /**
     * Computes group delay
     * @param {Float32Array} signal - Input signal
     * @param {number} sampleRate - Sampling rate in Hz
     * @returns {Object} Group delay data
     */
    computeGroupDelay(signal, sampleRate) {
        try {
            if (!signal || !sampleRate) {
                console.error('Invalid input to computeGroupDelay');
                return null;
            }

            const fft = this._computeFFT(signal);
            if (!fft) {
                console.error('FFT computation failed in computeGroupDelay');
                return null;
            }

            // Check if FFT result has complex components
            if (!fft.some(val => val.hasOwnProperty('imag') && val.hasOwnProperty('real'))) {
                console.error('FFT result missing complex components');
                return null;
            }

            const phase = fft.map(c => Math.atan2(c.imag, c.real));
            const groupDelay = new Float32Array(phase.length - 1);
            
            for (let i = 0; i < groupDelay.length; i++) {
                groupDelay[i] = -(phase[i + 1] - phase[i]) /
                               ((2 * Math.PI * sampleRate) / this.fftSize);
            }

            const frequencies = new Float32Array(groupDelay.length);
            for (let i = 0; i < frequencies.length; i++) {
                frequencies[i] = (i * sampleRate) / this.fftSize;
            }

            return { frequencies, groupDelay };
        } catch (err) {
            console.error('Error computing group delay:', err);
            return null;
        }
    }

    // Private helper methods
    _segmentSignal(signal) {
        const segmentSize = this.fftSize;
        const hopSize = Math.floor(segmentSize * (1 - this.overlap));
        const segments = [];
        
        for (let i = 0; i < signal.length - segmentSize; i += hopSize) {
            segments.push(signal.slice(i, i + segmentSize));
        }
        
        return segments;
    }

    _applyWindow(segment, windowType) {
        const windowed = new Float32Array(segment.length);
        
        for (let i = 0; i < segment.length; i++) {
            let windowValue;
            switch (windowType) {
                case 'hanning':
                    windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (segment.length - 1)));
                    break;
                // Add other window types as needed
                default:
                    windowValue = 1;
            }
            windowed[i] = segment[i] * windowValue;
        }
        
        return windowed;
    }

    _computeFFT(signal) {
        try {
            if (!signal || signal.length === 0) {
                console.error('Invalid signal provided to FFT');
                return null;
            }

            if (!(signal instanceof Float32Array)) {
                signal = new Float32Array(signal);
            }

            const result = FFTProcessor.computeFFT(signal, {
                windowType: 'none',
                sampleRate: this.fftSize,
                peakThreshold: 0
            });

            if (!result || !result.magnitudes) {
                console.error('FFT computation failed to return magnitudes');
                return null;
            }

            return result.magnitudes;
        } catch (err) {
            console.error('Error in FFT computation:', err);
            return null;
        }
    }
}
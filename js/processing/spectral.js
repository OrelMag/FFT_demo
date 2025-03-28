/**
 * Advanced spectral analysis utilities
 */
import { FFTProcessor } from './fft.js';

export class SpectralAnalyzer {
    constructor() {
        this.fftSize = 512; // Further reduced FFT size for more time points
        this.overlap = 0.9; // Higher overlap for smoother visualization and more time points
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
            
            // Zero-pad signal if shorter than FFT size
            let paddedSignal;
            if (signalArray.length < this.fftSize) {
                paddedSignal = new Float32Array(this.fftSize);
                paddedSignal.set(signalArray);
            } else {
                paddedSignal = signalArray;
            }

            // Use padded signal for segmentation
            const segments = this._segmentSignal(paddedSignal);
            if (!segments || segments.length === 0) {
                console.error('Failed to segment signal');
                return null;
            }

            // Process segments with error handling and progress tracking
            console.log(`Starting spectrogram computation with ${segments.length} segments`);
            
            let spectrogramData = [];
            for (let i = 0; i < segments.length; i++) {
                try {
                    const windowed = this._applyWindow(segments[i], 'hanning');
                    const result = FFTProcessor.computeFFT(windowed, {
                        windowType: 'none',
                        sampleRate: this.fftSize,
                        peakThreshold: 0
                    });

                    if (!result || !result.magnitudes) {
                        console.error(`FFT computation failed for segment ${i}`);
                        continue;
                    }

                    const segment = result.magnitudes
                        .slice(0, this.fftSize / 2)
                        .map(magnitude => magnitude <= 1e-10 ? -100 : 20 * Math.log10(magnitude));

                    spectrogramData.push(segment);
                } catch (err) {
                    console.error(`Error processing segment ${i}:`, err);
                    continue;
                }
            }

            if (spectrogramData.length === 0) {
                console.error('No valid segments processed');
                return null;
            }

            console.log(`Successfully processed ${spectrogramData.length} segments`);

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
        try {
            const segmentSize = this.fftSize;
            const hopSize = Math.max(1, Math.floor(segmentSize * (1 - this.overlap)));
            const segments = [];
            
            console.log(`Segmenting signal: length=${signal.length}, segmentSize=${segmentSize}, hopSize=${hopSize}`);
            
            if (signal.length <= segmentSize) {
                // For very short signals, create overlapped copies
                const numSegments = Math.max(10, Math.floor(signal.length / hopSize));
                for (let i = 0; i < numSegments; i++) {
                    const segment = new Float32Array(segmentSize);
                    const start = Math.min(Math.max(0, i * hopSize), signal.length - 1);
                    segment.set(signal.slice(start));
                    segments.push(segment);
                }
            } else {
                // For longer signals, use sliding window with high overlap
                for (let i = 0; i < signal.length - hopSize; i += hopSize) {
                    const segment = new Float32Array(segmentSize);
                    const end = Math.min(i + segmentSize, signal.length);
                    const data = signal.slice(i, end);
                    segment.set(data);
                    segments.push(segment);
                }
            }
            
            console.log(`Created ${segments.length} segments of size ${segmentSize}`);
            return segments;
        } catch (err) {
            console.error('Error in signal segmentation:', err);
            return [signal]; // Return original signal as fallback
        }
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

            // For spectrogram, we need complex values
            const complexResult = [];
            for(let i = 0; i < result.magnitudes.length; i++) {
                const mag = result.magnitudes[i];
                const phase = result.phases[i] * Math.PI / 180; // Convert degrees to radians
                complexResult.push({
                    real: mag * Math.cos(phase),
                    imag: mag * Math.sin(phase)
                });
            }
            return complexResult;
        } catch (err) {
            console.error('Error in FFT computation:', err);
            return null;
        }
    }
}
/**
 * Signal Generator Module
 * Provides functions for generating various waveforms
 */
export class SignalGenerator {
    /**
     * Generate time points array
     * @param {number} duration - Duration in seconds
     * @param {number} sampleRate - Sample rate in Hz
     * @returns {Array} Array of time points
     */
    static generateTimePoints(duration, sampleRate) {
        const numPoints = Math.floor(duration * sampleRate);
        const timePoints = new Array(numPoints);
        const dt = duration / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
            timePoints[i] = i * dt;
        }
        
        return timePoints;
    }

    /**
     * Generate multi-frequency sine wave
     * @param {Object} params - Wave parameters
     * @param {Array} params.components - Array of frequency components
     * @param {number} params.duration - Duration in seconds
     * @param {number} params.sampleRate - Sample rate in Hz
     * @returns {Object} Object containing time and signal arrays
     */
    static generateMultiSineWave(params) {
        const { components, duration, sampleRate } = params;
        const timePoints = this.generateTimePoints(duration, sampleRate);
        const signal = new Array(timePoints.length).fill(0);

        // Sum all frequency components
        components.forEach(comp => {
            const { frequency, amplitude, phase } = comp;
            const phaseRad = (phase || 0) * Math.PI / 180; // Convert phase from degrees to radians
            
            for (let i = 0; i < timePoints.length; i++) {
                signal[i] += amplitude * Math.sin(2 * Math.PI * frequency * timePoints[i] + phaseRad);
            }
        });

        return { timePoints, signal };
    }

    /**
     * Generate sine wave
     * @param {Object} params - Wave parameters
     * @param {number} params.frequency - Frequency in Hz
     * @param {number} params.amplitude - Amplitude
     * @param {number} params.phase - Phase in degrees
     * @param {number} params.duration - Duration in seconds
     * @param {number} params.sampleRate - Sample rate in Hz
     * @returns {Object} Object containing time and signal arrays
     */
    static generateSineWave(params) {
        const { frequency, amplitude, phase = 0, duration, sampleRate } = params;
        return this.generateMultiSineWave({
            components: [{
                frequency,
                amplitude,
                phase
            }],
            duration,
            sampleRate
        });
    }

    /**
     * Generate square wave
     * @param {Object} params - Wave parameters
     * @returns {Object} Object containing time and signal arrays
     */
    static generateSquareWave(params) {
        const { frequency, amplitude, duration, sampleRate } = params;
        const timePoints = this.generateTimePoints(duration, sampleRate);
        const signal = timePoints.map(t => {
            const period = 1 / frequency;
            const normalizedTime = t % period;
            return amplitude * (normalizedTime < period / 2 ? 1 : -1);
        });
        
        return { timePoints, signal };
    }

    /**
     * Generate triangle wave
     * @param {Object} params - Wave parameters
     * @returns {Object} Object containing time and signal arrays
     */
    static generateTriangleWave(params) {
        const { frequency, amplitude, duration, sampleRate } = params;
        const timePoints = this.generateTimePoints(duration, sampleRate);
        const period = 1 / frequency;
        
        const signal = timePoints.map(t => {
            const normalizedTime = t % period;
            const normalizedValue = normalizedTime / period;
            
            if (normalizedValue < 0.25) {
                return amplitude * (4 * normalizedValue);
            } else if (normalizedValue < 0.75) {
                return amplitude * (2 - 4 * normalizedValue);
            } else {
                return amplitude * (-4 + 4 * normalizedValue);
            }
        });
        
        return { timePoints, signal };
    }

    /**
     * Generate sawtooth wave
     * @param {Object} params - Wave parameters
     * @returns {Object} Object containing time and signal arrays
     */
    static generateSawtoothWave(params) {
        const { frequency, amplitude, duration, sampleRate } = params;
        const timePoints = this.generateTimePoints(duration, sampleRate);
        const period = 1 / frequency;
        
        const signal = timePoints.map(t => {
            const normalizedTime = t % period;
            return amplitude * (2 * (normalizedTime / period) - 1);
        });
        
        return { timePoints, signal };
    }

    /**
     * Generate signal based on wave type
     * @param {string} type - Wave type (sine, multiSine, square, triangle, sawtooth)
     * @param {Object} params - Wave parameters
     * @returns {Object} Object containing time and signal arrays
     */
    static generateSignal(type, params) {
        switch (type.toLowerCase()) {
            case 'sine':
                return this.generateSineWave(params);
            case 'multisine':
                return this.generateMultiSineWave(params);
            case 'square':
                return this.generateSquareWave(params);
            case 'triangle':
                return this.generateTriangleWave(params);
            case 'sawtooth':
                return this.generateSawtoothWave(params);
            default:
                throw new Error(`Unsupported wave type: ${type}`);
        }
    }
}
/**
 * Main Application Module
 * Handles user interactions and coordinates signal processing
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize plot manager
    const plotManager = new PlotManager();
    
    // Get form elements
    const signalForm = document.getElementById('signalForm');
    const fileForm = document.getElementById('fileForm');
    const waveTypeSelect = document.getElementById('waveType');
    const frequencyInput = document.getElementById('frequency');
    const amplitudeInput = document.getElementById('amplitude');
    const durationInput = document.getElementById('duration');
    const sampleRateInput = document.getElementById('sampleRate');
    const windowTypeSelect = document.getElementById('windowType');
    const dataFileInput = document.getElementById('dataFile');
    const sampleRateFileInput = document.getElementById('sampleRateFile');

    /**
     * Process and display signal
     * @param {Array} signal - Signal data array
     * @param {Array} timePoints - Time points array
     * @param {number} sampleRate - Sample rate in Hz
     * @param {string} title - Title for the plots
     */
    function processAndDisplaySignal(signal, timePoints, sampleRate, title) {
        try {
            // Compute FFT
            const { frequencies, magnitudes } = FFTProcessor.computeFFT(signal, {
                windowType: windowTypeSelect.value,
                sampleRate: sampleRate
            });

            // Update plots
            plotManager.updateTimePlot(timePoints, signal);
            plotManager.updateFreqPlot(frequencies, magnitudes);

            // Update plot titles
            plotManager.updatePlotOptions({
                timeTitle: `${title} - Time Domain`,
                freqTitle: `Frequency Spectrum - ${windowTypeSelect.value.charAt(0).toUpperCase() + windowTypeSelect.value.slice(1)} Window`
            });

        } catch (error) {
            console.error('Error processing signal:', error);
            alert('Error processing signal. Please check the console for details.');
        }
    }

    /**
     * Handle signal generation form submission
     * @param {Event} e - Form submission event
     */
    function handleSignalFormSubmit(e) {
        e.preventDefault();

        // Get form values
        const params = {
            waveType: waveTypeSelect.value,
            frequency: parseFloat(frequencyInput.value),
            amplitude: parseFloat(amplitudeInput.value),
            duration: parseFloat(durationInput.value),
            sampleRate: parseFloat(sampleRateInput.value)
        };

        // Validate input
        if (!validateSignalParams(params)) {
            return;
        }

        // Generate signal
        const { timePoints, signal } = SignalGenerator.generateSignal(
            params.waveType,
            params
        );

        // Process and display signal
        processAndDisplaySignal(
            signal,
            timePoints,
            params.sampleRate,
            `${params.waveType.charAt(0).toUpperCase() + params.waveType.slice(1)} Wave - ${params.frequency}Hz`
        );
    }

    /**
     * Handle file form submission
     * @param {Event} e - Form submission event
     */
    async function handleFileFormSubmit(e) {
        e.preventDefault();

        const file = dataFileInput.files[0];
        if (!file) {
            alert('Please select a file');
            return;
        }

        const sampleRate = parseFloat(sampleRateFileInput.value);
        if (!validateSampleRate(sampleRate)) {
            return;
        }

        try {
            // Load and validate data
            const signal = await DataLoader.loadFile(file);
            const validatedSignal = DataLoader.validateData(signal);
            const timePoints = DataLoader.generateTimePoints(validatedSignal.length, sampleRate);

            // Process and display signal
            processAndDisplaySignal(
                validatedSignal,
                timePoints,
                sampleRate,
                `Loaded Data: ${file.name}`
            );

        } catch (error) {
            console.error('Error loading file:', error);
            alert(`Error loading file: ${error.message}`);
        }
    }

    /**
     * Validate signal generation parameters
     * @param {Object} params - Signal parameters
     * @returns {boolean} True if valid, false otherwise
     */
    function validateSignalParams(params) {
        if (isNaN(params.frequency)) {
            alert('Please enter a valid frequency');
            return false;
        }
        if (isNaN(params.amplitude)) {
            alert('Please enter a valid amplitude');
            return false;
        }
        if (isNaN(params.duration) || params.duration <= 0) {
            alert('Duration must be greater than 0');
            return false;
        }
        if (!validateSampleRate(params.sampleRate)) {
            return false;
        }

        // Warn about Nyquist frequency but allow to proceed
        if (params.frequency > params.sampleRate / 2) {
            const proceed = confirm(
                `Warning: Frequency (${params.frequency}Hz) exceeds Nyquist frequency ` +
                `(${params.sampleRate / 2}Hz). This may cause aliasing.\n\n` +
                `Do you want to proceed anyway?`
            );
            if (!proceed) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validate sample rate
     * @param {number} sampleRate - Sample rate to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function validateSampleRate(sampleRate) {
        if (isNaN(sampleRate) || sampleRate <= 0) {
            alert('Sample rate must be greater than 0');
            return false;
        }
        return true;
    }

    // Add form submit event listeners
    signalForm.addEventListener('submit', handleSignalFormSubmit);
    fileForm.addEventListener('submit', handleFileFormSubmit);

    // Add window type change event listener
    windowTypeSelect.addEventListener('change', () => {
        if (dataFileInput.files.length > 0) {
            fileForm.dispatchEvent(new Event('submit'));
        } else {
            signalForm.dispatchEvent(new Event('submit'));
        }
    });

    // Generate initial signal
    signalForm.dispatchEvent(new Event('submit'));
});
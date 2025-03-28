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
    const singleFreqControls = document.getElementById('singleFreqControls');
    const multiFreqControls = document.getElementById('multiFreqControls');
    const frequencyInput = document.getElementById('frequency');
    const amplitudeInput = document.getElementById('amplitude');
    const phaseInput = document.getElementById('phase');
    const durationInput = document.getElementById('duration');
    const sampleRateInput = document.getElementById('sampleRate');
    const windowTypeSelect = document.getElementById('windowType');
    const dataFileInput = document.getElementById('dataFile');
    const sampleRateFileInput = document.getElementById('sampleRateFile');
    const peakThresholdInput = document.getElementById('peakThreshold');
    const logScaleCheckbox = document.getElementById('logScale');
    const exportFFTButton = document.getElementById('exportFFT');
    const exportPeaksButton = document.getElementById('exportPeaks');
    const addFrequencyButton = document.getElementById('addFrequency');

    let currentFrequencies = [];
    let lastFFTResult = null;

    /**
     * Create a frequency component input group
     * @param {number} index - Component index
     * @returns {HTMLElement} Component input group
     */
    function createFrequencyComponent(index) {
        const div = document.createElement('div');
        div.className = 'frequency-component mb-3 border p-2';
        div.innerHTML = `
            <div class="mb-2">
                <label class="form-label">Component ${index + 1}</label>
                <button type="button" class="btn btn-sm btn-danger float-end remove-freq">Remove</button>
            </div>
            <div class="mb-2">
                <label class="form-label">Frequency (Hz)</label>
                <input type="number" class="form-control freq-input" value="10" step="any">
            </div>
            <div class="mb-2">
                <label class="form-label">Amplitude</label>
                <input type="number" class="form-control amp-input" value="1" step="any">
            </div>
            <div class="mb-2">
                <label class="form-label">Phase (degrees)</label>
                <input type="number" class="form-control phase-input" value="0" step="any">
            </div>
        `;

        const removeButton = div.querySelector('.remove-freq');
        removeButton.addEventListener('click', () => {
            div.remove();
            currentFrequencies = collectFrequencyComponents();
        });

        return div;
    }

    /**
     * Collect frequency component values
     * @returns {Array} Array of frequency component objects
     */
    function collectFrequencyComponents() {
        const components = [];
        const componentDivs = document.querySelectorAll('.frequency-component');
        
        componentDivs.forEach(div => {
            components.push({
                frequency: parseFloat(div.querySelector('.freq-input').value),
                amplitude: parseFloat(div.querySelector('.amp-input').value),
                phase: parseFloat(div.querySelector('.phase-input').value)
            });
        });
        
        return components;
    }

    /**
     * Process and display signal
     * @param {Array} signal - Signal data array
     * @param {Array} timePoints - Time points array
     * @param {number} sampleRate - Sample rate in Hz
     * @param {string} title - Title for the plots
     */
    function processAndDisplaySignal(signal, timePoints, sampleRate, title) {
        try {
            // Get peak threshold
            const peakThreshold = parseFloat(peakThresholdInput.value);
            
            // Compute FFT
            lastFFTResult = FFTProcessor.computeFFT(signal, {
                windowType: windowTypeSelect.value,
                sampleRate: sampleRate,
                peakThreshold: peakThreshold
            });

            const { frequencies, magnitudes, phases, peaks } = lastFFTResult;

            // Update plots
            plotManager.updateTimePlot(timePoints, signal);
            plotManager.updateFreqPlot(frequencies, magnitudes, {
                phases,
                logScale: logScaleCheckbox.checked,
                peaks
            });

            // Update peak table
            plotManager.updatePeakTable(peaks);

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

        const params = {
            duration: parseFloat(durationInput.value),
            sampleRate: parseFloat(sampleRateInput.value)
        };

        if (waveTypeSelect.value === 'multiSine') {
            params.components = collectFrequencyComponents();
            if (params.components.length === 0) {
                alert('Please add at least one frequency component');
                return;
            }
        } else {
            params.frequency = parseFloat(frequencyInput.value);
            params.amplitude = parseFloat(amplitudeInput.value);
            params.phase = parseFloat(phaseInput.value);
        }

        // Validate input
        if (!validateSignalParams(params)) {
            return;
        }

        // Generate signal
        const { timePoints, signal } = SignalGenerator.generateSignal(
            waveTypeSelect.value,
            params
        );

        // Process and display signal
        processAndDisplaySignal(
            signal,
            timePoints,
            params.sampleRate,
            waveTypeSelect.value === 'multiSine' ? 
                'Multi-Frequency Signal' : 
                `${waveTypeSelect.value.charAt(0).toUpperCase() + waveTypeSelect.value.slice(1)} Wave`
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
        if (!params.components && (isNaN(params.frequency) || params.frequency <= 0)) {
            alert('Please enter a valid frequency');
            return false;
        }
        if (!params.components && (isNaN(params.amplitude))) {
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

    // Add event listeners
    waveTypeSelect.addEventListener('change', () => {
        const isMultiSine = waveTypeSelect.value === 'multiSine';
        singleFreqControls.style.display = isMultiSine ? 'none' : 'block';
        multiFreqControls.style.display = isMultiSine ? 'block' : 'none';
    });

    addFrequencyButton.addEventListener('click', () => {
        const frequenciesDiv = document.getElementById('frequencies');
        const component = createFrequencyComponent(frequenciesDiv.children.length);
        frequenciesDiv.appendChild(component);
        currentFrequencies = collectFrequencyComponents();
    });

    // Add first frequency component for multi-sine
    addFrequencyButton.click();

    // FFT controls event listeners
    windowTypeSelect.addEventListener('change', () => {
        if (lastFFTResult) {
            const { signal, timePoints, sampleRate, title } = lastFFTResult;
            processAndDisplaySignal(signal, timePoints, sampleRate, title);
        }
    });

    logScaleCheckbox.addEventListener('change', () => {
        if (lastFFTResult) {
            const { frequencies, magnitudes, phases, peaks } = lastFFTResult;
            plotManager.updateFreqPlot(frequencies, magnitudes, {
                phases,
                logScale: logScaleCheckbox.checked,
                peaks
            });
        }
    });

    peakThresholdInput.addEventListener('change', () => {
        if (lastFFTResult) {
            const { signal, timePoints, sampleRate, title } = lastFFTResult;
            processAndDisplaySignal(signal, timePoints, sampleRate, title);
        }
    });

    // Export buttons event listeners
    exportFFTButton.addEventListener('click', () => {
        if (lastFFTResult) {
            const { frequencies, magnitudes, phases } = lastFFTResult;
            ExportUtils.exportSignalData({ frequencies, magnitudes, phases }, 'fft');
        }
    });

    exportPeaksButton.addEventListener('click', () => {
        if (lastFFTResult) {
            ExportUtils.exportSignalData({ peaks: lastFFTResult.peaks }, 'peaks');
        }
    });

    // Add form submit event listeners
    signalForm.addEventListener('submit', handleSignalFormSubmit);
    fileForm.addEventListener('submit', handleFileFormSubmit);

    // Generate initial signal
    signalForm.dispatchEvent(new Event('submit'));
});
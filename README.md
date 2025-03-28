# FFT Signal Analyzer

A comprehensive web-based FFT (Fast Fourier Transform) signal analysis tool that allows users to generate, analyze, and visualize various waveforms and their frequency components.

![FFT Signal Analyzer Screenshot](screenshots/app.png)

## Features

### Signal Generation
- **Multiple Waveform Types**:
  - Single Frequency Sine Wave
  - Multi-Frequency Sine Wave (with custom components)
  - Square Wave
  - Triangle Wave
  - Sawtooth Wave

- **Signal Parameters**:
  - Adjustable frequency (Hz)
  - Configurable amplitude
  - Phase control (degrees)
  - Variable duration
  - Sample rate selection

- **Multi-Frequency Generation**:
  - Add multiple frequency components
  - Individual control of amplitude and phase for each component
  - Dynamic component addition/removal

### FFT Analysis
- **Advanced Processing**:
  - Real-time FFT computation
  - Multiple window functions:
    * No Window (rectangular)
    * Hamming
    * Hanning
    * Blackman
    * Kaiser
  - Automatic padding to power of 2
  - Phase information calculation

- **Peak Detection**:
  - Adjustable threshold for peak detection
  - Automatic identification of dominant frequencies
  - Magnitude and phase information for peaks

### Visualization
- **Time Domain**:
  - Real-time signal visualization
  - Interactive time-amplitude display
  - Automatic scaling

- **Frequency Domain**:
  - Magnitude spectrum display
  - Logarithmic/Linear scale toggle
  - Peak markers
  - Phase information
  - Interactive frequency-magnitude tooltips

- **Analysis Results**:
  - Tabular display of dominant frequencies
  - Magnitude and phase information
  - Real-time updates

### Data Input/Output
- **File Loading**:
  - Support for multiple file formats:
    * CSV
    * JSON
    * TXT
  - Automatic format detection
  - Sample rate configuration

- **Export Capabilities**:
  - FFT data export (CSV format)
  - Peak data export
  - Timestamp-based file naming
  - Complete spectrum information

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fft-analyzer.git
   cd fft-analyzer
   ```

2. Start a local server (multiple options):
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using Node.js (with http-server):
   ```bash
   npx http-server
   ```

3. Open in your browser:
   ```
   http://localhost:8000
   ```

## Usage

### Basic Signal Generation
1. Select a wave type from the dropdown menu
2. Set the desired frequency, amplitude, and duration
3. Click "Generate Signal" to visualize

### Multi-Frequency Analysis
1. Select "Multi-Frequency Sine" wave type
2. Add frequency components using "Add Frequency Component"
3. Configure each component's frequency, amplitude, and phase
4. Generate and analyze the composite signal

### File Analysis
1. Use the "Data Input" section
2. Select a data file (CSV, JSON, or TXT)
3. Set the appropriate sample rate
4. Click "Load & Process" to analyze

### Export Data
1. Generate or load a signal
2. Use "Export FFT Data" for complete spectrum
3. Use "Export Peak Data" for dominant frequencies

## Technical Details

### Implementation
- Pure JavaScript implementation
- Uses Web Audio API for signal processing
- Chart.js for visualization
- Implements Cooley-Tukey FFT algorithm
- Modular architecture for easy extension

### Performance
- Automatic power-of-2 padding for efficient FFT
- Real-time processing and visualization
- Optimized peak detection algorithm
- Efficient data handling for large signals

## Project Structure
```
fft-analyzer/
├── index.html              # Main application page
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── main.js           # Main application logic
│   ├── signalGenerator/
│   │   └── basicWaves.js # Waveform generation
│   ├── processing/
│   │   └── fft.js       # FFT implementation
│   ├── visualization/
│   │   └── plotManager.js # Plotting utilities
│   └── utils/
│       ├── dataLoader.js # File loading utilities
│       └── export.js     # Data export utilities
└── samples/              # Example signal files
```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- FFT implementation based on the Cooley-Tukey algorithm
- Uses Chart.js for visualization
- Inspired by various signal processing tools

## Authors
- Your Name - *Initial work* - [YourGitHub](https://github.com/yourusername)

## Support
For support, please open an issue in the GitHub repository.
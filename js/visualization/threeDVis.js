/**
 * 3D Visualization component for advanced spectral analysis
 * Uses Three.js for rendering complex 3D visualizations
 */
/* global THREE */

export class ThreeDVisualizer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || this.container.clientWidth,
            height: options.height || this.container.clientHeight,
            renderMode: options.renderMode || '3d-spectrum',
            ...options
        };

        this.init();
    }

    init() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.options.width / this.options.height,
            0.1,
            1000
        );
        this.camera.position.set(2, 2, 2);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        this.container.appendChild(this.renderer.domElement);

        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lighting
        this.setupLighting();

        // Start animation loop
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-2, 2, -2);
        this.scene.add(pointLight);
    }

    /**
     * Creates a 3D spectrum visualization
     * @param {Float32Array} frequencyData - Frequency domain data
     * @param {number} sampleRate - Sample rate in Hz
     */
    create3DSpectrum(frequencyData, sampleRate) {
        // Clear existing visualization
        this.clearVisualization();

        // Create geometry for 3D spectrum
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        // Generate vertices and colors for each frequency bin
        for (let i = 0; i < frequencyData.length; i++) {
            const frequency = (i * sampleRate) / (2 * frequencyData.length);
            const magnitude = Math.abs(frequencyData[i]);
            const normalizedMagnitude = magnitude / Math.max(...frequencyData);

            // Create circular pattern for each frequency bin
            const segments = 32;
            for (let j = 0; j < segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                const radius = 1 + normalizedMagnitude;

                vertices.push(
                    radius * Math.cos(angle),
                    normalizedMagnitude * 2,
                    radius * Math.sin(angle)
                );

                // Add color based on frequency and magnitude
                const hue = i / frequencyData.length;
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                colors.push(color.r, color.g, color.b);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            shininess: 50
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
    }

    /**
     * Creates a phase delay visualization
     * @param {Object} phaseData - Phase delay data
     */
    createPhaseDelayVis(phaseData) {
        this.clearVisualization();

        const { frequencies, phaseDelay } = phaseData;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        // Create spiral visualization for phase delay
        for (let i = 0; i < frequencies.length; i++) {
            const radius = 1 + (i / frequencies.length);
            const height = phaseDelay[i] * 2;
            const turns = 5;
            const angle = (i / frequencies.length) * Math.PI * 2 * turns;

            vertices.push(
                radius * Math.cos(angle),
                height,
                radius * Math.sin(angle)
            );

            // Color based on frequency
            const color = new THREE.Color().setHSL(i / frequencies.length, 1, 0.5);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
    }

    /**
     * Creates a coherence visualization
     * @param {Object} coherenceData - Coherence analysis data
     */
    createCoherenceVis(coherenceData) {
        this.clearVisualization();

        const { frequencies, coherence } = coherenceData;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        // Create surface plot for coherence
        const gridSize = Math.ceil(Math.sqrt(frequencies.length));
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = i * gridSize + j;
                if (index < frequencies.length) {
                    vertices.push(
                        (i / gridSize) * 2 - 1,
                        coherence[index],
                        (j / gridSize) * 2 - 1
                    );

                    const color = new THREE.Color().setHSL(
                        coherence[index],
                        1,
                        0.5
                    );
                    colors.push(color.r, color.g, color.b);
                }
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
    }

    clearVisualization() {
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            if (object.type === 'Mesh' || object.type === 'Points' || object.type === 'Line') {
                object.geometry.dispose();
                object.material.dispose();
                this.scene.remove(object);
            } else {
                this.scene.remove(object);
            }
        }
        this.setupLighting();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        this.clearVisualization();
        this.renderer.dispose();
        this.controls.dispose();
    }
}
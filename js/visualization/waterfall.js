/**
 * Waterfall plot visualization for time-varying spectrum
 * Uses Three.js for 3D rendering
 */
/* global THREE */

export class WaterfallPlot {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || this.container.clientWidth,
            height: options.height || this.container.clientHeight,
            colorScale: options.colorScale || 'viridis',
            maxHistory: options.maxHistory || 50,
            ...options
        };

        this.init();
    }

    init() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.options.width / this.options.height,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        this.container.appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Initialize geometry
        this.initGeometry();

        // Set camera position
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // Start animation loop
        this.animate();
    }

    initGeometry() {
        this.surfaces = [];
        this.historyData = [];
        
        // Create grid helper
        const grid = new THREE.GridHelper(10, 10);
        this.scene.add(grid);

        // Create axes
        this.createAxes();
    }

    createAxes() {
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Add labels for axes
        this.addAxisLabel('Frequency (Hz)', new THREE.Vector3(5, 0, 0));
        this.addAxisLabel('Time', new THREE.Vector3(0, 0, 5));
        this.addAxisLabel('Magnitude', new THREE.Vector3(0, 5, 0));
    }

    addAxisLabel(text, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.fillText(text, 0, 48);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(2, 1, 1);
        this.scene.add(sprite);
    }

    updateData(frequencyData, timestamps) {
        // Add new data to history
        this.historyData.unshift(Array.from(frequencyData));
        if (this.historyData.length > this.options.maxHistory) {
            this.historyData.pop();
            this.removeOldestSurface();
        }

        // Create new surface for the latest data
        this.addNewSurface(frequencyData);
    }

    addNewSurface(frequencyData) {
        const geometry = new THREE.PlaneGeometry(
            10,
            1,
            frequencyData.length - 1,
            1
        );

        // Validate input data
        if (!frequencyData || !Array.isArray(frequencyData)) {
            console.error('Invalid frequency data provided to waterfall plot');
            return;
        }

        // Update vertices using modern Three.js API
        const positions = geometry.getAttribute('position');
        const posArray = positions.array;
        
        for (let i = 0; i < posArray.length; i += 3) { // Iterate by 3 since each vertex has x,y,z
            const vertexIndex = Math.floor(i / 3);
            const dataIndex = vertexIndex % frequencyData.length;
            posArray[i + 2] = frequencyData[dataIndex] / 255; // Update Z coordinate
        }
        
        positions.needsUpdate = true;

        const material = new THREE.MeshPhongMaterial({
            color: this.getColorForSurface(this.surfaces.length),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const surface = new THREE.Mesh(geometry, material);
        surface.position.z = -this.surfaces.length * 0.2;
        this.surfaces.unshift(surface);
        this.scene.add(surface);
    }

    removeOldestSurface() {
        if (this.surfaces.length > 0) {
            const oldestSurface = this.surfaces.pop();
            this.scene.remove(oldestSurface);
            oldestSurface.geometry.dispose();
            oldestSurface.material.dispose();
        }
    }

    getColorForSurface(index) {
        // Implement color scaling based on this.options.colorScale
        const hue = (index / this.options.maxHistory) * 0.8; // Range 0-0.8 for better color distinction
        return new THREE.Color().setHSL(hue, 1, 0.5);
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
        // Clean up Three.js resources
        this.surfaces.forEach(surface => {
            surface.geometry.dispose();
            surface.material.dispose();
        });
        this.renderer.dispose();
        this.controls.dispose();
    }
}
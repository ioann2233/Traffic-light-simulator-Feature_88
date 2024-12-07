class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue color
        this.camera = new THREE.PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        
        // Setup renderer with better quality settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Setup initial camera position for better view
        this.camera.position.set(150, 150, 150);
        this.camera.lookAt(0, 0, 0);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add lighting
        this.setupLighting();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light for shadows
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(100, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    addObject(object) {
        this.scene.add(object);
    }
    
    removeObject(object) {
        this.scene.remove(object);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

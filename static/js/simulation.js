class TrafficSimulation {
    constructor() {
        console.log('Initializing TrafficSimulation...');
        
        // Initialize 3D scene
        this.scene3D = new Scene3D(document.getElementById('scene3d'));
        this.vehicles = [];
        
        // Add camera data processing
        this.cameraData = {
            northSouth: { count: 0, speed: 0 },
            eastWest: { count: 0, speed: 0 }
        };
        
        this.trafficLights = {
            north: { state: 'red', timer: 0 },
            south: { state: 'red', timer: 0 },
            east: { state: 'red', timer: 0 },
            west: { state: 'red', timer: 0 }
        };
        
        this.running = true;
        this.initializeScene();
        this.startSimulation();
    }

    initializeScene() {
        // Create roads
        const northSouthRoad = TrafficModels.createRoad();
        northSouthRoad.rotation.x = -Math.PI / 2; // Horizontal
        northSouthRoad.rotation.y = Math.PI / 2;
        northSouthRoad.position.y = -0.1; // Slightly below to avoid z-fighting
        this.scene3D.addObject(northSouthRoad);
        
        const eastWestRoad = TrafficModels.createRoad();
        eastWestRoad.rotation.x = -Math.PI / 2;
        eastWestRoad.position.y = -0.1;
        this.scene3D.addObject(eastWestRoad);
        
        // Create traffic lights
        const northLight = TrafficModels.createTrafficLight();
        northLight.position.set(-30, 0, 30);
        northLight.rotation.y = Math.PI / 2;
        this.scene3D.addObject(northLight);
        
        const southLight = TrafficModels.createTrafficLight();
        southLight.position.set(30, 0, -30);
        southLight.rotation.y = -Math.PI / 2;
        this.scene3D.addObject(southLight);
        
        const eastLight = TrafficModels.createTrafficLight();
        eastLight.position.set(30, 0, 30);
        this.scene3D.addObject(eastLight);
        
        const westLight = TrafficModels.createTrafficLight();
        westLight.position.set(-30, 0, -30);
        westLight.rotation.y = Math.PI;
        this.scene3D.addObject(westLight);
        
        // Add camera controls
        document.getElementById('topView').addEventListener('click', () => {
            this.scene3D.camera.position.set(0, 200, 0);
            this.scene3D.camera.lookAt(0, 0, 0);
        });
        
        document.getElementById('sideView').addEventListener('click', () => {
            this.scene3D.camera.position.set(200, 100, 200);
            this.scene3D.camera.lookAt(0, 0, 0);
        });
    }

    updateCameraData(data) {
        this.cameraData = data;
        // Update traffic light logic based on real data
        if (this.trafficControl) {
            this.trafficControl.updateTrafficData(this.cameraData);
        }
    }

    spawnVehicle() {
        if (!this.running) return;
        
        const directions = ['north', 'south', 'east', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        let x, z, dx, dz;
        switch(direction) {
            case 'north':
                x = -15;
                z = 100;
                dx = 0;
                dz = -2;
                break;
            case 'south':
                x = 15;
                z = -100;
                dx = 0;
                dz = 2;
                break;
            case 'east':
                x = -100;
                z = -15;
                dx = 2;
                dz = 0;
                break;
            case 'west':
                x = 100;
                z = 15;
                dx = -2;
                dz = 0;
                break;
        }

        const vehicleMesh = TrafficModels.createVehicle();
        vehicleMesh.position.set(x, 3, z);
        
        if (direction === 'east' || direction === 'west') {
            vehicleMesh.rotation.y = Math.PI / 2;
        }
        
        this.scene3D.addObject(vehicleMesh);
        
        this.vehicles.push({
            mesh: vehicleMesh,
            x, z,
            dx, dz,
            maxSpeed: { dx, dz },
            currentSpeed: { dx, dz },
            direction,
            waiting: false
        });
    }

    updateVehicles() {
        const SAFE_DISTANCE = 40;
        const BRAKE_DISTANCE = 60;
        const MINIMUM_GAP = 20;
        
        this.vehicles = this.vehicles.filter(vehicle => {
            // Update position
            vehicle.mesh.position.x += vehicle.currentSpeed.dx;
            vehicle.mesh.position.z += vehicle.currentSpeed.dz;
            vehicle.x = vehicle.mesh.position.x;
            vehicle.z = vehicle.mesh.position.z;
            
            // Remove vehicles that are out of bounds
            if (Math.abs(vehicle.x) > 150 || Math.abs(vehicle.z) > 150) {
                this.scene3D.removeObject(vehicle.mesh);
                return false;
            }
            
            return true;
        });
    }

    getTrafficData() {
        return {
            ns: {
                count: this.cameraData.northSouth.count,
                waiting: this.vehicles.filter(v => 
                    (v.direction === 'north' || v.direction === 'south') && v.waiting
                ).length,
                avgSpeed: this.cameraData.northSouth.speed
            },
            ew: {
                count: this.cameraData.eastWest.count,
                waiting: this.vehicles.filter(v => 
                    (v.direction === 'east' || v.direction === 'west') && v.waiting
                ).length,
    updateTrafficLights() {
        const updateLight = (light, state) => {
            const lights = light.children.filter(child => child instanceof THREE.Mesh);
            lights.forEach(mesh => {
                mesh.material.emissiveIntensity = 0.1;
            });
            
            switch(state) {
                case 'red':
                    lights[0].material.emissiveIntensity = 1;
                    break;
                case 'yellow':
                    lights[1].material.emissiveIntensity = 1;
                    break;
                case 'green':
                    lights[2].material.emissiveIntensity = 1;
                    break;
            }
        };
        
        // Update all traffic lights
        updateLight(this.northLight, this.trafficLights.north.state);
        updateLight(this.southLight, this.trafficLights.south.state);
        updateLight(this.eastLight, this.trafficLights.east.state);
        updateLight(this.westLight, this.trafficLights.west.state);
    }

                avgSpeed: this.cameraData.eastWest.speed
            }
        };
    }

    startSimulation() {
        this.spawnInterval = setInterval(() => this.spawnVehicle(), 2000);
        this.animate();
    }

    animate() {
        if (!this.running) return;
        this.updateVehicles();
        requestAnimationFrame(() => this.animate());
    }

    toggleSimulation() {
        this.running = !this.running;
        if (this.running) this.animate();
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
    
    document.getElementById('toggleSimulation').addEventListener('click', () => {
        window.simulation.toggleSimulation();
    });
});
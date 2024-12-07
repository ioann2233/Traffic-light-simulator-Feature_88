class TrafficSimulation {
    constructor() {
        // Initialize 3D scene
        this.scene3D = new Scene3D(document.getElementById('scene3d'));

        // Initialize state
        this.vehicles = [];
        this.running = true;
        this.trafficLights = {
            north: { state: 'red' },
            south: { state: 'red' },
            east: { state: 'red' },
            west: { state: 'red' }
        };

        // Create base scene
        this.initializeScene();
        this.startSimulation();
        
        // Start periodic data updates
        setInterval(() => this.fetchCameraData(), 2000);
    }
    
    async fetchCameraData() {
        try {
            const response = await fetch('/api/camera-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    camera_id: 'cam1',
                    position: {
                        x: 0,
                        y: 50,
                        z: 0
                    },
                    direction: 'north'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateVehiclesFromCamera(data);
            this.updateTrafficData(data);
        } catch (error) {
            console.error('Error fetching camera data:', error);
        }
    }

    updateVehiclesFromCamera(data) {
        // Remove vehicles outside camera view
        this.vehicles = this.vehicles.filter(vehicle => {
            const isVisible = this.isInCameraView(vehicle.mesh.position);
            if (!isVisible) {
                this.scene3D.removeObject(vehicle.mesh);
                return false;
            }
            return true;
        });

        // Add new vehicles based on camera data
        const spawnDirections = {
            ns: ['north', 'south'],
            ew: ['east', 'west']
        };

        if (data.ns && data.ns.count > 0) {
            spawnDirections.ns.forEach(direction => {
                for (let i = 0; i < Math.ceil(data.ns.count / 2); i++) {
                    this.spawnVehicle(direction);
                }
            });
        }

        if (data.ew && data.ew.count > 0) {
            spawnDirections.ew.forEach(direction => {
                for (let i = 0; i < Math.ceil(data.ew.count / 2); i++) {
                    this.spawnVehicle(direction);
                }
            });
        }
    }

    isInCameraView(position) {
        return Math.abs(position.x) < 50 && Math.abs(position.z) < 50;
    }

    initializeScene() {
        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.MeshStandardMaterial({
                color: 0x1a472a,
                roughness: 0.8
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene3D.addObject(ground);

        // Roads
        const roadNS = TrafficModels.createRoad();
        this.scene3D.addObject(roadNS);
        
        const roadEW = TrafficModels.createRoad();
        roadEW.rotation.y = Math.PI / 2;
        this.scene3D.addObject(roadEW);

        // Traffic lights
        this.setupTrafficLights();
        
        // Start vehicle spawning
        this.setupSpawnInterval();
    }

    setupTrafficLights() {
        const positions = [
            { direction: 'north', x: -15, z: 15, rotation: Math.PI },
            { direction: 'south', x: 15, z: -15, rotation: 0 },
            { direction: 'east', x: 15, z: 15, rotation: Math.PI / 2 },
            { direction: 'west', x: -15, z: -15, rotation: -Math.PI / 2 }
        ];

        positions.forEach(pos => {
            const light = TrafficModels.createTrafficLight();
            light.position.set(pos.x, 0, pos.z);
            light.rotation.y = pos.rotation;
            this[pos.direction + 'Light'] = light;
            this.scene3D.addObject(light);
        });
    }

    setupSpawnInterval() {
        setInterval(() => this.spawnVehicle(), 3000);
    }

    animate() {
        if (!this.running) return;
        
        // Update vehicle positions
        this.vehicles.forEach(vehicle => {
            if (!vehicle.waiting) {
                vehicle.mesh.position.x += vehicle.currentSpeed.dx;
                vehicle.mesh.position.z += vehicle.currentSpeed.dy;
                
                this.checkTrafficLights(vehicle);
                this.checkCollisions(vehicle);
            }
        });
        
        // Remove out-of-bounds vehicles
        this.vehicles = this.vehicles.filter(vehicle => {
            const outOfBounds = 
                Math.abs(vehicle.mesh.position.x) > 200 ||
                Math.abs(vehicle.mesh.position.z) > 200;
                
            if (outOfBounds) {
                this.scene3D.removeObject(vehicle.mesh);
                return false;
            }
            return true;
        });
        
        requestAnimationFrame(() => this.animate());
        this.scene3D.render();
    }

    spawnVehicle(forcedDirection = null) {
        if (!this.running) return;

        const directions = ['north', 'south', 'east', 'west'];
        const direction = forcedDirection || directions[Math.floor(Math.random() * directions.length)];
        
        // Choose random lane (0 or 1)
        const lane = Math.floor(Math.random() * 2);
        const laneOffset = lane * 10 - 5; // -5 for first lane, +5 for second
        
        const vehicle = {
            mesh: TrafficModels.createVehicle(),
            direction: direction,
            lane: lane,
            waiting: false,
            currentSpeed: { dx: 0, dy: 0 },
            maxSpeed: { dx: 0, dy: 0 }
        };

        // Set initial position and speed based on direction and lane
        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(-laneOffset, 2, 150);
                vehicle.mesh.rotation.y = Math.PI;
                vehicle.maxSpeed = { dx: 0, dy: -0.5 };
                break;
            case 'south':
                vehicle.mesh.position.set(laneOffset, 2, -150);
                vehicle.maxSpeed = { dx: 0, dy: 0.5 };
                break;
            case 'east':
                vehicle.mesh.position.set(-150, 2, -laneOffset);
                vehicle.mesh.rotation.y = Math.PI / 2;
                vehicle.maxSpeed = { dx: 0.5, dy: 0 };
                break;
            case 'west':
                vehicle.mesh.position.set(150, 2, laneOffset);
                vehicle.mesh.rotation.y = -Math.PI / 2;
                vehicle.maxSpeed = { dx: -0.5, dy: 0 };
                break;
        }

        // Check if it's safe to spawn
        const isSafeToSpawn = !this.vehicles.some(other => {
            if (other.direction !== direction || other.lane !== lane) return false;
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            return distance < 20;
        });

        if (isSafeToSpawn) {
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            this.scene3D.addObject(vehicle.mesh);
            this.vehicles.push(vehicle);
            console.log(`Spawning vehicle: direction=${direction}`);
        }
    }

    checkTrafficLights(vehicle) {
        const TRAFFIC_LIGHT_ZONE = 20;
        
        const inNorthZone = Math.abs(vehicle.mesh.position.z - 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.x) < 10;
        const inSouthZone = Math.abs(vehicle.mesh.position.z + 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.x) < 10;
        const inEastZone = Math.abs(vehicle.mesh.position.x - 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.z) < 10;
        const inWestZone = Math.abs(vehicle.mesh.position.x + 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.z) < 10;
        
        if ((inNorthZone && this.trafficLights.north.state !== 'green') ||
            (inSouthZone && this.trafficLights.south.state !== 'green') ||
            (inEastZone && this.trafficLights.east.state !== 'green') ||
            (inWestZone && this.trafficLights.west.state !== 'green')) {
            vehicle.waiting = true;
            vehicle.currentSpeed.dx = 0;
            vehicle.currentSpeed.dy = 0;
        } else {
            vehicle.waiting = false;
            vehicle.currentSpeed = {...vehicle.maxSpeed};
        }
    }

    checkCollisions(vehicle) {
        const SAFE_DISTANCE = 15;
        
        this.vehicles.forEach(other => {
            if (other !== vehicle && other.direction === vehicle.direction && other.lane === vehicle.lane) {
                const distance = Math.sqrt(
                    Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                    Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
                );
                
                if (distance < SAFE_DISTANCE) {
                    vehicle.waiting = true;
                    vehicle.currentSpeed.dx = 0;
                    vehicle.currentSpeed.dy = 0;
                }
            }
        });
    }

    startSimulation() {
        this.running = true;
        this.animate();
    }

    stopSimulation() {
        this.running = false;
    }

    toggleSimulation() {
        this.running = !this.running;
        if (this.running) {
            this.animate();
        }
    }

    getTrafficData() {
        const nsVehicles = this.vehicles.filter(v => v.direction === 'north' || v.direction === 'south');
        const ewVehicles = this.vehicles.filter(v => v.direction === 'east' || v.direction === 'west');
        
        return {
            ns: {
                count: nsVehicles.length,
                waiting: nsVehicles.filter(v => v.waiting).length,
                avgSpeed: nsVehicles.reduce((sum, v) => sum + Math.abs(v.currentSpeed.dy), 0) / Math.max(nsVehicles.length, 1)
            },
            ew: {
                count: ewVehicles.length,
                waiting: ewVehicles.filter(v => v.waiting).length,
                avgSpeed: ewVehicles.reduce((sum, v) => sum + Math.abs(v.currentSpeed.dx), 0) / Math.max(ewVehicles.length, 1)
            }
        };
    }

    updateTrafficLights() {
        Object.keys(this.trafficLights).forEach(direction => {
            const lightMesh = this[direction + 'Light'];
            if (lightMesh) {
                const lights = lightMesh.children.filter(child => 
                    child instanceof THREE.Mesh && 
                    child.material.emissive
                );
                
                // Reset all lights
                lights.forEach(light => {
                    light.material.emissiveIntensity = 0.1;
                });
                
                // Set active light
                const state = this.trafficLights[direction].state;
                const lightIndex = state === 'red' ? 0 : state === 'yellow' ? 1 : 2;
                if (lights[lightIndex]) {
                    lights[lightIndex].material.emissiveIntensity = 1;
                }
            }
        });
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
});

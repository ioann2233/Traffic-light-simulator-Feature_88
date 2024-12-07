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
        
        // Запуск периодического обновления данных
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
                    camera_id: 'cam1'
                })
            });
            const data = await response.json();
            this.updateTrafficData(data);
        } catch (error) {
            console.error('Error fetching camera data:', error);
        }
    }

    initializeScene() {
        this.createGround();
        this.createRoadMarkings();
        this.setupTrafficLights();
        this.setupSpawnInterval();
    }

    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene3D.addObject(ground);

        // Create roads using the updated TrafficModels method
        const roads = TrafficModels.createRoad();
        this.scene3D.addObject(roads);
    }

    createRoadMarkings() {
        const markingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4
        });

        // Центральные полосы (North-South)
        const nsLineGeometry = new THREE.BoxGeometry(0.5, 0.1, 30);
        for (let z = -150; z <= 150; z += 40) {
            const line = new THREE.Mesh(nsLineGeometry, markingMaterial);
            line.position.set(0, 0.1, z);
            this.scene3D.addObject(line);
        }

        // Центральные полосы (East-West)
        const ewLineGeometry = new THREE.BoxGeometry(30, 0.1, 0.5);
        for (let x = -150; x <= 150; x += 40) {
            const line = new THREE.Mesh(ewLineGeometry, markingMaterial);
            line.position.set(x, 0.1, 0);
            this.scene3D.addObject(line);
        }

        this.createStopLines(markingMaterial);
    }

    createStopLines(material) {
        const positions = [
            { direction: 'north', x: 0, z: 15 },
            { direction: 'south', x: 0, z: -15 },
            { direction: 'east', x: 15, z: 0 },
            { direction: 'west', x: -15, z: 0 }
        ];

        positions.forEach(pos => {
            const isVertical = pos.direction === 'north' || pos.direction === 'south';
            const geometry = isVertical 
                ? new THREE.BoxGeometry(20, 0.1, 2)
                : new THREE.BoxGeometry(2, 0.1, 20);
            
            const line = new THREE.Mesh(geometry, material);
            line.position.set(pos.x, 0.1, pos.z);
            this.scene3D.addObject(line);
        });
    }

    setupTrafficLights() {
        const positions = [
            { direction: 'north', x: 15, z: 15, rotation: Math.PI },
            { direction: 'south', x: -15, z: -15, rotation: 0 },
            { direction: 'east', x: 15, z: -15, rotation: Math.PI / 2 },
            { direction: 'west', x: -15, z: 15, rotation: -Math.PI / 2 }
        ];

        positions.forEach(pos => {
            const light = TrafficModels.createTrafficLight();
            light.position.set(pos.x, 0, pos.z);
            light.rotation.y = pos.rotation;
            this.scene3D.addObject(light);
        });
    }

    setupSpawnInterval() {
        setInterval(() => this.spawnVehicle(), 3000);
    }

    animate() {
        if (!this.running) return;
        
        // Обновление позиций машин
        this.vehicles.forEach(vehicle => {
            if (!vehicle.waiting) {
                vehicle.mesh.position.x += vehicle.currentSpeed.dx;
                vehicle.mesh.position.z += vehicle.currentSpeed.dy;
                
                // Проверка светофоров и других машин
                this.checkTrafficLights(vehicle);
                this.checkCollisions(vehicle);
            }
        });
        
        // Удаление машин за пределами сцены
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

    spawnVehicle() {
        if (!this.running) return;

        const directions = ['north', 'south', 'east', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        const vehicle = {
            mesh: TrafficModels.createVehicle(),
            direction: direction,
            waiting: false,
            currentSpeed: { dx: 0, dy: 0 },
            maxSpeed: { dx: 0, dy: 0 }
        };

        // Установка начальной позиции и скорости
        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(0, 2, 150);
                vehicle.mesh.rotation.y = Math.PI;
                vehicle.maxSpeed = { dx: 0, dy: -0.5 };
                break;
            case 'south':
                vehicle.mesh.position.set(0, 2, -150);
                vehicle.maxSpeed = { dx: 0, dy: 0.5 };
                break;
            case 'east':
                vehicle.mesh.position.set(-150, 2, 0);
                vehicle.mesh.rotation.y = Math.PI / 2;
                vehicle.maxSpeed = { dx: 0.5, dy: 0 };
                break;
            case 'west':
                vehicle.mesh.position.set(150, 2, 0);
                vehicle.mesh.rotation.y = -Math.PI / 2;
                vehicle.maxSpeed = { dx: -0.5, dy: 0 };
                break;
        }

        vehicle.currentSpeed = {...vehicle.maxSpeed};
        this.scene3D.addObject(vehicle.mesh);
        this.vehicles.push(vehicle);
        
        console.log(`Spawning vehicle: direction=${direction}`);
    }

    checkTrafficLights(vehicle) {
        // Определение зоны светофора
        const TRAFFIC_LIGHT_ZONE = 20;
        
        const inNorthZone = Math.abs(vehicle.mesh.position.z - 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.x) < 10;
        const inSouthZone = Math.abs(vehicle.mesh.position.z + 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.x) < 10;
        const inEastZone = Math.abs(vehicle.mesh.position.x - 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.z) < 10;
        const inWestZone = Math.abs(vehicle.mesh.position.x + 15) < TRAFFIC_LIGHT_ZONE && Math.abs(vehicle.mesh.position.z) < 10;
        
        // Проверка светофоров
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
            if (other !== vehicle && other.direction === vehicle.direction) {
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
        // This method will be called by the TrafficController
        Object.keys(this.trafficLights).forEach(direction => {
            const light = this.trafficLights[direction];
            // Update visual representation if needed
        });
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
});

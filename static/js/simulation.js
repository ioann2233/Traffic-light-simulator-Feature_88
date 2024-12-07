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
    }

    getTrafficData() {
        return {
            ns: {
                count: this.countVehicles('north') + this.countVehicles('south'),
                waiting: this.countWaitingVehicles('north') + this.countWaitingVehicles('south'),
                avgSpeed: this.calculateAverageSpeed(['north', 'south'])
            },
            ew: {
                count: this.countVehicles('east') + this.countVehicles('west'),
                waiting: this.countWaitingVehicles('east') + this.countWaitingVehicles('west'),
                avgSpeed: this.calculateAverageSpeed(['east', 'west'])
            }
        };
    }

    countVehicles(direction) {
        return this.vehicles.filter(v => v.direction === direction).length;
    }

    countWaitingVehicles(direction) {
        return this.vehicles.filter(v => v.direction === direction && v.waiting).length;
    }

    calculateAverageSpeed(directions) {
        const vehicles = this.vehicles.filter(v => directions.includes(v.direction));
        if (vehicles.length === 0) return 0;
        
        const totalSpeed = vehicles.reduce((sum, v) => {
            const speed = Math.sqrt(v.currentSpeed.dx ** 2 + v.currentSpeed.dy ** 2);
            return sum + speed;
        }, 0);
        
        return totalSpeed / vehicles.length;
    }

    updateTrafficLights() {
        const updateLight = (light, state) => {
            if (!light) return;
            
            // Находим все лампы светофора
            const redLight = light.children.find(child => 
                child instanceof THREE.Mesh && child.position.y === 14);
            const yellowLight = light.children.find(child => 
                child instanceof THREE.Mesh && child.position.y === 10);
            const greenLight = light.children.find(child => 
                child instanceof THREE.Mesh && child.position.y === 6);
                
            // Сбрасываем интенсивность всех ламп
            [redLight, yellowLight, greenLight].forEach(light => {
                if (light) light.material.emissiveIntensity = 0.1;
            });
            
            // Включаем нужную лампу
            switch(state) {
                case 'red':
                    if (redLight) redLight.material.emissiveIntensity = 1;
                    break;
                case 'yellow':
                    if (yellowLight) yellowLight.material.emissiveIntensity = 1;
                    break;
                case 'green':
                    if (greenLight) greenLight.material.emissiveIntensity = 1;
                    break;
            }
        };
        
        // Обновляем все светофоры
        updateLight(this.northLight, this.trafficLights.north.state);
        updateLight(this.southLight, this.trafficLights.south.state);
        updateLight(this.eastLight, this.trafficLights.east.state);
        updateLight(this.westLight, this.trafficLights.west.state);
    }

    initializeScene() {
        // Создание дороги North-South
        const roadNS = TrafficModels.createRoad();
        roadNS.rotation.x = -Math.PI / 2;  // Положить горизонтально
        roadNS.position.y = 0;  // На уровне земли
        this.scene3D.addObject(roadNS);
        
        // Создание дороги East-West с правильной ориентацией
        const roadEW = TrafficModels.createRoad();
        roadEW.rotation.x = -Math.PI / 2;  // Положить горизонтально
        roadEW.rotation.y = Math.PI / 2;   // Повернуть на 90 градусов
        roadEW.position.y = 0;  // На уровне земли
        this.scene3D.addObject(roadEW);
        
        // Земля
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a472a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;  // Чуть ниже дорог
        ground.receiveShadow = true;
        this.scene3D.addObject(ground);
        
        // Create traffic lights
        this.northLight = TrafficModels.createTrafficLight();
        this.northLight.position.set(-15, 0, -100);
        this.scene3D.addObject(this.northLight);
        
        this.southLight = TrafficModels.createTrafficLight();
        this.southLight.position.set(15, 0, 100);
        this.southLight.rotation.y = Math.PI;
        this.scene3D.addObject(this.southLight);
        
        this.eastLight = TrafficModels.createTrafficLight();
        this.eastLight.position.set(100, 0, -15);
        this.eastLight.rotation.y = -Math.PI / 2;
        this.scene3D.addObject(this.eastLight);
        
        this.westLight = TrafficModels.createTrafficLight();
        this.westLight.position.set(-100, 0, 15);
        this.westLight.rotation.y = Math.PI / 2;
        this.scene3D.addObject(this.westLight);
        
        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a472a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene3D.addObject(ground);
    }

    startSimulation() {
        this.spawnInterval = setInterval(() => this.spawnVehicle(), 2000);
        this.animate();
    }

    animate() {
        if (!this.running) return;
        
        // Update traffic lights state each frame
        this.updateTrafficLights();
        
        // Update vehicle positions
        this.vehicles = this.vehicles.filter(vehicle => {
            if (!vehicle.waiting) {
                vehicle.mesh.position.x += vehicle.currentSpeed.dx;
                vehicle.mesh.position.z += vehicle.currentSpeed.dy;
            }
            
            // Remove vehicles that have left the scene
            const outOfBounds = 
                vehicle.mesh.position.x < -200 ||
                vehicle.mesh.position.x > 200 ||
                vehicle.mesh.position.z < -200 ||
                vehicle.mesh.position.z > 200;
                
            if (outOfBounds) {
                this.scene3D.removeObject(vehicle.mesh);
                return false;
            }
            return true;
        });
        
        requestAnimationFrame(() => this.animate());
        this.scene3D.render();
    }

    toggleSimulation() {
        this.running = !this.running;
        if (this.running) this.animate();
    }

    spawnVehicle() {
        if (!this.running) return;

        const directions = ['north', 'south', 'east', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Определение полосы движения (смещение от центра)
        const laneOffset = Math.random() > 0.5 ? 8 : -8;  // Смещение для разных полос
        
        const vehicle = {
            mesh: TrafficModels.createVehicle(),
            direction: direction,
            lane: laneOffset,
            waiting: false,
            currentSpeed: { dx: 0, dy: 0 },
            maxSpeed: { dx: 0, dy: 0 }
        };

        // Установка начальной позиции с учетом полосы движения
        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(laneOffset, 2, 150);
                vehicle.mesh.rotation.y = Math.PI;
                vehicle.maxSpeed = { dx: 0, dy: -0.5 };
                break;
            case 'south':
                vehicle.mesh.position.set(-laneOffset, 2, -150);
                vehicle.maxSpeed = { dx: 0, dy: 0.5 };
                break;
            case 'east':
                vehicle.mesh.position.set(-150, 2, laneOffset);
                vehicle.mesh.rotation.y = Math.PI / 2;
                vehicle.maxSpeed = { dx: 0.5, dy: 0 };
                break;
            case 'west':
                vehicle.mesh.position.set(150, 2, -laneOffset);
                vehicle.mesh.rotation.y = -Math.PI / 2;
                vehicle.maxSpeed = { dx: -0.5, dy: 0 };
                break;
        }

        vehicle.currentSpeed = {...vehicle.maxSpeed};
        this.scene3D.addObject(vehicle.mesh);
        this.vehicles.push(vehicle);
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    try {
        window.simulation = new TrafficSimulation();
        
        document.getElementById('toggleSimulation').addEventListener('click', () => {
            window.simulation.toggleSimulation();
        });
        
        // Add camera control buttons
        document.getElementById('topView').addEventListener('click', () => {
            const camera = window.simulation.scene3D.camera;
            camera.position.set(0, 200, 0);
            camera.lookAt(0, 0, 0);
        });

        document.getElementById('sideView').addEventListener('click', () => {
            const camera = window.simulation.scene3D.camera;
            camera.position.set(200, 50, 200);
            camera.lookAt(0, 0, 0);
        });
    } catch (error) {
        console.error('Error initializing simulation:', error);
    }
});
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
                    camera_id: 'cam1'
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
            // Используем симулированные данные при ошибке
            const fallbackData = {
                ns: { count: 2, waiting: 1, avgSpeed: 0.5 },
                ew: { count: 2, waiting: 1, avgSpeed: 0.5 }
            };
            this.updateVehiclesFromCamera(fallbackData);
            this.updateTrafficData(fallbackData);
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
        // Убрать проверку видимости, т.к. нам нужны все машины
        return true;
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
            { direction: 'north', x: -20, z: 20, rotation: Math.PI },    // Сдвинуты дальше от перекрестка
            { direction: 'south', x: 20, z: -20, rotation: 0 },
            { direction: 'east', x: 20, z: 20, rotation: Math.PI / 2 },
            { direction: 'west', x: -20, z: -20, rotation: -Math.PI / 2 }
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
        
        // Update traffic lights state
        this.updateTrafficLights();
        
        // Update vehicles
        this.vehicles.forEach(vehicle => {
            if (!vehicle.waiting) {
                // Проверяем светофоры перед движением
                this.checkTrafficLights(vehicle);
                
                // Если не ждем, двигаемся
                if (!vehicle.waiting) {
                    vehicle.mesh.position.x += vehicle.currentSpeed.dx;
                    vehicle.mesh.position.z += vehicle.currentSpeed.dy;
                    this.checkCollisions(vehicle);
                }
            } else {
                // Повторная проверка светофора для ждущих машин
                this.checkTrafficLights(vehicle);
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
        
        // Выбор полосы (0 или 1)
        const lane = Math.floor(Math.random() * 2);
        const laneOffset = lane * 8; // Увеличенное расстояние между полосами
        
        const vehicle = {
            mesh: TrafficModels.createVehicle(),
            direction: direction,
            lane: lane,
            waiting: false,
            currentSpeed: { dx: 0, dy: 0 },
            maxSpeed: { dx: 0, dy: 0 }
        };

        // Установка позиции и скорости с учетом полосы
        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(-8 + laneOffset, 2, 150);
                vehicle.mesh.rotation.y = Math.PI;
                vehicle.maxSpeed = { dx: 0, dy: -0.8 };
                break;
            case 'south':
                vehicle.mesh.position.set(8 - laneOffset, 2, -150);
                vehicle.maxSpeed = { dx: 0, dy: 0.8 };
                break;
            case 'east':
                vehicle.mesh.position.set(-150, 2, -8 + laneOffset);
                vehicle.mesh.rotation.y = Math.PI / 2;
                vehicle.maxSpeed = { dx: 0.8, dy: 0 };
                break;
            case 'west':
                vehicle.mesh.position.set(150, 2, 8 - laneOffset);
                vehicle.mesh.rotation.y = -Math.PI / 2;
                vehicle.maxSpeed = { dx: -0.8, dy: 0 };
                break;
        }

        // Проверка безопасной дистанции
        const isSafeToSpawn = !this.vehicles.some(other => {
            if (other.direction !== direction || other.lane !== lane) return false;
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            return distance < 25;
        });

        if (isSafeToSpawn) {
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            this.scene3D.addObject(vehicle.mesh);
            this.vehicles.push(vehicle);
        }
    }

    checkTrafficLights(vehicle) {
        const STOP_LINE = 15;
        const INTERSECTION_ZONE = 10;
        
        const position = vehicle.mesh.position;
        const inIntersection = Math.abs(position.x) < INTERSECTION_ZONE && Math.abs(position.z) < INTERSECTION_ZONE;
        const beforeStopLine = 
            (vehicle.direction === 'north' && position.z > STOP_LINE) ||
            (vehicle.direction === 'south' && position.z < -STOP_LINE) ||
            (vehicle.direction === 'east' && position.x < -STOP_LINE) ||
            (vehicle.direction === 'west' && position.x > STOP_LINE);
        
        const lightState = this.trafficLights[vehicle.direction].state;
        
        if (inIntersection) {
            // Машина уже на перекрестке - позволяем проехать
            vehicle.waiting = false;
            vehicle.currentSpeed = {...vehicle.maxSpeed};
        } else if (beforeStopLine) {
            if (lightState === 'red') {
                // Полная остановка на красный
                vehicle.waiting = true;
                vehicle.currentSpeed.dx = 0;
                vehicle.currentSpeed.dy = 0;
            } else if (lightState === 'yellow') {
                // На желтый - замедляемся, но не останавливаемся полностью
                vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * 0.3;
                vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * 0.3;
            } else {
                // На зеленый - полная скорость
                vehicle.waiting = false;
                vehicle.currentSpeed = {...vehicle.maxSpeed};
            }
        }
    }

    checkCollisions(vehicle) {
        const SAFE_DISTANCE = 20;  // Увеличенная безопасная дистанция
        const SLOW_DISTANCE = 35;
        
        this.vehicles.forEach(other => {
            if (other !== vehicle && 
                other.direction === vehicle.direction && 
                other.lane === vehicle.lane) {
                
                const distance = Math.sqrt(
                    Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                    Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
                );
                
                if (distance < SAFE_DISTANCE) {
                    // Полная остановка при малой дистанции
                    vehicle.waiting = true;
                    vehicle.currentSpeed.dx = 0;
                    vehicle.currentSpeed.dy = 0;
                } else if (distance < SLOW_DISTANCE) {
                    // Плавное замедление при средней дистанции
                    vehicle.currentSpeed.dx = other.currentSpeed.dx * 0.5;
                    vehicle.currentSpeed.dy = other.currentSpeed.dy * 0.5;
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
            if (!lightMesh) return;
            
            const lights = lightMesh.children.filter(child => 
                child instanceof THREE.Mesh && 
                child.material.emissive
            );
            
            // Обновляем состояние каждого сигнала
            lights.forEach((light, index) => {
                const state = this.trafficLights[direction].state;
                const isActive = (
                    (index === 0 && state === 'red') ||
                    (index === 1 && state === 'yellow') ||
                    (index === 2 && state === 'green')
                );
                
                // Плавное изменение интенсивности
                const targetIntensity = isActive ? 1 : 0.1;
                light.material.emissiveIntensity += 
                    (targetIntensity - light.material.emissiveIntensity) * 0.2;
                
                // Обновляем точечный свет
                if (light.userData.pointLight) {
                    light.userData.pointLight.intensity = isActive ? 0.5 : 0;
                }
            });
        });
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
});

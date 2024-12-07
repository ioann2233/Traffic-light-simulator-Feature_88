class TrafficSimulation {
    constructor() {
        // Инициализация статистики
        this.stats = {
            ns: { waiting: 0, count: 0, avgSpeed: 0 },
            ew: { waiting: 0, count: 0, avgSpeed: 0 }
        };
        
        // Контейнер для 3D сцены
        this.container = document.querySelector('.scene-container');
        if (!this.container) {
            throw new Error('Scene container not found');
        }
        
        // Инициализация 3D сцены
        this.scene3D = new Scene3D(this.container);
        
        // Создание дорог
        this.createRoads();
        
        // Создание светофоров
        this.createTrafficLights();
        
        // Инициализация массива транспортных средств
        this.vehicles = [];
        
        // Состояние светофоров
        this.trafficLights = {
            north: { state: 'red' },
            south: { state: 'red' },
            east: { state: 'green' },
            west: { state: 'green' }
        };
        
        // Запуск обновления
        this.startSimulation();
    }

    getTrafficData() {
        return this.stats;
    }
    
    updateStats(data) {
        if (!data) return;
        
        this.stats = data;
        
        // Обновление отображения
        try {
            document.getElementById('ns-queue').textContent = data.ns.waiting;
            document.getElementById('ew-queue').textContent = data.ew.waiting;
            document.getElementById('ns-speed').textContent = 
                Math.round(data.ns.avgSpeed * 50) + ' км/ч';
            document.getElementById('ew-speed').textContent = 
                Math.round(data.ew.avgSpeed * 50) + ' км/ч';
        } catch (error) {
            console.error('Error updating stats display:', error);
        }
    }
    
    createRoads() {
        const roads = TrafficModels.createRoad();
        this.scene3D.addObject(roads);
    }
    
    createTrafficLights() {
        const positions = {
            north: [0, 0, 15],
            south: [0, 0, -15],
            east: [-15, 0, 0],
            west: [15, 0, 0]
        };
        
        const rotations = {
            north: [0, Math.PI, 0],
            south: [0, 0, 0],
            east: [0, Math.PI/2, 0],
            west: [0, -Math.PI/2, 0]
        };
        
        Object.entries(positions).forEach(([direction, position]) => {
            const light = TrafficModels.createTrafficLight(direction);
            light.position.set(...position);
            light.rotation.set(...rotations[direction]);
            this.scene3D.addObject(light);
            this[direction + 'Light'] = light;
        });
    }
    
    spawnVehicle() {
        try {
            // Определение начальной позиции и направления
            const spawnPoints = {
                north: { x: 0, z: 100, direction: 'south' },
                south: { x: 0, z: -100, direction: 'north' },
                east: { x: -100, z: 0, direction: 'west' },
                west: { x: 100, z: 0, direction: 'east' }
            };
            
            const directions = Object.keys(spawnPoints);
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const spawnPoint = spawnPoints[direction];
            
            // Создание модели транспортного средства
            const vehicleMesh = TrafficModels.createVehicle();
            vehicleMesh.position.set(spawnPoint.x, 0, spawnPoint.z);
            
            // Поворот в соответствии с направлением движения
            const rotations = {
                north: 0,
                south: Math.PI,
                east: Math.PI/2,
                west: -Math.PI/2
            };
            vehicleMesh.rotation.y = rotations[spawnPoint.direction];
            
            // Добавление на сцену
            this.scene3D.addObject(vehicleMesh);
            
            // Определение полосы движения
            const lane = Math.floor(Math.random() * 2);
            const laneOffset = lane * 12;
            
            // Добавление случайного поворота
            const willTurn = Math.random() < 0.3;
            const turnDirection = Math.random() < 0.5 ? 'left' : 'right';
            
            // Создание объекта транспортного средства
            const vehicle = {
                mesh: vehicleMesh,
                direction: spawnPoint.direction,
                lane: lane,
                turnDirection: willTurn ? turnDirection : null,
                waiting: false,
                maxSpeed: {
                    dx: spawnPoint.direction === 'east' ? 0.5 : 
                        spawnPoint.direction === 'west' ? -0.5 : 0,
                    dy: spawnPoint.direction === 'north' ? -0.5 :
                        spawnPoint.direction === 'south' ? 0.5 : 0
                }
            };
            
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            this.vehicles.push(vehicle);
            
        } catch (error) {
            console.error('Error spawning vehicle:', error);
        }
    }
    
    updateVehicles() {
        this.vehicles = this.vehicles.filter(vehicle => {
            if (!vehicle || !vehicle.mesh) return false;
            
            // Проверка выхода за пределы
            const position = vehicle.mesh.position;
            const isOutOfBounds = 
                Math.abs(position.x) > 150 || 
                Math.abs(position.z) > 150;
            
            if (isOutOfBounds) {
                this.scene3D.removeObject(vehicle.mesh);
                return false;
            }
            
            // Проверка светофоров и коллизий
            if (!vehicle.waiting) {
                this.checkTrafficLights(vehicle);
                this.checkCollisions(vehicle);
            }
            
            // Обновление позиции
            position.x += vehicle.currentSpeed.dx;
            position.z += vehicle.currentSpeed.dy;
            
            return true;
        });
    }
    
    updateTrafficLights() {
        ['north', 'south', 'east', 'west'].forEach(direction => {
            const lightMesh = this[direction + 'Light'];
            if (!lightMesh || !lightMesh.userData.lights) return;
            
            Object.entries(lightMesh.userData.lights).forEach(([state, elements]) => {
                const isActive = this.trafficLights[direction].state === state;
                const targetIntensity = isActive ? 1 : 0.1;
                const targetGlow = isActive ? 2 : 0;
                const targetOpacity = isActive ? 0.3 : 0;
                
                elements.light.material.emissiveIntensity += 
                    (targetIntensity - elements.light.material.emissiveIntensity) * 0.1;
                elements.glow.intensity += 
                    (targetGlow - elements.glow.intensity) * 0.1;
                elements.glowSphere.material.opacity += 
                    (targetOpacity - elements.glowSphere.material.opacity) * 0.1;
            });
        });
    }
    
    updateTurnSignals() {
        if (!this.vehicles) return;
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.mesh || !vehicle.mesh.userData.turnSignals) return;
            
            const signals = vehicle.mesh.userData.turnSignals;
            if (vehicle.turnDirection) {
                const signal = signals[vehicle.turnDirection];
                if (signal) {
                    signal.material.emissiveIntensity = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
                }
            } else {
                Object.values(signals).forEach(signal => {
                    if (signal) {
                        signal.material.emissiveIntensity = 0;
                    }
                });
            }
        });
    }
    
    checkTrafficLights(vehicle) {
        const STOP_LINE = 15;
        const INTERSECTION_ZONE = 10;
        const SLOW_DOWN_DISTANCE = 30;
        
        const position = vehicle.mesh.position;
        const inIntersection = Math.abs(position.x) < INTERSECTION_ZONE && 
                              Math.abs(position.z) < INTERSECTION_ZONE;
        
        if (inIntersection) {
            vehicle.waiting = false;
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            return;
        }
        
        const distanceToStopLine = Math.abs(
            vehicle.direction === 'north' || vehicle.direction === 'south' 
                ? position.z - Math.sign(position.z) * STOP_LINE
                : position.x - Math.sign(position.x) * STOP_LINE
        );
        
        const lightState = this.trafficLights[vehicle.direction].state;
        
        if (lightState === 'red' && distanceToStopLine > 0) {
            const slowDownFactor = Math.min(1, distanceToStopLine / SLOW_DOWN_DISTANCE);
            vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * slowDownFactor;
            vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * slowDownFactor;
            
            if (distanceToStopLine < 1) {
                vehicle.waiting = true;
                vehicle.currentSpeed.dx = 0;
                vehicle.currentSpeed.dy = 0;
            }
        } else if (lightState === 'green') {
            vehicle.waiting = false;
            const acceleration = 0.1;
            vehicle.currentSpeed.dx += (vehicle.maxSpeed.dx - vehicle.currentSpeed.dx) * acceleration;
            vehicle.currentSpeed.dy += (vehicle.maxSpeed.dy - vehicle.currentSpeed.dy) * acceleration;
        }
    }
    
    isInSamePath(vehicle1, vehicle2) {
        return vehicle1.direction === vehicle2.direction && vehicle1.lane === vehicle2.lane;
    }
    
    checkCollisions(vehicle) {
        const SAFE_DISTANCE = 45;
        const SLOW_DISTANCE = 60;
        const VERY_SLOW_DISTANCE = 80;
        
        let shouldStop = false;
        let shouldSlow = false;
        
        this.vehicles.forEach(other => {
            if (other === vehicle) return;
            
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            
            const isAhead = (
                (vehicle.direction === 'north' && other.mesh.position.z < vehicle.mesh.position.z) ||
                (vehicle.direction === 'south' && other.mesh.position.z > vehicle.mesh.position.z) ||
                (vehicle.direction === 'east' && other.mesh.position.x > vehicle.mesh.position.x) ||
                (vehicle.direction === 'west' && other.mesh.position.x < vehicle.mesh.position.x)
            );
            
            if (isAhead && this.isInSamePath(vehicle, other)) {
                if (distance < SAFE_DISTANCE) {
                    shouldStop = true;
                } else if (distance < SLOW_DISTANCE) {
                    shouldSlow = true;
                } else if (distance < VERY_SLOW_DISTANCE) {
                    vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * 0.7;
                    vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * 0.7;
                }
            }
        });
        
        if (shouldStop) {
            vehicle.currentSpeed.dx = 0;
            vehicle.currentSpeed.dy = 0;
        } else if (shouldSlow) {
            vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * 0.3;
            vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * 0.3;
        }
    }
    
    startSimulation() {
        // Периодическое создание транспортных средств
        setInterval(() => {
            if (this.vehicles.length < 20) {
                this.spawnVehicle();
            }
        }, 3000);
        
        // Основной цикл обновления
        const animate = () => {
            requestAnimationFrame(animate);
            this.updateVehicles();
            this.updateTrafficLights();
            this.updateTurnSignals();
        };
        
        animate();
        
        // Получение данных о трафике
        setInterval(async () => {
            try {
                const response = await fetch('/api/camera-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        camera_id: 'main'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.updateStats(data);
                }
            } catch (error) {
                console.error('Error fetching traffic data:', error);
            }
        }, 1000);
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        try {
            window.simulation = new TrafficSimulation();
            console.log('Simulation initialized successfully');
        } catch (error) {
            console.error('Error initializing simulation:', error);
        }
    }, 1000);
});
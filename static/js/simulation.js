class TrafficSimulation {
    constructor() {
        this.scene = new Scene3D(document.getElementById('scene3d'));
        this.vehicles = [];
        this.pedestrians = [];
        this.trafficLights = {
            north: { state: 'red' },
            south: { state: 'red' },
            east: { state: 'green' },
            west: { state: 'green' }
        };
        
        this.setupScene();
        this.startCameraUpdates();
    }
    
    setupScene() {
        // Добавляем дорогу
        const road = TrafficModels.createRoad();
        this.scene.addObject(road);
        
        // Добавляем светофоры
        ['north', 'south', 'east', 'west'].forEach(direction => {
            const light = TrafficModels.createTrafficLight(direction);
            const position = this.getTrafficLightPosition(direction);
            light.position.set(position.x, position.y, position.z);
            light.rotation.y = position.rotation;
            this.scene.addObject(light);
            this[direction + 'Light'] = light;
        });
        
        // Запускаем симуляцию
        this.startSimulation();
    }
    
    getTrafficLightPosition(direction) {
        const positions = {
            north: { x: 0, y: 0, z: -20, rotation: 0 },
            south: { x: 0, y: 0, z: 20, rotation: Math.PI },
            east: { x: 20, y: 0, z: 0, rotation: -Math.PI / 2 },
            west: { x: -20, y: 0, z: 0, rotation: Math.PI / 2 }
        };
        return positions[direction];
    }
    
    startCameraUpdates() {
        // Запускаем периодическое обновление данных с камер
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
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format received');
            }
            
            this.updateTrafficData(data);
            if (window.controller) {
                window.controller.updateTrafficLights(data);
            }
        } catch (error) {
            console.error('Error fetching camera data:', error);
            // Используем последние известные данные
            const fallbackData = {
                ns: { count: 3, waiting: 1, avgSpeed: 0.6 },
                ew: { count: 3, waiting: 1, avgSpeed: 0.6 }
            };
            this.updateTrafficData(fallbackData);
            if (window.controller) {
                window.controller.updateTrafficLights(fallbackData);
            }
        }
    }

    updateTrafficData(data) {
        // Update traffic statistics
        const nsData = data.ns;
        const ewData = data.ew;
        
        // Update queue lengths
        document.getElementById('ns-queue').textContent = nsData.waiting;
        document.getElementById('ew-queue').textContent = ewData.waiting;
        
        // Update speeds
        document.getElementById('ns-speed').textContent = 
            Math.round(nsData.avgSpeed * 50) + ' км/ч';
        document.getElementById('ew-speed').textContent = 
            Math.round(ewData.avgSpeed * 50) + ' км/ч';
            
        // Update intersection info if available
        if (data.intersection_name) {
            document.getElementById('intersection-name').textContent = data.intersection_name;
        }
        if (data.cameras) {
            if (data.cameras.ns) {
                document.getElementById('camera-ip-ns').textContent = data.cameras.ns.ip;
            }
            if (data.cameras.ew) {
                document.getElementById('camera-ip-ew').textContent = data.cameras.ew.ip;
            }
        }
    }
    
    updateVehicle(vehicle) {
        // Обновление поворотников
        const leftSignal = vehicle.mesh.children.find(child => 
            child.userData.isLeft === true);
        const rightSignal = vehicle.mesh.children.find(child => 
            child.userData.isLeft === false);
            
        if (vehicle.turning === 'left' && leftSignal) {
            leftSignal.material.emissiveIntensity = 
                Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
        } else if (vehicle.turning === 'right' && rightSignal) {
            rightSignal.material.emissiveIntensity = 
                Math.sin(Date.now() * 0.01) > 0 ? 1 : 0;
        }
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
            if (!lightMesh || !lightMesh.userData.lights) return;
            
            // Обновляем состояние каждого сигнала с анимацией
            Object.entries(lightMesh.userData.lights).forEach(([state, elements]) => {
                const isActive = this.trafficLights[direction].state === state;
                const targetIntensity = isActive ? 1 : 0.1;
                const targetGlow = isActive ? 2 : 0;
                const targetOpacity = isActive ? 0.3 : 0;
                
                // Плавное изменение интенсивности
                elements.light.material.emissiveIntensity += 
                    (targetIntensity - elements.light.material.emissiveIntensity) * 0.1;
                elements.glow.intensity += 
                    (targetGlow - elements.glow.intensity) * 0.1;
                elements.glowSphere.material.opacity += 
                    (targetOpacity - elements.glowSphere.material.opacity) * 0.1;
            });
        });
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
                this.scene.removeObject(vehicle.mesh);
                return false;
            }
            return true;
        });
        
        requestAnimationFrame(() => this.animate());
        this.scene.render();
    }

    spawnVehicle(forcedDirection = null) {
        if (!this.running) return;

        const directions = ['north', 'south', 'east', 'west'];
        const direction = forcedDirection || directions[Math.floor(Math.random() * directions.length)];
        
        // Изменение расстояния между полосами и их положения
        const lane = Math.floor(Math.random() * 2);
        const laneOffset = lane * 12; // Увеличенное расстояние между полосами
        
        // Добавляем случайный поворот
        const willTurn = Math.random() < 0.3; // 30% шанс поворота
        const turnDirection = Math.random() < 0.5 ? 'left' : 'right';
        
        const vehicle = {
            mesh: TrafficModels.createVehicle(),
            direction: direction,
            lane: lane,
            waiting: false,
            currentSpeed: { dx: 0, dy: 0 },
            maxSpeed: { dx: 0, dy: 0 }
        };

        // Корректное позиционирование машин по полосам
        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(-15 + (lane * 10), 2, 150); // Четкое разделение на полосы
                vehicle.mesh.rotation.y = Math.PI;
                vehicle.maxSpeed = { dx: 0, dy: -0.5 };
                break;
            case 'south':
                vehicle.mesh.position.set(15 - (lane * 10), 2, -150);
                vehicle.maxSpeed = { dx: 0, dy: 0.5 };
                break;
            case 'east':
                vehicle.mesh.position.set(-150, 2, -15 + (lane * 10));
                vehicle.mesh.rotation.y = Math.PI / 2;
                vehicle.maxSpeed = { dx: 0.5, dy: 0 };
                break;
            case 'west':
                vehicle.mesh.position.set(150, 2, 15 - (lane * 10));
                vehicle.mesh.rotation.y = -Math.PI / 2;
                vehicle.maxSpeed = { dx: -0.5, dy: 0 };
                break;
        }

        // Увеличение безопасной дистанции при спавне
        const isSafeToSpawn = !this.vehicles.some(other => {
            if (other.direction !== direction || other.lane !== lane) return false;
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            return distance < 30; // Увеличенная безопасная дистанция
        });

        if (isSafeToSpawn) {
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            this.scene.addObject(vehicle.mesh);
            this.vehicles.push(vehicle);
        }
    }

    checkTrafficLights(vehicle) {
        const STOP_LINE = 15;
        const INTERSECTION_ZONE = 10;
        
        const position = vehicle.mesh.position;
        const inIntersection = Math.abs(position.x) < INTERSECTION_ZONE && 
                              Math.abs(position.z) < INTERSECTION_ZONE;
        
        // Если машина уже в перекрестке - она продолжает движение без остановки
        if (inIntersection) {
            vehicle.waiting = false;
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            return;
        }
        
        const beforeStopLine = 
            (vehicle.direction === 'north' && position.z > STOP_LINE) ||
            (vehicle.direction === 'south' && position.z < -STOP_LINE) ||
            (vehicle.direction === 'east' && position.x < -STOP_LINE) ||
            (vehicle.direction === 'west' && position.x > STOP_LINE);
        
        if (beforeStopLine) {
            const lightState = this.trafficLights[vehicle.direction].state;
            if (lightState === 'red') {
                vehicle.waiting = true;
                vehicle.currentSpeed.dx = 0;
                vehicle.currentSpeed.dy = 0;
            } else {
                vehicle.waiting = false;
                vehicle.currentSpeed = {...vehicle.maxSpeed};
            }
        }
    }

    isInSamePath(vehicle1, vehicle2) {
        return vehicle1.direction === vehicle2.direction && vehicle1.lane === vehicle2.lane;
    }

    checkCollisions(vehicle) {
        const SAFE_DISTANCE = 45;
        const SLOW_DISTANCE = 60;
        const INTERSECTION_ZONE = 10;
        
        // Проверяем, находится ли машина в зоне перекрестка
        const inIntersection = Math.abs(vehicle.mesh.position.x) < INTERSECTION_ZONE && 
                              Math.abs(vehicle.mesh.position.z) < INTERSECTION_ZONE;
        
        if (inIntersection) {
            // В перекрестке всегда движемся, если есть разрешающий сигнал
            return;
        }
        
        // Проверка коллизий с другими машинами
        this.vehicles.forEach(other => {
            if (other === vehicle) return;
            
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            
            // Учитываем направление движения и повороты
            if (this.isInSamePath(vehicle, other) && distance < SAFE_DISTANCE) {
                vehicle.currentSpeed.dx = 0;
                vehicle.currentSpeed.dy = 0;
            } else if (distance < SLOW_DISTANCE) {
                vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * 0.5;
                vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * 0.5;
            }
        });
    }

    
    fetchIntersectionInfo() {
        try {
            const response = await fetch('/api/intersection-info');
            const data = await response.json();
            
            document.getElementById('intersection-name').textContent = data.name;
            document.getElementById('camera-ip-ns').textContent = data.cameras.ns.ip;
            document.getElementById('camera-ip-ew').textContent = data.cameras.ew.ip;
        } catch (error) {
            console.error('Error fetching intersection info:', error);
        }
    }

}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
});
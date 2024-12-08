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
            east: { state: 'green' },
            west: { state: 'green' }
        };

        // Create base scene
        this.initializeScene();
        this.setupTrafficLightClicks();
        this.startSimulation();
        
        // Start periodic data updates
        this.fetchIntersectionInfo();
        setInterval(() => this.fetchCameraData(), 2000);
    }
    
    async fetchIntersectionInfo() {
        try {
            const response = await fetch('/api/intersection-info');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            document.getElementById('intersection-name').textContent = data.name;
            document.getElementById('camera-ip-ns').textContent = data.cameras.ns.ip;
            document.getElementById('camera-ip-ew').textContent = data.cameras.ew.ip;
        } catch (error) {
            console.error('Error fetching intersection info:', error);
        }
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
            this.updateTrafficData(data);
            
            // Update vehicle spawning based on traffic data
            this.updateVehiclesFromCamera(data);
            
            // Update traffic lights based on data
            if (window.controller) {
                window.controller.updateTrafficLights(data);
            }
        } catch (error) {
            console.error('Error fetching camera data:', error);
        }
    }

    updateTrafficData(data) {
        // Update UI with traffic data
        document.getElementById('ns-queue').textContent = data.ns.waiting;
        document.getElementById('ew-queue').textContent = data.ew.waiting;
        document.getElementById('ns-speed').textContent = 
            Math.round(data.ns.avgSpeed * 50) + ' км/ч';
        document.getElementById('ew-speed').textContent = 
            Math.round(data.ew.avgSpeed * 50) + ' км/ч';
    }

    setupTrafficLightClicks() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        document.getElementById('scene3d').addEventListener('click', (event) => {
            const rect = event.target.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.scene3D.camera);
            const intersects = raycaster.intersectObjects(this.scene3D.scene.children, true);
            
            for (const intersect of intersects) {
                let trafficLight = intersect.object;
                while (trafficLight && !trafficLight.userData.direction) {
                    trafficLight = trafficLight.parent;
                }
                
                if (trafficLight && trafficLight.userData.direction) {
                    this.handleTrafficLightClick(trafficLight.userData.direction);
                    break;
                }
            }
        });
    }

    handleTrafficLightClick(direction) {
        const dialog = document.getElementById('trafficLightDialog');
        dialog.style.display = 'block';
        
        window.changeTrafficLight = (newState) => {
            const nsGroup = ['north', 'south'];
            const ewGroup = ['east', 'west'];
            const isNS = nsGroup.includes(direction);
            const currentGroup = isNS ? nsGroup : ewGroup;
            const oppositeGroup = isNS ? ewGroup : nsGroup;
            
            currentGroup.forEach(dir => {
                this.trafficLights[dir].state = newState;
            });
            
            if (newState === 'green') {
                oppositeGroup.forEach(dir => {
                    this.trafficLights[dir].state = 'red';
                });
            } else if (newState === 'red') {
                oppositeGroup.forEach(dir => {
                    this.trafficLights[dir].state = 'green';
                });
            }
            
            dialog.style.display = 'none';
        };
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
            { direction: 'north', x: -20, z: 20, rotation: Math.PI },
            { direction: 'south', x: 20, z: -20, rotation: 0 },
            { direction: 'east', x: 20, z: 20, rotation: Math.PI / 2 },
            { direction: 'west', x: -20, z: -20, rotation: -Math.PI / 2 }
        ];
        
        positions.forEach(pos => {
            const light = TrafficModels.createTrafficLight(pos.direction);
            light.position.set(pos.x, 0, pos.z);
            light.rotation.y = pos.rotation;
            this[pos.direction + 'Light'] = light;
            this.scene3D.addObject(light);
        });
    }

    setupSpawnInterval() {
        let lastSpawnTime = Date.now();
        const MIN_SPAWN_INTERVAL = 8000; // Увеличен интервал между появлением машин
        
        setInterval(() => {
            if (!this.running) return;
            if (this.vehicles.length >= 10) return;
            
            const currentTime = Date.now();
            if (currentTime - lastSpawnTime < MIN_SPAWN_INTERVAL) return;
            
            const spawnCount = Math.random() < 0.9 ? 1 : 2; // 90% шанс спавна одной машины
            const directions = ['north', 'south', 'east', 'west'];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            
            // Добавляем случайную задержку от 2 до 4 секунд
            const randomDelay = 2000 + Math.random() * 2000;
            
            for (let i = 0; i < spawnCount; i++) {
                setTimeout(() => {
                    const willTurn = Math.random() < 0.3;
                    const turnDirection = Math.random() < 0.5 ? 'left' : 'right';
                    this.spawnVehicle(direction, willTurn ? turnDirection : null);
                }, i * 4000 + randomDelay); // Увеличен интервал между машинами до 4 секунд
            }
            
            lastSpawnTime = currentTime + Math.random() * 3000;
        }, 1000);
    }

    animate() {
        if (!this.running) return;
        
        this.vehicles.forEach(vehicle => {
            if (!vehicle.waiting) {
                this.checkTrafficLights(vehicle);
                
                if (!vehicle.waiting) {
                    vehicle.updatePosition();
                    this.checkCollisions(vehicle);
                }
            } else {
                this.checkTrafficLights(vehicle);
            }
        });
        
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

    spawnVehicle(direction, turnDirection) {
        if (!this.running) return;

        const lane = Math.floor(Math.random() * 2);
        const laneOffset = lane * 12;
        
        const vehicle = new Vehicle(direction, turnDirection);
        vehicle.lane = lane;

        switch(direction) {
            case 'north':
                vehicle.mesh.position.set(-15 + (lane * 10), 2, 150);
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

        const isSafeToSpawn = !this.vehicles.some(other => {
            if (other.direction !== direction || other.lane !== lane) return false;
            const distance = Math.sqrt(
                Math.pow(vehicle.mesh.position.x - other.mesh.position.x, 2) +
                Math.pow(vehicle.mesh.position.z - other.mesh.position.z, 2)
            );
            return distance < 30;
        });

        if (isSafeToSpawn) {
            vehicle.currentSpeed = {...vehicle.maxSpeed};
            this.scene3D.addObject(vehicle.mesh);
            this.vehicles.push(vehicle);
        }
    }

    checkTrafficLights(vehicle) {
        const STOP_LINE = 35;
        const INTERSECTION_ZONE = 10;
        const SLOW_DOWN_DISTANCE = 60;
        
        const position = vehicle.mesh.position;
        const inIntersection = Math.abs(position.x) < INTERSECTION_ZONE && 
                              Math.abs(position.z) < INTERSECTION_ZONE;
        
        // Если машина уже в зоне перекрестка и едет на зеленый, позволяем закончить маневр
        if (inIntersection && 
            this.trafficLights[vehicle.direction].state === 'green' &&
            vehicle.currentSpeed.dx !== 0 || 
            vehicle.currentSpeed.dy !== 0) {
            return;
        }
        
        const beforeStopLine = 
            (vehicle.direction === 'north' && position.z > STOP_LINE) ||
            (vehicle.direction === 'south' && position.z < -STOP_LINE) ||
            (vehicle.direction === 'east' && position.x < -STOP_LINE) ||
            (vehicle.direction === 'west' && position.x > STOP_LINE);
        
        if (beforeStopLine || inIntersection) {
            const lightState = this.trafficLights[vehicle.direction].state;
            if (lightState === 'red' || lightState === 'yellow') {
                vehicle.waiting = true;
                vehicle.currentSpeed.dx = 0;
                vehicle.currentSpeed.dy = 0;
            } else {
                vehicle.waiting = false;
                vehicle.currentSpeed = {...vehicle.maxSpeed};
            }
        }
    }

    checkCollisions(vehicle) {
        const SAFE_DISTANCE = 80; // Увеличено безопасное расстояние
        const SLOW_DISTANCE = 120; // Увеличена зона замедления
        const INTERSECTION_ZONE = 15;
        
        const inIntersection = Math.abs(vehicle.mesh.position.x) < INTERSECTION_ZONE && 
                              Math.abs(vehicle.mesh.position.z) < INTERSECTION_ZONE;
        
        if (inIntersection) return;
        
        this.vehicles.forEach(other => {
            if (other === vehicle) return;
            
            if (other.direction === vehicle.direction && other.lane === vehicle.lane) {
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
                
                if (isAhead) {
                    if (distance < SAFE_DISTANCE) {
                        // Полная остановка при малом расстоянии
                        vehicle.currentSpeed.dx = 0;
                        vehicle.currentSpeed.dy = 0;
                        vehicle.waiting = true;
                    } else if (distance < SLOW_DISTANCE) {
                        // Плавное замедление
                        const slowDownFactor = Math.pow((distance - SAFE_DISTANCE) / (SLOW_DISTANCE - SAFE_DISTANCE), 2);
                        vehicle.currentSpeed.dx = vehicle.maxSpeed.dx * slowDownFactor;
                        vehicle.currentSpeed.dy = vehicle.maxSpeed.dy * slowDownFactor;
                        vehicle.waiting = false;
                    } else {
                        vehicle.waiting = false;
                    }
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
                avgSpeed: nsVehicles.reduce((sum, v) => 
                    sum + Math.abs(v.currentSpeed.dy), 0) / Math.max(nsVehicles.length, 1)
            },
            ew: {
                count: ewVehicles.length,
                waiting: ewVehicles.filter(v => v.waiting).length,
                avgSpeed: ewVehicles.reduce((sum, v) => 
                    sum + Math.abs(v.currentSpeed.dx), 0) / Math.max(ewVehicles.length, 1)
            }
        };
    }

    updateTrafficLights() {
        Object.keys(this.trafficLights).forEach(direction => {
            const lightMesh = this[direction + 'Light'];
            if (!lightMesh || !lightMesh.userData.lights) return;
            
            // Выключаем все сигналы сначала
            Object.values(lightMesh.userData.lights).forEach(elements => {
                elements.light.material.emissiveIntensity = 0;
                elements.glow.intensity = 0;
                elements.glowSphere.material.opacity = 0;
            });
            
            // Включаем только активный сигнал
            const currentState = this.trafficLights[direction].state;
            const activeElements = lightMesh.userData.lights[currentState];
            if (activeElements) {
                activeElements.light.material.emissiveIntensity = 1;
                activeElements.glow.intensity = 2;
                activeElements.glowSphere.material.opacity = 0.3;
            }
        });
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    window.simulation = new TrafficSimulation();
});
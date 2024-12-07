class TrafficSimulation {
    constructor(canvas) {
        console.log('Initializing TrafficSimulation...');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vehicles = [];
        this.trafficLights = {
            north: { state: 'red', timer: 0 },
            south: { state: 'red', timer: 0 },
            east: { state: 'red', timer: 0 },
            west: { state: 'red', timer: 0 }
        };
        this.running = true;
        
        // Intersection coordinates
        this.intersection = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 60,
            height: 60
        };
        
        this.spawnInterval = setInterval(() => this.spawnVehicle(), 500); // каждые 500мс
        console.log('TrafficSimulation initialized successfully');
        this.animate();
    }

    spawnVehicle() {
        if (!this.running) return;
        
        const directions = ['north', 'south', 'east', 'west'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        let x, y, dx, dy;
        switch(direction) {
            case 'north':
                x = this.intersection.x - 15;
                y = this.canvas.height;
                dx = 0;
                dy = -2; // Уменьшена скорость
                break;
            case 'south':
                x = this.intersection.x + 15;
                y = 0;
                dx = 0;
                dy = 2;  // Уменьшена скорость
                break;
            case 'east':
                x = 0;
                y = this.intersection.y - 15;
                dx = 2;  // Уменьшена скорость
                dy = 0;
                break;
            case 'west':
                x = this.canvas.width;
                y = this.intersection.y + 15;
                dx = -2; // Уменьшена скорость
                dy = 0;
                break;
        }
        console.log(`Spawning vehicle: direction=${direction}, position=(${x},${y}), speed=(${dx},${dy})`);

        this.vehicles.push({
            x, y, 
            dx, dy,
            maxSpeed: { dx: dx, dy: dy },
            currentSpeed: { dx: dx, dy: dy },
            direction,
            width: 20,
            height: 30,
            waiting: false,
            blocked: false
        });
    }

    drawRoad() {
        this.ctx.fillStyle = '#333';
        // Vertical road
        this.ctx.fillRect(
            this.intersection.x - 30,
            0,
            60,
            this.canvas.height
        );
        // Horizontal road
        this.ctx.fillRect(
            0,
            this.intersection.y - 30,
            this.canvas.width,
            60
        );
    }

    drawTrafficLights() {
        // Draw traffic lights for each direction
        const lights = [
            { light: this.trafficLights.north, x: this.intersection.x - 40, y: this.intersection.y - 40 },
            { light: this.trafficLights.south, x: this.intersection.x + 30, y: this.intersection.y + 30 },
            { light: this.trafficLights.east, x: this.intersection.x + 30, y: this.intersection.y - 40 },
            { light: this.trafficLights.west, x: this.intersection.x - 40, y: this.intersection.y + 30 }
        ];

        lights.forEach(({ light, x, y }) => {
            this.ctx.fillStyle = light.state === 'yellow' ? '#ffff00' : 
                                light.state === 'green' ? '#00ff00' : '#ff0000';
            this.ctx.fillRect(x, y, 10, 10);
        });
    }

    drawVehicles() {
        this.vehicles.forEach(vehicle => {
            this.ctx.fillStyle = '#4488ff';
            this.ctx.fillRect(
                vehicle.x - vehicle.width/2,
                vehicle.y - vehicle.height/2,
                vehicle.width,
                vehicle.height
            );
        });
    }

    updateVehicles() {
        const SAFE_DISTANCE = 80; // Увеличиваем безопасную дистанцию
        const BRAKE_DISTANCE = 100; // Дистанция начала торможения
        const MINIMUM_GAP = 40; // Минимальный промежуток между машинами
        const MAX_SPEED = 60;  // максимальная скорость
        const MIN_SPEED = 0;   // минимальная скорость
        const ACCELERATION_RATE = 0.2;  // Уменьшить для более плавного ускорения
        const STOP_LINE_DISTANCE = 50; // Distance to stop line before intersection
        const DECISION_ZONE = 80; // Зона принятия решения на желтый
        const YELLOW_SPEED_THRESHOLD = 1.5; // Минимальная скорость для проезда на желтый

        // Функция проверки дистанции до ближайшей машины впереди
        const getDistanceToNextVehicle = (vehicle, vehicles) => {
            let minDistance = Infinity;
            vehicles.forEach(other => {
                if (other === vehicle || other.direction !== vehicle.direction) return;
                
                let distance;
                if (vehicle.direction === 'north' || vehicle.direction === 'south') {
                    if (vehicle.direction === 'north' && other.y < vehicle.y) {
                        distance = vehicle.y - other.y;
                    } else if (vehicle.direction === 'south' && other.y > vehicle.y) {
                        distance = other.y - vehicle.y;
                    }
                } else {
                    if (vehicle.direction === 'east' && other.x > vehicle.x) {
                        distance = other.x - vehicle.x;
                    } else if (vehicle.direction === 'west' && other.x < vehicle.x) {
                        distance = vehicle.x - other.x;
                    }
                }
                if (distance > 0 && distance < minDistance) {
                    minDistance = distance;
                }
            });
            return minDistance;
        };

        const INTERSECTION_ZONE = {
            x1: this.intersection.x - 30,
            x2: this.intersection.x + 30,
            y1: this.intersection.y - 30,
            y2: this.intersection.y + 30
        };

        // Функция проверки, находится ли машина в зоне перекрестка
        const inIntersectionZone = vehicle => (
            vehicle.x > INTERSECTION_ZONE.x1 &&
            vehicle.x < INTERSECTION_ZONE.x2 &&
            vehicle.y > INTERSECTION_ZONE.y1 &&
            vehicle.y < INTERSECTION_ZONE.y2
        );

        // Функция проверки, есть ли место для выезда с перекрестка
        const hasExitSpace = vehicle => {
            const ahead = this.vehicles.find(v => {
                if (v === vehicle) return false;
                switch(vehicle.direction) {
                    case 'north':
                        return v.direction === 'north' && 
                               v.y < vehicle.y && 
                               v.y > INTERSECTION_ZONE.y1 - 50;
                    case 'south':
                        return v.direction === 'south' && 
                               v.y > vehicle.y && 
                               v.y < INTERSECTION_ZONE.y2 + 50;
                    case 'east':
                        return v.direction === 'east' && 
                               v.x > vehicle.x && 
                               v.x < INTERSECTION_ZONE.x2 + 50;
                    case 'west':
                        return v.direction === 'west' && 
                               v.x < vehicle.x && 
                               v.x > INTERSECTION_ZONE.x1 - 50;
                }
            });
            return !ahead;
        };

        const atIntersection = vehicle => (
            vehicle.y > this.intersection.y - 30 &&
            vehicle.y < this.intersection.y + 30 &&
            vehicle.x > this.intersection.x - 30 &&
            vehicle.x < this.intersection.x + 30
        );

        const isVertical = vehicle => vehicle.direction === 'north' || vehicle.direction === 'south';
        const distanceToIntersection = vehicle => isVertical(vehicle) ? 
            Math.abs(vehicle.y - this.intersection.y) :
            Math.abs(vehicle.x - this.intersection.x);

        const accelerateVehicle = (current, max, accelerationRate) => {
            if (current < max) {
                return Math.min(current + accelerationRate, max);
            }
            return current;
        };

        this.vehicles = this.vehicles.filter(vehicle => {
            const distanceToNext = getDistanceToNextVehicle(vehicle, this.vehicles);
            
            // Если дистанция меньше безопасной - начинаем тормозить
            if (distanceToNext < BRAKE_DISTANCE) {
                const brakingFactor = Math.max(0, (distanceToNext - MINIMUM_GAP) / (BRAKE_DISTANCE - MINIMUM_GAP));
                vehicle.currentSpeed.dx *= brakingFactor;
                vehicle.currentSpeed.dy *= brakingFactor;
                
                // Если слишком близко - полностью останавливаемся
                if (distanceToNext < MINIMUM_GAP) {
                    vehicle.currentSpeed.dx = 0;
                    vehicle.currentSpeed.dy = 0;
                    vehicle.waiting = true;
                }
            }
            
            // Плавное ускорение при достаточной дистанции
            if (distanceToNext > SAFE_DISTANCE && vehicle.waiting) {
                vehicle.waiting = false;
                vehicle.currentSpeed.dx = accelerateVehicle(vehicle.currentSpeed.dx, vehicle.maxSpeed.dx, ACCELERATION_RATE);
                vehicle.currentSpeed.dy = accelerateVehicle(vehicle.currentSpeed.dy, vehicle.maxSpeed.dy, ACCELERATION_RATE);
            }

            const isVertical = vehicle.direction === 'north' || vehicle.direction === 'south';
            const canPass = {
                'north': this.trafficLights.north.state === 'green',
                'south': this.trafficLights.south.state === 'green',
                'east': this.trafficLights.east.state === 'green',
                'west': this.trafficLights.west.state === 'green'
            }[vehicle.direction];

            // Check if vehicle is at stop line
            const isAtStopLine = (
                (vehicle.direction === 'north' && Math.abs(vehicle.y - (this.intersection.y + STOP_LINE_DISTANCE)) < 5) ||
                (vehicle.direction === 'south' && Math.abs(vehicle.y - (this.intersection.y - STOP_LINE_DISTANCE)) < 5) ||
                (vehicle.direction === 'east' && Math.abs(vehicle.x - (this.intersection.x - STOP_LINE_DISTANCE)) < 5) ||
                (vehicle.direction === 'west' && Math.abs(vehicle.x - (this.intersection.x + STOP_LINE_DISTANCE)) < 5)
            );

            // Enhanced red light checks
            const isApproachingIntersection = (
                Math.abs(vehicle.y - this.intersection.y) < STOP_LINE_DISTANCE * 1.5 &&
                Math.abs(vehicle.x - this.intersection.x) < STOP_LINE_DISTANCE * 1.5
            );
            
            const isYellowLight = {
                'north': this.trafficLights.north.state === 'yellow',
                'south': this.trafficLights.south.state === 'yellow',
                'east': this.trafficLights.east.state === 'yellow',
                'west': this.trafficLights.west.state === 'yellow'
            }[vehicle.direction];

            const isRedLight = !canPass && isApproachingIntersection;

            // Логика для желтого сигнала
            if (isYellowLight) {
                const distToIntersection = distanceToIntersection(vehicle);
                
                if (inIntersectionZone(vehicle)) {
                    // Если в перекрестке - проезжаем на максимальной скорости
                    vehicle.currentSpeed.dx = vehicle.maxSpeed.dx;
                    vehicle.currentSpeed.dy = vehicle.maxSpeed.dy;
                    return true;
                }
                
                if (distToIntersection < DECISION_ZONE) {
                    const currentSpeed = Math.sqrt(
                        vehicle.currentSpeed.dx ** 2 + 
                        vehicle.currentSpeed.dy ** 2
                    );
                    
                    if (currentSpeed > YELLOW_SPEED_THRESHOLD) {
                        // Продолжаем движение если едем достаточно быстро
                        return true;
                    } else {
                        // Плавно тормозим
                        vehicle.currentSpeed.dx *= 0.95;
                        vehicle.currentSpeed.dy *= 0.95;
                        if (Math.abs(vehicle.currentSpeed.dx) < 0.1) vehicle.currentSpeed.dx = 0;
                        if (Math.abs(vehicle.currentSpeed.dy) < 0.1) vehicle.currentSpeed.dy = 0;
                        return true;
                    }
                }
            }

            // Добавить обработку красного сигнала
            if (isRedLight) {
                if (distanceToIntersection(vehicle) < STOP_LINE_DISTANCE && !atIntersection) {
                    vehicle.currentSpeed.dx = 0;
                    vehicle.currentSpeed.dy = 0;
                    vehicle.waiting = true;
                    return true;
                }
            }

            // Плавное ускорение при зеленом свете
            if (canPass && vehicle.currentSpeed.dx === 0 && vehicle.currentSpeed.dy === 0) {
                vehicle.currentSpeed.dx = accelerateVehicle(vehicle.currentSpeed.dx, vehicle.maxSpeed.dx, ACCELERATION_RATE);
                vehicle.currentSpeed.dy = accelerateVehicle(vehicle.currentSpeed.dy, vehicle.maxSpeed.dy, ACCELERATION_RATE);
            } else if (vehicle.currentSpeed.dx === 0 && vehicle.currentSpeed.dy === 0 && canPass) {
                vehicle.currentSpeed.dx = accelerateVehicle(vehicle.currentSpeed.dx, vehicle.maxSpeed.dx, ACCELERATION_RATE);
                vehicle.currentSpeed.dy = accelerateVehicle(vehicle.currentSpeed.dy, vehicle.maxSpeed.dy, ACCELERATION_RATE);
            }

            if (canPass) {
                // Если машина приближается к перекрестку
                if (!inIntersectionZone(vehicle)) {
                    // Проверяем, можно ли въехать на перекресток
                    if (hasExitSpace(vehicle)) {
                        vehicle.currentSpeed.dx = vehicle.maxSpeed.dx;
                        vehicle.currentSpeed.dy = vehicle.maxSpeed.dy;
                    } else {
                        // Останавливаемся перед перекрестком
                        vehicle.currentSpeed.dx = 0;
                        vehicle.currentSpeed.dy = 0;
                        vehicle.waiting = true;
                    }
                } else {
                    // Если машина уже на перекрестке - продолжает движение
                    vehicle.currentSpeed.dx = vehicle.maxSpeed.dx;
                    vehicle.currentSpeed.dy = vehicle.maxSpeed.dy;
                    vehicle.waiting = false;
                }
            } else if (isYellowLight || isRedLight) {
                // На желтый или красный - останавливаемся перед перекрестком если не в нем
                if (!inIntersectionZone(vehicle) && distanceToIntersection(vehicle) < STOP_LINE_DISTANCE) {
                    vehicle.currentSpeed.dx = 0;
                    vehicle.currentSpeed.dy = 0;
                    vehicle.waiting = true;
                }
            }

            // Обновление позиции
            vehicle.x += vehicle.currentSpeed.dx;
            vehicle.y += vehicle.currentSpeed.dy;

            // Упрощенные условия удаления машин
            return !(
                vehicle.x < -100 ||
                vehicle.x > this.canvas.width + 100 ||
                vehicle.y < -100 ||
                vehicle.y > this.canvas.height + 100
            );
        });
    }

    getTrafficData() {
        const nsVehicles = this.vehicles.filter(v => 
            v.direction === 'north' || v.direction === 'south');
        const ewVehicles = this.vehicles.filter(v => 
            v.direction === 'east' || v.direction === 'west');

        return {
            ns: {
                count: nsVehicles.length,
                waiting: nsVehicles.filter(v => v.waiting).length,
                avgSpeed: nsVehicles.length ? 
                    nsVehicles.reduce((acc, v) => acc + (v.waiting ? 0 : Math.abs(v.dy)), 0) / nsVehicles.length : 0
            },
            ew: {
                count: ewVehicles.length,
                waiting: ewVehicles.filter(v => v.waiting).length,
                avgSpeed: ewVehicles.length ?
                    ewVehicles.reduce((acc, v) => acc + (v.waiting ? 0 : Math.abs(v.dx)), 0) / ewVehicles.length : 0
            }
        };
    }

    animate() {
        if (!this.running) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawRoad();
        this.drawTrafficLights();
        this.updateVehicles();
        this.drawVehicles();

        console.log(`Active vehicles: ${this.vehicles.length}`);
        requestAnimationFrame(() => this.animate());
    }

    toggleSimulation() {
        this.running = !this.running;
        if (this.running) this.animate();
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    const canvas = document.getElementById('simulationCanvas');
    window.simulation = new TrafficSimulation(canvas);

    document.getElementById('toggleSimulation').addEventListener('click', () => {
        window.simulation.toggleSimulation();
    });
});

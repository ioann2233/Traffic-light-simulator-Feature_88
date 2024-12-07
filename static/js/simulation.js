class TrafficSimulation {
    constructor(canvas) {
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
        
        this.spawnInterval = setInterval(() => this.spawnVehicle(), 2000);
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
                dy = -2;
                break;
            case 'south':
                x = this.intersection.x + 15;
                y = 0;
                dx = 0;
                dy = 2;
                break;
            case 'east':
                x = 0;
                y = this.intersection.y - 15;
                dx = 2;
                dy = 0;
                break;
            case 'west':
                x = this.canvas.width;
                y = this.intersection.y + 15;
                dx = -2;
                dy = 0;
                break;
        }

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
        const SAFE_DISTANCE = 30; // Reduced minimum safe distance between vehicles
        const INTERSECTION_CLEARANCE = 40; // Reduced space needed after intersection
        const SPEED_CHANGE_RATE = 0.05; // Reduced rate for smoother speed changes
        const MIN_SPEED_RATIO = 0.2; // Minimum speed as a ratio of max speed

        this.vehicles = this.vehicles.filter(vehicle => {
            const canPass = {
                'north': this.trafficLights.north.state === 'green',
                'south': this.trafficLights.south.state === 'green',
                'east': this.trafficLights.east.state === 'green',
                'west': this.trafficLights.west.state === 'green'
            }[vehicle.direction];

            // Add strict red light check
            const isApproachingIntersection = (
                Math.abs(vehicle.y - this.intersection.y) < 50 &&
                Math.abs(vehicle.x - this.intersection.x) < 50
            );

            // Check if vehicle is at intersection with reduced zone
            const atIntersection = (
                vehicle.y > this.intersection.y - 30 &&
                vehicle.y < this.intersection.y + 30 &&
                vehicle.x > this.intersection.x - 30 &&
                vehicle.x < this.intersection.x + 30
            );

            // Check if vehicle has started crossing the intersection
            const isCrossingIntersection = (
                vehicle.y > this.intersection.y - 15 &&
                vehicle.y < this.intersection.y + 15 &&
                vehicle.x > this.intersection.x - 15 &&
                vehicle.x < this.intersection.x + 15
            );

            // Check for vehicles ahead and maintain safe distance
            let shouldSlow = false;
            let shouldStop = false;
            let nearestVehicleAhead = null;
            let minDistance = Infinity;

            this.vehicles.forEach(otherVehicle => {
                if (vehicle === otherVehicle) return;

                // Only check vehicles in the same direction and same lane
                if (vehicle.direction === otherVehicle.direction) {
                    let distance;
                    let inSameLane = false;
                    
                    if (isVertical) {
                        inSameLane = Math.abs(vehicle.x - otherVehicle.x) < 15; // Stricter same lane check
                        if (inSameLane) {
                            // Only consider vehicles actually ahead
                            if ((vehicle.direction === 'north' && otherVehicle.y < vehicle.y) ||
                                (vehicle.direction === 'south' && otherVehicle.y > vehicle.y)) {
                                distance = Math.abs(vehicle.y - otherVehicle.y);
                            }
                        }
                    } else {
                        inSameLane = Math.abs(vehicle.y - otherVehicle.y) < 15; // Stricter same lane check
                        if (inSameLane) {
                            // Only consider vehicles actually ahead
                            if ((vehicle.direction === 'east' && otherVehicle.x > vehicle.x) ||
                                (vehicle.direction === 'west' && otherVehicle.x < vehicle.x)) {
                                distance = Math.abs(vehicle.x - otherVehicle.x);
                            }
                        }
                    }

                    if (distance !== undefined && distance < minDistance) {
                        minDistance = distance;
                        nearestVehicleAhead = otherVehicle;
                        if (distance < SAFE_DISTANCE * 0.5) { // Critical distance
                            shouldStop = true;
                        } else if (distance < SAFE_DISTANCE) {
                            shouldSlow = true;
                        }
                    }
                }
            });

            // Intersection logic with priority for vehicles already crossing
            // Enhanced red light stopping logic
            if (!canPass && (atIntersection || isApproachingIntersection)) {
                shouldStop = true;
                if (!vehicle.blocked) {
                    vehicle.blocked = true;
                    vehicle.waiting = true;
                }
            } else if (atIntersection && canPass) {
                // Check if there's enough space after intersection
                const spaceAhead = this.vehicles.every(otherVehicle => {
                    if (vehicle === otherVehicle || vehicle.direction !== otherVehicle.direction) return true;
                    
                    const aheadOfIntersection = (
                        (vehicle.direction === 'north' && otherVehicle.y < vehicle.y - INTERSECTION_CLEARANCE) ||
                        (vehicle.direction === 'south' && otherVehicle.y > vehicle.y + INTERSECTION_CLEARANCE) ||
                        (vehicle.direction === 'east' && otherVehicle.x > vehicle.x + INTERSECTION_CLEARANCE) ||
                        (vehicle.direction === 'west' && otherVehicle.x < vehicle.x - INTERSECTION_CLEARANCE)
                    );
                    
                    return aheadOfIntersection;
                });

                if (!spaceAhead && !isCrossingIntersection) {
                    shouldSlow = true;
                }
            }

            // Smooth speed adjustment based on conditions
            const targetSpeedRatio = shouldStop ? MIN_SPEED_RATIO :
                                   shouldSlow ? 0.5 :
                                   1.0;

            // Gradually adjust speed towards target
            const adjustSpeed = (current, max, target) => {
                const targetSpeed = Math.abs(max) * target;
                const currentAbs = Math.abs(current);
                
                if (currentAbs < targetSpeed) {
                    return Math.min(currentAbs + SPEED_CHANGE_RATE, targetSpeed) * Math.sign(max);
                } else {
                    return Math.max(currentAbs - SPEED_CHANGE_RATE, targetSpeed) * Math.sign(max);
                }
            };

            vehicle.currentSpeed.dx = adjustSpeed(vehicle.currentSpeed.dx, vehicle.maxSpeed.dx, targetSpeedRatio);
            vehicle.currentSpeed.dy = adjustSpeed(vehicle.currentSpeed.dy, vehicle.maxSpeed.dy, targetSpeedRatio);

            // Update vehicle state
            vehicle.waiting = shouldStop || shouldSlow;
            vehicle.blocked = shouldStop;

            // Update position
            vehicle.x += vehicle.currentSpeed.dx;
            vehicle.y += vehicle.currentSpeed.dy;

            // Remove vehicles that are off screen
            return !(
                vehicle.x < -50 ||
                vehicle.x > this.canvas.width + 50 ||
                vehicle.y < -50 ||
                vehicle.y > this.canvas.height + 50
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

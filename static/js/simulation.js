class TrafficSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vehicles = [];
        this.trafficLights = {
            ns: { state: 'red', timer: 0 },
            ew: { state: 'green', timer: 0 }
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
        // North-South traffic light
        this.ctx.fillStyle = this.trafficLights.ns.state === 'green' ? '#00ff00' : '#ff0000';
        this.ctx.fillRect(this.intersection.x - 40, this.intersection.y - 40, 10, 10);
        
        // East-West traffic light
        this.ctx.fillStyle = this.trafficLights.ew.state === 'green' ? '#00ff00' : '#ff0000';
        this.ctx.fillRect(this.intersection.x + 30, this.intersection.y - 40, 10, 10);
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
        const SAFE_DISTANCE = 40; // Minimum safe distance between vehicles
        const INTERSECTION_CLEARANCE = 80; // Space needed after intersection
        const SPEED_CHANGE_RATE = 0.1; // Rate of speed change for gradual adjustments

        this.vehicles = this.vehicles.filter(vehicle => {
            const isVertical = vehicle.direction === 'north' || vehicle.direction === 'south';
            const canPass = isVertical ? 
                this.trafficLights.ns.state === 'green' :
                this.trafficLights.ew.state === 'green';

            // Check if vehicle is at intersection
            const atIntersection = (
                vehicle.y > this.intersection.y - 40 &&
                vehicle.y < this.intersection.y + 40 &&
                vehicle.x > this.intersection.x - 40 &&
                vehicle.x < this.intersection.x + 40
            );

            // Check for vehicles ahead and maintain safe distance
            let shouldStop = false;
            let nearestVehicleAhead = null;
            let minDistance = Infinity;

            this.vehicles.forEach(otherVehicle => {
                if (vehicle === otherVehicle) return;

                // Only check vehicles in the same direction
                if (vehicle.direction === otherVehicle.direction) {
                    let distance;
                    if (isVertical) {
                        if (Math.abs(vehicle.x - otherVehicle.x) < 20) { // Same lane
                            distance = vehicle.direction === 'north' ?
                                vehicle.y - otherVehicle.y :
                                otherVehicle.y - vehicle.y;
                        }
                    } else {
                        if (Math.abs(vehicle.y - otherVehicle.y) < 20) { // Same lane
                            distance = vehicle.direction === 'east' ?
                                otherVehicle.x - vehicle.x :
                                vehicle.x - otherVehicle.x;
                        }
                    }

                    if (distance > 0 && distance < minDistance) {
                        minDistance = distance;
                        nearestVehicleAhead = otherVehicle;
                    }
                }
            });

            // Check intersection blocking
            if (atIntersection && !canPass) {
                vehicle.waiting = true;
                vehicle.blocked = true;
                shouldStop = true;
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

                if (!spaceAhead) {
                    vehicle.blocked = true;
                    shouldStop = true;
                }
            }

            // Adjust speed based on conditions
            if (shouldStop || (nearestVehicleAhead && minDistance < SAFE_DISTANCE)) {
                // Gradually decrease speed
                vehicle.currentSpeed.dx = Math.max(0, Math.abs(vehicle.currentSpeed.dx) - SPEED_CHANGE_RATE) * Math.sign(vehicle.maxSpeed.dx);
                vehicle.currentSpeed.dy = Math.max(0, Math.abs(vehicle.currentSpeed.dy) - SPEED_CHANGE_RATE) * Math.sign(vehicle.maxSpeed.dy);
                vehicle.waiting = true;
            } else {
                // Gradually increase speed back to max
                vehicle.currentSpeed.dx = Math.min(Math.abs(vehicle.maxSpeed.dx), Math.abs(vehicle.currentSpeed.dx) + SPEED_CHANGE_RATE) * Math.sign(vehicle.maxSpeed.dx);
                vehicle.currentSpeed.dy = Math.min(Math.abs(vehicle.maxSpeed.dy), Math.abs(vehicle.currentSpeed.dy) + SPEED_CHANGE_RATE) * Math.sign(vehicle.maxSpeed.dy);
                vehicle.waiting = false;
                vehicle.blocked = false;
            }

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

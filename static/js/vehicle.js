class Vehicle {
    constructor(direction, turnDirection) {
        this.mesh = TrafficModels.createVehicle();
        this.direction = direction;
        this.turnDirection = turnDirection;
        this.turnSignals = {
            left: this.createTurnSignal(-2),
            right: this.createTurnSignal(2)
        };
        this.turnSignalInterval = null;
        this.waiting = false;
        this.currentSpeed = { dx: 0, dy: 0 };
        this.maxSpeed = { dx: 0, dy: 0 };
        this.lane = 0;
        this.crossingOnGreen = false; // Флаг для отслеживания въезда на зеленый
        
        if (turnDirection) {
            this.startTurnSignal(turnDirection);
        }
    }
    
    createTurnSignal(offset) {
        const signal = new THREE.PointLight(0xffaa00, 0, 3);
        signal.position.set(offset, 1, -4);
        this.mesh.add(signal);
        return signal;
    }
    
    startTurnSignal(direction) {
        if (this.turnSignalInterval) clearInterval(this.turnSignalInterval);
        this.turnSignalInterval = setInterval(() => {
            const signal = this.turnSignals[direction];
            signal.intensity = signal.intensity > 0 ? 0 : 1;
        }, 500);
    }
    
    stopTurnSignal() {
        if (this.turnSignalInterval) {
            clearInterval(this.turnSignalInterval);
            this.turnSignalInterval = null;
            Object.values(this.turnSignals).forEach(signal => {
                signal.intensity = 0;
            });
        }
    }
    
    updatePosition() {
        const ACCELERATION = 0.02;
        const DECELERATION = 0.03;

        if (!this.waiting) {
            // Плавное ускорение
            this.currentSpeed.dx += (this.maxSpeed.dx - this.currentSpeed.dx) * ACCELERATION;
            this.currentSpeed.dy += (this.maxSpeed.dy - this.currentSpeed.dy) * ACCELERATION;

            let targetRotation = this.mesh.rotation.y;
            const turnRadius = 20;
            
            if (this.turnDirection && Math.abs(this.mesh.position.x) < turnRadius && 
                Math.abs(this.mesh.position.z) < turnRadius) {
                
                // Расчет угла поворота
                if (this.turnDirection === 'right') {
                    targetRotation = this.mesh.rotation.y - Math.PI/2;
                } else {
                    targetRotation = this.mesh.rotation.y + Math.PI/2;
                }
                
                // Плавный поворот
                this.mesh.rotation.y += (targetRotation - this.mesh.rotation.y) * 0.1;
                
                // Движение по дуге с учетом текущей скорости
                const speed = Math.sqrt(this.currentSpeed.dx * this.currentSpeed.dx + 
                                     this.currentSpeed.dy * this.currentSpeed.dy);
                this.mesh.position.x += Math.cos(this.mesh.rotation.y) * speed;
                this.mesh.position.z += Math.sin(this.mesh.rotation.y) * speed;
            } else {
                // Прямолинейное движение
                this.mesh.position.x += this.currentSpeed.dx;
                this.mesh.position.z += this.currentSpeed.dy;
            }
        } else {
            // Плавное торможение
            this.currentSpeed.dx *= (1 - DECELERATION);
            this.currentSpeed.dy *= (1 - DECELERATION);
        }
    }
}

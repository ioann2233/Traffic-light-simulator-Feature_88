class QLearningAgent {
    constructor() {
        this.minGreenTime = 20000;
        this.maxGreenTime = 160000;
        this.yellowTime = 5000;
    }
    
    calculateGreenTime(trafficData) {
        if (!trafficData || !trafficData.ns || !trafficData.ew) {
            return { nsTime: this.minGreenTime, ewTime: this.minGreenTime };
        }
        
        const ns_score = (trafficData.ns.waiting * 2) + (1 / (trafficData.ns.avgSpeed + 0.1));
        const ew_score = (trafficData.ew.waiting * 2) + (1 / (trafficData.ew.avgSpeed + 0.1));
        
        const total_score = ns_score + ew_score;
        if (total_score === 0) {
            return { nsTime: this.minGreenTime, ewTime: this.minGreenTime };
        }
        
        const variable_time = this.maxGreenTime - this.minGreenTime;
        
        const ns_green_time = Math.max(
            this.minGreenTime,
            Math.min(
                this.maxGreenTime,
                this.minGreenTime + (variable_time * (ns_score / total_score))
            )
        );
        
        const ew_green_time = Math.max(
            this.minGreenTime,
            Math.min(
                this.maxGreenTime,
                this.minGreenTime + (variable_time * (ew_score / total_score))
            )
        );
        
        return { nsTime: ns_green_time, ewTime: ew_green_time };
    }
}

class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.rlAgent = new QLearningAgent();
        
        // Запускаем автоматическое управление светофорами
        this.startAutomaticControl();
    }
    
    checkIntersectionClear() {
        const INTERSECTION_ZONE = 15;
        return !this.simulation.vehicles.some(vehicle => 
            Math.abs(vehicle.mesh.position.x) < INTERSECTION_ZONE && 
            Math.abs(vehicle.mesh.position.z) < INTERSECTION_ZONE
        );
    }
    
    startAutomaticControl() {
        this.currentPhase = {
            direction: 'ns',
            state: 'green',
            timeLeft: this.rlAgent.minGreenTime
        };
        
        setInterval(() => {
            const trafficData = this.simulation.getTrafficData();
            
            // Уменьшаем время только если это не желтый сигнал
            if (this.currentPhase.state !== 'yellow') {
                this.currentPhase.timeLeft -= 500;
            }
            
            if (this.currentPhase.timeLeft <= 0) {
                const times = this.rlAgent.calculateGreenTime(trafficData);
                
                if (this.currentPhase.state === 'green') {
                    // Переключаем на желтый
                    this.currentPhase.state = 'yellow';
                    this.currentPhase.timeLeft = 5000;
                    this.animateTransition(this.currentPhase.direction, 'green', 'yellow', 3000);
                } else if (this.currentPhase.state === 'yellow') {
                    // Проверяем, что перекресток пуст
                    if (this.checkIntersectionClear()) {
                        this.currentPhase.state = 'red';
                        this.animateTransition(this.currentPhase.direction, 'yellow', 'red', 3000);
                        
                        // Меняем направление только после того, как все машины проехали
                        setTimeout(() => {
                            this.currentPhase.direction = (this.currentPhase.direction === 'ns') ? 'ew' : 'ns';
                            this.currentPhase.timeLeft = this.currentPhase.direction === 'ns' ? 
                                times.nsTime : times.ewTime;
                            
                            // Включаем зеленый для нового направления
                            this.animateTransition(this.currentPhase.direction, 'red', 'green', 3000);
                            this.currentPhase.state = 'green';
                        }, 3000);
                    } else {
                        // Если перекресток не пуст, добавляем время для желтого сигнала
                        this.currentPhase.timeLeft = 2000;
                    }
                }
            }
            
            this.updateLightIntensities();
        }, 500);
    }
    
    updateLightIntensities() {
        Object.keys(this.simulation.trafficLights).forEach(direction => {
            const lightMesh = this.simulation[direction + 'Light'];
            if (!lightMesh || !lightMesh.userData.lights) return;
            
            // Сначала выключаем все сигналы
            Object.values(lightMesh.userData.lights).forEach(elements => {
                elements.light.material.emissiveIntensity = 0;
                elements.glow.intensity = 0;
                elements.glowSphere.material.opacity = 0;
            });
            
            // Затем включаем активный сигнал с увеличенной яркостью
            const state = this.simulation.trafficLights[direction].state;
            const activeElements = lightMesh.userData.lights[state];
            if (activeElements) {
                activeElements.light.material.emissiveIntensity = 1;
                activeElements.glow.intensity = 8; // Увеличена яркость
                activeElements.glowSphere.material.opacity = 0.6; // Увеличена прозрачность
            }
        });
    }
    
    animateTransition(direction, fromState, toState, duration) {
        const startTime = performance.now();
        const directions = direction === 'ns' ? ['north', 'south'] : ['east', 'west'];
        
        const animate = (currentTime) => {
            const progress = (currentTime - startTime) / duration;
            
            if (progress < 1) {
                directions.forEach(dir => {
                    const lightMesh = this.simulation[dir + 'Light'];
                    if (!lightMesh || !lightMesh.userData.lights) return;
                    
                    const fromElements = lightMesh.userData.lights[fromState];
                    const toElements = lightMesh.userData.lights[toState];
                    
                    if (fromElements && toElements) {
                        // Плавное затухание старого сигнала
                        fromElements.light.material.emissiveIntensity = 1 - progress;
                        fromElements.glow.intensity = 8 * (1 - progress);
                        fromElements.glowSphere.material.opacity = 0.6 * (1 - progress);
                        
                        // Плавное появление нового сигнала
                        toElements.light.material.emissiveIntensity = progress;
                        toElements.glow.intensity = 8 * progress;
                        toElements.glowSphere.material.opacity = 0.6 * progress;
                    }
                });
                
                requestAnimationFrame(animate);
            } else {
                // Установка финальных значений
                directions.forEach(dir => {
                    this.simulation.trafficLights[dir].state = toState;
                });
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize controller when simulation is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        window.controller = new TrafficController(window.simulation);
    }, 1000);
});
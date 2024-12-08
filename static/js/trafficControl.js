class QLearningAgent {
    constructor() {
        this.minGreenTime = 20000; // 20 секунд
        this.maxGreenTime = 160000; // 160 секунд
        this.yellowTime = 5000; // 5 секунд
        this.timeStep = 20000; // Шаг изменения времени
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

    getState(trafficData) {
        // Дискретизация состояния
        const nsWaiting = Math.min(Math.floor(trafficData.ns.waiting / 5), 5);
        const ewWaiting = Math.min(Math.floor(trafficData.ew.waiting / 5), 5);
        return `${nsWaiting}-${ewWaiting}`;
    }
    
    getAction(state) {
        // ε-жадная стратегия
        if (Math.random() < this.epsilon) {
            return this.getRandomAction();
        }
        
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        
        const possibleActions = this.getPossibleActions();
        let bestAction = possibleActions[0];
        let maxQ = this.getQValue(state, bestAction);
        
        possibleActions.forEach(action => {
            const qValue = this.getQValue(state, action);
            if (qValue > maxQ) {
                maxQ = qValue;
                bestAction = action;
            }
        });
        
        return bestAction;
    }
    
    getRandomAction() {
        const nsTime = Math.floor(Math.random() * 
            (this.maxGreenTime - this.minGreenTime) / this.timeStep) * this.timeStep + 
            this.minGreenTime;
        const ewTime = Math.floor(Math.random() * 
            (this.maxGreenTime - this.minGreenTime) / this.timeStep) * this.timeStep + 
            this.minGreenTime;
        return { nsTime, ewTime };
    }
    
    getPossibleActions() {
        const actions = [];
        for (let nsTime = this.minGreenTime; nsTime <= this.maxGreenTime; nsTime += this.timeStep) {
            for (let ewTime = this.minGreenTime; ewTime <= this.maxGreenTime; ewTime += this.timeStep) {
                actions.push({ nsTime, ewTime });
            }
        }
        return actions;
    }
    
    getQValue(state, action) {
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        const actionKey = JSON.stringify(action);
        return this.qTable[state][actionKey] || 0;
    }
    
    updateQ(state, action, reward, nextState) {
        const actionKey = JSON.stringify(action);
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        
        const oldQ = this.getQValue(state, action);
        const nextMaxQ = Math.max(...this.getPossibleActions()
            .map(a => this.getQValue(nextState, a)));
        
        this.qTable[state][actionKey] = oldQ + this.learningRate * 
            (reward + this.discountFactor * nextMaxQ - oldQ);
    }
}

class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.rlAgent = new QLearningAgent();
        this.lastState = null;
        this.lastAction = null;
        
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
            if (!this.checkIntersectionClear()) {
                return;
            }
            
            const trafficData = this.simulation.getTrafficData();
            this.currentPhase.timeLeft -= 500; // Уменьшаем частоту обновления
            
            if (this.currentPhase.timeLeft <= 0) {
                const times = this.rlAgent.calculateGreenTime(trafficData);
                
                if (this.currentPhase.state === 'green') {
                    // Плавный переход на желтый
                    this.currentPhase.state = 'yellow';
                    this.currentPhase.timeLeft = 5000; // 5 секунд на желтый
                    this.animateTransition(this.currentPhase.direction, 'green', 'yellow', 3000);
                } else if (this.currentPhase.state === 'yellow') {
                    // Плавный переход на красный
                    this.currentPhase.state = 'red';
                    this.animateTransition(this.currentPhase.direction, 'yellow', 'red', 3000);
                    
                    // Ждем окончания анимации перехода на красный
                    setTimeout(() => {
                        // Меняем направление
                        this.currentPhase.direction = (this.currentPhase.direction === 'ns') ? 'ew' : 'ns';
                        
                        // Устанавливаем время следующей фазы
                        this.currentPhase.timeLeft = this.currentPhase.direction === 'ns' ? 
                            times.nsTime : times.ewTime;
                        
                        // Плавный переход на зеленый для нового направления
                        setTimeout(() => {
                            this.animateTransition(this.currentPhase.direction, 'red', 'green', 3000);
                            this.currentPhase.state = 'green';
                        }, 2000);
                    }, 3000);
                }
            }
            
            this.updateLightIntensities();
        }, 100);
    }
    
    setLights(direction, state) {
        const directions = direction === 'ns' ? ['north', 'south'] : ['east', 'west'];
        const oppositeDirections = direction === 'ns' ? ['east', 'west'] : ['north', 'south'];
        
        directions.forEach(dir => {
            this.simulation.trafficLights[dir].state = state;
        });
        
        if (state === 'green') {
            oppositeDirections.forEach(dir => {
                this.simulation.trafficLights[dir].state = 'red';
            });
        }
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
            
            // Затем включаем активный сигнал
            const state = this.simulation.trafficLights[direction].state;
            const activeElements = lightMesh.userData.lights[state];
            if (activeElements) {
                activeElements.light.material.emissiveIntensity = 1;
                activeElements.glow.intensity = 5; // Увеличиваем яркость свечения
                activeElements.glowSphere.material.opacity = 0.5;
            }
        });
    }

    updateTrafficLights(action) {
        const nsWaiting = this.simulation.getTrafficData().ns.waiting;
        const ewWaiting = this.simulation.getTrafficData().ew.waiting;
        
        // Определяем, какое направление нуждается в зеленом сигнале
        if (nsWaiting > ewWaiting * 1.5) {
            // Больше машин ждет в направлении север-юг
            this.setLights('ns', 'green');
            this.setLights('ew', 'red');
        } else if (ewWaiting > nsWaiting * 1.5) {
            // Больше машин ждет в направлении восток-запад
            this.setLights('ns', 'red');
            this.setLights('ew', 'green');
        }
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
                        fromElements.glow.intensity = 2 * (1 - progress);
                        fromElements.glowSphere.material.opacity = 0.3 * (1 - progress);
                        
                        // Плавное появление нового сигнала
                        toElements.light.material.emissiveIntensity = progress;
                        toElements.glow.intensity = 2 * progress;
                        toElements.glowSphere.material.opacity = 0.3 * progress;
                    }
                });
                
                requestAnimationFrame(animate);
            } else {
                // Установка финальных значений
                directions.forEach(dir => {
                    this.simulation.trafficLights[dir].state = toState;
                });
                this.simulation.updateTrafficLights();
            }
        };
        
        requestAnimationFrame(animate);
    }

    calculateReward(trafficData) {
        // Штраф за каждую ожидающую машину
        const waitingPenalty = (trafficData.ns.waiting + trafficData.ew.waiting) * -2;
        
        // Награда за пропущенные машины
        const throughputReward = (trafficData.ns.count + trafficData.ew.count) * 3;
        
        // Дополнительный штраф за длительные заторы
        const congestionPenalty = 
            (trafficData.ns.waiting > 5 || trafficData.ew.waiting > 5) ? -15 : 0;
        
        return Math.exp((waitingPenalty + throughputReward + congestionPenalty) / 25);
    }
}

// Initialize controller when simulation is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        window.controller = new TrafficController(window.simulation);
    }, 1000);
});
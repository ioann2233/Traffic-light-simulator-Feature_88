class QLearning {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.epsilon = 0.1;
        this.minGreenTime = 20000; // 20 секунд
        this.maxGreenTime = 160000; // 160 секунд
    }
    
    getState(trafficData) {
        // Дискретизация состояния
        const nsWaiting = Math.min(Math.floor(trafficData.ns.waiting / 5) * 5, 20);
        const ewWaiting = Math.min(Math.floor(trafficData.ew.waiting / 5) * 5, 20);
        const nsSpeed = Math.floor(trafficData.ns.avgSpeed);
        const ewSpeed = Math.floor(trafficData.ew.avgSpeed);
        return `${nsWaiting}-${ewWaiting}-${nsSpeed}-${ewSpeed}`;
    }
    
    getAction(state) {
        if (Math.random() < this.epsilon) {
            return {
                nsTime: Math.random() * (this.maxGreenTime - this.minGreenTime) + this.minGreenTime,
                ewTime: Math.random() * (this.maxGreenTime - this.minGreenTime) + this.minGreenTime
            };
        }
        
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        
        let maxQ = -Infinity;
        let bestAction = null;
        
        for (let action in this.qTable[state]) {
            if (this.qTable[state][action] > maxQ) {
                maxQ = this.qTable[state][action];
                bestAction = JSON.parse(action);
            }
        }
        
        if (!bestAction) {
            bestAction = {
                nsTime: this.minGreenTime,
                ewTime: this.minGreenTime
            };
        }
        
        return bestAction;
    }
    
    updateQ(state, action, reward, nextState) {
        const actionKey = JSON.stringify(action);
        
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        if (!this.qTable[state][actionKey]) {
            this.qTable[state][actionKey] = 0;
        }
        
        // Q-learning формула обновления
        const maxNextQ = this.getMaxQ(nextState);
        this.qTable[state][actionKey] += this.learningRate * (
            reward + this.discountFactor * maxNextQ - this.qTable[state][actionKey]
        );
    }
    
    getMaxQ(state) {
        if (!this.qTable[state]) return 0;
        
        let maxQ = -Infinity;
        for (let action in this.qTable[state]) {
            maxQ = Math.max(maxQ, this.qTable[state][action]);
        }
        return maxQ === -Infinity ? 0 : maxQ;
    }
}

class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.qLearning = new QLearning();
        this.lastState = null;
        this.lastAction = null;
        
        // Запускаем автоматическое управление светофорами
        this.startAutomaticControl();
        
    // Метод для обновления данных с камер
    updateCameraData(cameraId, data) {
        this.cameraData.cameras[cameraId] = {
            ...data,
            timestamp: Date.now()
        };
    }

    // Получение агрегированных данных со всех камер
    getAggregatedTrafficData() {
        const now = Date.now();
        const validCameras = Object.entries(this.cameraData.cameras)
            .filter(([_, data]) => now - data.timestamp < 5000); // Используем данные не старше 5 секунд

        if (validCameras.length === 0) {
            return this.simulation.getTrafficData(); // Fallback на симуляцию
        }

        // Агрегируем данные со всех камер
        return validCameras.reduce((acc, [_, data]) => {
            return {
                ns: {
                    count: acc.ns.count + data.ns.count,
                    waiting: acc.ns.waiting + data.ns.waiting,
                    avgSpeed: (acc.ns.avgSpeed + data.ns.avgSpeed) / 2
                },
                ew: {
                    count: acc.ew.count + data.ew.count,
                    waiting: acc.ew.waiting + data.ew.waiting,
                    avgSpeed: (acc.ew.avgSpeed + data.ew.avgSpeed) / 2
                },
                pedestrians: {
                    waiting: (acc.pedestrians?.waiting || 0) + (data.pedestrians?.waiting || 0)
                },
                trams: {
                    approaching: (acc.trams?.approaching || 0) + (data.trams?.approaching || 0)
                }
            };
        }, {
            ns: { count: 0, waiting: 0, avgSpeed: 0 },
            ew: { count: 0, waiting: 0, avgSpeed: 0 },
            pedestrians: { waiting: 0 },
            trams: { approaching: 0 }
        });
    }
        this.qLearning = new QLearning();
        this.lastState = null;
        this.lastAction = null;
        
        this.lastStateChange = Date.now();
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const currentState = this.qLearning.getState(trafficData);
    startAutomaticControl() {
        setInterval(() => {
            const trafficData = this.simulation.getTrafficData();
            const currentState = this.qLearning.getState(trafficData);
            const action = this.qLearning.getAction(currentState);
            
            // Обновляем Q-таблицу
            if (this.lastState && this.lastAction) {
                const reward = this.calculateReward(trafficData);
                this.qLearning.updateQ(this.lastState, this.lastAction, reward, currentState);
            }
            
            this.lastState = currentState;
            this.lastAction = action;
            
            // Применяем действие
            this.updateTrafficLights(action);
        }, 1000); // Проверка каждую секунду
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

    setLights(direction, state) {
        if (direction === 'ns') {
            this.simulation.trafficLights.north.state = state;
            this.simulation.trafficLights.south.state = state;
        } else {
            this.simulation.trafficLights.east.state = state;
            this.simulation.trafficLights.west.state = state;
        }
    }
        const action = this.qLearning.getAction(currentState);
        
        // Вычисление награды
        if (this.lastState) {
            const reward = this.calculateReward(trafficData);
            this.qLearning.updateQ(this.lastState, this.lastAction, reward, currentState);
        }
        
        this.lastState = currentState;
        this.lastAction = action;
        
        return { nsGreenTime: action.nsTime, ewGreenTime: action.ewTime };
    }

    calculateReward(trafficData) {
        // Штраф за каждую ожидающую машину
        const waitingPenalty = 
            (trafficData.ns.waiting + trafficData.ew.waiting) * -1;
        
        // Награда за пропущенные машины
        const throughputReward = 
            (trafficData.ns.count + trafficData.ew.count) * 2;
        
        // Дополнительный штраф за заторы с нескольких сторон
        const multiDirectionPenalty = 
            (trafficData.ns.waiting > 0 && trafficData.ew.waiting > 0) ? -10 : 0;
        
        return Math.exp((waitingPenalty + throughputReward + multiDirectionPenalty) / 20);
    }

    async controlCycle() {
        while (true) {
            try {
                const trafficData = this.simulation.getTrafficData();
                const { nsGreenTime, ewGreenTime } = this.calculateGreenTime(trafficData);
                
                console.log('Switching lights - NS Green');
                await this.smoothTransition('ns', 'green');
                await this.delay(nsGreenTime);
                
                console.log('Switching lights - NS Yellow');
                await this.smoothTransition('ns', 'yellow');
                await this.delay(this.yellowTime);
                
                console.log('Switching lights - NS Red, EW Green');
                await this.smoothTransition('ns', 'red');
                await this.smoothTransition('ew', 'green');
                await this.delay(ewGreenTime);
                
                console.log('Switching lights - EW Yellow');
                await this.smoothTransition('ew', 'yellow');
                await this.delay(this.yellowTime);
                
                console.log('Switching lights - EW Red');
                await this.smoothTransition('ew', 'red');
                
                this.updateStats(trafficData);
            } catch (error) {
                console.error('Error in control cycle:', error);
                await this.delay(1000);
            }
        }
    }

    async smoothTransition(direction, newState) {
        const updateLights = (dir, state) => {
            this.simulation.trafficLights[dir].state = state;
        };

        if (direction === 'ns') {
            if (newState === 'yellow') {
                // Проверяем наличие машин на перекрестке
                const vehiclesInIntersection = this.simulation.vehicles.some(v => 
                    (v.direction === 'north' || v.direction === 'south') &&
                    Math.abs(v.mesh.position.x) < 10 && Math.abs(v.mesh.position.z) < 10
                );
                
                if (vehiclesInIntersection) {
                    // Даем дополнительное время для проезда
                    await this.delay(2000);
                }
            }
            updateLights('north', newState);
            updateLights('south', newState);
        } else {
            if (newState === 'yellow') {
                const vehiclesInIntersection = this.simulation.vehicles.some(v => 
                    (v.direction === 'east' || v.direction === 'west') &&
                    Math.abs(v.mesh.position.x) < 10 && Math.abs(v.mesh.position.z) < 10
                );
                
                if (vehiclesInIntersection) {
                    await this.delay(2000);
                }
            }
            updateLights('east', newState);
            updateLights('west', newState);
        }
        
        await this.delay(500);
    }

    updateStats(trafficData) {
        document.getElementById('ns-queue').textContent = trafficData.ns.waiting;
        document.getElementById('ew-queue').textContent = trafficData.ew.waiting;
        document.getElementById('ns-speed').textContent = 
            (trafficData.ns.avgSpeed * 10).toFixed(1);
        document.getElementById('ew-speed').textContent = 
            (trafficData.ew.avgSpeed * 10).toFixed(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startControl() {
        this.controlCycle().catch(console.error);
    }
}

// Initialize controller when simulation is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        window.controller = new TrafficController(window.simulation);
    }, 1000);
});

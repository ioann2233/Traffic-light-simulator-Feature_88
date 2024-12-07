class QLearningAgent {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.epsilon = 0.1;
        
        // Временные интервалы для светофоров (в миллисекундах)
        this.minGreenTime = 20000;
        this.maxGreenTime = 160000;
        this.timeStep = 20000; // Шаг изменения времени
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

    startAutomaticControl() {
        this.currentPhase = {
            direction: 'ns',
            state: 'green',
            timeLeft: 60000  // Начальное время - 60 секунд
        };
        
        setInterval(() => {
            const trafficData = this.simulation.getTrafficData();
            
            // Обновляем время фазы
            this.currentPhase.timeLeft -= 1000;
            
            if (this.currentPhase.timeLeft <= 0) {
                if (this.currentPhase.state === 'green') {
                    // Переход на желтый
                    this.currentPhase.state = 'yellow';
                    this.currentPhase.timeLeft = 5000; // 5 секунд на желтый
                    this.setLights(this.currentPhase.direction, 'yellow');
                } else if (this.currentPhase.state === 'yellow') {
                    // Переход на красный и смена направления
                    this.currentPhase.state = 'red';
                    this.setLights(this.currentPhase.direction, 'red');
                    
                    // Меняем направление
                    this.currentPhase.direction = (this.currentPhase.direction === 'ns') ? 'ew' : 'ns';
                    
                    // Вычисляем оптимальное время следующей фазы
                    const state = this.rlAgent.getState(trafficData);
                    const action = this.rlAgent.getAction(state);
                    const waitingCars = (this.currentPhase.direction === 'ns') 
                        ? trafficData.ns.waiting 
                        : trafficData.ew.waiting;
                        
                    // Устанавливаем время в пределах от 20 до 160 секунд
                    const baseTime = Math.max(20000, Math.min(160000, waitingCars * 10000));
                    this.currentPhase.timeLeft = baseTime;
                    
                    // Устанавливаем зеленый для нового направления
                    this.setLights(this.currentPhase.direction, 'green');
                    this.currentPhase.state = 'green';
                    
                    // Обновляем Q-таблицу
                    if (this.lastState && this.lastAction) {
                        const reward = this.calculateReward(trafficData);
                        this.rlAgent.updateQ(this.lastState, this.lastAction, reward, state);
                    }
                    this.lastState = state;
                    this.lastAction = action;
                }
            }
        }, 1000);
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
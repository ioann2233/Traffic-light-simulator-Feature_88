class QLearningAgent {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.epsilon = 0.1;
        
        this.minGreenTime = 20000;
        this.maxGreenTime = 160000;
        this.timeStep = 20000;
    }
    
    getState(trafficData) {
        if (!trafficData) return '0-0';
        const nsWaiting = Math.min(Math.floor(trafficData.ns.waiting / 5), 5);
        const ewWaiting = Math.min(Math.floor(trafficData.ew.waiting / 5), 5);
        return `${nsWaiting}-${ewWaiting}`;
    }
    
    getAction(state) {
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
        if (!state || !action || !nextState) return;
        
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
        if (!simulation) {
            console.error('Simulation not provided to TrafficController');
            return;
        }
        
        this.simulation = simulation;
        this.rlAgent = new QLearningAgent();
        this.lastState = null;
        this.lastAction = null;
        
        this.startAutomaticControl();
    }
    
    startAutomaticControl() {
        if (!this.simulation) {
            console.error('Simulation not initialized');
            return;
        }
        
        console.log('Starting automatic control');
        
        this.currentPhase = {
            direction: 'ns',
            state: 'green',
            timeLeft: 60000
        };
        
        // Основной цикл управления светофором
        setInterval(() => {
            try {
                const trafficData = this.simulation.getTrafficData();
                if (!trafficData) return;
                
                // Уменьшаем оставшееся время
                this.currentPhase.timeLeft -= 1000;
                
                // Если время фазы истекло
                if (this.currentPhase.timeLeft <= 0) {
                    if (this.currentPhase.state === 'green') {
                        // Переключаем на желтый
                        this.currentPhase.state = 'yellow';
                        this.currentPhase.timeLeft = 5000;
                        this.setLights(this.currentPhase.direction, 'yellow');
                    } else if (this.currentPhase.state === 'yellow') {
                        // Переключаем на красный и меняем направление
                        this.currentPhase.state = 'red';
                        this.setLights(this.currentPhase.direction, 'red');
                        
                        // Меняем направление
                        this.currentPhase.direction = 
                            (this.currentPhase.direction === 'ns') ? 'ew' : 'ns';
                        
                        // Вычисляем время следующей фазы
                        const state = this.rlAgent.getState(trafficData);
                        const action = this.rlAgent.getAction(state);
                        const waitingCars = (this.currentPhase.direction === 'ns') 
                            ? trafficData.ns.waiting 
                            : trafficData.ew.waiting;
                        
                        // Устанавливаем время в пределах от 20 до 160 секунд
                        this.currentPhase.timeLeft = Math.max(20000, 
                            Math.min(160000, waitingCars * 10000));
                        
                        // Включаем зеленый для нового направления
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
            } catch (error) {
                console.error('Error in automatic control:', error);
            }
        }, 1000);
        
        console.log('Automatic control started');
    }
    
    setLights(direction, state) {
        if (!this.simulation) return;
        
        if (direction === 'ns') {
            this.simulation.trafficLights.north.state = state;
            this.simulation.trafficLights.south.state = state;
        } else {
            this.simulation.trafficLights.east.state = state;
            this.simulation.trafficLights.west.state = state;
        }
    }
    
    calculateReward(trafficData) {
        if (!trafficData) return 0;
        
        const waitingPenalty = (trafficData.ns.waiting + trafficData.ew.waiting) * -2;
        const throughputReward = (trafficData.ns.count + trafficData.ew.count) * 3;
        const congestionPenalty = 
            (trafficData.ns.waiting > 5 || trafficData.ew.waiting > 5) ? -15 : 0;
        
        return Math.exp((waitingPenalty + throughputReward + congestionPenalty) / 25);
    }
}

// Initialize controller when simulation is ready
window.addEventListener('load', () => {
    const initController = () => {
        if (!window.simulation) {
            console.warn('Waiting for simulation to initialize...');
            setTimeout(initController, 1000);
            return;
        }
        try {
            window.controller = new TrafficController(window.simulation);
            console.log('Controller initialized successfully');
        } catch (error) {
            console.error('Error initializing controller:', error);
        }
    };
    
    setTimeout(initController, 1000);
});

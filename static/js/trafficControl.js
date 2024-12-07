class QLearning {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.epsilon = 0.1;
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
        // Epsilon-greedy стратегия
        if (Math.random() < this.epsilon) {
            return {
                nsTime: Math.random() * 10000 + 5000,
                ewTime: Math.random() * 10000 + 5000
            };
        }
        
        if (!this.qTable[state]) {
            this.qTable[state] = {};
        }
        
        // Выбор действия с максимальным Q-значением
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
                nsTime: 7000,
                ewTime: 7000
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
        this.minGreenTime = 5000;
        this.maxGreenTime = 15000;
        this.yellowTime = 2000;
        
        this.qLearning = new QLearning();
        this.lastState = null;
        this.lastAction = null;
        
        this.lastStateChange = Date.now();
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const currentState = this.qLearning.getState(trafficData);
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
        // Награда зависит от уменьшения количества машин в заторах
        const totalWaiting = trafficData.ns.waiting + trafficData.ew.waiting;
        const avgSpeed = (trafficData.ns.avgSpeed + trafficData.ew.avgSpeed) / 2;
        
        return -totalWaiting + avgSpeed;
    }

    async controlCycle() {
        while (true) {
            try {
                const trafficData = this.simulation.getTrafficData();
                const { nsGreenTime, ewGreenTime } = this.calculateGreenTime(trafficData);
                
                // North-South зеленый
                this.simulation.trafficLights.north.state = 'green';
                this.simulation.trafficLights.south.state = 'green';
                this.simulation.trafficLights.east.state = 'red';
                this.simulation.trafficLights.west.state = 'red';
                this.lastStateChange = Date.now();
                await this.delay(nsGreenTime);
                
                // Желтый для North-South
                this.simulation.trafficLights.north.state = 'yellow';
                this.simulation.trafficLights.south.state = 'yellow';
                await this.delay(this.yellowTime);
                
                // East-West зеленый
                this.simulation.trafficLights.north.state = 'red';
                this.simulation.trafficLights.south.state = 'red';
                this.simulation.trafficLights.east.state = 'green';
                this.simulation.trafficLights.west.state = 'green';
                this.lastStateChange = Date.now();
                await this.delay(ewGreenTime);
                
                // Желтый для East-West
                this.simulation.trafficLights.east.state = 'yellow';
                this.simulation.trafficLights.west.state = 'yellow';
                await this.delay(this.yellowTime);
                
                this.updateStats(trafficData);
            } catch (error) {
                console.error('Error in control cycle:', error);
                await this.delay(1000); // Пауза перед повторной попыткой
            }
        }
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

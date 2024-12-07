class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.minGreenTime = 5000;
        this.maxGreenTime = 15000;
        this.yellowTime = 2000;
        
        // Веса нейронной сети
        this.weights = {
            waiting: 2.5,
            speed: 1.5,
            queue: 2.0,
            timeInState: 1.0
        };
        
        this.lastStateChange = Date.now();
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const { ns, ew } = trafficData;
        const timeInCurrentState = (Date.now() - this.lastStateChange) / 1000;
        
        // Нормализация входных данных
        const normalize = (value, max) => value / max;
        
        // Вычисление скоров через нейронную сеть
        const calculateNeuralScore = (data, timeInState) => {
            return (
                this.weights.waiting * normalize(data.waiting, 20) +
                this.weights.speed * (1 - normalize(data.avgSpeed, 5)) +
                this.weights.queue * normalize(data.count, 30) +
                this.weights.timeInState * normalize(timeInState, 30)
            );
        };
        
        const nsScore = calculateNeuralScore(ns, timeInCurrentState);
        const ewScore = calculateNeuralScore(ew, timeInCurrentState);
        
        // Динамическое время на основе нейронной сети
        const totalScore = nsScore + ewScore;
        const nsTimeRatio = nsScore / totalScore;
        const ewTimeRatio = ewScore / totalScore;
        
        const nsTime = Math.min(this.maxGreenTime,
            this.minGreenTime + (this.maxGreenTime - this.minGreenTime) * nsTimeRatio);
        const ewTime = Math.min(this.maxGreenTime,
            this.minGreenTime + (this.maxGreenTime - this.minGreenTime) * ewTimeRatio);
            
        return { nsGreenTime: nsTime, ewGreenTime: ewTime };
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

class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.minGreenTime = 2000;   // Уменьшить минимальное время
        this.maxGreenTime = 10000;  // Уменьшить максимальное время
        this.yellowTime = 1000;     // Уменьшить время желтого
        
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const { ns, ew } = trafficData;
        
        // Вычисление приоритета на основе количества машин и их скорости
        const nsScore = (ns.waiting * 3) + (10 / (ns.avgSpeed + 0.1));
        const ewScore = (ew.waiting * 3) + (10 / (ew.avgSpeed + 0.1));
        
        // Динамическое время зеленого сигнала
        const baseTime = 5000;
        const maxTime = 15000;
        
        // Если есть затор (больше 10 машин), увеличиваем время
        const nsTime = ns.waiting > 10 ? 
            Math.min(maxTime, baseTime + (ns.waiting * 500)) : 
            baseTime + (nsScore * 500);
            
        const ewTime = ew.waiting > 10 ? 
            Math.min(maxTime, baseTime + (ew.waiting * 500)) : 
            baseTime + (ewScore * 500);
        
        return {
            nsGreenTime: nsTime,
            ewGreenTime: ewTime
        };
    }

    async controlCycle() {
        while (true) {
            const trafficData = this.simulation.getTrafficData();
            const { nsGreenTime, ewGreenTime } = this.calculateGreenTime(trafficData);
            
            // North-South зеленый
            this.simulation.trafficLights.north.state = 'green';
            this.simulation.trafficLights.south.state = 'green';
            this.simulation.trafficLights.east.state = 'red';
            this.simulation.trafficLights.west.state = 'red';
            await this.delay(nsGreenTime);
            
            // Желтый для North-South
            this.simulation.trafficLights.north.state = 'yellow';
            this.simulation.trafficLights.south.state = 'yellow';
            await this.delay(2000);
            
            // East-West зеленый
            this.simulation.trafficLights.north.state = 'red';
            this.simulation.trafficLights.south.state = 'red';
            this.simulation.trafficLights.east.state = 'green';
            this.simulation.trafficLights.west.state = 'green';
            await this.delay(ewGreenTime);
            
            // Желтый для East-West
            this.simulation.trafficLights.east.state = 'yellow';
            this.simulation.trafficLights.west.state = 'yellow';
            await this.delay(2000);
            
            this.updateStats(trafficData);
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

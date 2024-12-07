class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.minGreenTime = 3000;   // Уменьшено с 5000 до 3000 мс
        this.maxGreenTime = 130000; // 130 секунд максимум
        this.yellowTime = 2000;     // Уменьшено с 3000 до 2000 мс
        
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const { ns, ew } = trafficData;
        
        // Изменить порог с 20 на 10 машин
        if (ns.waiting > 10) {  // Было 20, стало 10
            return {
                nsGreenTime: Math.min(130000, this.maxGreenTime),
                ewGreenTime: this.minGreenTime
            };
        }
        if (ew.waiting > 10) {  // Было 20, стало 10
            return {
                nsGreenTime: this.minGreenTime,
                ewGreenTime: Math.min(130000, this.maxGreenTime)
            };
        }
        
        // Увеличить вес ожидающих машин в формуле
        const nsScore = (ns.waiting * 3) + (1 / (ns.avgSpeed + 0.1));  // Увеличен множитель с 2 до 3
        const ewScore = (ew.waiting * 3) + (1 / (ew.avgSpeed + 0.1));  // Увеличен множитель с 2 до 3
        
        const baseTime = this.minGreenTime;
        const variableTime = this.maxGreenTime - this.minGreenTime;
        
        const nsGreenTime = Math.min(
            this.maxGreenTime,
            baseTime + (variableTime * (nsScore / (nsScore + ewScore)))
        );
        
        const ewGreenTime = Math.min(
            this.maxGreenTime,
            baseTime + (variableTime * (ewScore / (nsScore + ewScore)))
        );
        
        return { nsGreenTime, ewGreenTime };
    }

    async controlCycle() {
        while (true) {
            const trafficData = this.simulation.getTrafficData();
            const { nsGreenTime, ewGreenTime } = this.calculateGreenTime(trafficData);

            // Update stats display
            this.updateStats(trafficData);

            // North-South green cycle
            this.simulation.trafficLights.north.state = 'green';
            this.simulation.trafficLights.south.state = 'green';
            this.simulation.trafficLights.east.state = 'red';
            this.simulation.trafficLights.west.state = 'red';
            await this.delay(nsGreenTime);

            // Yellow transition for North-South
            this.simulation.trafficLights.north.state = 'yellow';
            this.simulation.trafficLights.south.state = 'yellow';
            await this.delay(this.yellowTime);

            // Switch North-South to red
            this.simulation.trafficLights.north.state = 'red';
            this.simulation.trafficLights.south.state = 'red';

            // East-West green cycle
            this.simulation.trafficLights.east.state = 'green';
            this.simulation.trafficLights.west.state = 'green';
            await this.delay(ewGreenTime);

            // Yellow transition for East-West
            this.simulation.trafficLights.east.state = 'yellow';
            this.simulation.trafficLights.west.state = 'yellow';
            await this.delay(this.yellowTime);

            // Switch East-West to red
            this.simulation.trafficLights.east.state = 'red';
            this.simulation.trafficLights.west.state = 'red';
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

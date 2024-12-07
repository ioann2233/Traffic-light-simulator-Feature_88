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
        
        // Уменьшить порог переключения до 5 машин
        if (ns.waiting > 5) {
            return {
                nsGreenTime: 10000,
                ewGreenTime: this.minGreenTime
            };
        }
        if (ew.waiting > 5) {
            return {
                nsGreenTime: this.minGreenTime,
                ewGreenTime: 10000
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
            
            // Проверка машин на перекрестке перед переключением
            const isIntersectionClear = () => {
                return !this.simulation.vehicles.some(vehicle => 
                    vehicle.x > this.simulation.intersection.x - 30 &&
                    vehicle.x < this.simulation.intersection.x + 30 &&
                    vehicle.y > this.simulation.intersection.y - 30 &&
                    vehicle.y < this.simulation.intersection.y + 30
                );
            };

            // Ждем пока перекресток освободится
            while (!isIntersectionClear()) {
                await this.delay(100);
            }

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

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
        
        // Проверяем количество ждущих машин
        if (ns.waiting > 10 || ew.waiting > 10) {
            return {
                nsGreenTime: ns.waiting > ew.waiting ? 15000 : 5000,
                ewGreenTime: ew.waiting > ns.waiting ? 15000 : 5000
            };
        }
        
        // Стандартная логика
        const nsScore = (ns.waiting * 2) + (1 / (ns.avgSpeed + 0.1));
        const ewScore = (ew.waiting * 2) + (1 / (ew.avgSpeed + 0.1));
        
        return {
            nsGreenTime: Math.max(5000, Math.min(15000, 5000 + (10000 * (nsScore / (nsScore + ewScore))))),
            ewGreenTime: Math.max(5000, Math.min(15000, 5000 + (10000 * (ewScore / (nsScore + ewScore)))))
        };
    }

    async controlCycle() {
        while (true) {
            const trafficData = this.simulation.getTrafficData();
            const { nsGreenTime, ewGreenTime } = this.calculateGreenTime(trafficData);
            
            // Переключаем светофоры без ожидания очистки перекрестка
            // North-South зеленый
            this.simulation.trafficLights.north.state = 'green';
            this.simulation.trafficLights.south.state = 'green';
            this.simulation.trafficLights.east.state = 'red';
            this.simulation.trafficLights.west.state = 'red';
            await this.delay(nsGreenTime);

            // Желтый для North-South
            this.simulation.trafficLights.north.state = 'yellow';
            this.simulation.trafficLights.south.state = 'yellow';
            await this.delay(3000); // Увеличиваем время желтого

            // East-West зеленый
            this.simulation.trafficLights.north.state = 'red';
            this.simulation.trafficLights.south.state = 'red';
            this.simulation.trafficLights.east.state = 'green';
            this.simulation.trafficLights.west.state = 'green';
            await this.delay(ewGreenTime);

            // Желтый для East-West
            this.simulation.trafficLights.east.state = 'yellow';
            this.simulation.trafficLights.west.state = 'yellow';
            await this.delay(3000);
            
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

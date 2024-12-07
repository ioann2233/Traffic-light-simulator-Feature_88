class TrafficController {
    constructor(simulation) {
        this.simulation = simulation;
        this.minGreenTime = 5000;  // 5 seconds
        this.maxGreenTime = 30000; // 30 seconds
        this.yellowTime = 3000;    // 3 seconds
        
        this.startControl();
    }

    calculateGreenTime(trafficData) {
        const { ns, ew } = trafficData;
        
        // Calculate score based on waiting vehicles and average speed
        const nsScore = (ns.waiting * 2) + (1 / (ns.avgSpeed + 0.1));
        const ewScore = (ew.waiting * 2) + (1 / (ew.avgSpeed + 0.1));
        
        // Calculate green time based on score
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
            this.simulation.trafficLights.ns.state = 'green';
            this.simulation.trafficLights.ew.state = 'red';
            await this.delay(nsGreenTime);

            // Yellow transition
            this.simulation.trafficLights.ns.state = 'yellow';
            await this.delay(this.yellowTime);

            // East-West green cycle
            this.simulation.trafficLights.ns.state = 'red';
            this.simulation.trafficLights.ew.state = 'green';
            await this.delay(ewGreenTime);

            // Yellow transition
            this.simulation.trafficLights.ew.state = 'yellow';
            await this.delay(this.yellowTime);
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

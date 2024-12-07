class TrafficVisualization {
    constructor() {
        this.chart = this.initializeChart();
        this.updateInterval = setInterval(() => this.updateChart(), 1000);
    }

    initializeChart() {
        const ctx = document.getElementById('trafficChart').getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'NS Queue',
                    borderColor: '#ff6384',
                    data: []
                }, {
                    label: 'EW Queue',
                    borderColor: '#36a2eb',
                    data: []
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    updateChart() {
        if (!window.simulation || typeof window.simulation.getTrafficData !== 'function') {
            console.warn('Simulation not ready');
            return;
        }
        
        const trafficData = window.simulation.getTrafficData();
        const timestamp = new Date().toLocaleTimeString();

        this.chart.data.labels.push(timestamp);
        this.chart.data.datasets[0].data.push(trafficData.ns.waiting);
        this.chart.data.datasets[1].data.push(trafficData.ew.waiting);

        // Keep only last 10 data points
        if (this.chart.data.labels.length > 10) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        this.chart.update();
    }
}

// Initialize visualization when page loads
window.addEventListener('load', () => {
    window.visualization = new TrafficVisualization();
});

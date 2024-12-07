class TrafficSimulation {
    constructor() {
        // Initialize 3D scene
        this.scene3D = new Scene3D(document.getElementById('scene3d'));

        // Initialize state
        this.vehicles = [];
        this.running = true;
        this.trafficLights = {
            north: { state: 'red' },
            south: { state: 'red' },
            east: { state: 'red' },
            west: { state: 'red' }
        };

        // Create base scene
        this.initializeScene();
        this.startSimulation();
        
        // Запуск периодического обновления данных
        setInterval(() => this.fetchCameraData(), 2000);
    }
    
    async fetchCameraData() {
        try {
            const response = await fetch('/api/camera-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    camera_id: 'cam1'
                })
            });
            const data = await response.json();
            this.updateTrafficData(data);
        } catch (error) {
            console.error('Error fetching camera data:', error);
        }
    }

    initializeScene() {
        // Базовая инициализация сцены
        this.createGround();
        this.createRoadMarkings();
    }

    createGround() {
        // Создание земли и дороги
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene3D.addObject(ground);

        // Создание дороги
        const roadGeometry = new THREE.PlaneGeometry(40, 500);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6
        });

        // Вертикальная дорога
        const verticalRoad = new THREE.Mesh(roadGeometry, roadMaterial);
        verticalRoad.rotation.x = -Math.PI / 2;
        this.scene3D.addObject(verticalRoad);

        // Горизонтальная дорога
        const horizontalRoad = new THREE.Mesh(roadGeometry, roadMaterial);
        horizontalRoad.rotation.x = -Math.PI / 2;
        horizontalRoad.rotation.z = Math.PI / 2;
        this.scene3D.addObject(horizontalRoad);
    }

    createRoadMarkings() {
        // Материал для белой разметки
        const markingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4
        });

        // Центральные полосы (North-South)
        const nsLineGeometry = new THREE.BoxGeometry(0.5, 0.1, 30);
        const nsLines = [];
        for (let z = -150; z <= 150; z += 40) {
            const line = new THREE.Mesh(nsLineGeometry, markingMaterial);
            line.position.set(0, 0.1, z);
            nsLines.push(line);
            this.scene3D.addObject(line);
        }

        // Центральные полосы (East-West)
        const ewLineGeometry = new THREE.BoxGeometry(30, 0.1, 0.5);
        const ewLines = [];
        for (let x = -150; x <= 150; x += 40) {
            const line = new THREE.Mesh(ewLineGeometry, markingMaterial);
            line.position.set(x, 0.1, 0);
            ewLines.push(line);
            this.scene3D.addObject(line);
        }

        // Стоп-линии
        const stopLineGeometryNS = new THREE.BoxGeometry(20, 0.1, 2);
        const stopLineGeometryEW = new THREE.BoxGeometry(2, 0.1, 20);

        // North stop line
        const northStopLine = new THREE.Mesh(stopLineGeometryNS, markingMaterial);
        northStopLine.position.set(0, 0.1, 15);
        this.scene3D.addObject(northStopLine);

        // South stop line
        const southStopLine = new THREE.Mesh(stopLineGeometryNS, markingMaterial);
        southStopLine.position.set(0, 0.1, -15);
        this.scene3D.addObject(southStopLine);

        // East stop line
        const eastStopLine = new THREE.Mesh(stopLineGeometryEW, markingMaterial);
        eastStopLine.position.set(15, 0.1, 0);
        this.scene3D.addObject(eastStopLine);

        // West stop line
        const westStopLine = new THREE.Mesh(stopLineGeometryEW, markingMaterial);
        westStopLine.position.set(-15, 0.1, 0);
        this.scene3D.addObject(westStopLine);

        // Пешеходные переходы
        this.createPedestrianCrossing();
    }

    createPedestrianCrossing() {
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4
        });

        const directions = ['north', 'south', 'east', 'west'];
        const stripeGeometry = new THREE.BoxGeometry(2, 0.1, 1);

        directions.forEach(direction => {
            let startPos = { x:
class TrafficModels {
    static createRoad() {
        const group = new THREE.Group();
        
        // Основная дорога с 4 полосами (теперь горизонтально)
        const roadWidth = 40;
        const roadLength = 200;
        
        // Асфальт
        const roadGeometry = new THREE.PlaneGeometry(roadLength, roadWidth);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2; // Поворот для горизонтального положения
        road.receiveShadow = true;
        group.add(road);
        
        // Разметка
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.4
        });
        
        // Центральная двойная линия
        [-1, 1].forEach(offset => {
            const centerLine = new THREE.Mesh(
                new THREE.PlaneGeometry(roadLength, 0.5),
                lineMaterial
            );
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.position.y = 0.1;
            centerLine.position.z = offset;
            group.add(centerLine);
        });
        
        // Боковые линии
        [-roadWidth/2, roadWidth/2].forEach(z => {
            const sideLine = new THREE.Mesh(
                new THREE.PlaneGeometry(roadLength, 0.5),
                lineMaterial
            );
            sideLine.rotation.x = -Math.PI / 2;
            sideLine.position.y = 0.1;
            sideLine.position.z = z;
            group.add(sideLine);
        });
        
        // Разметка полос движения
        [-roadWidth/4, roadWidth/4].forEach(z => {
            const laneMarkings = new THREE.Group();
            for(let x = -90; x < 90; x += 20) {
                const dash = new THREE.Mesh(
                    new THREE.PlaneGeometry(10, 0.5),
                    lineMaterial
                );
                dash.position.set(x, 0.1, z);
                dash.rotation.x = -Math.PI / 2;
                laneMarkings.add(dash);
            }
            group.add(laneMarkings);
        });
        
        return group;
    }

    static createVehicle() {
        const vehicleGeometry = new THREE.BoxGeometry(8, 4, 12);
        const vehicleMaterial = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.5
        });
        const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
        vehicle.position.y = 2;
        vehicle.castShadow = true;
        vehicle.receiveShadow = true;
        return vehicle;
    }
    
    static createCameraView() {
        const geometry = new THREE.ConeGeometry(50, 100, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const cone = new THREE.Mesh(geometry, material);
        cone.rotation.x = Math.PI / 2;
        return cone;
    }

    static createTrafficLight() {
        const group = new THREE.Group();
        
        // Уменьшенный размер столба
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        post.position.y = 6;
        group.add(post);
        
        // Уменьшенный корпус светофора
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(3, 9, 3),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        housing.position.y = 13;
        group.add(housing);
        
        // Создание сигналов светофора
        const createLight = (color, y) => {
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.1
                })
            );
            light.position.set(0, y, 0);
            group.add(light);
            return light;
        };
        
        // Создаем сигналы с уменьшенным размером
        const redLight = createLight(0xff0000, 15);    // Красный
        const yellowLight = createLight(0xffff00, 13); // Желтый
        const greenLight = createLight(0x00ff00, 11);  // Зеленый
        
        return group;
    }
}

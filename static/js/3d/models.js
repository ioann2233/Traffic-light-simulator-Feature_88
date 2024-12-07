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
        
        // Столб светофора
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 15),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        post.position.y = 7.5;
        group.add(post);
        
        // Корпус светофора
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(4, 12, 4),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        housing.position.y = 18;
        group.add(housing);
        
        // Создание световых элементов
        const createLight = (color, y) => {
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(1.2),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.1
                })
            );
            bulb.position.set(0, y, 0);
            return bulb;
        };
        
        // Добавление цветных сигналов
        group.add(createLight(0xff0000, 22)); // Красный
        group.add(createLight(0xffff00, 18)); // Желтый
        group.add(createLight(0x00ff00, 14)); // Зеленый
        
        return group;
    }
}

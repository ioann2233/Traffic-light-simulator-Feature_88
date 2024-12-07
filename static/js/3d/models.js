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
        
        // Столб
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 20),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        post.position.y = 10;
        group.add(post);
        
        // Корпус светофора
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(6, 15, 6),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        housing.position.y = 22;
        group.add(housing);
        
        // Создание сигналов светофора с более яркими цветами и большим размером
        const createLight = (color, y) => {
            // Основа сигнала (черный фон)
            const background = new THREE.Mesh(
                new THREE.CylinderGeometry(1.8, 1.8, 1, 16),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            background.rotation.x = Math.PI / 2;
            background.position.set(0, y, 2.5);
            
            // Световой элемент
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(1.5),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.1,
                    transparent: true,
                    opacity: 0.9
                })
            );
            light.position.set(0, y, 2.5);
            
            group.add(background);
            group.add(light);
            return light;
        };
        
        // Создаем сигналы с увеличенным размером
        createLight(0xff0000, 26); // Красный
        createLight(0xffff00, 22); // Желтый
        createLight(0x00ff00, 18); // Зеленый
        
        return group;
    }
}

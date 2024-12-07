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

    static createTrafficLight(direction) {
        const group = new THREE.Group();
        group.userData.direction = direction; // Добавляем направление в userData
        
        // Столб светофора
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        post.position.y = 6;
        group.add(post);
        
        // Корпус светофора
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(3, 9, 3),
            new THREE.MeshStandardMaterial({ 
                color: 0x1a1a1a,
                roughness: 0.7
            })
        );
        housing.position.y = 13;
        group.add(housing);
        
        // Создание сигналов светофора
        const createLightBulb = (color, y) => {
            // Черное основание
            const base = new THREE.Mesh(
                new THREE.CircleGeometry(1.2, 32),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            base.position.set(0, y, 1.52);
            group.add(base);
            
            // Внутренний свет
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.1,
                    transparent: true,
                    opacity: 0.9
                })
            );
            light.position.set(0, y, 1.5);
            
            // Добавляем точечный свет для эффекта свечения
            const pointLight = new THREE.PointLight(color, 0.1, 3);
            pointLight.position.set(0, y, 1.5);
            light.userData.pointLight = pointLight;
            
            group.add(light);
            group.add(pointLight);
            return light;
        };
        
        // Создаем сигналы
        const redLight = createLightBulb(0xff0000, 16);    // Красный
        const yellowLight = createLightBulb(0xffff00, 13); // Желтый
        const greenLight = createLightBulb(0x00ff00, 10);  // Зеленый
        
        return group;
    }
}

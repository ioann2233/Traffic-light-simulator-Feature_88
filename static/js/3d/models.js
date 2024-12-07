class TrafficModels {
    static createRoad() {
        const group = new THREE.Group();
        
        // Создаем две пересекающиеся дороги
        const roads = [
            { width: 40, length: 200, rotation: 0 },      // Горизонтальная дорога
            { width: 40, length: 200, rotation: Math.PI/2 }  // Вертикальная дорога
        ];
        
        roads.forEach(road => {
            // Асфальт
            const roadGeometry = new THREE.PlaneGeometry(road.length, road.width);
            const roadMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                roughness: 0.8
            });
            const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
            roadMesh.rotation.x = -Math.PI / 2;
            roadMesh.rotation.y = road.rotation;
            roadMesh.receiveShadow = true;
            group.add(roadMesh);
            
            // Разметка
            const lineMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                roughness: 0.4
            });
            
            // Центральная разделительная полоса
            const centerLine = new THREE.Mesh(
                new THREE.PlaneGeometry(road.length, 0.5),
                lineMaterial
            );
            centerLine.rotation.x = -Math.PI / 2;
            centerLine.rotation.y = road.rotation;
            centerLine.position.y = 0.1;
            group.add(centerLine);
            
            // Боковые линии
            [-road.width/2, road.width/2].forEach(offset => {
                const sideLine = new THREE.Mesh(
                    new THREE.PlaneGeometry(road.length, 0.5),
                    lineMaterial
                );
                sideLine.rotation.x = -Math.PI / 2;
                sideLine.rotation.y = road.rotation;
                sideLine.position.y = 0.1;
                if (road.rotation === 0) {
                    sideLine.position.z = offset;
                } else {
                    sideLine.position.x = offset;
                }
                group.add(sideLine);
            });
        });
        
        return group;
    }

    static createVehicle() {
        const car = new THREE.Group();
        
        // Основной корпус (более реалистичной формы)
        const bodyGeometry = new THREE.BoxGeometry(4, 2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        car.add(body);
        
        // Крыша
        const roofGeometry = new THREE.BoxGeometry(3.5, 1.5, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: bodyMaterial.color,
            metalness: 0.7,
            roughness: 0.3
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 1.75;
        roof.position.z = -1;
        car.add(roof);
        
        // Колёса
        const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.7
        });
        
        const wheelPositions = [
            [-2, -1, -2.5],
            [2, -1, -2.5],
            [-2, -1, 2.5],
            [2, -1, 2.5]
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            car.add(wheel);
        });
        
        // Фары
        const headlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const headlightPositions = [
            [-1.5, 0, -4],
            [1.5, 0, -4]
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(...position);
            car.add(headlight);
        });
        
        // Поворотники
        const turnSignalGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const leftSignal = new THREE.Mesh(
            turnSignalGeometry,
            new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 0
            })
        );
        const rightSignal = leftSignal.clone();
        
        leftSignal.position.set(-2, 0, -4);
        rightSignal.position.set(2, 0, -4);
        
        car.add(leftSignal);
        car.add(rightSignal);
        
        // Сохраняем ссылки на поворотники
        car.userData.turnSignals = {
            left: leftSignal,
            right: rightSignal
        };
        
        car.castShadow = true;
        car.receiveShadow = true;
        
        return car;
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
        group.userData.direction = direction;
        group.userData.clickable = true;
        
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
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        housing.position.y = 13;
        group.add(housing);
        
        const createLight = (color, y) => {
            // Черное основание
            const base = new THREE.Mesh(
                new THREE.CircleGeometry(1.2, 32),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            base.position.set(0, y, 1.52);
            group.add(base);
            
            // Светящийся элемент
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
            
            // Добавление яркого свечения
            const glow = new THREE.PointLight(color, 0, 5);
            glow.position.set(0, y, 1.5);
            light.userData.pointLight = glow;
            
            // Добавление ореола свечения
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const glowSphere = new THREE.Mesh(
                new THREE.SphereGeometry(1.3),
                glowMaterial
            );
            glowSphere.position.set(0, y, 1.5);
            
            group.add(light);
            group.add(glow);
            group.add(glowSphere);
            return { light, glow, glowSphere };
        };
        
        // Создаем сигналы с эффектами свечения
        group.userData.lights = {
            red: createLight(0xff0000, 16),
            yellow: createLight(0xffff00, 13),
            green: createLight(0x00ff00, 10)
        };
        
        return group;
    }
}

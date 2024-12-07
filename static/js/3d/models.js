class TrafficModels {
    static createRoad() {
        const group = new THREE.Group();
        
        // Основная дорога
        const roadGeometry = new THREE.PlaneGeometry(200, 40);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        group.add(road);
        
        // Только основная разметка и пешеходные переходы
        const createPedestrianCrossing = (x, z, rotation) => {
            const crossing = new THREE.Group();
            for(let i = -15; i <= 15; i += 3) {
                const stripe = new THREE.Mesh(
                    new THREE.PlaneGeometry(5, 1),
                    new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
                );
                stripe.position.set(i, 0.1, 0);
                stripe.rotation.x = -Math.PI / 2;
                crossing.add(stripe);
            }
            crossing.position.set(x, 0, z);
            crossing.rotation.y = rotation;
            return crossing;
        };
        
        // Добавляем пешеходные переходы
        group.add(createPedestrianCrossing(20, 0, 0));
        group.add(createPedestrianCrossing(-20, 0, 0));
        group.add(createPedestrianCrossing(0, 20, Math.PI / 2));
        group.add(createPedestrianCrossing(0, -20, Math.PI / 2));
        
        return group;
    }

    static createVehicle() {
        const group = new THREE.Group();
        
        // Main vehicle body
        const vehicleGeometry = new THREE.BoxGeometry(8, 4, 12);
        const vehicleMaterial = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.5
        });
        const vehicleBody = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
        vehicleBody.castShadow = true;
        vehicleBody.receiveShadow = true;
        group.add(vehicleBody);

        // Add turn signals
        const signalGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const leftSignalMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0
        });
        const rightSignalMaterial = leftSignalMaterial.clone();
        
        const leftSignal = new THREE.Mesh(signalGeometry, leftSignalMaterial);
        const rightSignal = new THREE.Mesh(signalGeometry, rightSignalMaterial);
        
        leftSignal.position.set(-4, 0, -6);
        rightSignal.position.set(4, 0, -6);
        
        group.add(leftSignal);
        group.add(rightSignal);
        
        // Set initial position
        group.position.y = 2;
        
        return group;
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

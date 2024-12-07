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
        
        // Разметка дороги
        const createLine = (x, z, length, rotation = 0) => {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(length, 0.3),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
            );
            line.position.set(x, 0.01, z);
            line.rotation.x = -Math.PI / 2;
            line.rotation.y = rotation;
            return line;
        };
        
        // Центральная разделительная полоса
        for(let i = -90; i <= 90; i += 10) {
            group.add(createLine(0, i, 5));
        }
        
        // Боковые линии
        group.add(createLine(-20, 0, 200));
        group.add(createLine(20, 0, 200));
        group.add(createLine(0, -20, 200, Math.PI / 2));
        group.add(createLine(0, 20, 200, Math.PI / 2));
        
        // Пешеходные переходы
        const createPedestrianCrossing = (x, z, rotation) => {
            const crossing = new THREE.Group();
            for(let i = -15; i <= 15; i += 3) {
                const stripe = new THREE.Mesh(
                    new THREE.PlaneGeometry(5, 1),
                    new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
                );
                stripe.position.set(i, 0.01, 0);
                stripe.rotation.x = -Math.PI / 2;
                crossing.add(stripe);
            }
            crossing.position.set(x, 0, z);
            crossing.rotation.y = rotation;
            return crossing;
        };
        
        group.add(createPedestrianCrossing(25, 0, 0));
        group.add(createPedestrianCrossing(-25, 0, 0));
        group.add(createPedestrianCrossing(0, 25, Math.PI / 2));
        group.add(createPedestrianCrossing(0, -25, Math.PI / 2));
        
        return group;
    }

    static createVehicle() {
        const group = new THREE.Group();
        
        // Основное тело машины
        const bodyGeometry = new THREE.BoxGeometry(8, 3, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            metalness: 0.6,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // Крыша
        const roofGeometry = new THREE.BoxGeometry(7, 2, 8);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.y = 2.5;
        group.add(roof);
        
        // Колеса
        const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const createWheel = (x, z) => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, -1, z);
            return wheel;
        };
        
        group.add(createWheel(-4, -3));
        group.add(createWheel(4, -3));
        group.add(createWheel(-4, 3));
        group.add(createWheel(4, 3));
        
        // Поворотники
        const signalGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const createTurnSignal = (x, isLeft) => {
            const signal = new THREE.Mesh(
                signalGeometry,
                new THREE.MeshStandardMaterial({
                    color: 0xffaa00,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0
                })
            );
            signal.position.set(x, 0, -6);
            signal.userData.isLeft = isLeft;
            return signal;
        };
        
        const leftSignal = createTurnSignal(-4, true);
        const rightSignal = createTurnSignal(4, false);
        group.add(leftSignal);
        group.add(rightSignal);
        
        // Фары
        const headlightGeometry = new THREE.BoxGeometry(1, 0.5, 0.1);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const createHeadlight = (x) => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(x, 0, -6);
            return headlight;
        };
        
        group.add(createHeadlight(-3));
        group.add(createHeadlight(3));
        
        group.position.y = 2;
        group.castShadow = true;
        group.receiveShadow = true;
        
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

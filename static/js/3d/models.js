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
        const carColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const group = new THREE.Group();
        
        // Основной корпус
        const bodyGeometry = new THREE.BoxGeometry(4, 2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: carColors[Math.floor(Math.random() * carColors.length)],
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        group.add(body);
        
        // Кабина
        const cabinGeometry = new THREE.BoxGeometry(3.5, 1.5, 4);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 2.5, -1);
        group.add(cabin);
        
        // Колеса
        const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.7
        });
        
        const wheelPositions = [
            [-2, 0, -2.5],
            [2, 0, -2.5],
            [-2, 0, 2.5],
            [2, 0, 2.5]
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            group.add(wheel);
        });
        
        // Фары
        const headlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const headlightPositions = [
            [-1.5, 1, -4],
            [1.5, 1, -4]
        ];
        
        headlightPositions.forEach(position => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(...position);
            group.add(headlight);
        });
        
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
                    emissiveIntensity: 0,
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
                opacity: 0
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

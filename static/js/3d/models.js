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
        
        // Прерывистые линии
        [-roadWidth/4, roadWidth/4].forEach(z => {
            for(let x = -90; x < 90; x += 20) {
                const dash = new THREE.Mesh(
                    new THREE.PlaneGeometry(10, 0.5),
                    lineMaterial
                );
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(x, 0.1, z);
                group.add(dash);
            }
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
        
        // Post
        const postGeometry = new THREE.CylinderGeometry(1, 1, 20);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.castShadow = true;
        group.add(post);
        
        // Lights housing
        const housingGeometry = new THREE.BoxGeometry(4, 12, 4);
        const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.y = 10;
        housing.castShadow = true;
        group.add(housing);
        
        // Lights
        const lightGeometry = new THREE.SphereGeometry(1.5);
        const redLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            })
        );
        redLight.position.set(0, 14, 0);
        
        const yellowLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5
            })
        );
        yellowLight.position.set(0, 10, 0);
        
        const greenLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.5
            })
        );
        greenLight.position.set(0, 6, 0);
        
        group.add(redLight);
        group.add(yellowLight);
        group.add(greenLight);
        
        return group;
    }
}

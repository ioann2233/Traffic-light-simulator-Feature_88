class TrafficModels {
    static createRoad() {
        const group = new THREE.Group();
        
        // Основная дорога (темно-серая)
        const roadGeometry = new THREE.PlaneGeometry(200, 40);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.receiveShadow = true;
        group.add(road);
        
        // Центральная разделительная полоса (белая, приподнятая)
        const centerLineGeometry = new THREE.PlaneGeometry(200, 2);
        const centerLineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.5,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.5
        });
        const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        centerLine.position.y = 0.1; // Приподнять над дорогой
        group.add(centerLine);
        
        // Боковые полосы разметки
        [-15, 15].forEach(offset => {
            const laneLine = new THREE.Mesh(
                new THREE.PlaneGeometry(200, 1),
                centerLineMaterial.clone()
            );
            laneLine.position.set(0, 0.1, offset);
            group.add(laneLine);
        });
        
        return group;
    }
    
    static createVehicle() {
        const vehicleGeometry = new THREE.BoxGeometry(10, 6, 15);
        const vehicleMaterial = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff, // Random color for each vehicle
            roughness: 0.5,
            metalness: 0.5
        });
        const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
        vehicle.position.y = 3; // Lift vehicle slightly above the ground
        vehicle.castShadow = true;
        vehicle.receiveShadow = true;
        return vehicle;
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

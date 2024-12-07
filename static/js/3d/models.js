class TrafficModels {
    static createRoad() {
        const roadGeometry = new THREE.PlaneGeometry(200, 20);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.receiveShadow = true;
        return road;
    }
    
    static createVehicle() {
        const vehicleGeometry = new THREE.BoxGeometry(10, 6, 15);
        const vehicleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4488ff,
            roughness: 0.5,
            metalness: 0.5
        });
        const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
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

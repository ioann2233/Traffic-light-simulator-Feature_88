class Pedestrian {
    constructor(position, direction) {
        this.mesh = this.createPedestrianMesh();
        this.position = position;
        this.direction = direction;
        this.isWaiting = false;
        this.speed = 0.3;
    }
    
    createPedestrianMesh() {
        // Создание модели пешехода
        const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 2, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: Math.random() * 0xffffff 
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.castShadow = true;
        return mesh;
    }
    
    update() {
        if (!this.isWaiting) {
            switch(this.direction) {
                case 'north':
                    this.mesh.position.z -= this.speed;
                    break;
                case 'south':
                    this.mesh.position.z += this.speed;
                    break;
                case 'east':
                    this.mesh.position.x += this.speed;
                    break;
                case 'west':
                    this.mesh.position.x -= this.speed;
                    break;
            }
        }
    }
}

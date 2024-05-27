

const { Project, Scene3D, PhysicsLoader, THREE, ExtendedObject3D } = ENABLE3D

class MainScene extends Scene3D {

    async create() {

      const { orbitControls } = await this.warpSpeed()

      this.camera.position.set(-10, -10, 20)
      orbitControls?.target.set(0, 2.5, 0)
      this.camera.lookAt(0, 0, 0)

      // enable physics debugging
      this.physics.debug?.enable()

      // world axis 
      const axesHelper = new THREE.AxesHelper( 5 );
      axesHelper.setColors(new THREE.Color(255, 0, 0), new THREE.Color(0, 255, 0), new THREE.Color(0, 0, 255))    // in order to know which axis is the right axis
      this.scene.add( axesHelper );
      console.log(this)
    }
}


PhysicsLoader('../lib/ammo/kripken', () => new Project({ gravity: { x: 0, y: 0, z: -9.81 }, scenes: [MainScene], softBodies: true }))

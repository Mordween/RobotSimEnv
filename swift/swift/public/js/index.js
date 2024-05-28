import {OrbitControls} from '/js/vendor/examples/jsm/controls/OrbitControls.js'
import {Compound, Shape, FPS, SimTime, Slider, Button, Label, Select, Checkbox, Radio} from './lib.js'
import { STLLoader } from './vendor/examples/jsm/loaders/STLLoader.js'
// import { start } from 'repl';


let fps = new FPS(document.getElementById('fps'));
let sim_time = new SimTime(document.getElementById('sim-time'));

let camera, scene, renderer, controls;

// Array of all the robots in the scene
let agents = [];
let compounds = [];
let shapes = [];
let custom_elements = [];

let connected = false;

// Open the connection to python
//let port = parseInt(window.location.pathname.slice(1));
let port = 53000;
let ws = new WebSocket("ws://localhost:" + port + "/")

let recorder = null;
let recording = false;
let framerate = 20;
let autoclose = true;


ws.onopen = function(event) {
	connected = true;
	ws.send('Connected');
	console.log('Connection opened');
	startSim(event.data);
}


ws.onclose = function(event) {

	if (recording) {
		stopRecording();
	}

	if (autoclose) {
		setTimeout(
			function() {
				window.close();
			}, 5000);
	}
}


function startSim(port) {
	init()
	animate();
	window.addEventListener('resize', on_resize, false);
}


// function init() {
// // 
// 	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
// 	// camera = new HoloPlay.Camera();
	
// 	scene = new THREE.Scene();
// 	// THREE.Object3D.DefaultUp.set(0, 0, 1);
// 	// Function to load and add STL file to the scene
// 	/*
	
// 	// Usage example:
// 	// Assuming 'scene' is your Three.js scene and 'stlFilePath' is the path to your STL file
// 	const stlFilePath = '/retrieve/home/simeon/Documents/digitalFabrication/FabAcademy2024/final project/cnc/z_carriage.stl';
// 	console.log(stlFilePath)
// 	addSTLToScene(scene, stlFilePath);
// 	*/
// 	renderer = new THREE.WebGLRenderer( {antialias: true });
// 	// hrenderer = new HoloPlay.Renderer();
// 	// hrenderer.webglRenderer = renderer;
// 	// hrenderer.disableFullscreenUi = true;
// 	// console.log(hrenderer);

// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	renderer.shadowMap.enabled = true;
// 	let div = document.getElementById( 'canvas' );
// 	document.body.appendChild(div);
// 	div.appendChild(renderer.domElement)
// 	controls = new OrbitControls( camera, renderer.domElement );

// 	// Set up camera position
// 	camera.position.set(0.2, 1.2, 0.7);
// 	controls.target = new THREE.Vector3(0, 0, 0.2);
// 	controls.update();

// 	// scene.background = new THREE.Color(0x72645b);
// 	scene.background = new THREE.Color(0x787878);
// 	scene.fog = new THREE.Fog(0x787878, 2, 15 );

// 	var plane = new THREE.Mesh(
// 		new THREE.PlaneBufferGeometry( 40, 40 ),
// 		new THREE.MeshPhongMaterial( { color: 0x4B4B4B, specular: 0x101010 } )
// 	);
// 	plane.receiveShadow = true;
// 	scene.add( plane );
// 	// Lights
// 	scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );
// 	addShadowedLight( 1, 1, 1, 0xffffff, 1.35 );
// 	addShadowedLight( 0.5, 1, - 1, 0xffaa00, 1 );

// 	var axesHelper = new THREE.AxesHelper( 5 );
// 	scene.add( axesHelper );

// }


// function on_resize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }


// function addShadowedLight( x, y, z, color, intensity ) {

// 	var directionalLight = new THREE.DirectionalLight( color, intensity );
// 	directionalLight.position.set( x, y, z );
// 	scene.add( directionalLight );

// 	directionalLight.castShadow = true;

// 	var d = 1;
// 	directionalLight.shadow.camera.left = - d;
// 	directionalLight.shadow.camera.right = d;
// 	directionalLight.shadow.camera.top = d;
// 	directionalLight.shadow.camera.bottom = - d;

// 	directionalLight.shadow.camera.near = 1;
// 	directionalLight.shadow.camera.far = 4;

// 	directionalLight.shadow.bias = - 0.002;

// }


// function animate() {

// 	requestAnimationFrame(animate);

// 	renderer.render(scene, camera);

// 	if (recording) {
// 		recorder.capture(renderer.domElement);
// 	}

// 	fps.frame();
// }


// function startRecording(frate, name, format) {
// 	if (!recording) {

// 		if (format === 'gif') {
// 			autoclose = false;
// 		}

// 		recorder = new CCapture({
// 			verbose: false,
// 			display: true,
// 			framerate: frate,
// 			quality: 100,
// 			format: format,
// 			name: name,
// 			workersPath: 'js/vendor/build/'
// 		});
// 		recording = true;
// 		recorder.start();
// 	};
// }


// function stopRecording() {
// 	recorder.stop();
// 	recorder.save();
// 	recording = false;
// }


ws.onmessage = function (event) {
	console.log(event.data)
	let eventdata = JSON.parse(event.data)
	let func = eventdata[0]
	let data = eventdata[1]
	if (func === 'shape') {
		let compound = new Compound(scene);
		// Assuming data is a list of shapes
		for (let shapeData of data) {
			// Create a new shape object based on the shape data
			
			compound.add_shape(shapeData);
			//let shape = new Shape(scene, shapeData);
			 // Set the shape's id to the current length of the shapes array
			 // Add the shape to the shapes array
		}
		
		compound.id = compounds.length;
		compounds.push(compound);
		console.log("Compound: ", compound)
		// Send a confirmation message back to the server
		ws.send(compound.id); // Send the index of the first newly added shape
	
	} else if (func === 'shape_mounted') {
		let id = 1;
		ws.send(id);
	} else if (func === 'remove_shape') {
		let shape = shapes[data]
		shape.remove(scene)
		renderer.renderLists.dispose();
		shapes[data] = null;
		ws.send(0);
	} else if (func === 'shape_poses') {
		for (let shapeData of data) {
			let id = shapeData[0];
			let poses = shapeData[1];
			console.log("id: ", id)
			console.log("poses: ", poses)
			compounds[id].set_poses(poses);
		}
		let jsonString = JSON.stringify([]);
		ws.send(jsonString);
	} else if (func === 'is_loaded') {
		let loaded = agents[data].isLoaded();
		ws.send(loaded);
	} else if (func === 'sim_time') {
		sim_time.display(parseFloat(data));
		let jsonString = JSON.stringify([]);
		ws.send(jsonString);
	} else if (func === 'start_recording') {
		startRecording(parseFloat(data[0]), data[1], data[2]);
		ws.send(0);
	} else if (func === 'stop_recording') {
		stopRecording();
		
		setTimeout(
			function() {
				ws.send(0);
			}, 5000);
	} else if (func === 'add_element') {
		let element = data.element;

		if (element === 'slider') {
			custom_elements.push(new Slider(data));
		} else if (element === 'button') {
			custom_elements.push(new Button(data));
		} else if (element === 'label') {
			custom_elements.push(new Label(data));
		} else if (element === 'select') {
			custom_elements.push(new Select(data));
		} else if (element === 'checkbox') {
			custom_elements.push(new Checkbox(data));
		} else if (element === 'radio') {
			custom_elements.push(new Radio(data));
		}
		ws.send(0);
	} else if (func === 'check_elements') {
		let ret = {};

		for (let i = 0; i < custom_elements.length; i++) {
			if (custom_elements[i].changed === true) {
				ret[custom_elements[i].id] = custom_elements[i].data;
				custom_elements[i].changed = false;
			}
		}
		ws.send(JSON.stringify(ret));
	} else if (func === 'update_element') {
		let id = data.id;

		for (let i = 0; i < custom_elements.length; i++) {
			if (custom_elements[i].id === id) {
				custom_elements[i].update(data);
				break;
			}
		}

		ws.send(0);
	}
};



const { Project, Scene3D, PhysicsLoader, THREE, ExtendedObject3D } = ENABLE3D

      let pulleyRotValue = 0;

      let brickSpawn = false;
      let armBrickCollision = false;
      let leftArmCollision = false;
      let rightArmCollision = false;

      let armPos = 0.4

      const pulleyPos =  new THREE.Vector3();
      const ropePos =  new THREE.Vector3();

      // The rope
      const ropeWidth = 0.001
      const ropeLength = 4
      const ropeNumSegmentsZ = 1
      const ropeNumSegmentsY = 50

      // The pulley
      const pulleyScale = 0.5
      const pulleyRadius = 0.7*pulleyScale
      const pulleyHeight = 0.3*pulleyScale


      pulleyPos.set(0, 0, 8)
      ropePos.set(pulleyPos.x, pulleyPos.y, pulleyPos.z-pulleyScale*pulleyRadius)

      const ropeBodyUse = true;  
        
      let value = Math.PI/4

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


          const pulleyData = [
          {x: 0, y: 0,                      z: 0, height: pulleyHeight  , radiusTop: pulleyRadius, radiusBottom: pulleyRadius },    
          {x: 0, y: (pulleyScale * 4 * pulleyHeight)/6,     z: 0, height: pulleyHeight/3, radiusTop: 1.25*pulleyRadius, radiusBottom: 1.25*pulleyRadius },
          {x: 0, y: - (pulleyScale * 4 * pulleyHeight)/6,   z: 0, height: pulleyHeight/3, radiusTop: 1.25*pulleyRadius, radiusBottom: 1.25*pulleyRadius },
          ]
            let pos = 0
            this.pulley = pulleyData.map(d => {
                let cylinder = this.add.cylinder(d) 
                cylinder.position.x += pulleyPos.x;
                cylinder.position.y += pulleyPos.y;
                cylinder.position.z += pulleyPos.z;
                this.physics.add.existing(cylinder, { shape: 'convex', collisionFlags :(pos === 0?2:2), mass: 100000 })
                pos = 1
                return cylinder
          })
   

          const ropeGeometry = new THREE.PlaneGeometry(ropeWidth, ropeLength, ropeNumSegmentsZ, ropeNumSegmentsY)

          const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
          this.rope = new THREE.Mesh(ropeGeometry, ropeMaterial)
          this.rope.castShadow = true
          this.rope.receiveShadow = true
          this.scene.add(this.rope)

          this.load.texture('/assets/img/grid.png').then(texture => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(ropeNumSegmentsZ, ropeNumSegmentsY)
            // @ts-ignore
            this.rope.material.map = texture
            // @ts-ignore
            this.rope.material.needsUpdate = true
          })

          console.log("thisPhysics", this.physics.physicsWorld.getWorldInfo())
          this.physics.physicsWorld.getWorldInfo().get_m_gravity().setX(0)
          this.physics.physicsWorld.getWorldInfo().get_m_gravity().setY(0)
          this.physics.physicsWorld.getWorldInfo().get_m_gravity().setZ(-9.81)      // FIX soft body Gravity
          
          console.log("thisPhysics", this.physics.physicsWorld.getWorldInfo())

          const softBodyHelpers = new Ammo.btSoftBodyHelpers()
          this.ropeSoftBody
          
          if (ropeBodyUse === true)   /*********************************** CreateRope used *********************************/
          {
            const ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
            const ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y , ropePos.z - ropeLength );
            this.ropeSoftBody = softBodyHelpers.CreateRope( 
            this.physics.physicsWorld.getWorldInfo(), 
            ropeStart, 
            ropeEnd, 
            ropeNumSegmentsY - 1, 
            0 
            );
          }
          else                      /*********************************** CreatePatch used *********************************/
          {
            const ropeCornerBR = new Ammo.btVector3(ropePos.x, ropePos.y + 0.5 * ropeWidth, ropePos.z - ropeLength)
            const ropeCornerBL = new Ammo.btVector3(ropePos.x, ropePos.y - 0.5 * ropeWidth, ropePos.z - ropeLength)
            const ropeCornerTR = new Ammo.btVector3(ropePos.x, ropePos.y + 0.5 * ropeWidth, ropePos.z)
            const ropeCornerTL = new Ammo.btVector3(ropePos.x, ropePos.y - 0.5 * ropeWidth, ropePos.z)

            this.ropeSoftBody = softBodyHelpers.CreatePatch(
            this.physics.physicsWorld.getWorldInfo(),
            ropeCornerBR,
            ropeCornerBL,
            ropeCornerTR,
            ropeCornerTL,
            ropeNumSegmentsZ + 1,
            ropeNumSegmentsY + 1,
            0,
            true
            );
          }

          const sbConfig = this.ropeSoftBody.get_m_cfg()
          sbConfig.set_viterations(100)
          sbConfig.set_piterations(100)       // the rope is no longer elastic

          this.ropeSoftBody.setTotalMass(100, false)                  
          // @ts-ignore
          Ammo.castObject(this.ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.04) 
          this.physics.physicsWorld.addSoftBody(this.ropeSoftBody, 1, -1)

          console.log("this", this)

          this.rope.userData.physicsBody = this.ropeSoftBody
          
          // Disable deactivation
          this.ropeSoftBody.setActivationState(4)

          // Glue the rope to the pulley
          const influence = 1
          if(ropeBodyUse == true) /*********************************** if CreateRope used *********************************/
          {
            this.ropeSoftBody.appendAnchor(0, this.pulley[0].body.ammo, false, influence)
          }
          else                    /*********************************** if CreatePatch used *********************************/
          {
            this.ropeSoftBody.appendAnchor(ropeNumSegmentsY*2, this.pulley[0].body.ammo, false, influence)
          }

          this.ropeSoftBody.setFriction(1)
          this.ropeSoftBody.setRollingFriction(1)

          this.initInput()


          const armParams = {
            mass: 1,
            z: 2,
            height: 0.7,
            width: 0.1,
            depth: 0.4,
            collisionFlags: 2
          }
          const addArm = x => {
            const arm = this.physics.add.box({
              ...armParams,
              x
            })
            arm.body.setFriction(1)
            arm.body.setDamping(0.5,0.5);
            return arm
          }
          this.leftArm = addArm(-0.3)
          this.rightArm = addArm(0.3)
          this.leftArm.name = "leftArm"
          this.rightArm.name = "rightArm"



          // ROBOT PART
          let previousObject;
          const basePosition = {x:0, y:0, z:0.63}
          let key = 'base'

          // this.loadGLBFile("./object/base.glb", 'base', {x:basePosition.x, y:basePosition.y, z:basePosition.z}, {x:0, y:0, z:0}, 2)

          // this.loadGLBFile('./object/plate.glb', 'leftPlate', 2, {x:ropePos.x + 0.2, y:ropePos.y, z:ropePos.z-ropeLength-0.25}, {x:Math.PI/2, y:Math.PI/4, z:0}, 3)

          // if(key === 'base')
          // {
          //   object.position.set(basePosition.x, basePosition.y, basePosition.z)
          //   object.rotation.set(Math.PI/2, 0, 0)
          // }

          // if(key ==='link1')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['y'], 
          //                         previousObject.position.z + partJoint.position['z'])
          //   object.rotation.set(0, 0, Math.PI)
          // }
          // else if( key === 'link2')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['y'], 
          //                         previousObject.position.z + partJoint.position['z'])
          //   object.rotation.set(0, -Math.PI/2, 0)
          // }
          // else if( key === 'link3')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['z'], 
          //                         previousObject.position.y + partJoint.position['y'], 
          //                         previousObject.position.z + partJoint.position['x'])
          //   object.rotation.set(Math.PI, 0, 0)
          // }
          // else if( key === 'link4')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['z'], 
          //                         previousObject.position.z + partJoint.position['y'])
          //   object.rotation.set(-Math.PI/2, 0, 0)
          // }
          // else if( key === 'link5')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['z'], 
          //                         previousObject.position.z + partJoint.position['y'])
          // }
          // else if( key === 'link6')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['z'], 
          //                         previousObject.position.z - partJoint.position['y'])
          // object.rotation.set(-Math.PI/2, 0, 0)
          // }
          // else if( key === 'link_eef')
          // {
          //   object.position.set(  previousObject.position.x + partJoint.position['x'], 
          //                         previousObject.position.y + partJoint.position['z'], 
          //                         previousObject.position.z - partJoint.position['y'])
          //   object.rotation.set(-Math.PI/2, 0, 0)
          // }



          // ROBOT PART END

        }

        loadGLBFile(url, name, position = {x: number, y: number, z: number}, rotation = {x: number, y: number, z: number}, collisionFlags)
        {
          this.load.gltf(url).then(gltf => {

            let object = new ExtendedObject3D()
            const mesh = gltf.scene.children[0]

            object.position.set(position.x, position.y, position.z)
            object.rotation.set(rotation.x, rotation.y, rotation.z)

            
            object.name = name;
            this[name] = object

            object.add(mesh)
            this.add.mesh(this[name])

            this.physics.add.existing(this[name], { collisionFlags: collisionFlags, shape: 'mesh', mass : 1})    // mass = 0 => kinematics mesh
            this[name].body.setFriction(1)

          });
        }

        update(time) 
        {

          for (let i = 0; i < this.pulley.length; i++) {
              this.pulley[i].rotation.y = pulleyRotValue;
              this.pulley[i].position.setX(pulleyPos.x); 
              this.pulley[i].position.setY(i === 0 ? pulleyPos.y : (i===1? pulleyPos.y + 4 * pulleyHeight/6:pulleyPos.y - 4 * pulleyHeight/6)); 
              this.pulley[i].position.setZ(pulleyPos.z);
              this.pulley[i].body.needUpdate = true
          }

          if (brickSpawn===true)
           { 
            this.leftArm.position.set(  this.brick.position.x,
                                        this.brick.position.y,
                                        this.brick.position.z 
                                      )
            this.leftArm.translateX(armPos)

            this.rightArm.position.set( this.brick.position.x,
                                        this.brick.position.y,
                                        this.brick.position.z 
                                      )
            this.rightArm.translateX(-armPos)

            this.leftArm.quaternion._w = this.brick.quaternion.w 
            this.leftArm.quaternion._x = this.brick.quaternion.x
            this.leftArm.quaternion._y = this.brick.quaternion.y
            this.leftArm.quaternion._z = this.brick.quaternion.z

            this.rightArm.quaternion._w = this.brick.quaternion.w 
            this.rightArm.quaternion._x = this.brick.quaternion.x
            this.rightArm.quaternion._y = this.brick.quaternion.y
            this.rightArm.quaternion._z = this.brick.quaternion.z

            this.leftArm.body.needUpdate = true
            this.rightArm.body.needUpdate = true                      

            // /*** Friction with air ***/ 
            this.brick.body.applyForceX(- 0.05* this.brick.body.velocity.x * 1 * this.physics.physicsWorld.getWorldInfo().air_density )
            this.brick.body.applyForceY(- 0.05* this.brick.body.velocity.y * 1 * this.physics.physicsWorld.getWorldInfo().air_density )
            this.brick.body.applyForceZ(- 0.05* this.brick.body.velocity.z * 1 * this.physics.physicsWorld.getWorldInfo().air_density )
          }
          
        }

        addBrick = (position = {x: number, y: number, z: number}, rotation = {x: number, y: number, z: number}, scale, collisionFlags)=> {
          const brick = this.physics.add.box({
            mass: 10,
            x: position.x,
            y: position.y,
            z: position.z,
            height: 0.22*scale,
            width: 0.105*scale,
            depth: 0.06*scale,
            collisionFlags: collisionFlags,
            scale: scale,
          })
          brick.body.setFriction(1)
          brick.body.setDamping(0.5,0.5);
          return brick
        }

        initInput()
        {
          window.addEventListener(
            "keydown",
            (event) => {
              switch (event.code) {
                case "KeyS":
                case "ArrowDown":
                  // Handle "back"
                  pulleyPos.y -= 0.01;
                  break;
                case "KeyW":
                case "ArrowUp":
                  // Handle "forward"
                  pulleyPos.y += 0.01;
                  break;
                case "KeyA":
                case "ArrowLeft":
                  // Handle "turn left"
                  pulleyPos.x -= 0.01;
                  break;
                case "KeyD":
                case "ArrowRight":
                  // Handle "turn right"
                  pulleyPos.x += 0.01;
                  break;

                case "Shift":
                case "ShiftRight": 
                  // deleate last anchor
                  this.ropeSoftBody.m_anchors.pop_back()
                  break;

                case "KeyP":
                  if(armBrickCollision===false)     //stop when hot the brick
                  {
                    armPos -=0.01
                  }  
                  // this.leftArm.body.applyForceX(1)
                  // this.rightArm.body.applyForceX(-1)
                  break;

                case "Semicolon":
                  armPos +=0.01
                  // this.leftArm.body.applyForceX(-1)
                  // this.rightArm.body.applyForceX(1)
                  break; 

                case "Enter": 
                  this.brick = this.addBrick(
                    {
                      x:this.ropeSoftBody.m_nodes.at((ropeBodyUse === true ) ? ropeNumSegmentsY : 0).m_x.x(), 
                      y:this.ropeSoftBody.m_nodes.at((ropeBodyUse === true ) ? ropeNumSegmentsY : 0).m_x.y(), 
                      z:this.ropeSoftBody.m_nodes.at((ropeBodyUse === true ) ? ropeNumSegmentsY : 0).m_x.z()-0.03*4
                    }, 
                    {
                      x: 5,
                      y: 2, 
                      z: 1
                    }, 
                    4,
                    0
                  );
                  console.log(this.brick.rotation)
                  brickSpawn = true;
                  this.brick.body.on.collision((otherObject, event) => {
                    if (otherObject.name !== 'ground')
                    {
                      if(otherObject.name === 'leftArm' && event === 'collision')
                      {
                        leftArmCollision = true;
						// sendMessage("collision \o/ avec le bras gauche")		// TODO send message with websocket
                      }
                      else if(otherObject.name === 'leftArm' && event === 'end')
                      {
                        leftArmCollision = false;
                      }
                      if(otherObject.name === 'rightArm' && event === 'collision')
                      {
                        rightArmCollision = true;
						// sendMessage("collision \o/ avec le bras droit")
                      }
                      else if(otherObject.name === 'rightArm' && event === 'end')
                      {
                        rightArmCollision = false;
                      }

                      if(leftArmCollision === true && rightArmCollision === true)
                      {
                        armBrickCollision = true
						// sendMessage("collision \o/ avec les deux bras")
                      }
                      else
                      {
                        armBrickCollision = false
                      }
                    }
                  })
                  this.ropeSoftBody.appendAnchor((ropeBodyUse === true ) ? ropeNumSegmentsY : 0, this.brick.body.ammo, false, 1)
                break;

                case "+":
                case "NumpadAdd":
                    pulleyRotValue += 0.01 
                break;

                case "-":
                case "NumpadSubtract":
                    pulleyRotValue -= 0.01           
                break;
              }
            }
          );
        }


      }

      PhysicsLoader('../lib/ammo/kripken', () => new Project({ gravity: { x: 0, y: 0, z: -9.81 }, scenes: [MainScene], softBodies: true }))

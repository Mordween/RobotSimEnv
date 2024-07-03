// import {OrbitControls} from '/js/vendor/examples/jsm/controls/OrbitControls.js'
import {Compound, Shape, FPS, SimTime, Slider, Button, Label, Select, Checkbox, Radio} from './lib.js'
// import { STLLoader } from './vendor/examples/jsm/loaders/STLLoader.js'
// import { start } from 'repl';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

let fps = new FPS(document.getElementById('fps'));
let sim_time = new SimTime(document.getElementById('sim-time'));


// const viewer = new GaussianSplats3D.Viewer({
// 	'cameraUp': [0.01933, -0.75830, -0.65161],
// 	'initialCameraPosition': [1.54163, 2.68515, -6.37228],
// 	'initialCameraLookAt': [0.45622, 1.95338, 1.51278],
// 	'sphericalHarmonicsDegree': 2,
// 	'sharedMemoryForWorkers' : false, 
// });
// let path = './js/splats/point_cloud.ply';

// let path = './js/splats/bonsai.ksplat';

function getElementByName(array, name) {
    return [array.find(element => element.name === name), array.findIndex(element => element.name === name)];
}

let camera, scene, renderer, controls;

// Array of all the robots in the scene
let agents = [];
let compounds = [];
let shapes = [];
let custom_elements = [];


let recorder = null;
let recording = false;
let framerate = 20;
let autoclose = true;

let shaftHeight = 0.3785
// let shaftRad = 0.25 	
// let shaftRad = 0.33 
let shaftRad = 0.01		// for the cube		
let pulleyRadMin = 150
let pulleyRadMax = 200
let pulleyHeightMax = 50
let pulleyHeightMin = 100
let brickHeight = 0.3

// Open the connection to python
//let port = parseInt(window.location.pathname.slice(1));

class WebSocketCom {
	constructor(port) {
		this.port = port;
		this.ws = new WebSocket("ws://localhost:" + this.port + "/");
		this.connected = false;

		// Bind the context of 'this' to the class instance for these methods
		this.onOpen = this.onOpen.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onMessage = this.onMessage.bind(this);
	}

	Init() {
		this.ws.onopen = this.onOpen;
		this.ws.onclose = this.onClose;
		this.ws.onmessage = this.onMessage;
	}

	onOpen(event) {
		this.connected = true;
		this.ws.send('Connected');
		console.log('Connection opened');
		startSim(event.data);
	}

	onClose(event) {
		if (recording) {
			stopRecording();
		}

		if (autoclose) {
			setTimeout(() => {
				window.close();
			}, 5000);
		}
	}

	onMessage(event) {
		console.log(event.data);
		let eventdata = JSON.parse(event.data);
		let func = eventdata[0];
		let data = eventdata[1];
		console.log("data", data)
		try {
			console.log("scene", scene)
		  } catch (error) {
			console.log("skipping step", error);
		  }
		if (func === 'shape') {
			let compound = new Compound(scene);
			// Assuming data is a list of shapes
			let collision_enable = data[0];
            let collisionFlags = data[1];
			let mass = data[2];
			for (let shapeData of data.slice(3)) {
				compound.add_shape(shapeData, collision_enable, collisionFlags, mass);
			}
			
			compound.id = compounds.length;
			compounds.push(compound);
			console.log("Compound: ", compound);
			this.ws.send(compound.id); // Send the index of the first newly added shape

		} else if (func === 'shape_mounted') {
			let id = 1;
			this.ws.send(id);
		} else if (func === 'remove_shape') {
			let shape = shapes[data];
			shape.remove(scene);
			renderer.renderLists.dispose();
			shapes[data] = null;
			this.ws.send(0);
		} else if (func === 'shape_poses') {
			for (let shapeData of data) {
				let id = shapeData[0];
				let poses = shapeData[1];
				console.log("id: ", id);
				console.log("poses: ", poses);
				compounds[id].set_poses(poses);					// -------------------------------------------------------
			}
			let jsonString = JSON.stringify([]);
			this.ws.send(jsonString);
		} else if (func === 'is_loaded') {
			let loaded = agents[data].isLoaded();
			this.ws.send(loaded);
		} else if (func === 'sim_time') {
			sim_time.display(parseFloat(data));
			let jsonString = JSON.stringify([]);
			this.ws.send(jsonString);
		} else if (func === 'start_recording') {
			startRecording(parseFloat(data[0]), data[1], data[2]);
			this.ws.send(0);
		} else if (func === 'stop_recording') {
			stopRecording();
			
			setTimeout(() => {
				this.ws.send(0);
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
			this.ws.send(0);
		} else if (func === 'check_elements') {
			let ret = {};

			for (let i = 0; i < custom_elements.length; i++) {
				if (custom_elements[i].changed === true) {
					ret[custom_elements[i].id] = custom_elements[i].data;
					custom_elements[i].changed = false;
				}
			}
			this.ws.send(JSON.stringify(ret));
		} else if (func === 'update_element') {
			let id = data.id;

			for (let i = 0; i < custom_elements.length; i++) {
				if (custom_elements[i].id === id) {
					custom_elements[i].update(data);
					break;
				}
			}

			this.ws.send(0);
		} 
        else if (func === 'rope') 
		{
			if(data === 'add')
			{
				scene.createRope()
			}
			else if(data === 'pop')
			{
				scene.popRope()
			}
			else
			{
				console.log("This fonction is not implemented! ")
			}


			this.ws.send(0);
		}
		else if (func === 'shaft') 
		{
			if(data[0] === 'add')
			{
				let position = data[1];
				let scale = data[2];
				scene.createPulley(position, scale);
			}
			else if(data[0] === 'rotation')
			{
				let pulleyRotValue = data[1]
				for (let i = 0; i < scene.pulley.length; i++) {
					scene.pulley[i].rotation.y = pulleyRotValue;
					scene.pulley[i].body.needUpdate = true
				}
			}
			else
			{
				console.log("This fonction is not implemented! ")
			}

			this.ws.send(0);
		}
		else if (func === 'brickwall') 
			{
				if(data[0] === 'add')
				{
					let position = data[1];
					let scale = data[2];
					let collisionFlags = data[3]
					scene.createWall(position, scale, collisionFlags);
				}
				else
				{
					console.log("This fonction is not implemented! ")
				}
	
				this.ws.send(0);
			} 
	}
}

let webSocs = new WebSocketCom(53000);
webSocs.Init();


function startSim(port) {
	console.log("port", port)
	init();
	// window.addEventListener('resize', on_resize, false);
}


// function on_resize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }


function startRecording(frate, name, format) {
	if (!recording) {

		if (format === 'gif') {
			autoclose = false;
		}

		recorder = new CCapture({
			verbose: false,
			display: true,
			framerate: frate,
			quality: 100,
			format: format,
			name: name,
			workersPath: 'js/vendor/build/'
		});
		recording = true;
		recorder.start();
	};
}


function stopRecording() {
	recorder.stop();
	recorder.save();
	recording = false;
}


function init()
{

	const { Project, Scene3D, PhysicsLoader, THREE, ExtendedObject3D } = ENABLE3D

	class MainScene extends Scene3D {

		async create() {
			this.brickWallDone = false
			
			const { orbitControls } = await this.warpSpeed()

			// this.camera.position.set(0.5, -3, 0.5)
			this.camera.position.set(1.2, 1.2, 0.5)
			orbitControls?.target.set(0, 2.5, 0)
			// this.camera.lookAt(0.5, 0, 0)
			this.camera.lookAt(0, 0, 0)

			// enable physics debugging
			this.physics.debug?.enable()

			// world axis 
			const axesHelper = new THREE.AxesHelper( 5 );
			axesHelper.setColors(new THREE.Color(255, 0, 0), new THREE.Color(0, 255, 0), new THREE.Color(0, 0, 255))    // in order to know which axis is the right axis
			this.scene.add( axesHelper );

			// viewer.addSplatScene(path, {
			// 	'streamView': true
			// })
			// .then(() => {
			// 	// viewer.start();
			// 	console.log("this scene", this)
			// 	// this.add(viewer);
			// });

			scene = this
		}
	

		update(time) 
		{	
			if(this.brickWallDone === true)					// bricks continu to slide D: 
			{
				for(let i=0; i<12; i++)
				{
					this.brickWall[i].body.applyForceX(-  this.brickWall[i].body.velocity.x )
					this.brickWall[i].body.applyForceY(-  this.brickWall[i].body.velocity.y )
					this.brickWall[i].body.applyForceZ(-  this.brickWall[i].body.velocity.z )
				}
			}

        }
		createPulley(position, scale)
		{
			const pulleyData = [
				{x: position[0]													, y: position[1], 	z: position[2], height: pulleyHeightMin*scale, radiusTop: pulleyRadMin*scale, radiusBottom: pulleyRadMin*scale},    
				{x: position[0] + ((pulleyHeightMax + pulleyHeightMin)*scale)/2 , y: position[1],	z: position[2], height: pulleyHeightMax*scale, radiusTop: pulleyRadMax*scale, radiusBottom: pulleyRadMax*scale},
				{x: position[0] - ((pulleyHeightMax + pulleyHeightMin)*scale)/2	, y: position[1],	z: position[2], height: pulleyHeightMax*scale, radiusTop: pulleyRadMax*scale, radiusBottom: pulleyRadMax*scale},
				]
				let pos = 0
				this.pulley = pulleyData.map(d => {
					let cylinder = this.add.cylinder(d) 
					cylinder.rotation.z = Math.PI/2
					this.physics.add.existing(cylinder, { shape: 'convex', collisionFlags :(pos === 0?2:2), mass: 100000 })
					pos = 1
					return cylinder
				});

		}
		createRope()
		{

			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setX(0)
			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setY(0)
			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setZ(-9.81)
			// this.physics.physicsWorld.getWorldInfo().get_m_gravity().setZ(0)

			let [bricks, bricksNum] = getElementByName(this.scene.children, 'brick');
            // let [shaft, shaftNum] = getElementByName(this.scene.children, 'shaft3');
			let [shaft, shaftNum] = getElementByName(this.scene.children, 'Cube');
			// let shaft = this.pulley[0]
			// let [shaft, shaftNum] = getElementByName(this.scene.children, 'shaftCenter');
			// let [shaft, shaftNum] = getElementByName(this.scene.children, 'shaftCenterC');

			console.log(shaft)
			console.log(bricks)

			// rope parameters
			const ropePos =  new THREE.Vector3();
			// ropePos.x = shaft.position.x
			// ropePos.y = shaft.position.y
			// ropePos.z = shaft.position.z - shaftRad

			ropePos.x = bricks.position.x
			ropePos.y = bricks.position.y
			ropePos.z = shaft.position.z - shaftRad

			const ropeWidth = 0.01
			const ropeLength = ropePos.z - bricks.position.z - brickHeight/2
			
			console.log("rope length", ropeLength)
			const ropeNumSegmentsY = 1
			const ropeNumSegmentsZ = 50


			const ropeGeometry = new THREE.PlaneGeometry(ropeWidth, ropeLength, ropeNumSegmentsY, ropeNumSegmentsZ)
			const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000, side: THREE.DoubleSide })

			this.rope = new THREE.Mesh(ropeGeometry, ropeMaterial)

			this.rope.castShadow = true
			this.rope.receiveShadow = true
			
			const softBodyHelpers = new Ammo.btSoftBodyHelpers()
			this.ropeSoftBody
			

			const ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
			const ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y , ropePos.z - ropeLength );

			this.ropeSoftBody = softBodyHelpers.CreateRope( 
				this.physics.physicsWorld.getWorldInfo(), 
				ropeStart, 
				ropeEnd, 
				ropeNumSegmentsZ - 1, 
				0 
			);

			const sbConfig = this.ropeSoftBody.get_m_cfg()
			sbConfig.set_viterations(100)
			sbConfig.set_piterations(100)       // the rope is no longer elastic

			console.log(this.ropeSoftBody)

			this.ropeSoftBody.setTotalMass(1, false)                  
			// @ts-ignore
			Ammo.castObject(this.ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.04) 
			this.physics.physicsWorld.addSoftBody(this.ropeSoftBody, 1, -1)

			this.rope.userData.physicsBody = this.ropeSoftBody
			
			// Disable deactivation
			this.ropeSoftBody.setActivationState(4)

			this.ropeSoftBody.appendAnchor(0, this.scene.children[shaftNum].body.ammo, false, 1)
			this.ropeSoftBody.appendAnchor(ropeNumSegmentsZ, this.scene.children[bricksNum].body.ammo, false, 1)


		}
		popRope()
		{
			this.ropeSoftBody.m_anchors.pop_back()
		}

		createWall(position, scale, collisionFlags)
		{

	// 		# for i in range(4):
    // 		#     for j in range(3):
	// 		#         if not (i==3 and j==0):
	// 		#             b = copy.copy(brickWall)
	// 		#             b.T = SE3(0, 0.2 + 0.06*j, 0.16+0.03*i)
	// 		#             env.add(b, collision_enable = False, collisionFlags = 2)
			const quat = new THREE.Quaternion();

			// this.rigidBodies = []

			this.brickWall = []
			for(let i = 0; i < 4; i++)
			{
				for(let j = 0; j < 3; j++)
				{
					if(!( i == 3 && j == 0))
					{
						// let pos = new THREE.Vector3();
						// pos.x = position[0]
						// pos.y = position[1]
						// pos.z = position[2]

						// this.brickWall[i*3+j] = this.createParalellepiped(30*scale, 60*scale, 40*scale, 10, pos, quat, new THREE.MeshPhongMaterial( { color: 323232 } ))
						// brick.castShadow = true;
						// brick.receiveShadow = true;


						this.brickWall[i*3+j] = this.physics.add.box({
							mass: 1000000000000000000,
							x: position[0],
							y: position[1] + 60*scale*j,
							z: position[2] + 30*scale*i,
							height: 60*scale,
							width: 40*scale,
							depth: 30*scale,
							collisionFlags: collisionFlags,
							},
							{ 	
							lambert: { color: 0x323232 } 
						})	
						this.brickWall[i*3+j].body.ammo.setActivationState(0)

						this.brickWall[i*3+j].body.setFriction(0)
						this.brickWall[i*3+j].body.ammo.setRollingFriction(1)
						this.brickWall[i*3+j].body.setRestitution(0)
						this.brickWall[i*3+j].body.setBounciness(0)
						this.brickWall[i*3+j].body.setDamping(1, 1)

						this.brickWall[i*3+j].castShadow = true;
						this.brickWall[i*3+j].receiveShadow = true;

					}
				}
			}

			this.brickWallDone === true

		}

		createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

			const threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
			const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
			shape.setMargin( 0.05 );

			this.createRigidBody( threeObject, shape, mass, pos, quat );

			return threeObject;

		}

		createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

			threeObject.position.copy( pos );
			threeObject.quaternion.copy( quat );

			const transform = new Ammo.btTransform();
			transform.setIdentity();
			transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
			transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
			const motionState = new Ammo.btDefaultMotionState( transform );

			const localInertia = new Ammo.btVector3( 0, 0, 0 );
			physicsShape.calculateLocalInertia( mass, localInertia );

			const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
			const body = new Ammo.btRigidBody( rbInfo );

			threeObject.userData.physicsBody = body;

			this.scene.add( threeObject );

			if ( mass > 0 ) {

				this.rigidBodies.push( threeObject );

				// Disable deactivation
				body.setActivationState( 4 );

			}

			this.physics.addExisting( body );

		}



	}
	PhysicsLoader('../lib/ammo/kripken', () => new Project({ gravity: { x: 0, y: 0, z: -9.81 }, scenes: [MainScene], softBodies: true }))
}
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
    return array.find(element => element.name === name);
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
let shaftRad = 0.01

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
		if (func === 'shape') {
			let compound = new Compound(scene);
			// Assuming data is a list of shapes
			let collision_enable = data[0];
            let collisionFlags = data[1];
			for (let shapeData of data.slice(2)) {
				compound.add_shape(shapeData, collision_enable, collisionFlags);
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
        else if (func === 'rope') {
			if(data === 'add')
			{
				scene.createRope()
			}
			else
			{
				console.log("t'as pas add")
			}

            // console.log(scene)
            // let brique = getElementByName(scene.scene.children, 'brick')    
            // console.log(brique)
            // let shaft = getElementByName(scene.scene.children, 'shaft')
            // console.log(shaft)

            // // The rope
            // const ropeWidth = 0.001
            // const ropeLength =  (shaftHeight + shaft.position.z - brique.position.z) //(shaft.position.z - brique.position.z)
			// console.log("length", (shaftHeight + shaft.position.z - brique.position.z))
			// console.log("position", shaft.position, brique.position)
            // const ropeNumSegmentsZ = 1
            // const ropeNumSegmentsY = 50


            // const ropeGeometry = new THREE.PlaneGeometry(ropeWidth, ropeLength, ropeNumSegmentsZ, ropeNumSegmentsY)

			// const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
            // scene.rope = new THREE.Mesh(ropeGeometry, ropeMaterial)
			// scene.rope.castShadow = true
			// scene.rope.receiveShadow = true
			// // scene.scene.add(scene.rope)

            // const softBodyHelpers = new Ammo.btSoftBodyHelpers()
			// scene.ropeSoftBody

            // const ropeStart = new Ammo.btVector3( (shaft.position.x+2), (shaft.position.y+2), (shaft.position.z+5));
			// const ropeEnd = new Ammo.btVector3( (shaft.position.x+2), (shaft.position.y +2), (shaft.position.z - ropeLength +5));
			// scene.ropeSoftBody = softBodyHelpers.CreateRope( 
			// 	scene.physics.physicsWorld.getWorldInfo(), 
			// 	ropeStart, 
			// 	ropeEnd, 
			// 	ropeNumSegmentsY - 1, 
			// 	0 
			// 	);

            // const sbConfig = scene.ropeSoftBody.get_m_cfg()
			// sbConfig.set_viterations(100)
			// sbConfig.set_piterations(100)       // the rope is no longer elastic

			// scene.ropeSoftBody.setTotalMass(100, false)                  
			// // @ts-ignore
			// Ammo.castObject(scene.ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.04) 
			// scene.physics.physicsWorld.addSoftBody(scene.ropeSoftBody, 1, -1)

			// scene.rope.userData.physicsBody = scene.ropeSoftBody

			// scene.ropeSoftBody.setActivationState(4)

            // // scene.ropeSoftBody.appendAnchor(0, shaft.body.ammo, false, 1)
            // // scene.ropeSoftBody.appendAnchor(ropeNumSegmentsY, brique.body.ammo, false, 1)

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

			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setX(0)
			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setY(0)
			this.physics.physicsWorld.getWorldInfo().get_m_gravity().setZ(-9.81)      // FIX soft body Gravity

			scene = this
		}
	

		update(time) 
		{	

        }

		createRope()
		{
			let bricks = getElementByName(scene.scene.children, 'brick')    
            let shaft = getElementByName(scene.scene.children, 'shaft')

			// rope parameters
			const ropePos =  new THREE.Vector3();
			ropePos.x = shaft.position.x
			ropePos.y = shaft.position.y
			ropePos.z = shaft.position.z + shaftHeight - shaftRad

			const ropeWidth = 0.001
			const ropeLength = ropePos.z - bricks.position.z - shaftRad
			const ropeNumSegmentsY = 1
			const ropeNumSegmentsZ = 5000


			const ropeGeometry = new THREE.PlaneGeometry(ropeWidth, ropeLength, ropeNumSegmentsY, ropeNumSegmentsZ)
			const ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })

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
				ropeNumSegmentsY - 1, 
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

			this.ropeSoftBody.appendAnchor(0, shaft.body.ammo, false, 1)

		}


	}
	PhysicsLoader('../lib/ammo/kripken', () => new Project({ gravity: { x: 0, y: 0, z: -9.81 }, scenes: [MainScene], softBodies: true }))
}
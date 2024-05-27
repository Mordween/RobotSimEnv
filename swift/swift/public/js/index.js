


// // const tr = THREE;
// // const zerorpc = require("zerorpc");
// // const fs = require('fs');
// // // import {  } from 'app:../node_modules/ccapture.js/build/CCapture.all.min.js';
// // // import {CCapture} from 'app:../node_modules/ccapture.js/build/CCapture.all.min.js' 
// // // const HoloPlay = require("holoplay");
// // import * as tr from './vendor/three.module.js'

import {OrbitControls} from './vendor/examples/jsm/controls/OrbitControls.js'
import {Compound, Shape, FPS, SimTime, Slider, Button, Label, Select, Checkbox, Radio} from './lib.js'
import { STLLoader } from './vendor/examples/jsm/loaders/STLLoader.js'
// // import { start } from 'repl';


console.log("it's work")
// let fps = new FPS(document.getElementById('fps'));
// let sim_time = new SimTime(document.getElementById('sim-time'));

// let camera, scene, renderer, controls;

// // Array of all the robots in the scene
// let agents = [];
// let compounds = [];
// let shapes = [];
// let custom_elements = [];

// let connected = false;

// // Open the connection to python
// //let port = parseInt(window.location.pathname.slice(1));
// let port = 53000;
// let ws = new WebSocket("ws://localhost:" + port + "/")

// let recorder = null;
// let recording = false;
// let framerate = 20;
// let autoclose = true;



// ws.onopen = function(event) {
// 	connected = true;
// 	ws.send('Connected');
// 	console.log('Connection opened');
// 	startSim(event.data);
// }


// ws.onclose = function(event) {

// 	if (recording) {
// 		stopRecording();
// 	}

// 	if (autoclose) {
// 		setTimeout(
// 			function() {
// 				window.close();
// 			}, 5000);
// 	}
// }


// function startSim(port) {
// 	init()
// 	animate();
// 	window.addEventListener('resize', on_resize, false);
// }


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


// ws.onmessage = function (event) {
// 	console.log(event.data)
// 	let eventdata = JSON.parse(event.data)
// 	let func = eventdata[0]
// 	let data = eventdata[1]
// 	if (func === 'shape') {
// 		let compound = new Compound(scene);
// 		// Assuming data is a list of shapes
// 		for (let shapeData of data) {
// 			// Create a new shape object based on the shape data
			
// 			compound.add_shape(shapeData);
// 			//let shape = new Shape(scene, shapeData);
// 			 // Set the shape's id to the current length of the shapes array
// 			 // Add the shape to the shapes array
// 		}
		
// 		compound.id = compounds.length;
// 		compounds.push(compound);
// 		console.log("Compound: ", compound)
// 		// Send a confirmation message back to the server
// 		ws.send(compound.id); // Send the index of the first newly added shape
	
// 	} else if (func === 'shape_mounted') {
// 		let id = 1;
// 		ws.send(id);
// 	} else if (func === 'remove_shape') {
// 		let shape = shapes[data]
// 		shape.remove(scene)
// 		renderer.renderLists.dispose();
// 		shapes[data] = null;
// 		ws.send(0);
// 	} else if (func === 'shape_poses') {
// 		for (let shapeData of data) {
// 			let id = shapeData[0];
// 			let poses = shapeData[1];
// 			console.log("id: ", id)
// 			console.log("poses: ", poses)
// 			compounds[id].set_poses(poses);
// 		}
// 		let jsonString = JSON.stringify([]);
// 		ws.send(jsonString);
// 	} else if (func === 'is_loaded') {
// 		let loaded = agents[data].isLoaded();
// 		ws.send(loaded);
// 	} else if (func === 'sim_time') {
// 		sim_time.display(parseFloat(data));
// 		let jsonString = JSON.stringify([]);
// 		ws.send(jsonString);
// 	} else if (func === 'start_recording') {
// 		startRecording(parseFloat(data[0]), data[1], data[2]);
// 		ws.send(0);
// 	} else if (func === 'stop_recording') {
// 		stopRecording();
		
// 		setTimeout(
// 			function() {
// 				ws.send(0);
// 			}, 5000);
// 	} else if (func === 'add_element') {
// 		let element = data.element;

// 		if (element === 'slider') {
// 			custom_elements.push(new Slider(data));
// 		} else if (element === 'button') {
// 			custom_elements.push(new Button(data));
// 		} else if (element === 'label') {
// 			custom_elements.push(new Label(data));
// 		} else if (element === 'select') {
// 			custom_elements.push(new Select(data));
// 		} else if (element === 'checkbox') {
// 			custom_elements.push(new Checkbox(data));
// 		} else if (element === 'radio') {
// 			custom_elements.push(new Radio(data));
// 		}
// 		ws.send(0);
// 	} else if (func === 'check_elements') {
// 		let ret = {};

// 		for (let i = 0; i < custom_elements.length; i++) {
// 			if (custom_elements[i].changed === true) {
// 				ret[custom_elements[i].id] = custom_elements[i].data;
// 				custom_elements[i].changed = false;
// 			}
// 		}
// 		ws.send(JSON.stringify(ret));
// 	} else if (func === 'update_element') {
// 		let id = data.id;

// 		for (let i = 0; i < custom_elements.length; i++) {
// 			if (custom_elements[i].id === id) {
// 				custom_elements[i].update(data);
// 				break;
// 			}
// 		}

// 		ws.send(0);
// 	}
// };

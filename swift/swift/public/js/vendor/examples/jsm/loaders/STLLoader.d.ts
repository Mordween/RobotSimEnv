import {
	BufferGeometry,
	AnimationClip,
	Camera,
	Group,
	Loader,
	LoadingManager,
	Object3D,
	Material,
	Texture
} from '../../../src/Three';


// export interface STL {
// 	animations: AnimationClip[];
// 	scene: Group;
// 	scenes: Group[];
// 	cameras: Camera[];
// 	asset: {
// 		copyright?: string;
// 		generator?: string;
// 		version?: string;
// 		minVersion?: string;
// 		extensions?: any;
// 		extras?: any;
// 	};
// 	parser: STLParser;
// 	userData: any;
// }

export class STLLoader extends Loader {

	constructor( manager?: LoadingManager );

	load( url: string, onLoad: ( geometry: BufferGeometry ) => void, onProgress?: ( event: ProgressEvent ) => void, onError?: ( event: ErrorEvent ) => void ) : void;
	parse( data: ArrayBuffer | string ) : BufferGeometry;

}

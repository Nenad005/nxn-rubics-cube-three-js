import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

export default class SceneInit {
    scene: THREE.Scene | undefined;
    camera: THREE.PerspectiveCamera | undefined;
    renderer: THREE.WebGLRenderer | undefined;
    fov: number;
    nearPlane: number;
    farPlane: number;
    canvasId: string;
    clock: THREE.Clock | undefined;
    stats: Stats | undefined;
    controls: OrbitControls | undefined;
    ambientLight: THREE.AmbientLight | undefined;
    directionalLight: THREE.DirectionalLight | undefined;
    updateCallbacks: Array<() => void> = [];
    

    constructor(canvasId: string) {
        this.scene = undefined;
        this.camera = undefined;
        this.renderer = undefined;

        // NOTE: Camera params;
        this.fov = 45;
        this.nearPlane = 1;
        this.farPlane = 2000;
        this.canvasId = canvasId;

        // NOTE: Additional components.
        this.clock = undefined;
        this.stats = undefined;
        this.controls = undefined;

        // NOTE: Lighting is basically required.
        this.ambientLight = undefined;
        this.directionalLight = undefined;
    }

    initialize() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        this.camera.position.z = 60;
        this.camera.position.y = 30;

        const loader = new THREE.CubeTextureLoader();
        loader.setPath('src/assets/cm2/')
        const textureCube = loader.load([
            'posx.jpg', 'negx.jpg',
            'posy.jpg', 'negy.jpg',
            'posz.jpg', 'negz.jpg'
        ], 
        () => console.log('Cubemap loaded successfully'), undefined,
        (error) => console.error('Error loading cubemap:', error)
        );

        this.scene.background = textureCube

        const canvas : any = document.getElementById(this.canvasId);
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance", // Force GPU usage
            precision: "mediump", // Use medium precision for better performance
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        
        // GPU optimization settings
        this.renderer.sortObjects = false; // Disable automatic sorting for better performance
        this.renderer.info.autoReset = false; // Reduce overhead
        
        // this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0;
        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        // ambient light which is for the whole scene
        this.ambientLight = new THREE.AmbientLight(0x94b1b7, 2);
        this.scene.add(this.ambientLight);

        // directional light - parallel sun rays
        this.directionalLight = new THREE.DirectionalLight(0xfcf4c5, 3);
        // OPTIMIZATION: Disable shadows for better performance
        this.directionalLight.castShadow = false;
        const horizontalAngle = Math.PI/20
        const verticalAngle = Math.PI/32
        const len = 300;
        const sphericalCoords = new THREE.Vector3(
            len * Math.cos(verticalAngle) * Math.sin(horizontalAngle),
            len * Math.sin(verticalAngle),
            len * Math.cos(verticalAngle) * Math.cos(horizontalAngle),
        )
        this.directionalLight.position.set(sphericalCoords.x, sphericalCoords.y, sphericalCoords.z);
        this.scene.add(this.directionalLight);

        // let test = new THREE.DirectionalLightHelper(this.directionalLight, len/10, 0x000000);
        // this.scene.add(test)

        // if window resizes
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // NOTE: Load space background.
        // this.loader = new THREE.TextureLoader();
        // this.scene.background = this.loader.load('./pics/space.jpeg');

        // NOTE: Declare uniforms to pass into glsl shaders.
        // this.uniforms = {
        //   u_time: { type: 'f', value: 1.0 },
        //   colorB: { type: 'vec3', value: new THREE.Color(0xfff000) },
        //   colorA: { type: 'vec3', value: new THREE.Color(0xffffff) },
        // };
    }

    addUpdateCallback(callback: () => void) {
        this.updateCallbacks.push(callback);
    }

    animate() {
        // NOTE: Window is implied.
        // requestAnimationFrame(this.animate.bind(this));
        window.requestAnimationFrame(this.animate.bind(this));

        this.updateCallbacks.forEach(cb => cb());

        this.render();
        this.stats?.update();
        this.controls?.update();
    }

    render() {
        // NOTE: Update uniform data on each render.
        // this.uniforms.u_time.value += this.clock.getDelta();
        if (this.scene && this.camera)
        this.renderer?.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}
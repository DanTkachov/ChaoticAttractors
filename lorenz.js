import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
// import * as THREE from 'https://unpkg.com/three@0.118/build/three.module.js';
// import { EffectComposer } from 'https://unpkg.com/three@0.118/examples/jsm/postprocessing/EffectComposer.js'
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/AfterimagePass.js';
// import { AfterimagePass } from "three.module.js";

let camera, scene, renderer, circles, composer, renderScene, bloomPass;
let afterImagePass;
let NUM_SPHERES = 5000;

function init(){
    scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 1000);
    // this camera code is from stack overflow https://stackoverflow.com/questions/23450588/isometric-camera-with-three-js
    const aspect = window.innerWidth / window.innerHeight;
    const d = 30;
    camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 2000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    renderScene = new RenderPass(scene, camera);
    //resolution, strength, radius, threshold
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0,0)
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    afterImagePass = new AfterimagePass();
    afterImagePass.uniforms["damp"].value = .5;
    composer.addPass(afterImagePass);

    // Spawn in all the spheres (number of points) that we want
    const points = []
    for (let i = 0; i < NUM_SPHERES; i++){
        // let x = new THREE.SphereGeometry(0.04,3,3);
        // Using circles instead of Spheres now
        let x = new THREE.CircleGeometry(0.05, 3);
        points.push(x);
    }
    const light_mat = new THREE.MeshBasicMaterial( { color: 0x2a9d8f} );
    const dark_mat = new THREE.MeshBasicMaterial({color: 0x1d3557});
    circles = []
    for(let i =0; i < NUM_SPHERES; i++){
        let cube;
        i < NUM_SPHERES/2.5 ? cube = new THREE.Mesh(points[i], light_mat): cube = new THREE.Mesh(points[i], dark_mat)
        scene.add(cube);
        // cube.position.set(Math.random(), Math.random(), Math.random());
        if(i < NUM_SPHERES/2){
            cube.position.set(-Math.random(), -Math.random(), -Math.random());
        }else{
            cube.position.set(Math.random(), Math.random(), Math.random());
        }
        circles.push(cube);
    }

    camera.position.set( 0,0,-50 );
    camera.lookAt(scene.position)

    // By default, the circles wont look at the camera, so they wont be seen
    // This for loop forces all circles to look at the camera
    for(let i = 0; i < NUM_SPHERES; i++){
        circles[i].lookAt(camera.position);
    }
}

// Variables to control the attractor
let alpha = 1.4; // don't change; this is part of the math
let speed = 0.01; // dictates how fast particles move. value too high = offscreen
let deltatime;
function animate_lorenz() {
    // spawn in spheres until 60fps hit
    // see if i can spawn in spheres without rendering
    // swap to delta time
    // potentially user instanced mesh
    let time = Date.now()
    requestAnimationFrame( animate_lorenz ); //calculate
    composer.render( scene, camera );
    for(let i = 0; i < NUM_SPHERES; i++){
        let x = circles[i].position.x;
        let y = circles[i].position.y;
        let z = circles[i].position.z;
        circles[i].position.x += speed*(10.0 * (y-x));
        circles[i].position.y += speed*(circles[i].position.x * (30.0 - circles[i].position.z) - circles[i].position.y);
        circles[i].position.z += speed*(circles[i].position.x * circles[i].position.y - (8/3) * circles[i].position.z);
    }
    deltatime = Date.now() - time;
    console.log(deltatime)
}
init();
animate_lorenz();


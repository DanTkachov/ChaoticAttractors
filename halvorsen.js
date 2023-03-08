import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
// import * as THREE from 'https://unpkg.com/three@0.118/build/three.module.js';
// import { EffectComposer } from 'https://unpkg.com/three@0.118/examples/jsm/postprocessing/EffectComposer.js'
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/postprocessing/AfterimagePass.js';
// import { AfterimagePass } from "three.module.js";

let camera, scene, renderer, cubes, composer, renderScene, bloomPass;
let afterImagePass;
let NUM_SPHERES = 5000;

function init(){
    scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 1000);
    // this camera code is from stack overflow https://stackoverflow.com/questions/23450588/isometric-camera-with-three-js
    const aspect = window.innerWidth / window.innerHeight;
    const d = 14;
    camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    renderScene = new RenderPass(scene, camera);
    //resolution, strength, radius, threshold
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0,0)
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    // afterImagePass = new AfterimagePass();
    // afterImagePass.uniforms["damp"].value = .5;
    // composer.addPass(afterImagePass);

    // Spawn in all the spheres (number of points) that we want
    const points = []
    for (let i = 0; i < NUM_SPHERES; i++){
        let x = new THREE.SphereGeometry(0.04,3,3);
        points.push(x);
    }
    const light_mat = new THREE.MeshBasicMaterial( { color: 0x2a9d8f} );
    const dark_mat = new THREE.MeshBasicMaterial({color: 0x1d3557});
    cubes = []
    for(let i =0; i < NUM_SPHERES; i++){
        let cube;
        i < NUM_SPHERES/2.5 ? cube = new THREE.Mesh(points[i], light_mat): cube = new THREE.Mesh(points[i], dark_mat)
        scene.add(cube);
        cube.position.set(Math.random()/10, Math.random()/10, Math.random()/10);
        cubes.push(cube);
    }
    camera.position.set( -23.357, -16.4, -20.731 );

    camera.lookAt(scene.position)
}

// Variables to control the attractor
let alpha = 1.4; // don't change; this is part of the math
let speed = 0.01; // dictates how fast particles move. value too high = offscreen
let deltatime;
function animate_halvorsen() {
    // spawn in spheres until 60fps hit
    // see if i can spawn in spheres without rendering
    // swap to delta time
    // potentially user instanced mesh
    let time = Date.now()
    requestAnimationFrame( animate_halvorsen ); //calculate
    composer.render( scene, camera );
    for(let i = 0; i < NUM_SPHERES; i++){
        cubes[i].position.x += speed*(-alpha * cubes[i].position.x - 4*cubes[i].position.y - 4*cubes[i].position.z - (cubes[i].position.y * cubes[i].position.y));
        cubes[i].position.y += speed*(-alpha * cubes[i].position.y - 4*cubes[i].position.z - 4*cubes[i].position.x - (cubes[i].position.z * cubes[i].position.z));
        cubes[i].position.z += speed*(-alpha * cubes[i].position.z - 4*cubes[i].position.x - 4*cubes[i].position.y - (cubes[i].position.x * cubes[i].position.x));
    }
    deltatime = Date.now() - time;
    console.log(deltatime)
}

init();
animate_halvorsen();


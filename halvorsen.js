import * as THREE from 'three'
import { EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

let camera, scene, renderer, circles, trailMesh, composer, renderScene, bloomPass, trailLines;
let NUM_SPHERES = 200;
let TRAIL_LENGTH = 7;

// variables to count stats
let container = document.createElement('div');
container.style.cssText = 'position:fixed;top:0;left:0;color:red';
container.textContent = "hello:'";
container.style.display = 'block';

// initialize the simulation
function init(){
    scene = new THREE.Scene();
    // Below is the camera - switching away from isometric view produces a vastly different image
    // this camera code is from stack overflow https://stackoverflow.com/questions/23450588/isometric-camera-with-three-js
    const aspect = window.innerWidth / window.innerHeight;
    const d = 14;
    camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    renderScene = new RenderPass(scene, camera);
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);

    // Add a bloom effect to each point -
    //      in this simulation, is makes each point "bright"
    // https://en.wikipedia.org/wiki/Bloom_(shader_effect)
    //                                                    resolution, strength, radius, threshold
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.005,0)
    composer.addPass(bloomPass);

    // set the materials for the initial circles
    const light_mat = new THREE.MeshBasicMaterial( { color: 0x2a9d8f} );
    const circleGeo = new THREE.CircleGeometry(0.07, 8);
    circles = [];
    for(let i = 0; i < NUM_SPHERES; i++){
        let circle;
        circle = new THREE.Mesh(circleGeo, light_mat)
        scene.add(circle);
        circle.position.set(Math.random()/10, Math.random()/10, Math.random()/10);
        circles.push(circle);
    }

    // set in the materials for the trails
    const trail_mat = new THREE.MeshBasicMaterial( { color: 0x2a9d8f} );
    const trailCircleGeometry = new THREE.CircleGeometry(0.07, 8);

    trailMesh = [];
    for(let i = 0; i < NUM_SPHERES; i++){
        const circleTrailMeshes = [];

        for(let j = 0; j < TRAIL_LENGTH; j++){
            const trailCircle = new THREE.Mesh(trailCircleGeometry, trail_mat);
            scene.add(trailCircle);
            circleTrailMeshes.push(trailCircle);
        }
        trailMesh.push(circleTrailMeshes);
    }

    // set camera position and have every circle look at the camera
    camera.position.set( -23.357, -16.4, -20.731 );
    camera.lookAt(scene.position)
    for(let i = 0; i < NUM_SPHERES; i++){
        circles[i].lookAt(camera.position);

        // have each point of the trail look at the camera
        for( let j = 0; j < TRAIL_LENGTH; j++){
            trailMesh[i][j].lookAt(camera.position);
        }
    }

    // handle window resizing:
    //      when window is resized, adjust renderer size
    window.onresize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    };
//=======================================================
    // create the lines that go between the points of the trail
    trailLines = [];

    for (let i = 0; i < NUM_SPHERES; i++) {
        const circleTrailLines = [];

        for (let j = 0; j < TRAIL_LENGTH - 1; j++) {
            const lineColor = 0x2a9d8f;
            const line = createLineBetweenPoints(trailMesh[i][j].position, trailMesh[i][j + 1].position, lineColor);
            scene.add(line);
            circleTrailLines.push(line);
        }

        trailLines.push(circleTrailLines);
    }
}

// Variables to control the attractor
let alpha = 1.4; // don't change; this is part of the math
let speed = 0.02; // dictates how fast particles move. value too high = offscreen
let frames = 0;
let deltatime;
let trailIndex = 0; // circular index
function animate_halvorsen() {
    // spawn in spheres until 60fps hit
    // see if I can spawn in spheres without rendering
    // swap to delta time
    // potentially user instanced mesh

    let beginTime = Date.now(); // this line for stat tracking only

    // render frame and update positions here
    composer.render( scene, camera );
    for(let i = 0; i < NUM_SPHERES; i++){
        //update each circles position
        circles[i].position.x += speed*(-alpha * circles[i].position.x - 4*circles[i].position.y - 4*circles[i].position.z - (circles[i].position.y * circles[i].position.y));
        circles[i].position.y += speed*(-alpha * circles[i].position.y - 4*circles[i].position.z - 4*circles[i].position.x - (circles[i].position.z * circles[i].position.z));
        circles[i].position.z += speed*(-alpha * circles[i].position.z - 4*circles[i].position.x - 4*circles[i].position.y - (circles[i].position.x * circles[i].position.x));

        //update the trails position
        let temp = new THREE.Vector3(circles[i].position.x, circles[i].position.y, circles[i].position.z)
        for (let j = TRAIL_LENGTH - 1; j > 0; j--){
            // the trail is made up of many smaller points.
            trailMesh[i][j].position.copy(trailMesh[i][j-1].position);

        }
        trailMesh[i][0].position.copy(temp);


        // Update the trail line positions
        for (let j = 0; j < trailLines[i].length; j++) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                trailMesh[i][j].position,
                trailMesh[i][j + 1].position,
            ]);
            trailLines[i][j].geometry.dispose(); // Dispose the old geometry to avoid memory leaks
            trailLines[i][j].geometry = lineGeometry;
        }
    }



    requestAnimationFrame( animate_halvorsen ); //calculate
    trailIndex = (trailIndex + 1) % TRAIL_LENGTH;

    // stat tracking
    frames++;
    let endTime = Date.now() - beginTime;
    document.getElementById('fps').innerHTML = Math.trunc(1000/endTime).toString();
    document.getElementById('frames').innerHTML = frames.toString();
}
function createLineBetweenPoints(point1, point2, color) {
    const material = new THREE.LineBasicMaterial({ color: 0x2a9d8f });
    const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const line = new THREE.Line(geometry, material);
    return line;
}

init();
animate_halvorsen();


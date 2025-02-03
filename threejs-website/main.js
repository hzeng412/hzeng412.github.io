import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, document.getElementById('three-canvas')); // Ensure canvas is correctly referenced

// Initial camera setup
camera.position.set(10, 10, 10); // Move the camera further out initially
camera.lookAt(0, 0, 0); // Look at the origin

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Load GLB model
const loader = new GLTFLoader();
loader.load(
    'models/HZ_animated.glb', // Path to your GLB file
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0); // Ensure model is at the origin
        model.scale.set(3, 3, 3); // Scale the model if necessary
        console.log("Model loaded and added to the scene:", model);
    },
    undefined,
    function (error) {
        console.error("An error occurred while loading the model:", error);
    }
);

loader.load(
    'models/HZ_avatar.glb', // Path to your second GLB file
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(5, 0, 0); // Position the second model next to the first one
        model.scale.set(3, 3, 3); // Adjust scale if necessary
        console.log("Second model loaded and added to the scene:", model);
    },
    undefined,
    function (error) {
        console.error("An error occurred while loading the second model:", error);
    }
);
    

// Animation variables
let angle = 0; // Current angle of rotation
const radius = 10; // Radius of the circular path



// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update camera position for rotation
    angle += 0.005; // Adjust this value to control the speed of rotation
    camera.position.x = radius * Math.sin(angle); // X position along the circular path
    camera.position.z = radius * Math.cos(angle); // Z position along the circular path

    camera.lookAt(0, 0, 0); // Ensure camera always looks at the origin

    // Update controls if using OrbitControls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Start animation
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

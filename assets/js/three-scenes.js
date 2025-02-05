// assets/js/three-scenes.js

// Initialize the avatar scene
function initAvatarScene() {
    console.log('Initializing avatar scene...');
    
    const container = document.getElementById('avatar-3d');
    if (!container) {
        console.error('Container element "avatar-3d" not found');
        return;
    }
    console.log('Container found:', container);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);  // Changed to white
    console.log('Scene created');

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.5, 6);
    console.log('Camera set up');

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    console.log('Renderer initialized');

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x00d1ff, 0.5);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);
    console.log('Lights added');

    // Controls
    let controls;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.minPolarAngle = Math.PI / 3;
        controls.enableZoom = false;
        console.log('Controls configured');
    } else {
        console.warn('OrbitControls not available');
    }

    // GLB Model loading
    console.log('Starting model load...');
    let mixer = null;

    // Create loader
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('GLTFLoader not available');
        createFallbackObject();
        return;
    }

    const loader = new THREE.GLTFLoader();
    
    // Try to load the model
    try {
        loader.load(
            'assets/models/HZ_animated.glb',
            function (gltf) {
                console.log('Model loaded successfully');
                const model = gltf.scene;
                
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                
                // Scale to fit container
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                model.scale.multiplyScalar(scale);

                scene.add(model);
                console.log('Model added to scene');

                // Setup animation
                if (gltf.animations && gltf.animations.length) {
                    console.log('Animations found:', gltf.animations.length);
                    mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                } else {
                    console.log('No animations found in the model');
                }
            },
            function (progress) {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            function (error) {
                console.error('Error loading GLB:', error);
                createFallbackObject();
            }
        );
    } catch (error) {
        console.error('Error setting up model loader:', error);
        createFallbackObject();
    }

    // Store the fallback object reference globally in the function scope
    let fallbackObject;
    
    function createFallbackObject() {
        console.log('Creating fallback object');
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
            wireframe: true
        });
        fallbackObject = new THREE.Mesh(geometry, material);
        scene.add(fallbackObject);
        console.log('Fallback object added to scene');
    }

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        
        if (mixer) {
            mixer.update(clock.getDelta());
        }
        
        // Rotate the fallback object if it exists
        if (fallbackObject) {
            fallbackObject.rotation.x += 0.01;
            fallbackObject.rotation.y += 0.01;
        }
        
        if (controls) {
            controls.update();
        }
        
        renderer.render(scene, camera);
    }
    animate();
    console.log('Animation loop started');

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    console.log('Resize handler added');
}

// Initialize all scenes when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization');
    initAvatarScene();
});
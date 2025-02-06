function initHeroScene() {
    const container = document.getElementById('hero-3d');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);

    // Add raycaster setup here
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const camera = new THREE.PerspectiveCamera(
        60,  // Reduced FOV
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(1.5, 0.3, 1.5);  // Moved camera closer
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x00d1ff, 0.5);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    let controls;
    if (typeof THREE.OrbitControls === 'function') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.minPolarAngle = Math.PI / 3;
        controls.enableZoom = false;
        controls.enableRotate = false;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;
    }

    let originalMaterials = new Map();
    let isHovered = false;
    let model = null;
    let fallbackObject = null;
    let mixer = null;
    let modelLoaded = false;

    function createFallbackObject() {
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0066cc,
            wireframe: true
        });
        fallbackObject = new THREE.Mesh(geometry, material);
        scene.add(fallbackObject);
    }

    if (typeof THREE.GLTFLoader === 'function') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            './assets/models/HZ_animated.glb',
            function (gltf) {
                modelLoaded = true;
                model = gltf.scene;
                
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.position.y = -0.8;
                
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.5 / maxDim;
                model.scale.multiplyScalar(scale);
                
                model.traverse((node) => {
                    if (node.isMesh) {
                        originalMaterials.set(node, node.material.clone());
                    }
                });
                
                scene.add(model);

                if (gltf.animations && gltf.animations.length) {
                    mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                }
            },
            null,
            function (error) {
                if (!modelLoaded) createFallbackObject();
            }
        );
    } else {
        createFallbackObject();
    }

    // Updated mouse event listener with raycasting
    renderer.domElement.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model, true);

        if (intersects.length > 0 && !isHovered) {
            isHovered = true;
            model.traverse((node) => {
                if (node.isMesh) {
                    const newMaterial = node.material.clone();
                    newMaterial.color = new THREE.Color(0x00d1ff);
                    newMaterial.emissive = new THREE.Color(0x00d1ff);
                    newMaterial.emissiveIntensity = 1.0;
                    node.material = newMaterial;
                }
            });
        } else if (intersects.length === 0 && isHovered) {
            isHovered = false;
            model.traverse((node) => {
                if (node.isMesh && originalMaterials.has(node)) {
                    node.material = originalMaterials.get(node).clone();
                }
            });
        }
    });

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        
        if (mixer) mixer.update(clock.getDelta());
        if (fallbackObject) {
            fallbackObject.rotation.x += 0.01;
            fallbackObject.rotation.y += 0.01;
        }
        if (controls) controls.update();
        
        // Check intersection every frame
        if (model) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(model, true);

            if (intersects.length > 0 && !isHovered) {
                isHovered = true;
                model.traverse((node) => {
                    if (node.isMesh) {
                        const newMaterial = node.material.clone();
                        newMaterial.color = new THREE.Color(0x00d1ff);
                        newMaterial.emissive = new THREE.Color(0x00d1ff);
                        newMaterial.emissiveIntensity = 1.0;
                        node.material = newMaterial;
                    }
                });
            } else if (intersects.length === 0 && isHovered) {
                isHovered = false;
                model.traverse((node) => {
                    if (node.isMesh && originalMaterials.has(node)) {
                        node.material = originalMaterials.get(node).clone();
                    }
                });
            }
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-3d');
    const avatarContainer = document.getElementById('avatar-3d');
    
    if (heroContainer) initHeroScene();
    if (avatarContainer) initAvatarScene();
});
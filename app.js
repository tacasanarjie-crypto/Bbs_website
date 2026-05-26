// 3D Rotating Birthday Cake Web App Logic
// Powered by Three.js, GSAP (ScrollTrigger), and Canvas Confetti

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Global Variables
let scene, camera, renderer, cameraTarget;
let cakeGroup, sparklesGroup;
let polaroids = [];
let candles = [];
let candleFlames = [];
let candleLights = [];
let isBlownOut = false;
let activePolaroidIndex = -1;
let isLetterOpen = false;
let cameraOffset = { x: 0, y: 0, z: 0 }; // For blowout wobble camera zoom
let blowoutOrbit = { angle: 0, scale: 1.0 }; // For blowout 360 orbit animation
let cinematicCam = null; // Stores cinematic camera override position/target during tour

// Polaroid Letter Data Database
const polaroidData = [
    {
        texturePath: 'assets/photo1.jpg',
        title: 'Samgyup Date',
        date: 'July 19 2025',
        angle: 0.0,            // Angle around cake
        height: 0.8,           // Y offset
        orbitRadius: 4.8,      // Distance from center
        kicker: 'Memory 01',
        letterText: "Dear Biew-Biew,\n\nRemember this date bb?  remeber our first samgyup? On this exact moment while im doing this its just like the time stops and i cant stop looking at you, I've really enjoy that date bb and really memorable jud kay first nako na samgyup joker lang kayu kay wla na hurot ang mga karne, anyways this date is really special to me bb thats why i put it here thank you for being with me on our date<3.\n\nWith love, Always."
    },
    {
        texturePath: 'assets/photo5.jpg',
        title: 'Beginning of a lifeline',
        date: 'Beach Magic',
        angle: Math.PI / 2,
        height: 1.4,
        orbitRadius: 4.5,
        kicker: 'Memory 02',
        letterText: "Dear Biew-Biew,\n\n Oh this date love it's so very special the time when nag aks ko sa imong permission to court you the first bouquet i gave to a girl  its just really important this memory biew², the day you met protasyo as well our bb protasyo if pwede palang ni ma balik na moment i will always come back and reminisce this core memory we have. \n\nWith love, Always."
    },
    {
        texturePath: 'assets/photo2.jpg',
        title: 'Sweet Smile',
        date: 'Coffee & Pastel',
        angle: Math.PI,
        height: 0.7,
        orbitRadius: 4.8,
        kicker: 'Memory 03',
        letterText: "Dear Biew-Biew,\n\n This date bb is also very special for me thats why its here like i can't describe how happy you are on this very special moment love this photo i took is exactly the way i describe this moment like the vibe is really different not to mention the ahem also i know you really love that bouquet love like look how happy you are, and you know that i always love you i always do bb.\n\nWith love, Always."
    },
    {
        texturePath: 'assets/photo4.jpg',
        title: 'Memory of a commitment that never fade',
        date: 'Candid Smiles',
        angle: Math.PI * 1.5,
        height: 1.2,
        orbitRadius: 4.5,
        kicker: 'Memory 04',
        letterText: "Dear Biew-Biew,\n\nThis final core memory bb this is the symbolic day of our love we committed to each other the love we oath it might a normal day for other but for me this is the best day of my life I'm really happy on this day biew² \n\n like diko paka tou nga uyab nata it took 3 days to sink in that naa nakoy beautiful, pretty, majestic, cute, stunning and soo much more complementary words i can say my this work man ship making this website bb somehow make you happy, I love you my love thank you for being my Girlfriend I'm really grateful that you exist in such a cruel world.\n\nWith love, Always."
    }
];

// Audio Elements
const bgMusic = document.getElementById('bg-music');
const blowSound = document.getElementById('blow-sound');
const cheerSound = document.getElementById('cheer-sound');
const musicBtn = document.getElementById('music-btn');
const soundWave = document.getElementById('sound-wave');

// UI Elements
const loader = document.getElementById('loader');
const loaderBarFill = document.querySelector('.loader-bar-fill');
const blowBtn = document.getElementById('blow-btn');
const relightBtn = document.getElementById('relight-btn');
const scrollIndicator = document.getElementById('scroll-indicator');

// Modal Elements
const letterOverlay = document.getElementById('letter-overlay');
const closeLetterBtn = document.getElementById('close-letter-btn');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const letterKicker = document.getElementById('letter-kicker');
const letterTitle = document.getElementById('letter-title');
const letterContent = document.getElementById('letter-content');

// Setup Loading Manager for Assets
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// Track loading progress
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loaderBarFill.style.width = `${progress}%`;
};

// Handle complete loading
loadingManager.onLoad = () => {
    setTimeout(() => {
        loader.classList.add('fade-out');
        // Let scroll animation begin
        initScrollAnimation();
    }, 800);
};

// Initialize Application
function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfff0f3, 0.025);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3.5, 9);
    cameraTarget = new THREE.Vector3(0, 1.2, 0);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('webgl'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Groups
    cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    sparklesGroup = new THREE.Group();
    scene.add(sparklesGroup);

    // 4. Lights Setup
    setupLighting();

    // 5. Create 3D Scene Components
    createCakeStand();
    createCakeTiers();
    createCandles();
    createSparkles();
    createPolaroids();

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    setupRaycaster();
    setupAudioControls();
    setupInteractiveButtons();
    setupModalControls();

    // 7. Start Render Loop
    animate();
}

// Setup Lighting
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xfff0f3, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const softFillLight = new THREE.DirectionalLight(0xffe4e1, 0.4);
    softFillLight.position.set(-5, 3, -5);
    scene.add(softFillLight);
}

// Create Cake Stand
function createCakeStand() {
    // Elegant gold-tinted metallic stand
    const standMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0e6d0,
        roughness: 0.15,
        metalness: 0.55
    });

    // Base
    const baseGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.15, 64);
    const baseMesh = new THREE.Mesh(baseGeo, standMaterial);
    baseMesh.position.y = -0.075;
    baseMesh.receiveShadow = true;
    cakeGroup.add(baseMesh);

    // Decorative base ring
    const ringGeo = new THREE.TorusGeometry(3.05, 0.07, 8, 64);
    const ringMesh = new THREE.Mesh(ringGeo, standMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.03;
    cakeGroup.add(ringMesh);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.6, 0.85, 0.5, 32);
    const stemMesh = new THREE.Mesh(stemGeo, standMaterial);
    stemMesh.position.y = 0.25;
    stemMesh.castShadow = true;
    stemMesh.receiveShadow = true;
    cakeGroup.add(stemMesh);

    // Top Plate
    const plateGeo = new THREE.CylinderGeometry(2.75, 2.75, 0.1, 64);
    const plateMesh = new THREE.Mesh(plateGeo, standMaterial);
    plateMesh.position.y = 0.55;
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    cakeGroup.add(plateMesh);

    // Decorative plate rim torus
    const plateRimGeo = new THREE.TorusGeometry(2.75, 0.06, 8, 64);
    const plateRimMesh = new THREE.Mesh(plateRimGeo, standMaterial);
    plateRimMesh.rotation.x = Math.PI / 2;
    plateRimMesh.position.y = 0.60;
    cakeGroup.add(plateRimMesh);
}

// Create 3-Tier Cake
function createCakeTiers() {
    // Rich, vibrant materials
    const vanillaMat = new THREE.MeshStandardMaterial({
        color: 0xfff8ee,
        roughness: 0.45,
        metalness: 0.04
    });
    const roseOmbMat = new THREE.MeshStandardMaterial({
        color: 0xf9a8c2,  // vivid strawberry-rose
        roughness: 0.38,
        metalness: 0.04
    });
    const deepRoseMat = new THREE.MeshStandardMaterial({
        color: 0xf472a8,  // deeper hot-pink for top tier accent
        roughness: 0.38,
        metalness: 0.04
    });
    const cherryMat = new THREE.MeshStandardMaterial({
        color: 0xdc143c,
        roughness: 0.12,
        metalness: 0.25,
        emissive: 0x6a0010,
        emissiveIntensity: 0.12
    });
    const pearlMat = new THREE.MeshStandardMaterial({
        color: 0xf9e8f0,
        roughness: 0.1,
        metalness: 0.55,
        emissive: 0xffd0e8,
        emissiveIntensity: 0.08
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.12,
        metalness: 0.85
    });

    // ---- Tier 1 (Bottom) ---- vanilla base with rose frosting bands
    const t1Height = 0.9;
    const t1Radius = 2.3;
    const tier1Geo = new THREE.CylinderGeometry(t1Radius, t1Radius, t1Height, 64);
    const tier1Mesh = new THREE.Mesh(tier1Geo, vanillaMat);
    tier1Mesh.position.y = 0.6 + t1Height / 2;
    tier1Mesh.castShadow = true;
    tier1Mesh.receiveShadow = true;
    cakeGroup.add(tier1Mesh);

    // Frosting band ring on tier 1
    const band1Geo = new THREE.CylinderGeometry(t1Radius + 0.01, t1Radius + 0.01, 0.18, 64);
    const band1 = new THREE.Mesh(band1Geo, roseOmbMat);
    band1.position.y = 0.6 + t1Height * 0.5;
    cakeGroup.add(band1);

    // Drip frosting drops hanging from tier 1 top
    createDripFrosting(t1Radius, 0.6 + t1Height, roseOmbMat, 22);

    // Pearl row around mid tier 1
    createPearlRow(t1Radius + 0.01, 0.6 + t1Height * 0.5, pearlMat, 26);

    // ---- Tier 2 (Middle) ---- rose toned
    const t2Height = 0.75;
    const t2Radius = 1.7;
    const tier2Geo = new THREE.CylinderGeometry(t2Radius, t2Radius, t2Height, 64);
    const tier2Mesh = new THREE.Mesh(tier2Geo, roseOmbMat);
    tier2Mesh.position.y = 0.6 + t1Height + t2Height / 2;
    tier2Mesh.castShadow = true;
    tier2Mesh.receiveShadow = true;
    cakeGroup.add(tier2Mesh);

    createDripFrosting(t2Radius, 0.6 + t1Height + t2Height, vanillaMat, 16);
    createPearlRow(t2Radius + 0.01, 0.6 + t1Height + t2Height * 0.45, pearlMat, 20);

    // ---- Tier 3 (Top) ---- deep pink
    const t3Height = 0.65;
    const t3Radius = 1.1;
    const tier3Geo = new THREE.CylinderGeometry(t3Radius, t3Radius, t3Height, 64);
    const tier3Mesh = new THREE.Mesh(tier3Geo, deepRoseMat);
    tier3Mesh.position.y = 0.6 + t1Height + t2Height + t3Height / 2;
    tier3Mesh.castShadow = true;
    tier3Mesh.receiveShadow = true;
    cakeGroup.add(tier3Mesh);

    createPearlRow(t3Radius + 0.01, 0.6 + t1Height + t2Height + t3Height * 0.5, pearlMat, 14);

    // Rim piping on each tier
    createRimPiping(t1Radius, 0.6 + t1Height, roseOmbMat, 32);
    createRimPiping(t2Radius, 0.6 + t1Height + t2Height, vanillaMat, 24);
    createRimPiping(t3Radius, 0.6 + t1Height + t2Height + t3Height, roseOmbMat, 16);

    // Cherries on top rim
    const topY = 0.6 + t1Height + t2Height + t3Height;
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const cx = Math.cos(angle) * (t3Radius - 0.22);
        const cz = Math.sin(angle) * (t3Radius - 0.22);

        // Cherry
        const cherryMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 16, 16),
            cherryMat
        );
        cherryMesh.position.set(cx, topY + 0.08, cz);
        cherryMesh.castShadow = true;
        cakeGroup.add(cherryMesh);

        // Gold stem
        const stemMesh2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8),
            goldAccentMat
        );
        stemMesh2.position.set(cx, topY + 0.17, cz);
        cakeGroup.add(stemMesh2);
    }

    // Center top cream swirl
    const centerSwirl = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        vanillaMat
    );
    centerSwirl.scale.set(1, 1.4, 1);
    centerSwirl.position.set(0, topY + 0.2, 0);
    cakeGroup.add(centerSwirl);
}

// Helper to create cream frosting drops along a tier rim
function createRimPiping(radius, height, material, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const pipGeo = new THREE.SphereGeometry(0.10, 12, 12);
        pipGeo.scale(1, 0.75, 1.2);
        const pipMesh = new THREE.Mesh(pipGeo, material);
        pipMesh.position.set(px, height + 0.04, pz);
        pipMesh.rotation.y = -angle;
        cakeGroup.add(pipMesh);
    }
}

// Drip frosting drops hanging from the bottom of a tier rim
// Built with CylinderGeometry + a rounded bottom sphere (r128 compatible)
function createDripFrosting(radius, height, material, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const dripLen = 0.12 + Math.random() * 0.18;
        const r = 0.055;

        // Cylinder shaft of the drip
        const shaftGeo = new THREE.CylinderGeometry(r, r * 0.7, dripLen, 8);
        const shaftMesh = new THREE.Mesh(shaftGeo, material);
        shaftMesh.position.set(px, height - dripLen * 0.5, pz);
        cakeGroup.add(shaftMesh);

        // Rounded bottom teardrop cap
        const capGeo = new THREE.SphereGeometry(r * 0.85, 8, 8);
        const capMesh = new THREE.Mesh(capGeo, material);
        capMesh.position.set(px, height - dripLen, pz);
        cakeGroup.add(capMesh);
    }
}

// Pearl bead row decorating a tier
function createPearlRow(radius, height, material, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const pearlMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 14, 14),
            material
        );
        pearlMesh.position.set(px, height, pz);
        cakeGroup.add(pearlMesh);
    }
}

// Create 3 Interactive Candles on the Top Tier
function createCandles() {
    const candleColors = [0x93c5fd, 0xfef08a, 0xc084fc]; // Pastel blue, yellow, lavender
    const topY = 0.6 + 0.8 + 0.7 + 0.6; // height level of top tier

    // 3 Candle Positions
    const pos = [
        { x: 0.35, z: 0.35 },
        { x: -0.35, z: 0.35 },
        { x: 0, z: -0.45 }
    ];

    pos.forEach((p, idx) => {
        const candleGrp = new THREE.Group();
        candleGrp.position.set(p.x, topY, p.z);

        // Body material
        const bodyMat = new THREE.MeshStandardMaterial({
            color: candleColors[idx % candleColors.length],
            roughness: 0.6
        });

        // Wax Body
        const waxGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 16);
        const waxMesh = new THREE.Mesh(waxGeo, bodyMat);
        waxMesh.position.y = 0.25;
        waxMesh.castShadow = true;
        waxMesh.name = `candle-${idx}`;
        candleGrp.add(waxMesh);

        // Wick
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const wickGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
        const wickMesh = new THREE.Mesh(wickGeo, wickMat);
        wickMesh.position.y = 0.52;
        candleGrp.add(wickMesh);

        // Flame mesh
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flameGeo = new THREE.SphereGeometry(0.06, 12, 12);
        flameGeo.scale(1, 1.8, 1); // Pointy teardrop shape
        const flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.y = 0.61;
        flameMesh.name = `flame-${idx}`;
        candleGrp.add(flameMesh);
        candleFlames.push(flameMesh);

        // Candle light glow (casts warm light)
        const candleLight = new THREE.PointLight(0xff8833, 1.8, 4, 1.2);
        candleLight.position.y = 0.7;
        candleLight.castShadow = true;
        candleLight.shadow.bias = -0.01;
        candleGrp.add(candleLight);
        candleLights.push(candleLight);

        cakeGroup.add(candleGrp);
        candles.push(candleGrp);
    });
}

// Generate floating magic sparkles
function createSparkles() {
    const sparklesCount = 120;
    const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xfff4d0,
        transparent: true,
        opacity: 0.8
    });

    const sparkGeo = new THREE.SphereGeometry(0.035, 8, 8);

    for (let i = 0; i < sparklesCount; i++) {
        // Random distribution in cylinder around cake
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.0 + Math.random() * 4.0;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.random() * 5.0; // height

        const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
        sparkMesh.position.set(x, y, z);

        // Randomize speed & scale properties
        sparkMesh.userData = {
            speedY: 0.005 + Math.random() * 0.01,
            speedX: -0.003 + Math.random() * 0.006,
            originalX: x,
            amplitude: 0.1 + Math.random() * 0.4,
            phase: Math.random() * 10
        };

        sparklesGroup.add(sparkMesh);
    }
}

// Create orbiting Polaroid Memory picture frames
function createPolaroids() {
    polaroidData.forEach((data, index) => {
        const polaroidGrp = new THREE.Group();
        polaroidGrp.name = `polaroid-${index}`;

        // 1. Polaroid White Card Frame Base (box)
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9
        });
        const frameGeo = new THREE.BoxGeometry(2.1, 2.6, 0.05);
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.castShadow = true;
        frameMesh.receiveShadow = true;
        frameMesh.name = `frame-${index}`;
        polaroidGrp.add(frameMesh);

        // 2. Photo Area (plane mapping loaded image texture)
        const photoMat = new THREE.MeshStandardMaterial({
            roughness: 0.4
        });

        // Load custom texture
        textureLoader.load(data.texturePath, (texture) => {
            // Prevent stretching in Three.js (cover-fit on square plane)
            const img = texture.image;
            if (img && img.width > 0 && img.height > 0) {
                const aspect = img.width / img.height;
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                if (aspect > 1) {
                    // Landscape: crop left & right
                    texture.repeat.set(1 / aspect, 1);
                    texture.offset.set((1 - 1 / aspect) / 2, 0);
                } else {
                    // Portrait: crop top & bottom
                    texture.repeat.set(1, aspect);
                    texture.offset.set(0, (1 - aspect) / 2);
                }
            }
            photoMat.map = texture;
            photoMat.needsUpdate = true;
        });

        // Photo geometry (square photo near top of polaroid)
        const photoGeo = new THREE.PlaneGeometry(1.85, 1.85);
        const photoMesh = new THREE.Mesh(photoGeo, photoMat);
        photoMesh.position.set(0, 0.22, 0.03); // offset slightly forward
        photoMesh.castShadow = true;
        photoMesh.name = `photo-${index}`;
        polaroidGrp.add(photoMesh);

        // Position polaroid around the cake in circular orbit
        const px = Math.cos(data.angle) * data.orbitRadius;
        const pz = Math.sin(data.angle) * data.orbitRadius;
        polaroidGrp.position.set(px, data.height, pz);

        // Make the polaroid look towards the center, facing outward/inward elegantly
        // Adding slight rotations to look organic, like they are floating in the air
        polaroidGrp.lookAt(0, data.height, 0);
        polaroidGrp.rotation.y += Math.PI; // Face the camera orbiting around
        polaroidGrp.rotation.z += (Math.random() - 0.5) * 0.15; // cute angle tilt
        polaroidGrp.rotation.x += (Math.random() - 0.5) * 0.05; // slight pitch

        // Save initial orientation for slerp interpolation
        polaroidGrp.userData.initialQuaternion = polaroidGrp.quaternion.clone();
        polaroidGrp.userData.index = index;

        // 3. 3D Heart decoration – lower-right corner of polaroid frame
        const heartGroup = createPolaroidHeart();
        // Hang off lower-right edge so it visually overlaps the border
        heartGroup.position.set(0.88, -0.98, 0.08);
        polaroidGrp.add(heartGroup);

        scene.add(polaroidGrp);
        polaroids.push(polaroidGrp);

        // Save initial coordinates for scroll animation reference
        data.mesh = polaroidGrp;
    });
}

// Build a rose-gold twisted wire heart for polaroid corner decoration
function createPolaroidHeart() {
    const group = new THREE.Group();

    // Generate 3D points along the classic heart parametric equation
    function buildHeartPoints(scale, zFn) {
        const pts = [];
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            // Positive y so lobes face UP (correct orientation)
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = zFn ? zFn(t) : 0;
            pts.push(new THREE.Vector3(x * scale, y * scale, z));
        }
        return pts;
    }

    const s = 0.038;
    const braidAmp = 0.045;
    const braidFreq = 5;

    // Wire 1 – medium red, glossy
    const mat1 = new THREE.MeshStandardMaterial({
        color: 0xFF6B8A,
        metalness: 0.55,
        roughness: 0.20,
        emissive: 0xCC1133,
        emissiveIntensity: 0.18
    });
    const curve1 = new THREE.CatmullRomCurve3(
        buildHeartPoints(s, t => Math.sin(t * braidFreq) * braidAmp), true
    );
    group.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve1, 200, 0.062, 10, true),
        mat1
    ));

    // Wire 2 – lighter pink highlight wire, braided opposite phase
    const mat2 = new THREE.MeshStandardMaterial({
        color: 0xFF9BB0,
        metalness: 0.45,
        roughness: 0.25,
        emissive: 0xCC2244,
        emissiveIntensity: 0.12
    });
    const curve2 = new THREE.CatmullRomCurve3(
        buildHeartPoints(s, t => -Math.sin(t * braidFreq) * braidAmp), true
    );
    group.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve2, 200, 0.050, 10, true),
        mat2
    ));

    // Overall group scale & tilt to match the screenshot angle
    group.scale.setScalar(0.92);
    group.rotation.x = -0.18;   // tilt top away from viewer slightly
    group.rotation.z = 0.12;   // slight lean to the right
    group.userData.isHeart = true;
    return group;
}

// Raycaster to detect tap directly on candles OR polaroids
function setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (e) => {
        // If letter is already open, ignore clicks
        if (isLetterOpen) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Detect clicks on Polaroids
        let clickedPolaroidIdx = -1;
        for (let p of polaroids) {
            const intersects = raycaster.intersectObjects(p.children, true);
            if (intersects.length > 0) {
                clickedPolaroidIdx = p.userData.index;
                break;
            }
        }

        if (clickedPolaroidIdx !== -1) {
            openLetterModal(clickedPolaroidIdx);
            return;
        }

        // 2. Detect clicks on Candles (only in last section)
        const wishSec = document.getElementById('sec-wish');
        if (wishSec && wishSec.classList.contains('active')) {
            const intersects = raycaster.intersectObjects(cakeGroup.children, true);
            if (intersects.length > 0) {
                const hitObject = intersects[0].object;
                if (hitObject.name.includes('candle') || hitObject.name.includes('flame')) {
                    triggerBlowout();
                }
            }
        }
    });
}

// Set up scroll-driven 3D animation paths using GSAP
function initScrollAnimation() {
    // Hide scroll indicator once user scrolled past intro
    ScrollTrigger.create({
        trigger: "#sec-intro",
        start: "top top",
        end: "bottom top",
        onLeave: () => gsap.to(scrollIndicator, { opacity: 0, duration: 0.4 }),
        onEnterBack: () => gsap.to(scrollIndicator, { opacity: 1, duration: 0.4 })
    });

    // Mark sections as active/inactive to handle text card entries and active polaroid state
    const sections = document.querySelectorAll('.scroll-section');
    sections.forEach((sec, idx) => {
        ScrollTrigger.create({
            trigger: sec,
            start: "top 50%",
            end: "bottom 50%",
            onToggle: (self) => {
                if (self.isActive) {
                    sec.classList.add('active');
                    if (idx >= 1 && idx <= 4) {
                        activePolaroidIndex = idx - 1;
                    } else {
                        activePolaroidIndex = -1;
                    }
                } else {
                    sec.classList.remove('active');
                }
            }
        });
    });

    // GSAP Camera & Cake Scroll Timeline
    const mainTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: ".scroll-container",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5, // smooth scrubbing with inertia
        }
    });

    // Section 1 (Intro) -> Section 2 (Memory 1)
    // Polaroid 1 is at (4.8, 0.8, 0.0). We position the camera directly in front.
    mainTimeline.to(camera.position, {
        x: 7.4,
        y: 0.95,
        z: 1.6,
        ease: "power1.inOut"
    }, 0);
    mainTimeline.to(cameraTarget, {
        x: 4.8,
        y: 0.8,
        z: 0.0,
        ease: "power1.inOut"
    }, 0);

    // Section 2 -> Section 3 (Memory 2)
    // Polaroid 2 is at (0.0, 1.4, 4.5).
    mainTimeline.to(camera.position, {
        x: -1.6,
        y: 1.55,
        z: 7.2,
        ease: "power1.inOut"
    }, 1);
    mainTimeline.to(cameraTarget, {
        x: 0.0,
        y: 1.4,
        z: 4.5,
        ease: "power1.inOut"
    }, 1);

    // Section 3 -> Section 4 (Memory 3)
    // Polaroid 3 is at (-4.8, 0.7, 0.0).
    mainTimeline.to(camera.position, {
        x: -7.4,
        y: 0.85,
        z: -1.6,
        ease: "power1.inOut"
    }, 2);
    mainTimeline.to(cameraTarget, {
        x: -4.8,
        y: 0.7,
        z: 0.0,
        ease: "power1.inOut"
    }, 2);

    // Section 4 -> Section 5 (Memory 4)
    // Polaroid 4 is at (0.0, 1.2, -4.5).
    mainTimeline.to(camera.position, {
        x: 1.6,
        y: 1.35,
        z: -7.2,
        ease: "power1.inOut"
    }, 3);
    mainTimeline.to(cameraTarget, {
        x: 0.0,
        y: 1.2,
        z: -4.5,
        ease: "power1.inOut"
    }, 3);

    // Section 5 -> Section 6 (Make a Wish)
    mainTimeline.to(camera.position, {
        x: 0.0,
        y: 4.6,
        z: 2.2,
        ease: "power2.inOut"
    }, 4);
    mainTimeline.to(cameraTarget, {
        x: 0.0,
        y: 2.6,
        z: 0.0,
        ease: "power2.inOut"
    }, 4);

    // Slow organic cake rotation mapping to scroll to show different angles
    mainTimeline.to(cakeGroup.rotation, {
        y: Math.PI * 1.5,
        ease: "none"
    }, 0);
}

// Open Letter Modal for a specific Polaroid
function openLetterModal(idx) {
    if (idx < 0 || idx >= polaroidData.length) return;
    isLetterOpen = true;

    const data = polaroidData[idx];

    // Populate Modal Content
    modalImg.src = data.texturePath;
    modalCaption.textContent = data.title;
    letterKicker.textContent = data.kicker;
    letterTitle.textContent = data.title;
    letterContent.textContent = data.letterText;

    // Show Modal
    letterOverlay.classList.remove('hidden');
}

function closeLetterModal() {
    isLetterOpen = false;
    letterOverlay.classList.add('hidden');
}

// Spawn floating heart & star emoji wish elements
function spawnFloatingEmojis() {
    const emojis = ['💖', '✨', '🎂', '🎉', '💝', '🌸'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '999';
    document.body.appendChild(container);

    const count = 40;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.position = 'absolute';

        // Start near the center of the viewport (around the cake stand)
        const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 150;
        const startY = window.innerHeight * 0.55 + (Math.random() - 0.5) * 80;

        el.style.left = `${startX}px`;
        el.style.top = `${startY}px`;
        el.style.fontSize = `${24 + Math.random() * 24}px`;
        el.style.opacity = '0';
        el.style.transform = 'scale(0.5)';

        container.appendChild(el);

        // Animate up, wobble, rotate, and fade out
        const delay = Math.random() * 0.4;
        const duration = 1.8 + Math.random() * 1.4;
        const endX = startX + (Math.random() - 0.5) * 250;
        const endY = startY - 350 - Math.random() * 300;
        const rotation = (Math.random() - 0.5) * 540;

        gsap.to(el, {
            left: endX,
            top: endY,
            opacity: 1,
            scale: 1.3,
            rotation: rotation,
            duration: duration,
            delay: delay,
            ease: "power1.out",
            onComplete: () => {
                gsap.to(el, {
                    opacity: 0,
                    scale: 0.6,
                    duration: 0.4,
                    onComplete: () => el.remove()
                });
            }
        });
    }

    setTimeout(() => {
        container.remove();
    }, 4500);
}

// Blow Out the Candles Interaction
function triggerBlowout() {
    if (isBlownOut) return;
    isBlownOut = true;

    // 1. Extinguish flames and turn off lights
    candleFlames.forEach((flame) => {
        gsap.to(flame.scale, { x: 0, y: 0, z: 0, duration: 0.3 });
    });

    candleLights.forEach((light) => {
        gsap.to(light, { intensity: 0, duration: 0.4 });
    });

    // 1b. Hide the wish card so the camera tour isn't obscured
    const wishCard = document.querySelector('#sec-wish .story-card');
    if (wishCard) {
        gsap.to(wishCard, {
            opacity: 0, scale: 0.92, duration: 0.4, ease: "power2.in",
            onComplete: () => { wishCard.style.pointerEvents = 'none'; }
        });
    }

    // 1c. Cinematic tour: orbit through each polaroid then return to top
    triggerCinematicTour(wishCard);

    // 2. Play Sound effects
    try {
        blowSound.volume = 1.0;
        blowSound.play();

        setTimeout(() => {
            cheerSound.volume = 0.7;
            cheerSound.play();
        }, 300);
    } catch (e) {
        console.warn("Audio failed to play.", e);
    }

    // 3. Trigger emoji wish float and regular paper confetti
    spawnFloatingEmojis();
    triggerConfettiExplosion();

    // 4. Toggle buttons in UI
    blowBtn.classList.add('hidden');
    relightBtn.classList.remove('hidden');
}

// Trigger colorful confetti spray (paper confetti)
function triggerConfettiExplosion() {
    // Left spray
    confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#ffd1dc', '#f472b6', '#fffdf6', '#ffcbd5', '#ffaa00']
    });

    // Right spray
    confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#ffd1dc', '#f472b6', '#fffdf6', '#ffcbd5', '#ffaa00']
    });

    // Center burst
    setTimeout(() => {
        confetti({
            particleCount: 120,
            angle: 90,
            spread: 120,
            origin: { x: 0.5, y: 0.55 },
            colors: ['#c084fc', '#ffd1dc', '#fef08a', '#93c5fd']
        });
    }, 200);
}

// Light the Candles Again Interaction
function triggerRelight() {
    if (!isBlownOut) return;
    isBlownOut = false;

    // Scale flames back up
    candleFlames.forEach((flame) => {
        gsap.to(flame.scale, { x: 1, y: 1.8, z: 1, duration: 0.5 });
    });

    // Restore lights
    candleLights.forEach((light) => {
        gsap.to(light, { intensity: 1.8, duration: 0.5 });
    });

    // Clear cinematic tour override immediately (tour already done or interrupted)
    cinematicCam = null;
    gsap.to(cameraOffset, { x: 0.0, y: 0.0, z: 0.0, duration: 0.7, ease: "power2.out" });

    // Restore wish card visibility in case tour was skipped/interrupted
    const wishCard = document.querySelector('#sec-wish .story-card');
    if (wishCard) {
        wishCard.style.pointerEvents = 'auto';
        gsap.to(wishCard, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" });
    }

    // Toggle buttons
    relightBtn.classList.add('hidden');
    blowBtn.classList.remove('hidden');
}

// Cinematic camera tour: visits each polaroid memory then swoops back to top
function triggerCinematicTour(wishCard) {
    // Collect tour waypoints from polaroid data
    const waypoints = polaroidData.map((data) => {
        const px = Math.cos(data.angle) * data.orbitRadius;
        const pz = Math.sin(data.angle) * data.orbitRadius;
        const dirX = Math.cos(data.angle);
        const dirZ = Math.sin(data.angle);
        return {
            camX: px + dirX * 2.8,
            camY: data.height + 0.3,
            camZ: pz + dirZ * 2.8,
            tgtX: px,
            tgtY: data.height,
            tgtZ: pz
        };
    });

    // Snapshot the ScrollTrigger camera position NOW (wish section position)
    const returnCamX = camera.position.x;
    const returnCamY = camera.position.y;
    const returnCamZ = camera.position.z;
    const returnTgtX = cameraTarget.x;
    const returnTgtY = cameraTarget.y;
    const returnTgtZ = cameraTarget.z;

    // Activate the cinematic override starting from current position
    cinematicCam = {
        pos: new THREE.Vector3(returnCamX, returnCamY, returnCamZ),
        tgt: new THREE.Vector3(returnTgtX, returnTgtY, returnTgtZ)
    };

    const visitDuration = 1.8;
    const pauseDuration = 0.8;
    const returnDuration = 2.2;

    const tl = gsap.timeline({
        onComplete: () => {
            // Smoothly fly back to the exact ScrollTrigger position
            gsap.to(cinematicCam.pos, {
                x: returnCamX,
                y: returnCamY,
                z: returnCamZ,
                duration: returnDuration,
                ease: "power2.inOut"
            });
            gsap.to(cinematicCam.tgt, {
                x: returnTgtX,
                y: returnTgtY,
                z: returnTgtZ,
                duration: returnDuration,
                ease: "power2.inOut",
                onComplete: () => {
                    // Clear cinematic override — camera is now exactly at ScrollTrigger pos
                    cinematicCam = null;
                    // Fade the wish card back in
                    if (wishCard) {
                        wishCard.style.pointerEvents = 'auto';
                        gsap.to(wishCard, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" });
                    }
                }
            });
        }
    });

    waypoints.forEach((wp, i) => {
        const startTime = i * (visitDuration + pauseDuration);
        tl.to(cinematicCam.pos, {
            x: wp.camX, y: wp.camY, z: wp.camZ,
            duration: visitDuration, ease: "power2.inOut"
        }, startTime);
        tl.to(cinematicCam.tgt, {
            x: wp.tgtX, y: wp.tgtY, z: wp.tgtZ,
            duration: visitDuration, ease: "power2.inOut"
        }, startTime);
    });
}

// Audio Controls Toggle
function setupAudioControls() {
    musicBtn.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.volume = 0.5;
            bgMusic.play().then(() => {
                soundWave.classList.add('playing');
                musicBtn.querySelector('.music-text').textContent = "Pause Music";
            }).catch(err => {
                console.error("Audio playback blocked", err);
            });
        } else {
            bgMusic.pause();
            soundWave.classList.remove('playing');
            musicBtn.querySelector('.music-text').textContent = "Play Music";
        }
    });
}

// Button setup
function setupInteractiveButtons() {
    blowBtn.addEventListener('click', triggerBlowout);
    relightBtn.addEventListener('click', triggerRelight);

    // Also allow clicking the glass story cards directly to open the modal
    const memorySections = ['sec-mem1', 'sec-mem2', 'sec-mem3', 'sec-mem4'];
    memorySections.forEach((id, index) => {
        const sec = document.getElementById(id);
        if (sec) {
            const card = sec.querySelector('.story-card');
            if (card) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    if (!isLetterOpen) {
                        openLetterModal(index);
                    }
                });
            }
        }
    });
}

// Modal controls setup
function setupModalControls() {
    closeLetterBtn.addEventListener('click', closeLetterModal);

    // Close on click outside card
    letterOverlay.addEventListener('click', (e) => {
        if (e.target === letterOverlay) {
            closeLetterModal();
        }
    });

    // Close on ESC key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isLetterOpen) {
            closeLetterModal();
        }
    });
}

// Window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main Render & Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // 1. Slow idle cake float when NOT scrolling aggressively (organic movement)
    // Helps the cake feel alive in 3D space
    if (!ScrollTrigger.isScrolling) {
        cakeGroup.position.y = Math.sin(time * 0.8) * 0.05;
        cakeGroup.rotation.y += 0.0015;
    }

    // 2. Smoothly rotate active polaroid to face camera, or return to initial float
    const tempObj = new THREE.Object3D();
    polaroids.forEach((p, idx) => {
        const data = polaroidData[idx];
        // Fallback: If ScrollTrigger indices fail, we check distance to cameraTarget
        const isCurrentActive = (idx === activePolaroidIndex) ||
            (activePolaroidIndex === -1 && cameraTarget.distanceTo(p.position) < 0.65);

        if (isCurrentActive) {
            // Face the camera directly
            tempObj.position.copy(p.position);
            tempObj.lookAt(camera.position);
            // Removed rotation.y += Math.PI; which was flipping the polaroid to show its back

            p.quaternion.slerp(tempObj.quaternion, 0.1);

            // Bring active polaroid slightly higher and float/bob gently to pop out
            const bob = Math.sin(time * 2.0 + idx) * 0.08;
            p.position.y = THREE.MathUtils.lerp(p.position.y, data.height + 0.12 + bob, 0.1);
        } else {
            // Interpolate back to original rotation with a tiny organic sway
            if (p.userData.initialQuaternion) {
                const targetQ = p.userData.initialQuaternion.clone();
                // Add tiny organic idle sway around Z (roll)
                const swayAngle = Math.sin(time * 0.6 + idx) * 0.04;
                const swayQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), swayAngle);
                targetQ.multiply(swayQ);
                p.quaternion.slerp(targetQ, 0.06);
            }

            // Restore initial float height
            const baseHeight = data.height;
            p.position.y = THREE.MathUtils.lerp(p.position.y, baseHeight + Math.sin(time * 0.8 + idx) * 0.03, 0.06);
        }
    });

    // 3. Animate candle flame flicker (scales Y, shakes positions slightly)
    if (!isBlownOut) {
        candleFlames.forEach((flame, idx) => {
            const scaleY = 1.8 + Math.sin(time * 15 + idx) * 0.25;
            const scaleXZ = 1.0 + Math.sin(time * 20 + idx) * 0.1;
            flame.scale.set(scaleXZ, scaleY, scaleXZ);

            // Random tiny displacement for realism
            flame.position.x = Math.sin(time * 25 + idx) * 0.005;

            // Flicker light intensity
            candleLights[idx].intensity = 1.6 + Math.sin(time * 30 + idx) * 0.3;
        });
    }

    // 4. Update magic sparkles rising up
    sparklesGroup.children.forEach((spark) => {
        const u = spark.userData;
        spark.position.y += u.speedY;
        spark.position.x = u.originalX + Math.sin(time + u.phase) * u.amplitude;

        // Wrap around if sparkles rise too high
        if (spark.position.y > 6.0) {
            spark.position.y = 0;
            spark.position.x = u.originalX;
        }
    });

    // 5. Apply cinematic camera override OR normal offset, then render
    const originalPos = camera.position.clone();
    const originalTarget = cameraTarget.clone();

    if (cinematicCam) {
        // Full camera override – use the GSAP-animated cinematic position
        camera.position.copy(cinematicCam.pos);
        camera.lookAt(cinematicCam.tgt);
    } else {
        camera.position.x += cameraOffset.x;
        camera.position.y += cameraOffset.y;
        camera.position.z += cameraOffset.z;
        camera.lookAt(cameraTarget);
    }

    renderer.render(scene, camera);

    // Restore original camera position for ScrollTrigger to scrub smoothly next frame
    camera.position.copy(originalPos);
    cameraTarget.copy(originalTarget);
}

// Initialize on window load
window.onload = () => {
    init();
};

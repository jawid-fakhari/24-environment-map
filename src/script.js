import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import {
  EXRLoader,
  GLTFLoader,
  RGBELoader,
} from "three/examples/jsm/Addons.js";

EXRLoader;
/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
const rgbeLoader = new RGBELoader();
const exrLoader = new EXRLoader();
const textureLoader = new THREE.TextureLoader();
/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Environment Maps
 */
scene.environmentIntensity = 1; //intensity of an enviroment on objects
scene.backgroundBlurriness = 0;
scene.backgroundIntensity = 5;
// scene.backgroundRotation.x = 1;
// scene.environmentRotation.x = 1;

gui.add(scene, "environmentIntensity").min(0).max(10).step(0.001);
gui.add(scene, "backgroundBlurriness").min(0).max(1).step(0.001);
gui.add(scene, "backgroundIntensity").min(0).max(10).step(0.001);
gui
  .add(scene.backgroundRotation, "y")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);
gui
  .add(scene.environmentRotation, "y")
  .min(0)
  .max(Math.PI * 2)
  .step(0.001);

// Loader Cube Texture

const environmentMap = cubeTextureLoader.load([
  "/environmentMaps/0/px.png",
  "/environmentMaps/0/nx.png",
  "/environmentMaps/0/py.png",
  "/environmentMaps/0/ny.png",
  "/environmentMaps/0/pz.png",
  "/environmentMaps/0/nz.png",
]);
scene.environment = environmentMap;
scene.background = environmentMap;

// //HDR (RGBE) equirectangular
// rgbeLoader.load("/environmentMaps/0/2k.hdr", (environmentMap) => {
//   environmentMap.mapping = THREE.EquirectangularReflectionMapping;
//   scene.background = environmentMap;
//   scene.environment = environmentMap;
// });

// //EXR file
// exrLoader.load("/environmentMaps/nvidiaCanvas-4k.exr", (environmentMap) => {
//   environmentMap.mapping = THREE.EquirectangularReflectionMapping;

//   scene.background = environmentMap;
//   scene.environment = environmentMap;
// });

//JPG file
// const environmentMap = textureLoader.load(
//   "/environmentMaps/blockadesLabsSkybox/anime_art_style_japan_streets_with_cherry_blossom_.jpg"
// );
// environmentMap.mapping = THREE.EquirectangularReflectionMapping;
// environmentMap.colorSpace = THREE.SRGBColorSpace;

// scene.background = environmentMap;
// scene.environment = environmentMap;
/**
 * Torus Knot
 */
const torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
  new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 1,
    color: 0xaaaaaa,
  })
);
torusKnot.position.set(-4, 4, 0);
scene.add(torusKnot);

/**
 *Models
 */
let model = null;
gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", (gltf) => {
  model = gltf.scene;
  model.scale.set(10, 10, 10);
  scene.add(model);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 5, 4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3.5;
controls.enableDamping = true;

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 6);
directionalLight.position.set(3, 7, 6);
scene.add(directionalLight);

gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-10)
  .max(10)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-10)
  .max(10)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-10)
  .max(10)
  .step(0.001)
  .name("lightZ");

//cast shadow to the light
directionalLight.castShadow = true;
gui.add(directionalLight, "castShadow");

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Realistic render
//
//Tone mapping
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2;

gui.add(renderer, "toneMapping", {
  No: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
});
gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);

//Shadows, activating shadow map then cast it to light and objects
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);

//Helper
const directionalLightHelper = new THREE.CameraHelper(
  directionalLight.shadow.camera
);
scene.add(directionalLightHelper);

//Target, change the center of object for light
directionalLight.target.position.set(0, 4, 0);
directionalLight.target.updateMatrixWorld();

//Update all Materials
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child.isMesh) {
      // Activate shadow here
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};
/**
 * Animate
 */
const clock = new THREE.Clock();
const tick = () => {
  // Time
  const elapsedTime = clock.getElapsedTime();

  //cast and recieve shadow on all materials
  updateAllMaterials();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvertTubesToLines } from './path-line';

export let renderer, camera, scene, controls, clock, gui, stats;
let cameraP, cameraO;
let environment, collider, visualizer, player;
let box, plane;

init();
render();

function init() {
  const bgColor = 0x263238 / 2;

  // renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bgColor, 20, 70);
  scene.background = new THREE.Color(0xffffff);
  // lights
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1.5, 1).multiplyScalar(50);
  light.shadow.mapSize.setScalar(2048);
  light.shadow.bias = -1e-4;
  light.shadow.normalBias = 0.05;
  light.castShadow = true;

  const shadowCam = light.shadow.camera;
  shadowCam.bottom = shadowCam.left = -30;
  shadowCam.top = 30;
  shadowCam.right = 45;

  const size = 30;
  const divisions = 30;

  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);

  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.4));

  // camera setup
  cameraP = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  cameraP.position.set(10, 10, -10);
  cameraP.far = 1000;
  cameraP.updateProjectionMatrix();

  let aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const d = 5;
  cameraO = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
  cameraO.position.copy(cameraP.position.clone());
  cameraO.updateMatrixWorld();
  cameraO.updateProjectionMatrix();

  camera = cameraP;

  controls = new OrbitControls(camera, document.body);

  const cttl = new ConvertTubesToLines();

  let indd = 5;
  if (indd === 1) {
    cttl.loaderObj('1');
    cttl.loaderObj('2');
    cttl.loaderObj('3');
  }
  if (indd === 2) {
    cttl.loaderObj('test_1');
    cttl.loaderObj('test_2');
    cttl.loaderObj('test_3');
  }
  if (indd === 3) {
    cttl.loaderObj('test_1_0');
    cttl.loaderObj('test_1_1');
    cttl.loaderObj('test_1_2');
    cttl.loaderObj('test_1_3');
    cttl.loaderObj('test_1_4');
    cttl.loaderObj('test_1_5');
  }
  if (indd === 4) {
    cttl.loaderObj('000-MR1_PIPE01');
  }
  if (indd === 5) {
    cttl.loaderObj('0019.005-TH_02.osf');
  }

  window.addEventListener(
    'resize',
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  document.addEventListener('keydown', onKeyDown);
}

function onKeyDown(event) {
  if (event.code !== 'KeyC') return;

  const pos = camera.position.clone();

  camera = camera === cameraP ? cameraO : cameraP;

  if (camera === cameraO) {
    const dist = controls.target.distanceTo(cameraP.position);

    cameraO.zoom = 10 / dist;
  }

  camera.position.copy(pos);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  controls.object = camera;
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}

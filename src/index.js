import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { svgConverter } from './svg';
import { LoaderModel } from './loader-model';
import { IsometricModeService } from './select-obj';
import { IsometricMovingObjs } from './moving';
import { IsometricRulerService } from './ruler';
import { Joint } from './joint';
import { IsometricLabels } from './labels';
import { IsometricLabelList } from './labelList';
import { IsometricScreenshot } from './screenshot';
import { DeleteObj } from './deleteObj';
import { Gis } from './gis-page';
import { ReadWrite } from './readWrite';
import { AddObj } from './addObj';
import { Axes } from './axes';
import { CatchObj } from './catchObj';

import { PanelRp } from './ui/panelRp';

export let renderer, camera, scene, controls, modelsContainerInit, mapControlInit, clock, gui, stats;
let cameraP, cameraO;
export let loaderModel, gisdPage, selectObj, ruler, moving, joint, isometricLabels, isometricLabelList, deleteObj, addObj, axes, catchObj;
let isomety;
let meshes = [];

init();
render();

function init() {
  const bgColor = 0x263238 / 2;

  // renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // scene setup
  scene = new THREE.Scene();
  modelsContainerInit = { control: scene };
  //scene.fog = new THREE.Fog(bgColor, 20, 70);
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // camera setup
  cameraP = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  cameraP.position.set(10, 10, -10);
  cameraP.far = 1000;
  cameraP.updateProjectionMatrix();

  let aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const d = 5;
  cameraO = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 10000);
  cameraO.position.copy(cameraP.position.clone());
  cameraO.updateMatrixWorld();
  cameraO.updateProjectionMatrix();
  // const cameraOHelper = new THREE.CameraHelper(cameraO);
  // scene.add(cameraOHelper);

  camera = cameraP;

  controls = new OrbitControls(camera, document.body);
  mapControlInit = { control: controls };

  console.log(333, controls);

  loaderModel = new LoaderModel({ scene });

  let indd = 5;
  if (indd === 1) {
    loaderModel.loaderObj('1');
    loaderModel.loaderObj('2');
    loaderModel.loaderObj('3');
  }
  if (indd === 2) {
    loaderModel.loaderObj('test_1');
    loaderModel.loaderObj('test_2');
    loaderModel.loaderObj('test_3');
  }
  if (indd === 3) {
    loaderModel.loaderObj('test_1_0');
    loaderModel.loaderObj('test_1_1');
    loaderModel.loaderObj('test_1_2');
    loaderModel.loaderObj('test_1_3');
    loaderModel.loaderObj('test_1_4');
    loaderModel.loaderObj('test_1_5');
  }
  if (indd === 4) {
    loaderModel.loaderObj('000-MR1_PIPE01');
  }
  if (indd === 5) {
    loaderModel.loaderObj('0019.005-TH_02.osf');
  }

  includeClasses();

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

// подключаем классы
function includeClasses() {
  moving = new IsometricMovingObjs();
  ruler = new IsometricRulerService();
  deleteObj = new DeleteObj();
  gisdPage = new Gis();
  joint = new Joint();
  isometricLabels = new IsometricLabels();
  isometricLabelList = new IsometricLabelList();
  //isometricLabelList.init();
  const isometricScreenshot = new IsometricScreenshot();
  const readWrite = new ReadWrite();
  addObj = new AddObj();
  catchObj = new CatchObj();
  axes = new Axes();

  selectObj = new IsometricModeService({ controls, scene, canvas: renderer.domElement, meshes: [] });

  new PanelRp({ gisdPage, isometricScreenshot, ruler, isometricMode: selectObj, isometricLabelList, readWrite, joint, addObj });
}

// подписка событие - обновление массива объектов для расчета стыков
export function setMeshes({ arr }) {
  meshes = arr;

  //isomety.updateMesh(meshes);
  selectObj.updateMesh(meshes);
}

function onKeyDown(event) {
  if (event.code !== 'KeyC') return;

  let pos = new THREE.Vector3();
  let rot = camera.rotation.clone();

  camera = camera === cameraP ? cameraO : cameraP;

  if (camera === cameraO) {
    const dist = controls.target.distanceTo(cameraP.position);

    cameraO.zoom = 10 / dist;

    const dir = cameraP.position.clone().sub(controls.target).normalize();
    const offset = new THREE.Vector3().addScaledVector(dir, 1000);
    pos = cameraP.position.clone().add(offset);
  } else {
    const dir = cameraO.position.clone().sub(controls.target).normalize();
    const offset = new THREE.Vector3().addScaledVector(dir, 1000);
    pos = cameraO.position.clone().sub(offset);
  }

  camera.position.copy(pos);
  camera.rotation.copy(rot);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  controls.object = camera;
  mapControlInit.control.object = camera;

  if (camera === cameraO) isometricLabelList.init();
}

function render() {
  requestAnimationFrame(render);

  controls.update();
  svgConverter.updateSvg(controls.object, controls.domElement);

  renderer.render(scene, camera);
}

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import {
  controls,
  mapControlInit,
  modelsContainerInit,
  setMeshes,
  loaderModel,
  selectObj as isometricMode,
  isometricLineStyle,
  isometricSheetsService,
  ruler as isometricRulerService,
  isometricLabels as isometricLabelsService,
  deleteObj,
  changeCamera,
} from './index';

import { CalcIsometry } from './back/calcIsometry';
import { svgConverter } from './svg';

export class Gis {
  svgConverter = svgConverter;
  modelsContainerInit;
  isometry;
  svgLines = [];
  lines = [];
  tubes = [];
  valves = [];
  tees = [];
  joins = [];
  joinsPos = new Map();
  jsonIsometry = {};
  dataObjs = { valve: null, tee: null };

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.isometry = new CalcIsometry();

    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    // создание svg
    if (event.code === 'KeyS') {
      svgConverter.createSvgScheme({ lines: this.svgLines });
    }
  };

  // ковертируем/рассчитываем трубопровод в изометрию
  getIsometry() {
    const meshesTube = loaderModel.getMeshesTube();
    const meshesValve = loaderModel.getMeshesValve();
    const meshesTee = loaderModel.getMeshesTee();

    for (let i = 0; i < meshesTube.length; i++) meshesTube[i].visible = false;
    for (let i = 0; i < meshesValve.length; i++) meshesValve[i].visible = false;
    for (let i = 0; i < meshesTee.length; i++) meshesTee[i].visible = false;

    const { tubes, valves, tees, dataObjs } = this.isometry.getIsometry({ tubes: meshesTube, valves: meshesValve, tees: meshesTee });

    this.init({ tubes, valves, tees, dataObjs });

    this.enable();
  }

  enable() {
    //isometricSheetsService.createSvgSheet();
    //controls.enableRotate = false;
    //controls.enabled = false;
    isometricMode.changeMode('move');
    setMeshes({ arr: [...this.tubes, ...this.valves, ...this.tees, ...this.joins] });
    changeCamera();
    //this.fitCamera();
  }

  fitCamera() {
    changeCamera();

    const bound = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

    console.log(this.joins);
    for (let i = 0; i < this.joins.length; i++) {
      const v = this.joins[i].position;
      if (v.x < bound.min.x) {
        bound.min.x = v.x;
      }
      if (v.x > bound.max.x) {
        bound.max.x = v.x;
      }
      if (v.y < bound.min.y) {
        bound.min.y = v.y;
      }
      if (v.y > bound.max.y) {
        bound.max.y = v.y;
      }
      if (v.z < bound.min.z) {
        bound.min.z = v.z;
      }
      if (v.z > bound.max.z) {
        bound.max.z = v.z;
      }
    }

    const center = new THREE.Vector3(
      (bound.max.x - bound.min.x) / 2 + bound.min.x,
      (bound.max.y - bound.min.y) / 2 + bound.min.y,
      (bound.max.z - bound.min.z) / 2 + bound.min.z
    );

    const points = [];
    points.push(new THREE.Vector2(bound.min.x, bound.min.z));
    points.push(new THREE.Vector2(bound.max.x, bound.min.z));
    points.push(new THREE.Vector2(bound.max.x, bound.max.z));
    points.push(new THREE.Vector2(bound.min.x, bound.max.z));

    const camera = this.mapControlInit.control.object;
    let aspect = (bound.max.x - bound.min.x) / (bound.max.z - bound.min.z);

    if (aspect > 1.0) {
      // определяем что больше ширина или высота
      let x = bound.max.x - bound.min.x < 0.1 ? 0.1 : bound.max.x - bound.min.x;
      camera.zoom = camera.right / (x / 2);
    } else {
      let z = bound.max.z - bound.min.z < 0.1 ? 0.1 : bound.max.z - bound.min.z;
      camera.zoom = camera.top / (z / 2);
    }
    console.log(camera, camera.rotation.x, camera.rotation.y, camera.rotation.z);

    const pos = new THREE.Vector3(20, 20, -20);
    camera.position.copy(pos);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    this.mapControlInit.control.target.copy(center);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    this.mapControlInit.control.update();

    // визуализация boundBox изометрии
    const helpVisual = false;
    if (helpVisual) {
      const shape = new THREE.Shape(points);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
      const geometry = new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, depth: -(bound.max.y - bound.min.y) });
      geometry.rotateX(Math.PI / 2);
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = bound.min.y;
      this.modelsContainerInit.control.add(cube);

      const geometry2 = new THREE.BoxGeometry(1, 1, 1);
      const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube2 = new THREE.Mesh(geometry2, material2);
      cube2.position.copy(center);
      this.modelsContainerInit.control.add(cube2);
    }
  }

  // собираем изометрию из полученных данных
  init({ tubes, valves, tees, dataObjs }) {
    for (let i = 0; i < tubes.length; i++) {
      this.createTube(tubes[i]);
    }

    for (let i = 0; i < valves.length; i++) {
      if (valves[i].shapes.length === 0) continue;

      this.createValve(valves[i]);
    }

    for (let i = 0; i < tees.length; i++) {
      if (tees[i].shapes.length === 0) continue;

      this.createTee(tees[i]);
    }

    this.createJoins();
    this.linkJoins();

    this.jsonIsometry = { tubes, valves, tees };

    this.dataObjs = dataObjs;
  }

  // создание труб
  createTube(data) {
    const points = data.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const lineStyle = data.lineStyle;

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const tubeGeometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 32, false);
    const tubeObj = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true }));
    tubeObj.material.visible = false;
    tubeObj.userData = {};
    tubeObj.userData.isIsometry = true;
    tubeObj.userData.isTube = true;
    tubeObj.userData.line = null;

    const obj = this.createLine({ points, lineStyle });
    obj.userData = {};
    obj.userData.isLine = true;
    obj.userData.nameTxt = points.length === 2 ? 'труба' : 'угол';
    obj.userData.points = [points[0], points[points.length - 1]];
    obj.userData.line = points.map((p) => p.clone());
    obj.userData.lineStyle = lineStyle;
    obj.userData.joins = [];
    obj.userData.labels = [];
    obj.userData.tubeObj = tubeObj;

    tubeObj.userData.line = obj;

    if (lineStyle) {
      isometricLineStyle.setTypeLine(lineStyle, tubeObj);
    }

    this.modelsContainerInit.control.add(tubeObj);
    this.modelsContainerInit.control.add(obj);

    this.tubes.push(tubeObj);

    this.svgLines.push(points);
    this.lines.push(obj);

    const p1 = obj.userData.points[0];
    const p2 = obj.userData.points[1];
    let result = this.joinsPos.get(p1.x + '' + p1.y + '' + p1.z);
    if (!result) this.joinsPos.set(p1.x + '' + p1.y + '' + p1.z, { pos: p1, obj: null });

    result = this.joinsPos.get(p2.x + '' + p2.y + '' + p2.z);
    if (!result) this.joinsPos.set(p2.x + '' + p2.y + '' + p2.z, { pos: p2, obj: null });

    return obj;
  }

  // создание кранов
  createValve(data) {
    const size = data.boundBox[0].size;
    const posG = data.boundBox[0].pos;
    const obj = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true, opacity: 1 })
    );
    obj.material.visible = false;
    obj.geometry.translate(posG.x, posG.y, posG.z);

    obj.userData = {};
    obj.userData.isIsometry = true;
    obj.userData.isObj = true;
    obj.userData.isValve = true;
    obj.userData.nameTxt = 'кран';
    obj.userData.shapes = [];
    obj.userData.boundBox = data.boundBox;
    obj.userData.joins = [];
    obj.userData.labels = [];

    const points = data.joins.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    obj.userData.points = [points[0], points[1]];

    for (let i2 = 0; i2 < data.shapes.length; i2++) {
      const points = data.shapes[i2].map((p) => new THREE.Vector3(p.x, p.y, p.z));

      obj.userData.shapes.push(points);

      const line = this.createLine({ points });
      obj.add(line);
      line.updateMatrixWorld();
      line.updateMatrix();
    }

    obj.position.set(data.pos.x, data.pos.y, data.pos.z);
    obj.rotation.set(data.rot.x, data.rot.y, data.rot.z);

    this.modelsContainerInit.control.add(obj);
    this.valves.push(obj);

    points.forEach((p1) => {
      this.joinsPos.set(p1.x + '' + p1.y + '' + p1.z, { pos: p1, obj: null });
    });

    return obj;
  }

  // создание тройников
  createTee(data) {
    const size = data.boundBox[0].size;
    const posG = data.boundBox[0].pos;
    const obj = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true, opacity: 1 })
    );
    obj.material.visible = false;
    obj.geometry.translate(posG.x, posG.y, posG.z);

    //const obj = new THREE.Mesh();
    obj.userData = {};
    obj.userData.isIsometry = true;
    obj.userData.isObj = true;
    obj.userData.isTee = true;
    obj.userData.nameTxt = 'тройник';
    obj.userData.shapes = [];
    obj.userData.boundBox = data.boundBox;
    obj.userData.joins = [];
    obj.userData.labels = [];

    const points = data.joins.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    obj.userData.points = [points[0], points[1], points[2]];

    for (let i2 = 0; i2 < data.shapes.length; i2++) {
      const points = data.shapes[i2].map((p) => new THREE.Vector3(p.x, p.y, p.z));

      obj.userData.shapes.push(points);

      const line = this.createLine({ points });
      obj.add(line);
      line.updateMatrixWorld();
      line.updateMatrix();
    }

    obj.position.set(data.pos.x, data.pos.y, data.pos.z);
    obj.rotation.set(data.rot.x, data.rot.y, data.rot.z);

    this.modelsContainerInit.control.add(obj);
    this.tees.push(obj);

    points.forEach((p1) => {
      this.joinsPos.set(p1.x + '' + p1.y + '' + p1.z, { pos: p1, obj: null });
    });

    return obj;
  }

  // создаем стыки
  createJoins() {
    this.joinsPos.forEach((value, key, map) => {
      if (!value.obj) {
        const jp = this.createJoin(value.pos);
        value.obj = jp;
      }
    });
  }

  createJoin(pos) {
    const jp = this.helperSphere({ pos, size: 0.075, color: 0x222222 });
    jp.userData.isIsometry = true;
    jp.userData.isJoint = true;
    jp.userData.nameTxt = 'стык';
    jp.userData.tubes = [];
    jp.userData.objs = [];
    jp.userData.labels = [];
    jp.userData.rulerPoints = [];
    this.joins.push(jp);

    return jp;
  }

  // связываем стыки с объектами
  linkJoins() {
    for (let i = 0; i < this.tubes.length; i++) {
      const points = this.tubes[i].userData.line.userData.points;

      for (let i2 = 0; i2 < points.length; i2++) {
        const p = points[i2];

        const result = this.joinsPos.get(p.x + '' + p.y + '' + p.z);
        if (result) {
          this.tubes[i].userData.line.userData.joins.push(result.obj);
          result.obj.userData.tubes.push({ obj: this.tubes[i].userData.line, id: i2 });
        }
      }
    }

    for (let i = 0; i < this.valves.length; i++) {
      const points = this.valves[i].userData.points;

      for (let i2 = 0; i2 < points.length; i2++) {
        const p = points[i2];

        const result = this.joinsPos.get(p.x + '' + p.y + '' + p.z);
        if (result) {
          this.valves[i].userData.joins.push(result.obj);
          result.obj.userData.objs.push(this.valves[i]);
        }
      }
    }

    for (let i = 0; i < this.tees.length; i++) {
      const points = this.tees[i].userData.points;

      for (let i2 = 0; i2 < points.length; i2++) {
        const p = points[i2];

        const result = this.joinsPos.get(p.x + '' + p.y + '' + p.z);
        if (result) {
          this.tees[i].userData.joins.push(result.obj);
          result.obj.userData.objs.push(this.tees[i]);
        }
      }
    }
  }

  // отображение линий по точкам
  createLine({ points }) {
    const positions = [];
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
    points = curve.getPoints(12 * points.length);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      positions.push(point.x, point.y, point.z);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const domElement = this.mapControlInit.control.domElement;

    const matLine = new LineMaterial({
      color: 0x000000,
      linewidth: 1,
      worldUnits: false,
      dashed: false,
      dashScale: 4,
      dashSize: 4,
      gapSize: 1,
      alphaToCoverage: true,
      resolution: new THREE.Vector2(domElement.clientWidth, domElement.clientHeight),
    });

    const line = new Line2(geometry, matLine);
    line.computeLineDistances();

    return line;
  }

  // построение sphere для визуализиции
  helperSphere({ pos, size, color = 0x0000ff }) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true }));
    sphere.position.copy(pos);
    this.modelsContainerInit.control.add(sphere);

    return sphere;
  }

  // удаляем изометрию
  deleteObjs() {
    const arr = [...this.lines, ...this.tubes, ...this.valves, ...this.tees, ...this.joins];

    arr.forEach((item) => {
      this.clearMesh(item);
    });

    this.lines = [];
    this.tubes = [];
    this.valves = [];
    this.tees = [];
    this.joins = [];
    this.joinsPos = new Map();

    const rulerObjs = isometricRulerService.rulerObjs;

    rulerObjs.forEach((obj) => {
      deleteObj.deleteRuler(obj, false);
    });

    isometricRulerService.rulerObjs = [];

    const labelObjs = isometricLabelsService.labelObjs;
    labelObjs.forEach((obj) => {
      deleteObj.deleteLabel(obj, false);
    });
    isometricLabelsService.labelObjs = [];
  }

  clearMesh(mesh) {
    mesh?.parent?.remove(mesh);
    mesh.geometry.dispose();

    const materials = [];
    if (Array.isArray(mesh.material)) {
      materials.push(...mesh.material);
    } else if (mesh.material instanceof THREE.Material) {
      materials.push(mesh.material);
    }

    materials.forEach((mtrl) => {
      if (mtrl.map) mtrl.map.dispose();
      if (mtrl.lightMap) mtrl.lightMap.dispose();
      if (mtrl.bumpMap) mtrl.bumpMap.dispose();
      if (mtrl.normalMap) mtrl.normalMap.dispose();
      if (mtrl.specularMap) mtrl.specularMap.dispose();
      if (mtrl.envMap) mtrl.envMap.dispose();
      mtrl.dispose();
    });
  }
}

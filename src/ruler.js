import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { modelsContainerInit, mapControlInit } from './index';

export class IsometricRulerService {
  act = false;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector3();
  obj;
  pointsTool = [];
  rulerObjs = [];
  modelsContainerInit;
  mapControlInit;

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
    this.mapControlInit = mapControlInit;
  }

  // кликнули на изометрию, создаем точку для линейки
  createPoint(intersection) {
    let create = false;
    const pos = intersection.point;

    const point = this.helperSphere({ pos: pos, size: 0.075, color: 0xff0000 });
    this.pointsTool.push(point);

    if (this.pointsTool.length === 2) {
      this.createRuler();
      create = true;
    }

    return create;
  }

  // есть 2 точки, создаем линейку
  createRuler(points = []) {
    if (points.length === 0) points = this.pointsTool.map((p) => p.position);
    const startPoints = [...points];

    const startPosCenter = points[1].clone().sub(points[0]);
    startPosCenter.divideScalar(2).add(points[0]);

    const dashes = this.createSideLine({ points });
    const pos1 = this.getPosPointLine({ line: dashes[0], id: 1 });
    const pos2 = this.getPosPointLine({ line: dashes[1], id: 1 });

    points = [pos1, pos2];

    const lineG = this.createArrow({ points });
    const cone1 = this.createCone({ points, id: 0 });
    const cone2 = this.createCone({ points, id: 1 });
    const objDiv = this.createDiv({ obj: lineG, points });

    lineG.userData.startPoints = startPoints;
    lineG.userData.startPos = lineG.position.clone();
    lineG.userData.startPosCenter = startPosCenter;
    lineG.userData.cones = [cone1, cone2];
    lineG.userData.line2 = dashes;
    lineG.userData.objDiv = objDiv;
    lineG.userData.dir = startPosCenter.clone().sub(this.getPosCenter(lineG)).normalize();
    this.setRotLabel(lineG);
    this.setPosObjDiv(lineG);

    this.pointsTool.forEach((pointO) => {
      pointO.removeFromParent();
      pointO.geometry.dispose();
    });

    this.rulerObjs.push(lineG);

    this.pointsTool = [];

    return lineG;
  }

  // создание основной стрелки
  createArrow({ points }) {
    const line = this.createLine({ points });
    line.material.color.set(0x000000);

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const geometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 12, false);
    const lineG = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: false, transparent: true }));
    lineG.material.visible = false;
    lineG.userData = {};
    lineG.userData.isRuler = true;
    lineG.userData.startPosCenter = new THREE.Vector3();
    lineG.userData.dir = new THREE.Vector3();
    lineG.userData.line = line;
    lineG.userData.cones = [];
    lineG.userData.line2 = [];
    lineG.userData.objDiv = null;
    lineG.userData.label = null;

    this.modelsContainerInit.control.add(line, lineG);

    return lineG;
  }

  // наконечник стрелки
  createCone({ points, id }) {
    const geometry = new THREE.ConeGeometry(0.1, 0.25, 32);
    geometry.translate(0, -0.25 / 2, 0);
    geometry.rotateX(-Math.PI / 2);
    const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));

    const id2 = id === 0 ? 1 : 0;

    obj.position.copy(points[id]);
    obj.lookAt(points[id2]);

    this.modelsContainerInit.control.add(obj);

    return obj;
  }

  // создание боковых линий
  createSideLine({ points }) {
    const line2 = [];

    const dir = points[0].clone().sub(points[1]).normalize();
    const dir2 = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const dir1 = new THREE.Vector3(dir2.x * 0.2, 0, dir2.z * 0.2);

    line2[0] = this.createLine({ points: [points[0].clone().add(dir1), points[0].clone().add(dir2)] });
    line2[1] = this.createLine({ points: [points[1].clone().add(dir1), points[1].clone().add(dir2)] });

    line2[0].userData.startPos = points[0];
    line2[1].userData.startPos = points[1];

    line2.forEach((line) => {
      line.material.color.set(0x000000);
    });

    this.modelsContainerInit.control.add(...line2);

    return line2;
  }

  createDiv({ obj, points }) {
    const posC = points[1].clone().sub(points[0]);
    posC.divideScalar(2).add(points[0]);

    const point = this.helperSphere({ pos: posC, size: 0.075, color: 0x00ff00 });
    point.visible = false;

    const container = document.createElement('div');

    const elem = document.createElement('div');
    elem.textContent = 'размер';
    //elem.style.background = 'rgb(255, 255, 255)';
    //elem.style.border = '1px solid rgb(204, 204, 204)';
    elem.style.fontSize = '20px';
    elem.style.fontFamily = 'arial,sans-serif';
    //elem.style.borderRadius = '4px';
    elem.style.cursor = 'pointer';
    elem.style.padding = '10px';
    //elem.style.transform = 'rotate(30deg)';
    container.append(elem);

    const label = new CSS2DObject(container);

    label.position.set(0, 0, 0);
    point.add(label);

    obj.userData.label = label;

    this.initEventLabel(label);

    return point;
  }

  initEventLabel(label) {
    const container = label.element;
    const elem = container.children[0];

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      elem2.textContent = '';
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.fontSize = '20px';
      elem.style.fontFamily = 'arial,sans-serif';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';
      container.append(elem2);

      elem2.focus();

      elem2.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          const txt = elem2.value;
          container.children[1].remove();

          if (txt !== '') elem.textContent = txt;
          elem.style.display = '';
        }
      };

      elem.style.display = 'none';
    };
  }

  // отображение линий по точкам
  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);

    return line;
  }

  // построение sphere для визуализиции
  helperSphere({ pos, size, color = 0x0000ff }) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true }));
    sphere.position.copy(pos);
    this.modelsContainerInit.control.add(sphere);

    return sphere;
  }

  rayIntersect(event, obj, t) {
    const canvas = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    // function getMousePosition(event) {
    //   const rect = canvas.getBoundingClientRect();

    //   const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    //   const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    //   return new THREE.Vector2(x, y);
    // }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0;
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = [];
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  onmousedown({ intersection, event, plane }) {
    //const obj = intersection.object;
    //if (obj.userData.isRuler) this.clickRuler({ event, obj, plane });

    const create = this.createPoint(intersection);

    return create;
  }

  // кликнули на линейку, готовимся ее перемещению
  clickRuler({ event, obj, plane }) {
    this.obj = obj;

    plane.position.copy(obj.position);
    plane.rotation.copy(this.mapControlInit.control.object.rotation);
    plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length == 0) return;
    this.offset = intersects[0].point;

    this.isDown = true;
    this.isMove = true;
  }

  onmousemove = (event, plane) => {
    if (!this.isMove) return;

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length == 0) return;

    let offset = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point;

    // const pos1 = this.getPosPointLine({ line: this.obj.userData.line2[0], id: 1 });
    // const pos2 = this.getPosPointLine({ line: this.obj.userData.line2[1], id: 1 });
    // const posCenter = pos1.clone().sub(pos2);
    // posCenter.divideScalar(2).add(pos2);

    //const startPosCenter = this.obj.userData.startPosCenter;

    // let dir = posCenter.clone().sub(startPosCenter).normalize();
    // let dir = new THREE.Vector3(0, 0, 1);
    // let dist = dir.dot(new THREE.Vector3().subVectors(intersects[0].point, offset));
    // let pos = offset.clone().add(new THREE.Vector3().addScaledVector(dir, dist));
    // offset = new THREE.Vector3().subVectors(pos, offset);

    this.offsetLabel({ obj: this.obj, offset });
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };

  offsetLabel({ obj, offset }) {
    const startPosCenter = obj.userData.startPosCenter;

    obj.position.add(offset);

    obj.userData.line.position.add(offset);

    obj.userData.cones.forEach((cone) => {
      cone.position.add(offset);
    });

    obj.userData.line2.forEach((line2) => {
      const pos = line2.userData.startPos.clone();
      const dir1 = obj.userData.dir;
      const pos1 = pos.sub(new THREE.Vector3().addScaledVector(dir1, 0.2));

      //const pos1 = this.getPosPointLine({ line: line2, id: 0 });
      const pos2 = this.getPosPointLine({ line: line2, id: 1 });
      pos2.add(offset);

      const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
      line2.geometry.dispose();
      line2.geometry = geometry;
    });

    if (obj.userData.objDiv && obj.userData.label) {
      obj.userData.objDiv.position.add(offset);
      this.setPosObjDiv(obj);
      this.setRotLabel(obj);

      const dir2 = startPosCenter.clone().sub(obj.userData.objDiv.position).normalize();
      let dot = obj.userData.dir.dot(dir2);
      obj.userData.dir = dir2;
    }
  }

  setRotLabel(obj) {
    const pos1 = this.getPosPointLine({ line: obj.userData.line2[0], id: 1 });
    const pos2 = this.getPosPointLine({ line: obj.userData.line2[1], id: 1 });

    const p1 = this.getPosition2D(pos1);
    const p2 = this.getPosition2D(pos2);

    const dir = new THREE.Vector2().subVectors(p2, p1);
    let rotY = Math.atan2(dir.x, dir.y);
    rotY += rotY <= 0.001 ? Math.PI / 2 : -Math.PI / 2;
    rotY = THREE.MathUtils.radToDeg(rotY);

    const container = obj.userData.label.element;
    const elem = container.children[0];
    elem.style.transform = 'rotate(' + -rotY + 'deg)';

    // const offset = new THREE.Vector3(-dir.y, dir.x).normalize();
    // if (offset.y < p1.y || offset.y < p2.y) {
    //   offset.x *= -1;
    //   offset.y *= -1;
    // }
    // container.style.top = offset.y * 30 + 'px';
    // container.style.left = offset.x * 30 + 'px';
    // console.log(rotY, elem.children[0], offset);
  }

  // положение объекта на 2D экране
  getPosition2D(pos) {
    const camera = this.mapControlInit.control.object;
    const canvas = this.mapControlInit.control.domElement;

    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return new THREE.Vector2(x, y);
  }

  // получаем pos для начала или конца линии
  getPosPointLine({ line, id }) {
    const arrPos = line.geometry.getAttribute('position').array;
    const pos1 = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);
    const pos2 = new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]);

    return id === 0 ? pos1 : pos2;
  }

  // устанавливаем Div со внутренней стороны
  setPosObjDiv(obj) {
    const posCenter = this.getPosCenter(obj);

    const startPosCenter = obj.userData.startPosCenter;

    let dir = posCenter.clone().sub(startPosCenter).normalize();
    dir = new THREE.Vector3().addScaledVector(dir, 0.5);
    const pos = posCenter.clone().sub(dir);

    obj.userData.objDiv.position.copy(pos);
  }

  getPosCenter(obj) {
    const pos1 = this.getPosPointLine({ line: obj.userData.line2[0], id: 1 });
    const pos2 = this.getPosPointLine({ line: obj.userData.line2[1], id: 1 });

    const posCenter = pos1.clone().sub(pos2);
    posCenter.divideScalar(2).add(pos2);

    return posCenter;
  }

  deleteRuler(obj) {}
}

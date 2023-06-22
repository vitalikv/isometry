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
    const pos = intersection.point;

    const point = this.helperSphere({ pos: pos, size: 0.075, color: 0xff0000 });
    this.pointsTool.push(point);

    if (this.pointsTool.length === 2) {
      this.createRuler();
    }
  }

  // есть 2 точки, создаем линейку
  createRuler() {
    const points = this.pointsTool.map((p) => p.position);

    const line = this.createLine({ points });

    const line2 = [];
    line2[0] = this.createLine({ points: [points[0].clone(), points[0].clone()] });
    line2[1] = this.createLine({ points: [points[1].clone(), points[1].clone()] });

    line2[0].userData.points = [points[0].clone(), points[0].clone()];
    line2[1].userData.points = [points[1].clone(), points[1].clone()];

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const geometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 12, false);
    const lineG = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: false, transparent: true }));
    lineG.material.visible = false;
    lineG.userData = {};
    lineG.userData.isRuler = true;
    lineG.userData.line = line;
    lineG.userData.line2 = line2;
    lineG.userData.pointObjs = this.pointsTool;
    lineG.userData.labelPoint = null;
    lineG.userData.label = null;

    this.modelsContainerInit.control.add(line, lineG, ...line2);

    lineG.userData.pointObjs.forEach((pointO) => {
      pointO.userData.isRuler = true;
      pointO.userData.line = [];
      pointO.userData.line.push(line);
    });

    //this.rulerObjs.push(lineG, ...this.pointsTool);
    this.rulerObjs.push(lineG);

    this.pointsTool = [];

    this.createLabel({ obj: lineG, points });
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
    const obj = intersection.object;

    if (obj.userData.isIsometry) this.createPoint(intersection);
    if (obj.userData.isRuler) this.clickRuler({ event, obj, plane });
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

    const offset = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point;

    this.obj.position.add(offset);

    this.obj.userData.pointObjs.forEach((pointO) => {
      pointO.position.add(offset);
    });

    this.obj.userData.line.position.add(offset);

    this.obj.userData.line2.forEach((line2) => {
      line2.userData.points[1].add(offset);

      const geometry = new THREE.BufferGeometry().setFromPoints(line2.userData.points);
      line2.geometry.dispose();
      line2.geometry = geometry;
    });

    if (this.obj.userData.labelPoint && this.obj.userData.label) {
      this.obj.userData.labelPoint.position.add(offset);
      this.setRotLabel(this.obj);
    }
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };

  createLabel({ obj, points }) {
    const posC = points[1].clone().sub(points[0]);
    posC.divideScalar(2).add(points[0]);

    const point = this.helperSphere({ pos: posC, size: 0.075, color: 0x00ff00 });
    point.visible = false;
    obj.userData.labelPoint = point;

    const container = document.createElement('div');

    const elem = document.createElement('div');
    elem.textContent = 'размер';
    elem.style.background = 'rgb(255, 255, 255)';
    elem.style.border = '1px solid rgb(204, 204, 204)';
    elem.style.fontSize = '20px';
    elem.style.borderRadius = '4px';
    elem.style.cursor = 'pointer';
    elem.style.padding = '10px';
    elem.style.transform = 'rotate(30deg)';
    container.append(elem);

    const label = new CSS2DObject(container);
    console.log(label);
    label.position.set(0, 0, 0);
    point.add(label);

    obj.userData.label = label;
    this.setRotLabel(obj);
    this.initEventLabel(label);
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

  setRotLabel(obj) {
    const p1 = this.getPosition2D(obj.userData.pointObjs[0].position);
    const p2 = this.getPosition2D(obj.userData.pointObjs[1].position);

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
}

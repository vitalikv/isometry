import * as THREE from 'three';

import { modelsContainerInit, controls, selectObj } from './index';

export class Ruler {
  act = false;
  plane;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector3();
  obj;
  pointsTool = [];
  rulerObjs = [];
  modelsContainerInit;
  controls;
  selectObj;

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
    this.controls = controls;
    this.selectObj = selectObj;
    this.plane = this.initPlane();
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
  }

  initPlane() {
    let geometry = new THREE.PlaneGeometry(10000, 10000);
    let material = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    //material.visible = false;
    const planeMath = new THREE.Mesh(geometry, material);
    planeMath.rotation.set(-Math.PI / 2, 0, 0);
    //this.modelsContainerInit.control.add(planeMath);

    return planeMath;
  }

  onKeyDown = (evet) => {
    if (event.code !== 'KeyR') return;

    this.act = !this.act;

    const type = this.act ? 'ruler' : 'move';
    this.selectObj.changeType(type);
  };

  click({ intersection, event }) {
    const obj = intersection.object;

    if (obj.userData.isIsometry) this.createPoint(intersection);
    if (obj.userData.isRuler) this.clickRuler({ event, obj });
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

    this.modelsContainerInit.control.add(line, lineG, ...line2);

    lineG.userData.pointObjs.forEach((pointO) => {
      pointO.userData.isRuler = true;
      pointO.userData.line = [];
      pointO.userData.line.push(line);
    });

    //this.rulerObjs.push(lineG, ...this.pointsTool);
    this.rulerObjs.push(lineG);

    this.pointsTool = [];
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
    const container = this.controls.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1;
      const y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0;
    raycaster.setFromCamera(mouse, this.controls.object);

    let intersects = null;
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  // кликнули на линейку, готовимся ее перемещению
  clickRuler({ event, obj }) {
    this.obj = obj;

    this.plane.position.copy(obj.position);
    this.plane.rotation.copy(controls.object.rotation);
    this.plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, this.plane, 'one');
    if (intersects.length == 0) return;
    this.offset = intersects[0].point;

    this.isDown = true;
    this.isMove = true;
  }

  onmousemove = (event) => {
    if (!this.isMove) return;

    const intersects = this.rayIntersect(event, this.plane, 'one');
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
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };
}

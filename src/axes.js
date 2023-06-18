import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class Axes {
  mapControlInit;
  modelsContainerInit;
  isometricSchemeService;
  activated = false;
  toolAxes;
  isDown = false;
  actObj = null;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.isometricSchemeService = gisdPage;
    this.toolAxes = this.createToolAxes();
  }

  createToolAxes() {
    const obj3D = new THREE.Object3D();
    const x = this.createLine({ points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0)], color: 0xff0000, axis: 'x' });
    const y = this.createLine({ points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0)], color: 0x00ff00, axis: 'y' });
    const z = this.createLine({ points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10)], color: 0x0000ff, axis: 'z' });

    obj3D.add(x, y, z);
    this.modelsContainerInit.control.add(obj3D);
    obj3D.visible = false;

    return obj3D;
  }

  // включаем оси
  enable({ obj }) {
    const result = this.checkObj(obj);

    if (result) {
      this.activated = true;
      this.actObj = obj;

      this.toolAxes.position.copy(obj.position);

      if (obj.userData.isTube) {
        obj = obj.userData.line;
        const linePoints = obj.userData.line;
        let pos = linePoints[1].clone().sub(linePoints[0]);
        pos = new THREE.Vector3().addScaledVector(pos, 0.5);
        pos.add(linePoints[0]);

        this.toolAxes.position.copy(pos);
      }

      this.toolAxes.visible = true;
      this.mapControlInit.control.enablePan = false;
    }

    return result;
  }

  // отключаем оси
  disable() {
    const result = this.activated;

    if (result) {
      this.activated = false;
      this.toolAxes.visible = false;
      this.mapControlInit.control.enablePan = true;
    }

    return result;
  }

  onmousedown() {
    if (!this.activated) return;
    this.isDown = true;
  }

  onmousemove(event) {
    if (!this.isDown) return;
    if (!this.actObj) return;

    this.rotObj({ event, obj: this.actObj });
  }

  onmouseup() {
    this.isDown = false;
    this.actObj = null;
  }

  rotObj({ event, obj }) {
    const intersections = this.rayIntersect(event, [this.toolAxes], 'arr', 0.25);
    if (intersections.length === 0) return;

    const axis = intersections[0].object;
    const points = axis.userData.points;

    if (obj.userData.isObj) {
      this.setRot({ obj, pos1: points[0], pos2: points[1] });

      obj.userData.joins.forEach((joint, ind) => {
        const pos = obj.localToWorld(obj.userData.points[ind].clone());
        joint.position.copy(pos);
      });
    }

    if (obj.userData.isTube) {
      const dir = points[1].clone().sub(points[0]).normalize();
      obj = obj.userData.line;
      const linePoints = obj.userData.line;

      linePoints[0].copy(this.toolAxes.position.clone().add(new THREE.Vector3().addScaledVector(dir, 1)));
      linePoints[1].copy(this.toolAxes.position.clone().add(new THREE.Vector3().addScaledVector(dir, -1)));

      this.updataTubeLine({ obj, pos1: linePoints[0], pos2: linePoints[1] });

      obj.userData.joins[0].position.copy(linePoints[0]);
      obj.userData.joins[1].position.copy(linePoints[1]);
    }
  }

  // проверяем объект, что он ни к чему не присоединен
  checkObj(obj) {
    let result = false;

    if (obj && (obj.userData.isTube || obj.userData.isObj)) {
      if (obj.userData.isTube) obj = obj.userData.line;

      let jointObject = [];

      obj.userData.joins.forEach((joint) => {
        joint.userData.tubes.forEach((item) => {
          if (item.obj !== obj) jointObject.push(item.obj);
        });
        joint.userData.objs.forEach((item) => {
          if (item !== obj) jointObject.push(item);
        });
      });

      const count = jointObject.length;
      console.log(count, jointObject);
      result = count === 0 ? true : false;
    }

    return result;
  }

  // поворот объекта по двум точкам
  setRot({ obj, pos1, pos2 }) {
    const dir = pos2.clone().sub(pos1).normalize();

    const pos = obj.position.clone();
    obj.position.set(0, 0, 0);
    obj.lookAt(dir);
    obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    obj.position.copy(pos);
  }

  // отображение линий по точкам
  createLine({ points, color, axis }) {
    const material = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    line.userData = {};
    line.userData.axis = axis;
    line.userData.points = points;

    return line;
  }

  rayIntersect(event, obj, t, threshold = 0) {
    const canvas = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = threshold;
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = [];
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  // обновляем геометрию линии при перемещение всей линии или певрой/последней точки
  updataTubeLine({ obj, pos1, pos2 }) {
    const points = obj.userData.line;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    obj.geometry.dispose();
    obj.geometry = geometry;

    this.updataTubeGeom({ obj });
  }

  // обновляем геометрию трубы
  updataTubeGeom({ obj }) {
    const tubeObj = obj.userData.tubeObj;
    const points = obj.userData.line;
    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;

    const tubeGeometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 32, false);
    tubeObj.geometry.dispose();
    tubeObj.geometry = tubeGeometry;
  }
}

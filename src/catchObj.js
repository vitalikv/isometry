import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class CatchObj {
  mapControlInit;
  modelsContainerInit;
  isometricSchemeService;
  done = false;
  isMove = false;
  offset = new THREE.Vector3();

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.isometricSchemeService = gisdPage;
  }

  onmousemove({ event, obj, offset }) {
    if (!this.isMove) {
      this.isMove = true;

      this.done = this.checkObj(obj);
    }

    if (this.done) {
      const intersection = this.defineIntersectionObj({ event, obj });
      if (intersection) {
        this.setPosRot({ obj, intersection });
      } else {
        obj.position.sub(this.offset);
        obj.position.add(offset);
        this.offset = new THREE.Vector3();
      }

      obj.userData.joins.forEach((joint, ind) => {
        const pos = obj.localToWorld(obj.userData.points[ind].clone());
        joint.position.copy(pos);
      });
    }

    return this.done;
  }

  onmouseup() {
    this.isMove = false;
    this.done = false;
    this.offset = new THREE.Vector3();
  }

  // проверяем объект, что он ни к чему не присоединен
  checkObj(obj) {
    let jointObject = [];

    obj.userData.joins.forEach((joint) => {
      joint.userData.tubes.forEach((item) => {
        if (item !== obj) jointObject.push(item);
      });
      joint.userData.objs.forEach((item) => {
        if (item !== obj) jointObject.push(item);
      });
    });

    const count = jointObject.length;

    const res = count === 0 ? true : false;
    console.log(res, count, jointObject);

    return res;
  }

  // определяем если пересечение с другим объектом
  defineIntersectionObj({ event, obj }) {
    const lines = this.isometricSchemeService.lines;
    const intersections = this.rayIntersect(event, lines, 'arr', 0.25);

    // const tubes = this.isometricSchemeService.tubes;
    // const valves = this.isometricSchemeService.valves;
    // const tees = this.isometricSchemeService.tees;
    // const intersections = this.rayIntersect(event, [...tubes, ...valves, ...tees], 'arr', 0);
    if (intersections.length === 0) return;

    const intersection = this.sortObj({ obj, intersections });
    if (!intersection) return;

    return intersection;
  }

  // находим луч, который не пересекается с нашем объектом
  sortObj({ obj, intersections }) {
    let intersection = null;

    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i].object === obj) continue;

      intersection = intersections[i];
      break;
    }

    return intersection;
  }

  // позиционируем объект относительно другого
  setPosRot({ obj, intersection }) {
    const pos = intersection.point;
    const obj2 = intersection.object;

    if (this.offset.length() === 0) {
      this.offset = pos.clone().sub(obj.position);
    }

    obj.position.copy(pos);
    if (obj2.userData.isTube || obj2.userData.isLine) {
      const line = obj2.userData.isTube ? obj2.userData.line : obj2;
      const pos1 = line.userData.joins[0].position;
      const pos2 = line.userData.joins[line.userData.joins.length - 1].position;
      this.setRot({ obj, pos1, pos2 });
    }
    if (obj2.userData.isObj) obj.rotation.copy(obj2.rotation);
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
}

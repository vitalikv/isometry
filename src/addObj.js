import * as THREE from 'three';

import { gisdPage, modelsContainerInit, mapControlInit } from './index';
import { ConvertValves } from './convertValves';
import { ConvertTees } from './convertTees';

export class AddObj {
  activated = false;
  type = '';
  modelsContainerInit;
  mapControlInit;

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
    this.mapControlInit = mapControlInit;
  }

  enable(type) {
    this.activated = true;
    this.type = type;
  }

  disable() {
    this.activated = false;
    this.type = '';
  }

  rayIntersect(event, obj, t) {
    const container = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1;
      const y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = [];
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  click({ event, plane }) {
    if (!this.activated) return;

    let dir1 = this.mapControlInit.control.object.getWorldDirection(new THREE.Vector3());
    dir1 = new THREE.Vector3().addScaledVector(dir1, 10);

    plane.position.copy(dir1);
    plane.rotation.copy(this.mapControlInit.control.object.rotation);
    plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length == 0) return;
    const pos = intersects[0].point;

    if (this.type === 'tube') this.addTube(pos);
    if (this.type === 'corner') this.addCorner(pos);
    if (this.type === 'valve') this.addValve(pos);
    if (this.type === 'tee') this.addTee(pos);

    this.disable();

    return true;
  }

  addTube(pos) {
    const arr = [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)];

    arr.forEach((v) => {
      v.x += pos.x;
      v.y += pos.y;
      v.z += pos.z;
    });
    const obj = gisdPage.createTube(arr);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 0 });

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 1 });
  }

  addCorner(pos) {
    const arr = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0.26, 0), new THREE.Vector3(0.23, 0.4, 0), new THREE.Vector3(0.49, 0.5, 0)];

    arr.forEach((v) => {
      v.x *= 2;
      v.y *= 2;
      v.z *= 2;
      v.x += pos.x;
      v.y += pos.y;
      v.z += pos.z;
    });
    const obj = gisdPage.createTube(arr);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 0 });

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 1 });
  }

  addValve(pos) {
    let obj = gisdPage.shapeObjs.valveObj.clone();

    const dist = 0.5;
    obj.scale.set(dist / 2, dist / 2, dist / 2);

    const convertValves = new ConvertValves();

    obj.position.copy(pos);

    convertValves.upObjUserData({ obj });
    convertValves.getBoundObject({ obj });

    //this.modelsContainerInit.control.add(obj);
    obj = gisdPage.createValve(obj.userData);
    obj.position.copy(pos);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);

    console.log(pos);
  }

  addTee(pos) {
    let obj = gisdPage.shapeObjs.teeObj;

    const dist = 0.5;
    obj.scale.set(dist / 2, dist / 2, dist / 2);

    const convertTees = new ConvertTees();
    obj.position.copy(pos);
    convertTees.upObjUserData({ obj });
    convertTees.getBoundObject({ obj });

    //this.modelsContainerInit.control.add(obj);
    obj = gisdPage.createTee(obj.userData);
    obj.position.copy(pos);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);

    jp = gisdPage.createJoin(obj.userData.points[2].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);
  }
}

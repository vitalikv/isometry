import * as THREE from 'three';

import { gisdPage, modelsContainerInit } from './index';
import { ConvertValves } from './convertValves';
import { ConvertTees } from './convertTees';

export class AddObj {
  activated = false;
  type = '';
  modelsContainerInit;

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
  }

  enable(type) {
    this.activated = true;
    this.type = type;
  }

  disable() {
    this.activated = false;
    this.type = '';
  }

  click() {
    if (!this.activated) return;

    if (this.type === 'tube') this.addTube();
    if (this.type === 'corner') this.addCorner();
    if (this.type === 'valve') this.addValve();
    if (this.type === 'tee') this.addTee();

    this.disable();
  }

  addTube() {
    const obj = gisdPage.createTube([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)]);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 0 });

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 1 });
  }

  addCorner() {
    const arr = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0.26, 0), new THREE.Vector3(0.23, 0.4, 0), new THREE.Vector3(0.49, 0.5, 0)];

    arr.forEach((v) => {
      v.x *= 2;
      v.y *= 2;
      v.z *= 2;
    });
    const obj = gisdPage.createTube(arr);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 0 });

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.tubes.push({ obj, id: 1 });
  }

  addValve() {
    let obj = gisdPage.shapeObjs.valveObj;

    const dist = 0.5;
    obj.scale.set(dist / 2, dist / 2, dist / 2);

    const convertValves = new ConvertValves();

    convertValves.upObjUserData({ obj });
    convertValves.getBoundObject({ obj });

    //this.modelsContainerInit.control.add(obj);
    obj = gisdPage.createValve(obj.userData);

    let jp = gisdPage.createJoin(obj.userData.points[0].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);

    jp = gisdPage.createJoin(obj.userData.points[1].clone());
    obj.userData.joins.push(jp);
    jp.userData.objs.push(obj);
  }

  addTee() {
    let obj = gisdPage.shapeObjs.teeObj;

    const dist = 0.5;
    obj.scale.set(dist / 2, dist / 2, dist / 2);

    const convertTees = new ConvertTees();

    convertTees.upObjUserData({ obj });
    convertTees.getBoundObject({ obj });

    //this.modelsContainerInit.control.add(obj);
    obj = gisdPage.createTee(obj.userData);

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

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { scene } from './index';

export class ShapeObjs {
  valveObj;
  teeObj;

  constructor() {
    this.valveObj = this.createValve();
    this.teeObj = this.createTee();
    this.crTestPointRot({ obj: this.teeObj });
  }

  createValve() {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometries = this.getFormValve();

    const obj = new THREE.Object3D();
    geometries.forEach((g) => obj.add(new THREE.Line(g, material)));

    obj.userData = {};
    obj.userData.pos = new THREE.Vector3();
    obj.userData.rot = new THREE.Vector3();
    obj.userData.scale = 1;
    obj.userData.boundBox = [];
    obj.userData.joins = { tubes: [], points: [] };
    obj.userData.shapes = [];
    geometries.forEach((g) => {
      obj.userData.shapes.push(g.userData.points);
    });

    return obj;
  }

  createTee() {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometries = this.getFormTree();

    const obj = new THREE.Object3D();
    geometries.forEach((g) => obj.add(new THREE.Line(g, material)));

    obj.userData = {};
    obj.userData.pos = new THREE.Vector3();
    obj.userData.rot = new THREE.Vector3();
    obj.userData.scale = 1;
    obj.userData.boundBox = [];
    obj.userData.joins = { tubes: [], points: [] };
    obj.userData.shapes = [];
    geometries.forEach((g) => {
      obj.userData.shapes.push(g.userData.points);
    });

    return obj;
  }

  getFormValve() {
    function line1() {
      const points = [];
      points.push(new THREE.Vector3(-1, -1, 0));
      points.push(new THREE.Vector3(-1, 1, 0));
      points.push(new THREE.Vector3(1, -1, 0));
      points.push(new THREE.Vector3(1, 1, 0));
      points.push(new THREE.Vector3(-1, -1, 0));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.userData = {};
      geometry.userData.points = points;

      return geometry;
    }

    function line2() {
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(0, 1.5, 0));
      points.push(new THREE.Vector3(-1, 1.5, 0));
      points.push(new THREE.Vector3(1, 1.5, 0));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.userData = {};
      geometry.userData.points = points;

      return geometry;
    }

    return [line1(), line2()];
  }

  getFormTree() {
    function line1() {
      const points = [];
      points.push(new THREE.Vector3(-1, 0, 0));
      points.push(new THREE.Vector3(1, 0, 0));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.userData = {};
      geometry.userData.points = points;

      return geometry;
    }

    function line2() {
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(0, -1, 0));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.userData = {};
      geometry.userData.points = points;

      return geometry;
    }

    return [line1(), line2()];
  }

  crTestPointRot({ obj }) {
    obj = obj.clone();
    scene.add(obj);

    const size = 0.2;
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, depthTest: true, transparent: true });
    //const pos = [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)];
    const pos = [new THREE.Vector3(-0.5, -0.3, -1), new THREE.Vector3(0.5, 0.3, 1)];

    const box1 = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material);
    box1.position.copy(pos[0]);
    scene.add(box1);

    const box2 = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material);
    box2.position.copy(pos[1]);
    scene.add(box2);

    this.setRot({ obj, pos1: pos[0], pos2: pos[1] });
  }

  setRot({ obj, pos1, pos2 }) {
    const dir = pos2.clone().sub(pos1).normalize();

    const pos = obj.position.clone();
    obj.position.set(0, 0, 0);
    obj.lookAt(dir);
    obj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    obj.position.copy(pos);

    obj.userData.pos = pos;
    obj.userData.rot = new THREE.Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    obj.userData.scale = obj.scale.x;
  }
}

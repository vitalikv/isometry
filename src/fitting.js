import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class Fitting {
  scene;
  obj;

  constructor({ scene }) {
    this.scene = scene;
    this.createValve();

    //this.crTestPointRot();
  }

  createValve() {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometries = [];
    geometries.push(this.getForm1());
    geometries.push(this.getForm2());
    console.log(geometries);
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    const obj = new THREE.Line(geometry, material);
    obj.geometry.computeBoundingSphere();
    obj.geometry.computeBoundingBox();
    //this.scene.add(obj);

    obj.userData = {};
    obj.userData.pos = new THREE.Vector3();
    obj.userData.rot = new THREE.Vector3();
    obj.userData.scale = 1;
    obj.userData.shapes = [];
    geometries.forEach((g) => {
      obj.userData.shapes.push(g.userData.points);
    });

    this.obj = obj;
  }

  getForm1() {
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

  getForm2() {
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

  crTestPointRot() {
    const size = 0.2;
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, depthTest: true, transparent: true });
    //const pos = [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)];
    const pos = [new THREE.Vector3(-0.5, -0.3, -1), new THREE.Vector3(0.5, 0.3, 1)];

    const box1 = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material);
    box1.position.copy(pos[0]);
    this.scene.add(box1);

    const box2 = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material);
    box2.position.copy(pos[1]);
    this.scene.add(box2);

    this.setRot({ obj: this.obj, pos1: pos[0], pos2: pos[1] });
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

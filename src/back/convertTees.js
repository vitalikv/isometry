import * as THREE from 'three';

import * as Main from '../index';

export class ConvertTees {
  scene;
  CalcIsometry;

  constructor(shapeObjs) {
    this.scene = Main.scene;
    this.shapeObjs = shapeObjs;
  }

  getData({ meshes, lines }) {
    const listObjs = [];

    for (let i = 0; i < meshes.length; i++) {
      const obj = this.shapeObjs.teeObj.clone();

      if (!meshes[i].geometry.boundingSphere) meshes[i].geometry.computeBoundingSphere();
      const position = meshes[i].geometry.boundingSphere.center.clone().applyMatrix4(meshes[i].matrixWorld);

      const q = meshes[i].getWorldQuaternion(new THREE.Quaternion());
      obj.position.copy(position);
      obj.quaternion.copy(q);

      const dist = 0.5;
      obj.scale.set(dist / 2, dist / 2, dist / 2);

      // const obj2 = obj.clone();
      // obj2.children[0].material.color = new THREE.Color(0xff0000);
      // obj2.children[1].material.color = new THREE.Color(0xff0000);
      // const dirA = new THREE.Vector3(0, 0, 1);
      // const dirB = new THREE.Vector3(-1, 0, 0);
      // const dir = new THREE.Vector3().crossVectors(dirA, dirB).normalize();
      // this.helperArrow({ dir, pos: obj.position, length: 1, color: 0x0000ff });
      // const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(dirB.x, -dirB.y, dirB.z));
      // const rot = new THREE.Euler().setFromRotationMatrix(m);
      // obj2.rotation.copy(rot);
      // this.scene.add(obj2);

      this.upObjUserData({ obj });
      this.getBoundObject({ obj });

      listObjs.push(obj);
    }

    for (let i = 0; i < listObjs.length; i++) {
      const obj = listObjs[i];

      const listDist = [];

      for (let i2 = 0; i2 < lines.length; i2++) {
        const points = lines[i2].points;
        const pos1 = points[0];
        const pos2 = points[points.length - 1];

        const dist1 = obj.position.distanceTo(pos1);
        const dist2 = obj.position.distanceTo(pos2);

        // напрвление трубы
        const dir = pos1.clone().sub(pos2).normalize();

        listDist.push({ dist: dist1, pos: pos1, dir, points, lid: i2, id: 0 });
        listDist.push({ dist: dist2, pos: pos2, dir, points, lid: i2, id: points.length - 1 });
      }

      listDist.sort((a, b) => {
        return a.dist - b.dist;
      });

      if (listDist[0].dist > 1) continue;

      const listDist2 = [];

      for (let i2 = 0; i2 < listDist.length; i2++) {
        if (i2 > 2) break; // ножно считать dot только для первых 3 точек

        const i3 = i2 < 2 ? i2 + 1 : 0;
        const dot = listDist[i2].dir.dot(listDist[i3].dir);

        listDist2[i2] = listDist[i2];
        listDist2[i2].dot = {};
        listDist2[i2].dot.ind1 = i2;
        listDist2[i2].dot.ind2 = i3;
        listDist2[i2].dot.value = Math.abs(dot);
        //listDist2[i2].dot.line = [...listDist[i3]]; // id соседней линии, с которой считали результат dot
      }

      listDist2.sort((a, b) => {
        return b.dot.value - a.dot.value;
      });

      const line1 = listDist2[0];

      const line2 = listDist2.find((item, ind) => {
        if (listDist2[0].dot.ind2 === item.dot.ind1) {
          return item;
        }
      });
      let line3 = listDist2[2];
      if (line3 === line2) {
        line3 = listDist2[1];
      }

      let posC = line2.pos.clone().sub(line1.pos);
      posC = new THREE.Vector3(posC.x / 2, posC.y / 2, posC.z / 2);
      posC.add(line1.pos);
      obj.position.copy(posC);

      // this.helperSphere({ pos: line1.pos, size: 0.11, color: 0xff0000 });
      // this.helperSphere({ pos: line2.pos, size: 0.11, color: 0xff0000 });
      // this.helperSphere({ pos: line3.pos, size: 0.11, color: 0xff0000 });
      // this.helperSphere({ pos: posC, size: 0.11, color: 0x0000ff });

      //this.shapeObjs.setRot({ obj, pos1: line1.pos, pos2: line2.pos });
      this.shapeObjs.setRot2({ obj, posP: [line1.pos, line2.pos, line3.pos], posC });

      let dir = line2.pos.clone().sub(line1.pos).normalize();
      dir.x *= obj.scale.x; // меняем размер
      dir.y *= obj.scale.x;
      dir.z *= obj.scale.x;

      const pos1 = posC.clone().sub(dir);
      const pos2 = posC.clone().add(dir);
      const pos3 = line3.pos;

      if (line1.id === 0) line1.points[0] = pos1;
      else line1.points[line1.points.length - 1] = pos1;

      if (line2.id === 0) line2.points[0] = pos2;
      else line2.points[line2.points.length - 1] = pos2;

      // if (line3.id === 0) line3.points[0] = pos2;
      // else line3.points[line3.points.length - 1] = pos2;

      //const pos3 = obj.userData.joins.points[2];
      obj.userData.joins.points = [];
      obj.userData.joins.points.push(pos1, pos2, pos3);
    }

    return listObjs.map((item) => item.userData);
  }

  // обновляем иформацию по которой будем строить фитинг
  upObjUserData({ obj }) {
    obj.updateMatrixWorld();

    for (let i2 = 0; i2 < obj.userData.shapes.length; i2++) {
      for (let i3 = 0; i3 < obj.userData.shapes[i2].length; i3++) {
        let point = obj.userData.shapes[i2][i3];

        point.x *= obj.scale.x;
        point.y *= obj.scale.x;
        point.z *= obj.scale.x;

        obj.userData.shapes[i2][i3] = point;
        //obj.userData.shapes[i2][i3] = new THREE.Vector3(point.x, point.y, point.z).applyMatrix4(obj.matrixWorld);
      }
    }
  }

  getBoundObject({ obj }) {
    const arr = [];

    obj.updateMatrixWorld(true);

    obj.traverse(function (child) {
      arr.push(child);
    });

    const boundG = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

    for (let i = 0; i < arr.length; i++) {
      if (!arr[i].geometry) continue;
      if (!arr[i].geometry.boundingBox) arr[i].geometry.computeBoundingBox();
      //if (!arr[i].geometry.boundingSphere) arr[i].geometry.computeBoundingSphere();

      //const pos = arr[i].geometry.boundingSphere.center.clone();
      const bound = arr[i].geometry.boundingBox;

      if (bound.min.x < boundG.min.x) {
        boundG.min.x = bound.min.x;
      }
      if (bound.max.x > boundG.max.x) {
        boundG.max.x = bound.max.x;
      }
      if (bound.min.y < boundG.min.y) {
        boundG.min.y = bound.min.y;
      }
      if (bound.max.y > boundG.max.y) {
        boundG.max.y = bound.max.y;
      }
      if (bound.min.z < boundG.min.z) {
        boundG.min.z = bound.min.z;
      }
      if (bound.max.z > boundG.max.z) {
        boundG.max.z = bound.max.z;
      }
    }

    const size = new THREE.Vector3(boundG.max.x - boundG.min.x, boundG.max.y - boundG.min.y, boundG.max.z - boundG.min.z);

    const p1 = new THREE.Vector3(boundG.min.x, boundG.max.y, 0).applyMatrix4(obj.matrixWorld);
    const p2 = new THREE.Vector3(boundG.max.x, boundG.max.y, 0).applyMatrix4(obj.matrixWorld);
    const p3 = new THREE.Vector3(0, boundG.min.y, 0).applyMatrix4(obj.matrixWorld);
    obj.userData.joins.points = [p1, p2, p3];

    const center = new THREE.Vector3(
      (boundG.max.x - boundG.min.x) / 2 + boundG.min.x,
      (boundG.max.y - boundG.min.y) / 2 + boundG.min.y,
      (boundG.max.z - boundG.min.z) / 2 + boundG.min.z
    );

    center.x *= obj.scale.x;
    center.y *= obj.scale.y;
    center.z *= obj.scale.z;

    size.x *= obj.scale.x;
    size.y *= obj.scale.x;
    size.z *= obj.scale.x;
    obj.userData.boundBox.push({ pos: center, size });
  }

  helperArrow({ dir, pos, length = 1, color = 0x0000ff }) {
    const helper = new THREE.ArrowHelper(dir, pos, length, color);
    helper.position.copy(pos);
    this.scene.add(helper);
  }

  helperSphere({ pos, size, color = 0x0000ff }) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshStandardMaterial({ color, depthTest: false, transparent: true }));
    sphere.position.copy(pos);
    this.scene.add(sphere);

    return sphere;
  }
}

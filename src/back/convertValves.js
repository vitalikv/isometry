import * as THREE from 'three';

import * as Main from '../index';

export class ConvertValves {
  scene;
  shapeObjs;

  constructor(shapeObjs) {
    this.scene = Main.scene;
    this.shapeObjs = shapeObjs;
  }

  getData({ meshes, lines }) {
    const listObjs = [];

    for (let i = 0; i < meshes.length; i++) {
      const obj = this.shapeObjs.valveObj.clone();

      if (!meshes[i].geometry.boundingSphere) meshes[i].geometry.computeBoundingSphere();
      const position = meshes[i].geometry.boundingSphere.center.clone().applyMatrix4(meshes[i].matrixWorld);

      const q = meshes[i].getWorldQuaternion(new THREE.Quaternion());
      obj.position.copy(position);
      obj.quaternion.copy(q);
      //this.scene.add(obj.clone());

      const dist = 0.5;
      obj.scale.set(dist / 2, dist / 2, dist / 2);

      this.upObjUserData({ obj });
      this.getBoundObject({ obj });

      listObjs.push(obj);
    }

    for (let i = 0; i < listObjs.length; i++) {
      const obj = listObjs[i];

      const listDist = [];

      for (let i2 = 0; i2 < lines.length; i2++) {
        const points = lines[i2].points;

        const dist1 = obj.position.distanceTo(points[0]);
        const dist2 = obj.position.distanceTo(points[points.length - 1]);

        listDist.push({ dist: dist1, lid: i2, pos: points[0], points, id: 0 });
        listDist.push({ dist: dist2, lid: i2, pos: points[points.length - 1], points, id: points.length - 1 });
      }

      listDist.sort((a, b) => {
        return a.dist - b.dist;
      });

      //const dist = listDist[0].pos.distanceTo(listDist[1].pos);

      if (listDist[0].dist > 1) continue;

      let posC = listDist[1].pos.clone().sub(listDist[0].pos);
      posC = new THREE.Vector3(posC.x / 2, posC.y / 2, posC.z / 2);
      posC.add(listDist[0].pos);
      obj.position.copy(posC);

      this.shapeObjs.setRot({ obj, pos1: listDist[0].pos, pos2: listDist[1].pos });

      let dir = listDist[1].pos.clone().sub(listDist[0].pos).normalize();
      dir.x *= obj.scale.x; // меняем размер
      dir.y *= obj.scale.x;
      dir.z *= obj.scale.x;

      const pos1 = posC.clone().sub(dir);
      const pos2 = posC.clone().add(dir);

      if (listDist[0].id === 0) listDist[0].points[0] = pos1;
      else listDist[0].points[listDist[0].points.length - 1] = pos1;

      if (listDist[1].id === 0) listDist[1].points[0] = pos2;
      else listDist[1].points[listDist[1].points.length - 1] = pos2;

      obj.userData.joins.points = [];
      obj.userData.joins.points.push(pos1, pos2);
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

    const p1 = new THREE.Vector3(boundG.min.x, 0, size.z).applyMatrix4(obj.matrixWorld);
    const p2 = new THREE.Vector3(boundG.max.x, 0, size.z).applyMatrix4(obj.matrixWorld);
    obj.userData.joins.points = [p1, p2];

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
}

import * as THREE from 'three';

import * as Main from './index';
import { Fitting } from './fitting';

export class ConvertObjs {
  scene;
  lines;
  fitting;

  constructor() {
    this.scene = Main.scene;
    this.fitting = new Fitting({ scene: Main.scene });
  }

  getIsometryFittings({ meshes, lines }) {
    this.lines = lines;
    const fittingObjs = [];

    for (let i = 0; i < meshes.length; i++) {
      meshes[i].visible = false;

      const obj = this.fitting.obj.clone();

      if (!meshes[i].geometry.boundingSphere) meshes[i].geometry.computeBoundingSphere();
      const position = meshes[i].geometry.boundingSphere.center.clone().applyMatrix4(meshes[i].matrixWorld);

      const q = meshes[i].getWorldQuaternion(new THREE.Quaternion());
      obj.position.copy(position);
      obj.quaternion.copy(q);
      //this.scene.add(obj);

      fittingObjs.push(obj);
    }

    for (let i = 0; i < fittingObjs.length; i++) {
      const obj = fittingObjs[i];

      const listDist = [];

      for (let i2 = 0; i2 < this.lines.length; i2++) {
        const points = this.lines[i2];

        const dist1 = obj.position.distanceTo(points[0]);
        const dist2 = obj.position.distanceTo(points[points.length - 1]);

        listDist.push({ dist: dist1, pos: points[0], points, id: 0 });
        listDist.push({ dist: dist2, pos: points[points.length - 1], points, id: points.length - 1 });
      }

      listDist.sort((a, b) => {
        return a.dist - b.dist;
      });

      //const dist = listDist[0].pos.distanceTo(listDist[1].pos);
      const dist = 0.5;
      obj.scale.set(dist / 2, dist / 2, dist / 2);

      let posC = listDist[1].pos.clone().sub(listDist[0].pos);
      posC = new THREE.Vector3(posC.x / 2, posC.y / 2, posC.z / 2);
      posC.add(listDist[0].pos);
      obj.position.copy(posC);

      this.fitting.setRot({ obj, pos1: listDist[0].pos, pos2: listDist[1].pos });

      let dir = listDist[1].pos.clone().sub(listDist[0].pos).normalize();
      dir.x *= 0.25;
      dir.y *= 0.25;
      dir.z *= 0.25;

      if (listDist[0].id === 0) listDist[0].points.unshift(posC.clone().sub(dir));
      else listDist[0].points.push(posC.clone().sub(dir));

      if (listDist[1].id === 0) listDist[1].points.unshift(posC.clone().add(dir));
      else listDist[1].points.push(posC.clone().add(dir));

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

    return fittingObjs;
  }
}

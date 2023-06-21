import * as THREE from 'three';

import { loaderModel } from '../index';

export class SaveLoad {
  isometricSchemeService;

  constructor({ isometricSchemeService }) {
    this.isometricSchemeService = isometricSchemeService;
  }

  save() {
    const tubes = this.isometricSchemeService.tubes;
    const valves = this.isometricSchemeService.valves;
    const tees = this.isometricSchemeService.tees;

    const isometry = { tubes: [], valves: [], tees: [] };

    tubes.forEach((tube) => {
      const points = tube.userData.line.userData.line;
      const lineStyle = tube.userData.line.userData.lineStyle;
      isometry.tubes.push({ points, lineStyle });
    });

    valves.forEach((obj) => {
      const pos = obj.position;
      const rot = new THREE.Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z);
      const shapes = obj.userData.shapes;
      const boundBox = obj.userData.boundBox;
      const joins = { tubes: [], points: [] };
      obj.userData.joins.forEach((joint) => {
        joins.points.push(joint.position);
      });
      isometry.valves.push({ pos, rot, shapes, boundBox, joins });
    });

    tees.forEach((obj) => {
      const pos = obj.position;
      const rot = new THREE.Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z);
      const shapes = obj.userData.shapes;
      const boundBox = obj.userData.boundBox;
      const joins = { tubes: [], points: [] };
      obj.userData.joins.forEach((joint) => {
        joins.points.push(joint.position);
      });
      isometry.tees.push({ pos, rot, shapes, boundBox, joins });
    });

    console.log(this.isometricSchemeService.jsonIsometry);
    console.log('isometry2', isometry);
    const str = JSON.stringify(isometry);

    const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(str);

    let link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = data;
    link.download = 'isometry.json';
    link.click();
    document.body.removeChild(link);
  }

  load() {
    const p = this.xhrPromise_1({ url: 'img/isometry.json' });
    p.then((data) => {
      const meshesTube = loaderModel.getMeshesTube();
      const meshesValve = loaderModel.getMeshesValve();
      const meshesTee = loaderModel.getMeshesTee();

      for (let i = 0; i < meshesTube.length; i++) meshesTube[i].visible = false;
      for (let i = 0; i < meshesValve.length; i++) meshesValve[i].visible = false;
      for (let i = 0; i < meshesTee.length; i++) meshesTee[i].visible = false;

      const { tubes, valves, tees } = data;
      this.isometricSchemeService.init({ tubes, valves, tees, dataObjs: [] });
      this.isometricSchemeService.enable();
    }).catch((err) => {
      console.log('err', err);
    });
  }

  xhrPromise_1({ url }) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

      xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          resolve(xhr.response);
        } else {
          reject(xhr.response);
        }
      };

      xhr.onprogress = (event) => {};

      xhr.onerror = () => {
        reject(xhr.response);
      };

      xhr.send();
    });
  }
}

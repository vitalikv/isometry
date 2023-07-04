import * as THREE from 'three';

import { loaderModel, ruler as isometricRulerService, isometricLabels as isometricLabelsService } from '../index';

export class SaveLoad {
  isometricSchemeService;

  constructor({ isometricSchemeService }) {
    this.isometricSchemeService = isometricSchemeService;
  }

  save() {
    const tubes = this.isometricSchemeService.tubes;
    const valves = this.isometricSchemeService.valves;
    const tees = this.isometricSchemeService.tees;

    const isometry = { tubes: [], valves: [], tees: [], rulerObjs: [], labelObjs: [] };

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

    const rulerObjs = isometricRulerService.rulerObjs;

    rulerObjs.forEach((obj) => {
      const startPos = obj.userData.startPos;
      const dir = obj.userData.dir;
      const textContent = obj.userData.label.element.children[0].textContent;
      isometry.rulerObjs.push({ startPoints: obj.userData.startPoints, startPos, pos: obj.position, dir, textContent });
    });

    const labelObjs = isometricLabelsService.labelObjs;

    labelObjs.forEach((obj) => {
      const startPos = obj.userData.startPos;
      const pos = obj.userData.objTxt.position;
      const textContent = obj.userData.label.element.children[0].textContent;
      isometry.labelObjs.push({ startPos, pos, textContent });
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
      this.isometricSchemeService.deleteObjs();

      const meshesTube = loaderModel.getMeshesTube();
      const meshesValve = loaderModel.getMeshesValve();
      const meshesTee = loaderModel.getMeshesTee();

      for (let i = 0; i < meshesTube.length; i++) meshesTube[i].visible = false;
      for (let i = 0; i < meshesValve.length; i++) meshesValve[i].visible = false;
      for (let i = 0; i < meshesTee.length; i++) meshesTee[i].visible = false;

      const { tubes, valves, tees } = data;
      this.isometricSchemeService.init({ tubes, valves, tees, dataObjs: [] });

      const rulerObjs = data.rulerObjs ? data.rulerObjs : [];

      rulerObjs.forEach((item) => {
        const points = item.startPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
        const obj = isometricRulerService.createRuler(points);

        obj.userData.label.element.children[0].textContent = item.textContent;

        if (item.dir) obj.userData.dir = new THREE.Vector3(item.dir.x, item.dir.y, item.dir.z);
        const startPos = new THREE.Vector3(item.startPos.x, item.startPos.y, item.startPos.z);
        const pos = new THREE.Vector3(item.pos.x, item.pos.y, item.pos.z);
        const offset = pos.clone().sub(startPos);

        isometricRulerService.offsetLabel({ obj, offset });
      });

      const labelObjs = data.labelObjs ? data.labelObjs : [];

      labelObjs.forEach((item) => {
        const startPos = new THREE.Vector3(item.startPos.x, item.startPos.y, item.startPos.z);
        const textContent = item.textContent;
        const obj = isometricLabelsService.createLabel({ startPos, text: textContent, targetObj: null });

        const pos = new THREE.Vector3(item.pos.x, item.pos.y, item.pos.z);
        const offset = pos.clone().sub(startPos);

        isometricLabelsService.offsetLabel({ obj: obj.userData.objTxt, offset });
      });

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

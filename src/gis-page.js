import * as THREE from 'three';

import { controls, setMeshes } from './index';
import { Isometry } from './isometry';
import { svgConverter } from './svg';

export class Gis {
  svgConverter = svgConverter;
  scene;
  isometry;
  svgLines = [];
  lines = [];
  objs = [];
  joins = [];

  constructor({ scene }) {
    this.scene = scene;
    this.isometry = new Isometry();

    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'Space') {
      this.init();
      //controls.enabled = false;
      controls.enableRotate = false;

      setMeshes({ arr: [...this.lines, ...this.objs, ...this.joins] });
    }

    // создание svg
    if (event.code === 'KeyS') {
      svgConverter.createSvgScheme({ lines: this.lines });
    }
  };

  init() {
    const { lines, objs } = this.isometry.getIsometry();

    for (let i = 0; i < lines.length; i++) {
      const obj = this.createLine({ points: lines[i] });
      obj.userData = {};
      obj.userData.isIsometry = true;
      obj.userData.isLine = true;
      obj.userData.points = [lines[i][0], lines[i][lines[i].length - 1]];
      obj.userData.line = lines[i].map((p) => p.clone());
      obj.userData.tubes = [];
      obj.userData.joins = [];
      this.scene.add(obj);

      obj.updateMatrixWorld(true);
      this.svgLines.push(lines[i]);
      this.lines.push(obj);

      //this.helperSphere({ pos: lines[i][0], size: 0.1, color: 0x0000ff });
    }

    for (let i = 0; i < objs.length; i++) {
      if (objs[i].userData.shapes.length === 0) continue;

      const obj = new THREE.Object3D();
      obj.userData = {};
      obj.userData.isIsometry = true;
      obj.userData.isFittings = true;
      obj.userData.tubes = [];
      obj.userData.joins = [];

      const points = objs[i].userData.joins.points;
      obj.userData.points = [points[0].pos, points[1].pos];

      for (let i2 = 0; i2 < objs[i].userData.shapes.length; i2++) {
        const line = this.createLine({ points: objs[i].userData.shapes[i2] });
        //console.log(objs[i].userData.shapes[i2]);
        obj.add(line);
      }

      const pos = objs[i].userData.pos;
      const rot = objs[i].userData.rot;
      obj.position.set(pos.x, pos.y, pos.z);
      obj.rotation.set(rot.x, rot.y, rot.z);

      // for (let i2 = 0; i2 < objs[i].userData.boundBox.length; i2++) {
      //   const size = objs[i].userData.boundBox[i2].size;
      //   const pos = objs[i].userData.boundBox[i2].pos;

      //   const box = new THREE.Mesh(
      //     new THREE.BoxGeometry(size.x, size.y, size.z),
      //     new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true })
      //   );
      //   box.position.copy(pos);
      //   obj.add(box);
      // }

      // стыки
      // const joinsP = objs[i].userData.joins.points;

      // for (let i2 = 0; i2 < joinsP.length; i2++) {
      //   const obj = this.helperSphere({ pos: joinsP[i2].pos, size: 0.1, color: 0xff0000 });
      //   obj.userData = {};
      //   obj.userData.isIsometry = true;
      //   //this.joins.push(obj);
      // }

      this.scene.add(obj);
      this.objs.push(obj);
    }

    this.createJoins();
    this.joinLine();
  }

  createJoins() {
    let count = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const points1 = this.lines[i].userData.points;

      const joins = [];

      for (let i2 = 0; i2 < this.objs.length; i2++) {
        const points2 = this.objs[i2].userData.points;

        const dist1 = points1[0].distanceTo(points2[0]);
        const dist2 = points1[0].distanceTo(points2[1]);

        //if (joins.length === 2) break;
        if (dist1 < 0.01) joins.push({ tube: this.lines[i], tubeP: 0, objs: this.objs[i2], pos: points1[0] });
        if (dist2 < 0.01) joins.push({ tube: this.lines[i], tubeP: 0, objs: this.objs[i2], pos: points1[0] });
      }

      for (let i2 = 0; i2 < this.objs.length; i2++) {
        const points2 = this.objs[i2].userData.points;

        const dist1 = points1[1].distanceTo(points2[0]);
        const dist2 = points1[1].distanceTo(points2[1]);
        // this.helperSphere({ pos: points2[0], size: 0.1, color: 0xff0000 });
        // this.helperSphere({ pos: points2[1], size: 0.1, color: 0xff0000 });
        // if (joins.length === 2) break;
        if (dist1 < 0.01) joins.push({ tube: this.lines[i], tubeP: 1, objs: this.objs[i2], pos: points1[1] });
        if (dist2 < 0.01) joins.push({ tube: this.lines[i], tubeP: 1, objs: this.objs[i2], pos: points1[1] });
      }

      for (let i2 = 0; i2 < joins.length; i2++) {
        count += 1;
        const jp = this.helperSphere({ pos: joins[i2].pos, size: 0.1, color: 0xff0000 });
        jp.userData.isJoin = true;
        joins[i2].objs.userData.tubes.push({ obj: joins[i2].tube, id: joins[i2].tubeP });
        joins[i2].objs.userData.joins.push(jp);
      }
    }

    console.log(count);
  }

  joinLine() {
    const listDist = [];
    for (let i = 0; i < this.lines.length; i++) {
      const points1 = this.lines[i].userData.points;

      for (let i2 = 0; i2 < this.lines.length; i2++) {
        if (i === i2) continue;
        const points2 = this.lines[i2].userData.points;

        const dist1 = points1[0].distanceTo(points2[0]);
        const dist2 = points1[0].distanceTo(points2[points2.length - 1]);

        if (dist1 < 0.01) listDist.push({ pos: points1[0], tube1: this.lines[i], tube2: this.lines[i2], lid1: i, lid2: i2, pid1: 0, pid2: 0 });
        if (dist2 < 0.01) listDist.push({ pos: points1[0], tube1: this.lines[i], tube2: this.lines[i2], lid1: i, lid2: i2, pid1: 0, pid2: points2.length - 1 });
      }

      for (let i2 = 0; i2 < this.lines.length; i2++) {
        if (i === i2) continue;
        const points2 = this.lines[i2].userData.points;

        const pid1 = points1.length - 1;
        const dist1 = points1[pid1].distanceTo(points2[0]);
        const dist2 = points1[pid1].distanceTo(points2[points2.length - 1]);

        if (dist1 < 0.01) listDist.push({ pos: points1[1], tube1: this.lines[i], tube2: this.lines[i2], lid1: i, lid2: i2, pid1, pid2: 0 });
        if (dist2 < 0.01) listDist.push({ pos: points1[1], tube1: this.lines[i], tube2: this.lines[i2], lid1: i, lid2: i2, pid1, pid2: points2.length - 1 });
      }
    }

    console.log(listDist);

    const pointsHelp = [];
    const listIgnorLine = [];
    let count = 0;
    for (let i = 0; i < listDist.length; i++) {
      const pid1 = listDist[i].pid1 === 0 ? 0 : this.lines[listDist[i].lid1].length - 1;
      const pid2 = listDist[i].pid2 === 0 ? 0 : this.lines[listDist[i].lid2].length - 1;

      const ui1 = listDist[i].lid1 + '' + (pid1 === 0 ? 0 : 1);
      const ui2 = listDist[i].lid2 + '' + (pid2 === 0 ? 0 : 1);

      if (listIgnorLine.indexOf(ui1) > -1 && listIgnorLine.indexOf(ui2) > -1) {
        //console.log(ui1, listDist[i].lid1, listDist[i].pid1 === 0 ? 0 : 1);
        continue;
      }

      listIgnorLine.push(ui1, ui2);

      const jp = this.helperSphere({ pos: listDist[i].pos, size: 0.1, color: 0x0000ff });
      jp.userData.isIsometry = true;
      jp.userData.isJoin = true;
      jp.userData.tubes = [];

      const id1 = pid1 === 0 ? 0 : 1;
      const id2 = pid2 === 0 ? 0 : 1;

      jp.userData.tubes.push({ obj: listDist[i].tube1, id: id1 });
      jp.userData.tubes.push({ obj: listDist[i].tube2, id: id2 });

      this.joins.push(jp);

      listDist[i].tube1.userData.tubes.push({ obj: listDist[i].tube2, id: id2 });
      listDist[i].tube2.userData.tubes.push({ obj: listDist[i].tube1, id: id1 });

      listDist[i].tube1.userData.joins.push(jp);
      listDist[i].tube2.userData.joins.push(jp);

      count++;
    }

    //console.log(count, pointsHelp);
  }

  // отображение линий по точкам
  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);

    return line;
  }

  // построение sphere для визуализиции
  helperSphere({ pos, size, color = 0x0000ff }) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 32, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, depthTest: false, transparent: true })
    );
    sphere.position.copy(pos);
    this.scene.add(sphere);

    return sphere;
  }
}

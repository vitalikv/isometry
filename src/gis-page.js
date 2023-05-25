import * as THREE from 'three';

import { controls, modelsContainerInit, setMeshes, loaderModel } from './index';

import { CalcIsometry } from './calcIsometry';
import { svgConverter } from './svg';

export class Gis {
  svgConverter = svgConverter;
  modelsContainerInit;
  isometry;
  svgLines = [];
  lines = [];
  tubes = [];
  objs = [];
  joins = [];
  joinsPos = new Map();

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
    this.isometry = new CalcIsometry();

    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'Space') {
      this.init();
      //controls.enabled = false;
      controls.enableRotate = false;

      setMeshes({ arr: [...this.tubes, ...this.objs, ...this.joins] });
    }

    // создание svg
    if (event.code === 'KeyS') {
      svgConverter.createSvgScheme({ lines: this.lines });
    }
  };

  init() {
    const meshesTube = loaderModel.getMeshesTube();
    const meshesObj = loaderModel.getMeshesObj();

    for (let i = 0; i < meshesTube.length; i++) meshesTube[i].visible = false;
    for (let i = 0; i < meshesObj.length; i++) meshesObj[i].visible = false;

    const { tubes, objs } = this.isometry.getIsometry({ tubes: meshesTube, objs: meshesObj });

    for (let i = 0; i < tubes.length; i++) {
      this.createTube(tubes[i]);
    }

    for (let i = 0; i < objs.length; i++) {
      if (objs[i].userData.shapes.length === 0) continue;

      this.createObj(objs[i].userData);
    }

    this.createJoins();
    this.linkJoins();
  }

  // создание труб
  createTube(data) {
    const points = data;

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const tubeGeometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 32, false);
    const tubeObj = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true }));
    tubeObj.material.visible = false;
    tubeObj.userData = {};
    tubeObj.userData.isIsometry = true;
    tubeObj.userData.isTube = true;
    tubeObj.userData.line = null;

    const obj = this.createLine({ points });
    obj.userData = {};
    obj.userData.points = [points[0], points[points.length - 1]];
    obj.userData.line = points.map((p) => p.clone());
    obj.userData.tubes = [];
    obj.userData.joins = [];
    obj.userData.tubeObj = tubeObj;

    tubeObj.userData.line = obj;

    this.modelsContainerInit.control.add(tubeObj);
    this.modelsContainerInit.control.add(obj);

    this.tubes.push(tubeObj);

    this.svgLines.push(points);
    this.lines.push(obj);

    const p1 = obj.userData.points[0];
    const p2 = obj.userData.points[1];
    this.joinsPos.set(p1.x + '' + p1.y + '' + p1.z, { pos: p1, obj: null });
    this.joinsPos.set(p2.x + '' + p2.y + '' + p2.z, { pos: p2, obj: null });
  }

  // создание объектов
  createObj(data) {
    const size = data.boundBox[0].size;
    const posG = data.boundBox[0].pos;
    const obj = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: true, transparent: true, opacity: 0 })
    );
    obj.material.visible = false;
    obj.geometry.translate(posG.x, posG.y, posG.z);

    //const obj = new THREE.Mesh();
    obj.userData = {};
    obj.userData.isIsometry = true;
    obj.userData.isObj = true;
    obj.userData.tubes = [];
    obj.userData.joins = [];

    const points = data.joins.points;
    obj.userData.points = [points[0].pos, points[1].pos];

    for (let i2 = 0; i2 < data.shapes.length; i2++) {
      const line = this.createLine({ points: data.shapes[i2] });
      obj.add(line);
      line.updateMatrixWorld();
      line.updateMatrix();
    }

    const pos = data.pos;
    const rot = data.rot;
    obj.position.set(pos.x, pos.y, pos.z);
    obj.rotation.set(rot.x, rot.y, rot.z);

    this.modelsContainerInit.control.add(obj);
    this.objs.push(obj);

    const p1 = points[0].pos;
    const p2 = points[1].pos;
    this.joinsPos.set(p1.x + '' + p1.y + '' + p1.z, { pos: p1, obj: null });
    this.joinsPos.set(p2.x + '' + p2.y + '' + p2.z, { pos: p2, obj: null });
  }

  // создаем стыки
  createJoins() {
    this.joinsPos.forEach((value, key, map) => {
      const jp = this.helperSphere({ pos: value.pos, size: 0.075, color: 0x222222 });
      jp.userData.isIsometry = true;
      jp.userData.isJoin = true;
      jp.userData.tubes = [];
      jp.userData.objs = [];
      this.joins.push(jp);

      value.obj = jp;
    });
  }

  // связываем стыки с объектами
  linkJoins() {
    for (let i = 0; i < this.tubes.length; i++) {
      const points = this.tubes[i].userData.line.userData.points;

      for (let i2 = 0; i2 < points.length; i2++) {
        const p = points[i2];

        const result = this.joinsPos.get(p.x + '' + p.y + '' + p.z);
        if (result) {
          this.tubes[i].userData.line.userData.joins.push(result.obj);
          result.obj.userData.tubes.push({ obj: this.tubes[i].userData.line, id: i2 });
        }
      }
    }

    for (let i = 0; i < this.objs.length; i++) {
      const points = this.objs[i].userData.points;

      for (let i2 = 0; i2 < points.length; i2++) {
        const p = points[i2];

        const result = this.joinsPos.get(p.x + '' + p.y + '' + p.z);
        if (result) {
          this.objs[i].userData.joins.push(result.obj);
          result.obj.userData.objs.push(this.objs[i]);
        }
      }
    }
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
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true }));
    sphere.position.copy(pos);
    this.modelsContainerInit.control.add(sphere);

    return sphere;
  }
}

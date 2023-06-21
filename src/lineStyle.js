import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import { modelsContainerInit, mapControlInit, selectObj as isometricModeService } from './index';

export class IsometricLineStyle {
  matLine;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.initMat();
    this.init();
    this.init2();
  }

  initMat() {
    const domElement = this.mapControlInit.control.domElement;

    this.matLine = new LineMaterial({
      color: 0x000000,
      linewidth: 1,
      worldUnits: false,
      dashed: true,
      dashScale: 4,
      dashSize: 1,
      gapSize: 1,
      alphaToCoverage: true,
      resolution: new THREE.Vector2(domElement.clientWidth, domElement.clientHeight),
    });
  }

  init() {
    let points = [new THREE.Vector3(-5, 1, 0), new THREE.Vector3(5, 1, 0)];

    const positions = [];

    const curve = new THREE.CatmullRomCurve3(points);
    points = curve.getPoints(12 * points.length);

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      positions.push(point.x, point.y, point.z);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const line = new Line2(geometry, this.matLine.clone());
    line.computeLineDistances();

    this.modelsContainerInit.control.add(line);
  }

  init2() {
    const positions = [];
    const colors = [];

    const points = [new THREE.Vector3(-5, 2, 0), new THREE.Vector3(5, 2, 0)];

    const spline = new THREE.CatmullRomCurve3(points);
    const divisions = Math.round(12 * points.length);
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0, l = divisions; i < l; i++) {
      const t = i / l;

      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5, THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    const matLine = new LineMaterial({
      color: 0x00ff00,
      linewidth: 0.5,
      worldUnits: true,
      vertexColors: true,
      alphaToCoverage: true,
    });

    const curve = new Line2(geometry, matLine);
    curve.computeLineDistances();

    this.modelsContainerInit.control.add(curve);
  }

  setTypeLine(type, obj = null) {
    if (!obj) obj = isometricModeService.actObj;

    if (!obj) return;
    if (!obj.userData.isTube) return;

    obj = obj.userData.line;

    if (type === 'basic') {
      obj.material.dashed = false;
      obj.material.linewidth = 1;
    }
    if (type === 'thick') {
      obj.material.dashed = false;
      obj.material.linewidth = 2;
    }
    if (type === 'dashed') {
      obj.material.dashed = true;
      obj.material.linewidth = 1;
    }

    obj.userData.lineStyle = type;
  }
}

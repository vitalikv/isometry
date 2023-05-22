import * as THREE from 'three';

import { Isometry } from './isometry';
import { svgConverter } from './svg';

export class Gis {
  svgConverter = svgConverter;
  scene;
  isometry;
  lines = [];
  objs = [];

  constructor({ scene }) {
    this.scene = scene;
    this.isometry = new Isometry();

    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'Space') {
      this.init();
    }

    // создание svg
    if (event.code === 'KeyS') {
      svgConverter.createSvgScheme({ lines: this.lines });
    }
  };

  init() {
    const { lines, objs } = this.isometry.getIsometry();
    this.lines = lines;

    for (let i = 0; i < lines.length; i++) {
      const line = this.createLine({ points: lines[i] });
      this.scene.add(line);
    }

    for (let i = 0; i < objs.length; i++) {
      const obj = new THREE.Object3D();
      this.scene.add(obj);
      for (let i2 = 0; i2 < objs[i].userData.shapes.length; i2++) {
        const line = this.createLine({ points: objs[i].userData.shapes[i2] });
        obj.add(line);
      }
      const pos = objs[i].userData.pos;
      const rot = objs[i].userData.rot;
      obj.position.set(pos.x, pos.y, pos.z);
      obj.rotation.set(rot.x, rot.y, rot.z);

      this.objs.push(obj);
    }
  }

  // отображение линий по точкам
  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);

    return line;
  }
}

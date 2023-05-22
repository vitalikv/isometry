import * as THREE from 'three';

import * as Main from './index';
import { ConvertObjs } from './objs';
import { ConvertTubesToLines } from './tubes';

export class Isometry {
  lines = [];
  objs = [];

  constructor() {}

  getIsometry() {
    this.getTubes();
    this.getObjs();

    return { lines: this.lines, objs: this.objs };
  }

  getTubes() {
    const meshes = Main.loaderModel.meshes;

    const line = new ConvertTubesToLines();
    this.lines = line.getIsometry({ meshes });
  }

  getObjs() {
    const fittings = Main.loaderModel.fittings;

    const convertObjs = new ConvertObjs();
    this.objs = convertObjs.getIsometryFittings({ meshes: fittings, lines: this.lines });

    console.log(555, this.objs);
  }
}

import { ConvertTubes } from './convertTubes';
import { ConvertObjs } from './convertObjs';

export class CalcIsometry {
  convertTubes;
  convertObjs;
  lines = [];
  objs = [];

  constructor() {
    this.convertTubes = new ConvertTubes();
    this.convertObjs = new ConvertObjs();
  }

  getIsometry({ tubes, objs }) {
    this.getTubes(tubes);
    this.getObjs(objs);

    return { tubes: this.lines, objs: this.objs };
  }

  getTubes(meshes) {
    this.lines = this.convertTubes.getData({ meshes });
  }

  getObjs(meshes) {
    this.objs = this.convertObjs.getData({ meshes, lines: this.lines });
  }
}

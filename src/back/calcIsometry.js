import { ShapeObjs } from './shapeObjs';
import { ConvertTubes } from './convertTubes';
import { ConvertValves } from './convertValves';
import { ConvertTees } from './convertTees';

export class CalcIsometry {
  shapeObjs;
  convertTubes;
  convertValves;
  convertTees;
  lines = [];
  valves = [];
  tees = [];
  dataObjs = { valve: null, tee: null };

  constructor() {
    this.shapeObjs = new ShapeObjs();
    this.convertTubes = new ConvertTubes();
    this.convertValves = new ConvertValves(this.shapeObjs);
    this.convertTees = new ConvertTees(this.shapeObjs);
  }

  getIsometry({ tubes, valves = [], tees = [] }) {
    this.lines = this.getTubes(tubes);
    this.valves = this.getValves(valves);
    this.tees = this.getTees(tees);
    this.dataObjs = this.getDataObjs();

    return { tubes: this.lines, valves: this.valves, tees: this.tees, dataObjs: this.dataObjs };
  }

  getTubes(meshes) {
    let lines = this.convertTubes.getData({ meshes });

    lines = lines.map((p) => {
      return { points: p, lineStyle: 'basic' };
    });

    return lines;
  }

  getValves(meshes) {
    return this.convertValves.getData({ meshes, lines: this.lines });
  }

  getTees(meshes) {
    return this.convertTees.getData({ meshes, lines: this.lines });
  }

  getDataObjs() {
    const valveObj = this.shapeObjs.valveObj.clone();
    const teeObj = this.shapeObjs.teeObj.clone();

    const dist = 0.5;
    valveObj.scale.set(dist / 2, dist / 2, dist / 2);
    this.convertValves.upObjUserData({ obj: valveObj });
    this.convertValves.getBoundObject({ obj: valveObj });

    teeObj.scale.set(dist / 2, dist / 2, dist / 2);
    this.convertTees.upObjUserData({ obj: teeObj });
    this.convertTees.getBoundObject({ obj: teeObj });

    const valve = valveObj.userData;
    const tee = teeObj.userData;

    return { valve, tee };
  }
}

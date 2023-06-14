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
    this.getTubes(tubes);
    this.getValves(valves);
    this.getTees(tees);
    this.getDataObjs();

    return { tubes: this.lines, valves: this.valves, tees: this.tees, dataObjs: this.dataObjs };
  }

  getTubes(meshes) {
    this.lines = this.convertTubes.getData({ meshes });
  }

  getValves(meshes) {
    this.valves = this.convertValves.getData({ meshes, lines: this.lines });
  }

  getTees(meshes) {
    this.tees = this.convertTees.getData({ meshes, lines: this.lines });
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

    this.dataObjs.valve = valveObj.userData;
    this.dataObjs.tee = teeObj.userData;
  }
}

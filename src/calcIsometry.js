import { ConvertTubes } from './convertTubes';
import { ConvertValves } from './convertValves';
import { ConvertTees } from './convertTees';

export class CalcIsometry {
  convertTubes;
  convertValves;
  convertTees;
  lines = [];
  valves = [];
  tees = [];

  constructor() {
    this.convertTubes = new ConvertTubes();
    this.convertValves = new ConvertValves();
    this.convertTees = new ConvertTees();
  }

  getIsometry({ tubes, valves = [], tees = [] }) {
    this.getTubes(tubes);
    this.getValves(valves);
    this.getTees(tees);

    return { tubes: this.lines, valves: this.valves, tees: this.tees };
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
}

import * as THREE from 'three';

import { gisdPage as scheme } from './index';

export class DeleteObj {
  delete(obj) {
    if (!obj) return;
    //if (!obj.userData.isIsometry) return;

    if (obj.userData.isTube) this.deleteTube(obj);
    if (obj.userData.isJoint) this.deleteJoint(obj);
    if (obj.userData.isObj) this.deleteObj(obj);
    if (obj.userData.isRuler) this.deleteRuler(obj);
    if (obj.userData.isLabel) this.deleteLabel(obj);
  }

  deleteTube(obj) {
    obj = obj.userData.line;
    let index = scheme.lines.indexOf(obj);
    if (index > -1) scheme.lines.splice(index, 1);

    index = scheme.tubes.indexOf(obj.userData.tubeObj);
    if (index > -1) scheme.tubes.splice(index, 1);

    this.clearMesh(obj.userData.tubeObj);
    this.clearMesh(obj);
    this.deleteLabels(obj);

    obj.userData.joins.forEach((joint) => {
      const index = joint.userData.tubes.findIndex((item) => item.obj === obj);
      if (index > -1) joint.userData.tubes.splice(index, 1);
    });

    obj.userData.joins.forEach((joint) => {
      if ([...joint.userData.tubes, ...joint.userData.objs].length === 0) {
        const index = scheme.joins.indexOf(joint);
        if (index > -1) {
          scheme.joins.splice(index, 1);
          this.clearMesh(joint);
        }
      }
    });
  }

  deleteJoint(obj) {
    const arr = obj.userData.tubes.filter((item) => item.obj.userData.line.length === 2);

    if (arr.length < 2) {
      if (obj.userData.tubes.length === 1) this.deleteTube(obj.userData.tubes[0].obj.userData.tubeObj);
      return;
    }

    const index = scheme.joins.indexOf(obj);
    if (index > -1) scheme.joins.splice(index, 1);
    this.clearMesh(obj);
    this.deleteLabels(obj);

    const joints = [];
    const lines = [];

    arr.forEach((item) => {
      const line = item.obj;

      lines.push(line);

      line.userData.joins.forEach((joint, index) => {
        if (joint !== obj) joints.push(joint);
      });

      let index = scheme.lines.indexOf(line);
      if (index > -1) scheme.lines.splice(index, 1);

      index = scheme.tubes.indexOf(line.userData.tubeObj);
      if (index > -1) scheme.tubes.splice(index, 1);

      this.clearMesh(line.userData.tubeObj);
      this.clearMesh(line);
    });

    lines.forEach((line) => {
      let index = joints[0].userData.tubes.findIndex((item) => item.obj === line);
      if (index > -1) joints[0].userData.tubes.splice(index, 1);

      index = joints[1].userData.tubes.findIndex((item) => item.obj === line);
      if (index > -1) joints[1].userData.tubes.splice(index, 1);
    });

    const line = scheme.createTube({ points: [joints[0].position, joints[1].position] });
    line.userData.joins.push(joints[0], joints[1]);
    joints[0].userData.tubes.push({ obj: line, id: 0 });
    joints[1].userData.tubes.push({ obj: line, id: 1 });
  }

  deleteObj(obj) {
    this.clearMesh(obj);
    this.deleteLabels(obj);

    if (obj.userData.isValve) {
      const index = scheme.valves.indexOf(obj);
      if (index > -1) scheme.valves.splice(index, 1);
    }
    if (obj.userData.isTee) {
      const index = scheme.tees.indexOf(obj);
      if (index > -1) scheme.tees.splice(index, 1);
    }

    obj.userData.joins.forEach((joint) => {
      const index = joint.userData.objs.findIndex((item) => item === obj);
      if (index > -1) joint.userData.objs.splice(index, 1);

      if ([...joint.userData.objs, ...joint.userData.tubes].length === 0) {
        const index = scheme.joins.indexOf(joint);
        if (index > -1) {
          scheme.joins.splice(index, 1);
          this.clearMesh(joint);
        }
      }
    });
  }

  deleteLabels(obj) {
    obj.userData.labels.forEach((label) => {
      this.deleteLabel(label);
    });
  }

  deleteLabel(obj) {
    const objParent = obj.parent;

    objParent.userData.label.removeFromParent();

    this.clearMesh(objParent.userData.objTxt);
    this.clearMesh(objParent.userData.objPointer);
    this.clearMesh(objParent.userData.objLine);
    this.clearMesh(objParent.userData.objDash);
    this.clearMesh(objParent.userData.objDashHelper);
    this.clearMesh(objParent.userData.objDiv);
  }

  deleteRuler(obj) {
    obj.userData.cones.forEach((o) => {
      this.clearMesh(o);
    });

    obj.userData.line2.forEach((o) => {
      this.clearMesh(o);
    });

    obj.userData.label.removeFromParent();

    this.clearMesh(obj.userData.line);
    this.clearMesh(obj.userData.objDiv);
    this.clearMesh(obj);
  }

  clearMesh(mesh) {
    mesh.removeFromParent();
    if (!mesh.geometry) return;
    mesh.geometry.dispose();

    const materials = [];
    if (Array.isArray(mesh.material)) {
      materials.push(...mesh.material);
    } else if (mesh.material instanceof THREE.Material) {
      materials.push(mesh.material);
    }

    materials.forEach((mtrl) => {
      if (mtrl.map) mtrl.map.dispose();
      if (mtrl.lightMap) mtrl.lightMap.dispose();
      if (mtrl.bumpMap) mtrl.bumpMap.dispose();
      if (mtrl.normalMap) mtrl.normalMap.dispose();
      if (mtrl.specularMap) mtrl.specularMap.dispose();
      if (mtrl.envMap) mtrl.envMap.dispose();
      mtrl.dispose();
    });
  }
}

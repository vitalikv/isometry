import * as THREE from 'three';

import { gisdPage as scheme } from './index';

export class DeleteObj {
  delete(obj) {
    if (!obj) return;
    if (!obj.userData.isIsometry) return;

    if (obj.userData.isJoint) this.deleteJoint(obj);
  }

  deleteJoint(obj) {
    const arr = obj.userData.tubes.filter((item) => item.obj.userData.line.length === 2);

    if (arr.length < 2) return;

    obj.parent?.remove(obj);

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

      line.userData.tubeObj.parent?.remove(line.userData.tubeObj);
      line.parent?.remove(line);
    });

    console.log(joints);

    lines.forEach((line) => {
      let index = joints[0].userData.tubes.findIndex((item) => item.obj === line);
      console.log(index, joints[0].userData.tubes.length);
      if (index > -1) joints[0].userData.tubes.splice(index, 1);

      index = joints[1].userData.tubes.findIndex((item) => item.obj === line);
      console.log(index);
      if (index > -1) joints[1].userData.tubes.splice(index, 1);
    });

    const line = scheme.createTube([joints[0].position, joints[1].position]);
    line.userData.joins.push(joints[0], joints[1]);
    joints[0].userData.tubes.push({ obj: line, id: 0 });
    joints[1].userData.tubes.push({ obj: line, id: 1 });
  }
}

import * as THREE from 'three';

import { modelsContainerInit, mapControlInit } from './index';

export class Joint {
  modelsContainerInit;
  helperJoint;
  activated = false;

  constructor() {
    this.modelsContainerInit = modelsContainerInit;
    this.mapControlInit = mapControlInit;
    this.helperJoint = this.createHelperJoint();
  }

  activate() {
    this.activated = !this.activated;
  }

  createHelperJoint() {
    const obj = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 16), new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false, transparent: true }));
    obj.visible = false;
    this.modelsContainerInit.control.add(obj);

    return obj;
  }

  onmousedown = ({ event, tubes, scheme }) => {
    if (!this.activated) return;

    const ray = this.rayIntersect(event, [...tubes], 'arr');
    if (ray.length === 0) return;
    const intersection = ray[0];

    this.helperJoint.position.copy(intersection.point);
    this.helperJoint.visible = false;

    const obj = intersection.object;

    let index = scheme.lines.indexOf(obj);
    if (index > -1) scheme.lines.splice(index, 1);

    index = scheme.tubes.indexOf(obj.userData.tubeObj);
    if (index > -1) scheme.tubes.splice(index, 1);

    console.log(obj);
    obj.userData.tubeObj.parent?.remove(obj.userData.tubeObj);
    obj.parent?.remove(obj);

    const joints = obj.userData.joins;

    index = joints[0].userData.tubes.findIndex((item) => item.obj === obj);
    if (index > -1) joints[0].userData.tubes.splice(index, 1);

    index = joints[1].userData.tubes.findIndex((item) => item.obj === obj);
    if (index > -1) joints[1].userData.tubes.splice(index, 1);

    const line1 = scheme.createTube({ points: [joints[0].position, intersection.point] });
    const line2 = scheme.createTube({ points: [joints[1].position, intersection.point] });

    const jp = scheme.createJoin(intersection.point);

    line1.userData.joins.push(joints[0], jp);
    joints[0].userData.tubes.push({ obj: line1, id: 0 });
    jp.userData.tubes.push({ obj: line1, id: 1 });

    line2.userData.joins.push(joints[1], jp);
    joints[1].userData.tubes.push({ obj: line2, id: 0 });
    jp.userData.tubes.push({ obj: line2, id: 1 });

    return true;
  };

  onmousemove = (event, tubes) => {
    if (!this.activated) return;

    this.helperJoint.visible = false;

    const ray = this.rayIntersect(event, [...tubes], 'arr');
    if (ray.length === 0) return;
    const intersection = ray[0];

    this.helperJoint.position.copy(intersection.point);
    this.helperJoint.visible = true;
  };

  rayIntersect(event, obj, t) {
    const canvas = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    // function getMousePosition(event) {
    //   const rect = canvas.getBoundingClientRect();

    //   const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    //   const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    //   return new THREE.Vector2(x, y);
    // }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.25;
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = [];
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }
}

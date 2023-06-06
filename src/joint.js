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
    this.modelsContainerInit.control.add(obj);

    return obj;
  }

  createJoint({ pos }) {
    const obj = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 16), new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false, transparent: true }));
    obj.position.copy(pos);
    this.modelsContainerInit.control.add(obj);

    return obj;
  }

  onmousedown = ({ event, tubes }) => {
    if (!this.activated) return;

    const ray = this.rayIntersect(event, [...tubes], 'arr');
    if (ray.length === 0) return;
    const intersection = ray[0];

    this.helperJoint.position.copy(intersection.point);
    this.helperJoint.visible = false;

    this.createJoint({ pos: intersection.point });

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
    raycaster.params.Line.threshold = 0;
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

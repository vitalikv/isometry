import * as THREE from 'three';

import { scene, controls } from './index';

export class Moving {
  isDown = false;
  isMove = false;
  controls;
  scene;
  plane;
  obj;
  offset;

  constructor() {
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
    this.scene = scene;
    this.controls = controls;
    this.plane = this.initPlane();
  }

  initPlane() {
    let geometry = new THREE.PlaneGeometry(10000, 10000);
    let material = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    material.visible = false;
    const planeMath = new THREE.Mesh(geometry, material);
    planeMath.rotation.set(-Math.PI / 2, 0, 0);
    this.scene.add(planeMath);

    return planeMath;
  }

  click({ obj, event }) {
    this.isDown = false;

    obj = this.getParentObj({ obj });
    if (!obj) return;
    console.log(555, obj);
    this.obj = obj;

    this.plane.position.copy(obj.position);
    this.plane.rotation.copy(controls.object.rotation);
    this.plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, this.plane, 'one');
    if (intersects.length == 0) return;

    this.offset = new THREE.Vector3().subVectors(obj.position, intersects[0].point);

    this.isDown = true;
    this.isMove = true;
  }

  getParentObj({ obj }) {
    let next = true;

    while (next) {
      if (obj.userData) {
        if (obj.userData.isIsometry) {
          next = false;
          return obj;
        } else if (obj.parent) {
          obj = obj.parent;
        } else {
          next = false;
          return null;
        }
      } else if (obj.parent) {
        obj = obj.parent;
      } else {
        next = false;
        return null;
      }
    }
  }

  rayIntersect(event, obj, t) {
    const container = this.controls.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1;
      const y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.controls.object);

    let intersects = null;
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  onmousemove = (event) => {
    if (!this.isMove) return;

    const intersects = this.rayIntersect(event, this.plane, 'one');
    if (intersects.length == 0) return;

    const pos = new THREE.Vector3().addVectors(intersects[0].point, this.offset);
    const offset = pos.clone().sub(this.obj.position);
    this.obj.position.add(offset);

    if (this.obj.userData.isLine) {
      this.obj.userData.joins.forEach((o) => {
        o.position.add(offset);
      });

      this.obj.userData.tubes.forEach((data) => {
        data.obj.geometry.dispose();
        const points = data.obj.userData.line;

        if (points.length > 2) {
          data.obj.position.add(offset);
        } else {
          if (data.id === 0) {
            points[0].add(offset);
          } else {
            points[points.length - 1].add(offset);
          }
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          data.obj.geometry = geometry;
        }
      });
    }

    if (this.obj.userData.isFittings) {
      this.obj.userData.joins.forEach((o) => {
        o.position.add(offset);
      });

      this.obj.userData.tubes.forEach((data) => {
        //data.obj.position.add(offset);
        data.obj.geometry.dispose();
        const points = data.obj.userData.line;
        if (data.id === 0) {
          points[0].add(offset);
        } else {
          points[points.length - 1].add(offset);
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        data.obj.geometry = geometry;
      });
    }

    if (this.obj.userData.isJoin) {
      this.obj.userData.tubes.forEach((data) => {
        data.obj.geometry.dispose();
        const points = data.obj.userData.line;
        if (data.id === 0) {
          points[0].add(offset);
        } else {
          points[points.length - 1].add(offset);
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        data.obj.geometry = geometry;
      });
    }
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };
}

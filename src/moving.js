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
    console.log(555, obj.userData);
    this.obj = obj;

    this.plane.position.copy(obj.position);
    this.plane.rotation.copy(controls.object.rotation);
    this.plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, this.plane, 'one');
    if (intersects.length == 0) return;
    this.offset = intersects[0].point;

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

    const offset = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point;

    // перетаскиваем линию
    if (this.obj.userData.isTube) {
      const obj = this.obj.userData.line;
      this.updataTubeLine({ obj, offset });

      obj.userData.joins.forEach((o) => this.moveJoin({ obj: o, offset, skipObj: obj }));
    }

    // перетаскиваем фитинги
    if (this.obj.userData.isObj) {
      this.obj.position.add(offset);

      this.obj.userData.joins.forEach((o) => this.moveJoin({ obj: o, offset, skipObj: this.obj }));
    }

    // перетаскиваем стык
    if (this.obj.userData.isJoin) {
      this.moveJoin({ obj: this.obj, offset, skipObj: null });
    }
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };

  moveJoin({ obj, offset, skipObj }) {
    obj.position.add(offset);

    obj.userData.tubes.forEach((data) => {
      if (data.obj !== skipObj) {
        this.updataTubeLine({ obj: data.obj, offset, id: data.id });
      }
    });

    obj.userData.objs.forEach((o) => {
      if (o !== skipObj) {
        o.position.add(offset);
      }
    });
  }

  // обновляем геометрию линии при перемещение всей линии или певрой/последней точки
  updataTubeLine({ obj, offset, id = undefined }) {
    const points = obj.userData.line;

    if (id === 0) {
      points[0].add(offset);
    } else if (id === 1) {
      points[points.length - 1].add(offset);
    } else {
      points.forEach((point) => point.add(offset));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    obj.geometry.dispose();
    obj.geometry = geometry;

    this.updataTubeGeom({ obj });
  }

  // обновляем геометрию трубы
  updataTubeGeom({ obj }) {
    const tubeObj = obj.userData.tubeObj;
    const points = obj.userData.line;
    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline.curveType = 'catmullrom';
    pipeSpline.tension = 0;

    const tubeGeometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 32, false);
    tubeObj.geometry.dispose();
    tubeObj.geometry = tubeGeometry;
  }
}

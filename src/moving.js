import * as THREE from 'three';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

import { scene, mapControlInit, isometricLabels, addObj, gisdPage, catchObj, ruler as isometricRulerService } from './index';

export class IsometricMovingObjs {
  isDown = false;
  isMove = false;
  mapControlInit;
  scene;
  obj;
  offset;

  constructor() {
    this.mapControlInit = mapControlInit;
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
    const container = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - container.offsetLeft) / container.clientWidth) * 2 - 1;
      const y = -((event.clientY - container.offsetTop) / container.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = [];
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  // если клиенули по изометрии, то готовимся к перетаскиванию
  onmousedown({ obj, event, plane }) {
    this.isDown = false;

    if (!obj.userData.isIsometry) return;
    // obj = this.getParentObj({ obj });
    // if (!obj) return;

    this.obj = obj;

    plane.position.copy(obj.position);
    plane.rotation.copy(this.mapControlInit.control.object.rotation);
    plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length == 0) return;
    this.offset = intersects[0].point;

    this.isDown = true;
    this.isMove = true;
  }

  onmousemove = (event, plane) => {
    if (!this.isMove) return;

    const intersects = this.rayIntersect(event, plane, 'one');
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
      // позиционирование одиночного объекта
      const done = catchObj.onmousemove({ event, obj: this.obj, offset });
      if (done) return;

      this.obj.position.add(offset);

      isometricLabels.updataPos(this.obj);

      this.obj.userData.joins.forEach((o) => this.moveJoin({ obj: o, offset, skipObj: this.obj }));
    }

    // перетаскиваем стык
    if (this.obj.userData.isJoint) {
      this.moveJoin({ obj: this.obj, offset, skipObj: null });

      this.connectJoints(event);
    }
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    if (this.obj.userData.isObj) {
      catchObj.onmouseup();
    }

    if (this.obj.userData.isJoint) {
      this.connectJoints(event, 'up');
    }

    this.isDown = false;
    this.isMove = false;
  };

  // соединение стыка (который ни с кем не соединен) с другим стыком (тоже ни с кем не соединен)
  connectJoints(event, type = '') {
    if ([...this.obj.userData.objs, ...this.obj.userData.tubes].length !== 1) return;

    let findObj = null;
    let limit = 20;

    const canvas = this.mapControlInit.control.domElement;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const v1 = new THREE.Vector2(x, y);
    const camera = this.mapControlInit.control.object;

    const arr = gisdPage.joins;

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === this.obj) continue;
      if ([...arr[i].userData.objs, ...arr[i].userData.tubes].length !== 1) continue;

      const v2 = this.getPosition2D({ camera, canvas, pos: arr[i].position });

      const dist = v1.distanceTo(v2);

      if (limit > dist) {
        limit = dist;
        findObj = arr[i];
      }
    }

    if (!findObj) return;

    const offset = findObj.position.clone().sub(this.obj.position);
    this.obj.position.add(offset);

    this.offset = findObj.position.clone();

    const obj = this.obj;
    const skipObj = null;
    const skipJoins = [];

    // перемещение труб привязанные к стыку
    obj.userData.tubes.forEach((data) => {
      if (data.obj !== skipObj) {
        this.updataTubeLine({ obj: data.obj, offset, id: data.id });

        if (data.obj.userData.line.length > 2) {
          data.obj.userData.joins.forEach((join) => {
            if (join !== obj) this.moveJoin({ obj: join, offset, skipObj: data.obj, skipJoins });
          });
        }
      }
    });

    // перемещение объектов привязанные к стыку
    obj.userData.objs.forEach((o) => {
      if (o !== skipObj) {
        o.position.add(offset);
        isometricLabels.updataPos(o);

        // перемещение стыков привязанные к объекты, за исключением текущего
        o.userData.joins.forEach((join) => {
          if (join !== obj) {
            this.moveJoin({ obj: join, offset, skipObj: o, skipJoins });
          }
        });
      }
    });

    if (type === 'up') {
      const index = gisdPage.joins.indexOf(obj);
      if (index > -1) {
        gisdPage.joins.splice(index, 1);

        obj.removeFromParent();
        obj.geometry.dispose();

        let objJ = [...this.obj.userData.objs, ...this.obj.userData.tubes];

        if (this.obj.userData.tubes.length > 0) {
          objJ[0].obj.userData.joins.push(findObj);
          findObj.userData.tubes.push(objJ[0]);
        }
        if (this.obj.userData.objs.length > 0) {
          objJ[0].userData.joins.push(findObj);
          findObj.userData.objs.push(objJ[0]);
        }

        this.obj = null;
      }
    }
  }

  // положение стыка на 2D экране
  getPosition2D({ camera, canvas, pos }) {
    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return new THREE.Vector2(x, y);
  }

  // перемещение стыка
  moveJoin({ obj, offset, skipObj, skipJoins = [] }) {
    // если стык уже перемещался, то отменяем операцию
    skipJoins.forEach((join) => {
      if (join === obj) return;
    });

    isometricLabels.updataPos(obj);

    // добавляем в массив skipJoins, текущий стык, чтобы большего его не перемещали и небыло зацикливания
    skipJoins.push(obj);

    // перемещение стыка
    obj.position.add(offset);

    isometricRulerService.updataPos({ obj, offset });

    // перемещение труб привязанные к стыку
    obj.userData.tubes.forEach((data) => {
      if (data.obj !== skipObj) {
        this.updataTubeLine({ obj: data.obj, offset, id: data.id });

        if (data.obj.userData.line.length > 2) {
          data.obj.userData.joins.forEach((join) => {
            if (join !== obj) this.moveJoin({ obj: join, offset, skipObj: data.obj, skipJoins });
          });
        }
      }
    });

    // перемещение объектов привязанные к стыку
    obj.userData.objs.forEach((o) => {
      if (o !== skipObj) {
        o.position.add(offset);
        isometricLabels.updataPos(o);

        // перемещение стыков привязанные к объекты, за исключением текущего
        o.userData.joins.forEach((join) => {
          if (join !== obj) {
            this.moveJoin({ obj: join, offset, skipObj: o, skipJoins });
          }
        });
      }
    });
  }

  // обновляем геометрию линии при перемещение всей линии или певрой/последней точки
  updataTubeLine({ obj, offset, id = undefined }) {
    const points = obj.userData.line;

    if (id === 0 && points.length < 3) {
      points[0].add(offset);
    } else if (id === 1 && points.length < 3) {
      points[points.length - 1].add(offset);
    } else {
      points.forEach((point) => point.add(offset));
    }

    obj.geometry.dispose();

    const positions = [];
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
    const points2 = curve.getPoints(12 * points.length);
    for (let i = 0; i < points2.length; i++) {
      const point = points2[i];
      positions.push(point.x, point.y, point.z);
    }
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    obj.geometry = geometry;
    obj.computeLineDistances();

    isometricLabels.updataPos(obj);

    this.updataTubeGeom({ obj });
  }

  // обновляем геометрию трубы
  updataTubeGeom({ obj }) {
    const tubeObj = obj.userData.tubeObj;
    const points = obj.userData.line;
    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;

    const tubeGeometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 32, false);
    tubeObj.geometry.dispose();
    tubeObj.geometry = tubeGeometry;
  }
}

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
  axisX;
  axisZ;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.axisX = this.createAxis();
    this.axisZ = this.createAxis();
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

    this.mapControlInit.control.object.updateMatrixWorld();
    this.mapControlInit.control.object.updateProjectionMatrix();

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
      this.alignToAxis({ event });
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

  createAxis(type = 'x') {
    const material = new THREE.LineDashedMaterial({ color: 0x0000ff, dashSize: 1, gapSize: 0.5 });

    const points = [];
    if (type === 'x') {
      points.push(new THREE.Vector3(-10, 0, 0));
      points.push(new THREE.Vector3(10, 0, 0));
    }
    if (type === 'z') {
      points.push(new THREE.Vector3(0, 0, -10));
      points.push(new THREE.Vector3(0, 0, 10));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    scene.add(line);

    return line;
  }

  alignToAxis({ event }) {
    const arr = gisdPage.joins;
    //const v1 = this.getPosition2D({ camera, canvas, pos: this.obj.position });
    //console.log(555, this.obj);

    const canvas = this.mapControlInit.control.domElement;
    const x1 = event.clientX - canvas.offsetLeft;
    const y1 = event.clientY - canvas.offsetTop;
    const v1 = new THREE.Vector2(x1, y1);

    //this.axis.position.copy(this.obj.position);

    // for (let i = 0; i < arr.length; i++) {
    //   if (arr[i] === this.obj) continue;

    //   const axis1 = this.createAxis();
    //   const axis2 = this.createAxis('z');

    //   axis1.position.copy(arr[i].position);
    //   axis2.position.copy(arr[i].position);
    // }

    let pX = [];
    let pZ = [];
    const point = this.obj;
    //const point2 = this.obj.userData.joins[0] === point ? this.obj.userData.joins[1] : this.obj.userData.joins[0];
    const obj_point = gisdPage.joins;

    for (let i = 0; i < obj_point.length; i++) {
      if (obj_point[i] === point) {
        continue;
      }

      var p1 = this.spPoint(obj_point[i].position, new THREE.Vector3().addVectors(obj_point[i].position, new THREE.Vector3(10, 0, 0)), point.position);
      var p2 = this.spPoint(obj_point[i].position, new THREE.Vector3().addVectors(obj_point[i].position, new THREE.Vector3(0, 0, 10)), point.position);

      var x = Math.abs(obj_point[i].position.x - p1.x);
      var z = Math.abs(obj_point[i].position.z - p2.z);

      if (x < 0.1) {
        pX[pX.length] = i;
      }
      if (z < 0.1) {
        pZ[pZ.length] = i;
      }
    }

    if (pX.length > 0) {
      var v = [];
      for (var i = 0; i < pX.length; i++) {
        v[i] = obj_point[pX[i]].position;
      }
      var n1 = pX[this.getMinDistanceVertex(v, point.position)];
    }

    if (pZ.length > 0) {
      var v = [];
      for (var i = 0; i < pZ.length; i++) {
        v[i] = obj_point[pZ[i]].position;
      }
      var n2 = pZ[this.getMinDistanceVertex(v, point.position)];
    }

    // if (pX.length > 0 && pZ.length > 0) {
    //   point.position.x = obj_point[n1].position.x;
    //   point.position.y = obj_point[n2].position.y;
    //   point.position.z = obj_point[n2].position.z;
    //   this.dopFunct1(point, obj_point[n1].position, this.axisX, 'xz');
    //   this.dopFunct1(point, obj_point[n2].position, this.axisZ, 'xz');
    // } else {
    //   pX.length > 0 ? this.dopFunct1(point, obj_point[n1].position, this.axisX, 'x') : (this.axisX.visible = false);
    //   pZ.length > 0 ? this.dopFunct1(point, obj_point[n2].position, this.axisZ, 'z') : (this.axisZ.visible = false);
    // }

    this.axisX.visible = false;
    this.axisZ.visible = false;
    if (pX.length > 0) {
      const dist = point.position.distanceTo(obj_point[n1].position);
      this.dopFunct1(point, obj_point[n1].position, this.axisX, 'x');
    } else if (pZ.length > 0) {
      const dist = point.position.distanceTo(obj_point[n2].position);
      this.dopFunct1(point, obj_point[n2].position, this.axisZ, 'z');
    }
  }

  spPoint(A, B, C) {
    var x1 = A.x,
      y1 = A.z,
      x2 = B.x,
      y2 = B.z,
      x3 = C.x,
      y3 = C.z;
    var px = x2 - x1,
      py = y2 - y1,
      dAB = px * px + py * py;
    var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    var x = x1 + u * px,
      z = y1 + u * py;
    return { x: x, y: 0, z: z };
  }

  // находим ближайшую точку к выброанной позиции
  getMinDistanceVertex(v, pos) {
    var minDist = 99999;
    var hit = 0;

    for (var i = 0; i < v.length; i++) {
      var dist = pos.distanceTo(v[i]);
      if (dist <= minDist) {
        minDist = dist;
        hit = i;
      }
    }

    return hit;
  }

  // устанвливаем и показываем красные линии
  dopFunct1(point, pos2, lineAxis, axis) {
    //point.position.y = 0;
    if (axis == 'x') {
      point.position.x = pos2.x;
      point.position.y = pos2.y;
    }
    if (axis == 'z') {
      point.position.z = pos2.z;
      point.position.y = pos2.y;
    }

    var pos2 = new THREE.Vector3(pos2.x, point.position.y, pos2.z);

    var dir = new THREE.Vector3().subVectors(point.position, pos2).normalize();
    var angleDeg = Math.atan2(dir.x, dir.z);
    lineAxis.rotation.set(0, angleDeg + Math.PI / 2, 0);
    lineAxis.position.copy(point.position);
    lineAxis.visible = true;
  }
}

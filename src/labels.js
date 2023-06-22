import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { modelsContainerInit, mapControlInit } from './index';

export class IsometricLabels {
  isDown = false;
  isMove = false;
  obj;
  offset;
  mapControlInit;
  modelsContainerInit;
  labelObjs = [];

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
  }

  createLabel({ intersection, text }) {
    const pos = this.modelsContainerInit.control.worldToLocal(intersection.point.clone());

    const objParent = new THREE.Object3D();
    objParent.userData = {};

    // Label с информацие (круг)
    const radius = 0.01;
    const circleShape = new THREE.Shape().moveTo(radius, 0).absarc(0, 0, radius, 0, Math.PI * 2, false);
    circleShape.userData = {};
    circleShape.userData.radius = radius;
    const objTxt = this.addShape(circleShape, text);
    objTxt.rotation.copy(this.mapControlInit.control.object.rotation);
    objTxt.position.copy(pos);
    objTxt.userData = {};
    //objTxt.userData.isLabel = true;
    objTxt.userData.target = { pos: new THREE.Vector3(), obj: null };

    const objPointer = this.createPointer(pos);
    const line = this.createLineSegment(pos);
    const objDash = this.createDash(pos);
    const objDashHelper = this.createDashHelper(objDash);
    const objDiv = this.createDiv(objDash, text);

    objParent.userData.objTxt = objTxt;
    objParent.userData.objPointer = objPointer;
    objParent.userData.objLine = line;
    objParent.userData.objDash = objDash;
    objParent.userData.objDashHelper = objDashHelper;
    objParent.userData.objDiv = objDiv;

    objParent.add(objTxt, objPointer, line, objDash, objDashHelper, objDiv);

    this.modelsContainerInit.control.add(objParent);
    this.labelObjs.push(objParent);

    this.linkObj({ labelObj: objTxt, targetObj: intersection.object, pos });
  }

  // указатель/стрелка
  createPointer(pos) {
    const geometry = new THREE.ConeGeometry(0.1, 0.25, 32);
    geometry.translate(0, -0.25 / 2, 0);
    geometry.rotateX(-Math.PI / 2);
    const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
    obj.userData.isLabel = true;
    obj.userData.isPointer = true;

    obj.rotation.copy(this.mapControlInit.control.object.rotation);
    obj.position.copy(pos);

    return obj;
  }

  // линия (от указателя до информационного круга)
  createLineSegment(pos) {
    const line = this.createLine({ points: [pos.clone(), pos.clone()] });
    line.userData.isLabel = true;
    line.userData.isLine = true;

    return line;
  }

  // черточка для текста
  createDash(pos) {
    let pos2 = this.getPosition2D(pos);
    pos2.x += 200;
    pos2 = this.getPosition3D(pos2);

    const points = [pos, pos2];
    const obj = this.createLine({ points });
    obj.userData.isLabel = true;
    obj.userData.isDash = true;

    return obj;
  }

  createDashHelper(objDash) {
    const arrPos = objDash.geometry.getAttribute('position').array;
    const pos1 = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);
    const pos2 = new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]);

    const points = [pos1, pos2];

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const geometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 12, false);
    const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x0000ff, depthTest: false, transparent: true }));
    obj.material.visible = false;
    obj.userData = {};
    obj.userData.isLabel = true;
    obj.userData.isDashHelper = true;

    return obj;
  }

  // div с текстом
  createDiv(objDash, text) {
    const arrPos = objDash.geometry.getAttribute('position').array;
    const pos1 = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);
    const pos2 = new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]);

    const posC = pos2.clone().sub(pos1);
    posC.divideScalar(2).add(pos1);

    const obj = new THREE.Object3D();
    obj.position.copy(posC);

    const container = document.createElement('div');

    const elem = document.createElement('div');
    elem.textContent = text;
    elem.style.marginBottom = '40px';
    elem.style.fontSize = '20px';
    elem.style.fontFamily = 'arial,sans-serif';
    elem.style.cursor = 'pointer';
    container.append(elem);

    const label = new CSS2DObject(container);
    label.position.set(0, 0, 0);
    obj.add(label);

    this.initEventDiv(label);

    return obj;
  }

  initEventDiv(label) {
    const container = label.element;
    const elem = container.children[0];

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      elem2.textContent = '';
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.fontSize = '20px';
      elem2.style.fontFamily = 'arial,sans-serif';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';
      container.append(elem2);

      elem2.focus();

      close = () => {
        const txt = elem2.value;
        container.children[1].remove();

        if (txt !== '') elem.textContent = txt;
        elem.style.display = '';
      };

      elem2.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          close();
        }
      };

      elem2.onblur = () => close();

      elem.style.display = 'none';
    };
  }

  // создаем ссылку на сноску для объекта
  linkObj({ labelObj, targetObj, pos }) {
    if (targetObj.userData.isTube) {
      targetObj = targetObj.userData.line;
      const points = targetObj.userData.line;
      const fullDist = points[0].distanceTo(points[1]);
      const distFirst = points[0].distanceTo(pos);
      const range = Math.round((distFirst / fullDist) * 100) / 100;
      console.log(range);
      labelObj.userData.target.pos = new THREE.Vector3(range, 0, 0);
    } else {
      labelObj.userData.target.pos = targetObj.worldToLocal(pos.clone());
    }

    labelObj.userData.target.obj = targetObj;
    targetObj.userData.labels.push(labelObj);
  }

  addShape(shape, text) {
    const geometry = new THREE.ShapeGeometry(shape);
    //const texture = this.loadTexture({ radius: shape.userData.radius });
    const texture = this.crTexture({ text, radius: shape.userData.radius });

    const obj = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: texture }));
    obj.material.color.convertSRGBToLinear();
    return obj;
  }

  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    return line;
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

  onmousedown({ intersection, event, plane }) {
    let create = false;

    const obj = intersection.object;

    //if (obj.userData.isLabel) this.clickObj({ event, obj, plane });
    if (obj.userData.isIsometry) {
      let text = 'text';

      if (obj.userData.isTube) {
        text = obj.userData.line.userData.nameTxt;
      } else if (obj.userData.nameTxt) {
        text = obj.userData.nameTxt;
      }

      this.createLabel({ intersection, text });

      create = true;
    }

    return create;
  }

  // если клиенули по label, то готовимся к перетаскиванию
  clickObj({ obj, event, plane }) {
    this.isDown = false;
    this.isMove = false;

    if (!obj.userData.isLabel) return;

    this.obj = obj;

    plane.position.copy(obj.position);
    plane.rotation.copy(this.mapControlInit.control.object.rotation);
    plane.updateMatrixWorld();

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length == 0) return;
    this.offset = intersects[0].point;

    this.isDown = true;
  }

  onmousemove = (event, plane) => {
    if (!this.isDown) return;
    this.isMove = true;

    const intersects = this.rayIntersect(event, plane, 'one');
    if (intersects.length === 0) return;

    const offset = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point;

    const objParent = this.obj.parent;

    const objTxt = objParent.userData.objTxt;
    const objPointer = objParent.userData.objPointer;
    const objLine = objParent.userData.objLine;
    const objDash = objParent.userData.objDash;
    const objDashHelper = objParent.userData.objDashHelper;

    if (this.obj === objPointer || this.obj === objTxt) {
      this.obj.position.add(offset);
    }

    if (this.obj === objDashHelper) {
      objTxt.position.add(offset);
    }

    this.updataGeomLine(objParent);
    this.setRotPointer(objParent);
    this.setPosDash(objParent, event);
    this.setPosDashHelper(objParent);
    this.setPosDiv(objParent);
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };

  updataGeomLine(objParent) {
    const objLine = objParent.userData.objLine;
    const obj1 = objParent.userData.objTxt;
    const obj2 = objParent.userData.objPointer;

    const points = [obj1.position.clone(), obj2.position.clone()];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    objLine.geometry.dispose();
    objLine.geometry = geometry;
  }

  // двигаем выноску вслед за привязанным объектом
  updataPos(obj) {
    obj.userData.labels.forEach((label) => {
      const objParent = label.parent;

      let pos = new THREE.Vector3();
      if (obj.userData.isLine) {
        const points = obj.userData.line;
        pos = new THREE.Vector3().subVectors(points[1], points[0]);
        pos = new THREE.Vector3().addScaledVector(pos, label.userData.target.pos.x);
        pos.add(points[0]);
      } else {
        pos = obj.localToWorld(label.userData.target.pos.clone());
      }

      const objPointer = objParent.userData.objPointer;
      objPointer.position.copy(pos);
      this.setRotPointer(objParent);
      this.updataGeomLine(objParent);
    });
  }

  setRotPointer(objParent) {
    const objPointer = objParent.userData.objPointer;
    const objLine = objParent.userData.objLine;

    const arrPos = objLine.geometry.getAttribute('position').array;
    const posTarget = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);

    objPointer.lookAt(posTarget);
  }

  // двигаем черточку
  setPosDash(objParent, event = null) {
    const objDash = objParent.userData.objDash;
    const objLine = objParent.userData.objLine;
    const arrPos = objLine.geometry.getAttribute('position').array;

    const pos2 = this.getPosition2D(new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]));
    const pos1 = this.getPosition2D(new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]));
    let dir = pos1.clone().sub(pos2);

    if (event) {
      //dir = pos1.clone().sub(new THREE.Vector2(event.clientX, event.clientY));
    }

    pos2.x += dir.x < 5 ? 200 : -200;
    const pos = this.getPosition3D(pos2);

    const points = [new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]), pos];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    objDash.geometry.dispose();
    objDash.geometry = geometry;
  }

  setPosDashHelper(objParent) {
    const objDashHelper = objParent.userData.objDashHelper;
    const objDash = objParent.userData.objDash;

    const arrPos = objDash.geometry.getAttribute('position').array;
    const pos1 = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);
    const pos2 = new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]);

    const points = [pos1, pos2];

    const pipeSpline = new THREE.CatmullRomCurve3(points);
    pipeSpline['curveType'] = 'catmullrom';
    pipeSpline['tension'] = 0;
    const geometry = new THREE.TubeGeometry(pipeSpline, points.length, 0.05, 12, false);

    objDashHelper.geometry.dispose();
    objDashHelper.geometry = geometry;
  }

  setPosDiv(objParent) {
    const objDiv = objParent.userData.objDiv;
    const objDash = objParent.userData.objDash;

    const arrPos = objDash.geometry.getAttribute('position').array;
    const pos1 = new THREE.Vector3(arrPos[0], arrPos[1], arrPos[2]);
    const pos2 = new THREE.Vector3(arrPos[3], arrPos[4], arrPos[5]);

    const posC = pos2.clone().sub(pos1);
    posC.divideScalar(2).add(pos1);

    objDiv.position.copy(posC);
  }

  crTexture({ text, radius }) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 1024;

    context.fillStyle = 'rgba(255,255,255,1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, 1024 / 2, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(255,255,255,1)';
    context.fill();
    context.lineWidth = canvas.width * 0.1;
    context.strokeStyle = 'rgba(34, 34, 34,1)';
    context.stroke();

    context.font = '220pt Arial';
    context.fillStyle = 'rgba(34, 34, 34,1)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.Texture(canvas);
    //texture.colorSpace = THREE.SRGBColorSpace;
    //texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(radius, radius);
    texture.needsUpdate = true;

    return texture;
  }

  // загрузка текстуры для label (не используется, делал для теста)
  loadTexture({ radius }) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('img/manometr.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(radius, radius);

    return texture;
  }

  // положение объекта на 2D экране
  getPosition2D(pos) {
    const camera = this.mapControlInit.control.object;
    const canvas = this.mapControlInit.control.domElement;

    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return new THREE.Vector2(x, y);
  }

  // из 2D в 3D
  getPosition3D(pos2D) {
    const camera = this.mapControlInit.control.object;
    const canvas = this.mapControlInit.control.domElement;

    const x = ((pos2D.x - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
    const y = -((pos2D.y - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;
    const pos = new THREE.Vector3(x, y, -1);

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    pos.unproject(camera);

    return pos;
  }
}

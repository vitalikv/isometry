import * as THREE from 'three';

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

  createLabel({ pos, text }) {
    const radius = 0.5;
    const circleShape = new THREE.Shape().moveTo(radius, 0).absarc(0, 0, radius, 0, Math.PI * 2, false);
    circleShape.userData = {};
    circleShape.userData.radius = radius;

    const obj = this.addShape(circleShape, text);
    obj.rotation.copy(this.mapControlInit.control.object.rotation);
    obj.position.copy(pos);
    obj.userData = {};
    obj.userData.isLabel = true;
    obj.userData.isInfo = true;
    obj.userData.pointerObj = null;
    obj.userData.lineObj = null;

    const objP = new THREE.Mesh(obj.geometry.clone(), new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
    objP.rotation.copy(this.mapControlInit.control.object.rotation);
    objP.position.copy(obj.position);
    objP.scale.set(0.1, 0.1, 0.1);
    objP.userData.isLabel = true;
    objP.userData.isPointer = true;
    objP.userData.infoObj = obj;
    objP.userData.lineObj = null;

    const line = this.createLine({ points: [obj.position, objP.position] });
    line.userData.isLabel = true;
    line.userData.isLine = true;
    line.userData.infoObj = obj;
    line.userData.pointerObj = objP;

    obj.userData.pointerObj = objP;
    obj.userData.lineObj = line;
    objP.userData.lineObj = line;

    this.modelsContainerInit.control.add(obj, objP, line);
    this.labelObjs.push(obj, objP);
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
    const obj = intersection.object;

    if (obj.userData.isLabel) this.clickObj({ event, obj, plane });
    if (obj.userData.isIsometry) {
      let text = 'text';
      if (obj.userData.isTube) text = 'труба';
      if (obj.userData.isObj) text = 'кран';
      if (obj.userData.isJoin) text = 'стык';
      this.createLabel({ pos: intersection.point, text });
    }
  }

  // если клиенули по label, то готовимся к перетаскиванию
  clickObj({ obj, event, plane }) {
    this.isDown = false;

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

    this.obj.position.add(offset);

    if (this.obj.userData.isInfo) {
      this.updataGeomLine({ obj: this.obj.userData.lineObj });
    }

    if (this.obj.userData.isPointer) {
      this.updataGeomLine({ obj: this.obj.userData.lineObj });
    }
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) return;

    this.isDown = false;
    this.isMove = false;
  };

  updataGeomLine({ obj }) {
    const obj1 = obj.userData.infoObj;
    const obj2 = obj.userData.pointerObj;

    const points = [obj1.position.clone(), obj2.position.clone()];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    obj.geometry.dispose();
    obj.geometry = geometry;
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

  loadTexture({ radius }) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('img/manometr.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(radius, radius);

    return texture;
  }
}

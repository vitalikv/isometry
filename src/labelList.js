import * as THREE from 'three';

import { modelsContainerInit, mapControlInit, renderer } from './index';

export class IsometricLabelList {
  mapControlInit;
  modelsContainerInit;
  obj;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
  }

  init() {
    this.createSheet({ pos: new THREE.Vector3(), text: 'text' });
  }

  createSheet({ pos, text }) {
    if (this.obj) {
      this.obj.visible = !this.obj.visible;
      this.setPosRot();

      return;
    }

    const x = 2;
    const y = 1;
    const squareShape = new THREE.Shape().moveTo(0, 0).lineTo(0, y).lineTo(x, y).lineTo(x, 0).lineTo(0, 0);

    const obj = this.addShape(squareShape, text);
    this.modelsContainerInit.control.add(obj);
    this.obj = obj;
    this.setPosRot();
  }

  addShape(shape, text) {
    const geometry = new THREE.ShapeGeometry(shape);
    //const texture = this.loadTexture({ radius: shape.userData.radius });
    const texture = this.crTexture({ text, radius: 1 });

    const obj = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: texture }));
    obj.material.color.convertSRGBToLinear();
    return obj;
  }

  crTexture({ text, radius }) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 1024 / 2;

    context.fillStyle = 'rgba(0,0,0,1)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.fillStyle = 'rgba(255,255,255,1)';
    context.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
    context.fill();
    context.lineWidth = canvas.width * 0.1;
    context.strokeStyle = 'rgba(34, 34, 34,1)';
    context.stroke();

    context.font = '50pt Arial';
    context.fillStyle = 'rgba(34, 34, 34,1)';
    //context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText('труба', canvas.width / 2 + 100, 0 + 50);
    context.fillText('отвод', canvas.width / 2 + 100, 0 + 200);
    context.fillText('кран', canvas.width / 2 + 100, 0 + 350);

    const texture = new THREE.Texture(canvas);
    //texture.colorSpace = THREE.SRGBColorSpace;
    //texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / 2, 1 / 1);
    //texture.offset.set(radius, radius);
    texture.needsUpdate = true;

    return texture;
  }

  getPos() {
    const camera = this.mapControlInit.control.object;
    const canvas = this.mapControlInit.control.domElement;

    const x = ((5 - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
    const y = -((canvas.clientHeight - 80 - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;
    const pos = new THREE.Vector3(x, y, -1);

    camera.updateMatrixWorld();
    if (camera instanceof THREE.OrthographicCamera) camera.updateProjectionMatrix();

    pos.unproject(camera);

    // let dir1 = camera.getWorldDirection(new THREE.Vector3());
    // dir1 = new THREE.Vector3().addScaledVector(dir1, 10);
    // A = camera.position.clone().add(dir1).add(new THREE.Vector3());

    return pos;
  }

  setPosRot() {
    if (!this.obj) return;
    if (!this.obj.visible) return;

    const camera = this.mapControlInit.control.object;
    this.obj.rotation.copy(this.mapControlInit.control.object.rotation);
    this.obj.position.copy(this.getPos());
    if (camera instanceof THREE.OrthographicCamera) {
      this.obj.scale.set(1 / camera.zoom, 1 / camera.zoom, 1 / camera.zoom);
    }
  }
}

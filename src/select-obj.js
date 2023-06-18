import * as THREE from 'three';

import { modelsContainerInit, mapControlInit, ruler, moving, isometricLabels, isometricLabelList, gisdPage, joint, deleteObj, addObj, axes } from './index';

export class IsometricModeService {
  mode = 'select';
  mapControlInit;
  modelsContainerInit;
  plane;
  meshes;
  materials = { def: null, act: null };
  listSelectObjs = [];
  isDown = false;
  isMove = false;
  actObj = null;
  colorAct = 0xff0000;
  colorDef = 0x000000;

  isometricSchemeService;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.isometricSchemeService = gisdPage;
    this.plane = this.initPlane();

    document.body.addEventListener('mousedown', this.onmousedown);
    document.body.addEventListener('mousemove', this.onmousemove);
    document.body.addEventListener('mouseup', this.onmouseup);
    document.body.addEventListener('wheel', this.mouseWheel);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  initPlane() {
    let geometry = new THREE.PlaneGeometry(10000, 10000);
    let material = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    //material.visible = false;
    const planeMath = new THREE.Mesh(geometry, material);
    planeMath.rotation.set(-Math.PI / 2, 0, 0);
    //this.modelsContainerInit.control.add(planeMath);

    return planeMath;
  }

  onKeyDown = (event) => {
    if (event.code === 'Enter') this.getListSelectedObjs();

    // if (event.code === 'KeyR') this.changeMode('ruler');
    // if (event.code === 'KeyM') this.changeMode('move');
    if (event.code === 'Delete') deleteObj.delete(this.actObj);
    if (event.code === 'ControlLeft' && !event.repeat) {
      if (axes.enable({ obj: this.actObj })) this.changeMode('axes');
    }
  };

  onKeyUp = (event) => {
    if (event.code === 'ControlLeft' && !event.repeat) {
      if (axes.disable()) this.changeMode('move');
    }
  };

  changeMode(mode) {
    if (this.mode === mode) {
      this.mode = 'move';
    } else {
      this.mode = mode;
    }
    console.log(this.mode);
  }

  updateMesh(meshes) {
    this.meshes = meshes;
  }

  rayIntersect(event, obj, t) {
    const canvas = this.mapControlInit.control.domElement;

    const mouse = getMousePosition(event);

    function getMousePosition(event) {
      const x = ((event.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1;
      const y = -((event.clientY - canvas.offsetTop) / canvas.clientHeight) * 2 + 1;

      return new THREE.Vector2(x, y);
    }

    // работает также
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

  onmousedown = (event) => {
    if (this.mode === 'axes') {
      axes.onmousedown();
      return;
    }

    this.deActivateObj();
    this.isDown = false;
    this.isMove = false;

    const result = addObj.click({ event, plane: this.plane });
    if (result) return;

    const tubes = this.isometricSchemeService.tubes;
    const valves = this.isometricSchemeService.valves;
    const tees = this.isometricSchemeService.tees;
    const joins = this.isometricSchemeService.joins;
    const rulerObjs = ruler.rulerObjs;
    const labelObjs = isometricLabels.labelObjs;

    const ray = this.rayIntersect(event, [...this.meshes, ...tubes, ...valves, ...tees, ...joins, ...rulerObjs, ...labelObjs], 'arr');
    if (ray.length === 0) return;

    const intersection = ray[0];
    const obj = intersection.object;
    console.log('---', intersection.object);

    // режим веделения
    if (this.mode === 'select') {
      this.upListObjs({ obj });
    }

    // режим перетаскивания
    if (this.mode === 'move') {
      this.actObj = obj;
      if (obj.userData.isIsometry) moving.onmousedown({ obj, event, plane: this.plane });
    }

    // режим добавления стыка
    if (this.mode === 'addJoint') {
      const result = joint.onmousedown({ event, tubes: gisdPage.lines, scheme: gisdPage });
      if (result) {
        this.changeMode('move');
        joint.activate();
      }
    }

    // режим линейки
    if (this.mode === 'ruler') {
      ruler.onmousedown({ intersection, event, plane: this.plane });
    }

    // режим выноски для объектов
    if (this.mode === 'label') {
      isometricLabels.onmousedown({ intersection, event, plane: this.plane });
    }

    this.isDown = true;
  };

  onmousemove = (event) => {
    if (this.isDown) this.isMove = true;

    isometricLabelList.setPosRot();

    if (this.mode === 'axes') {
      axes.onmousemove(event);
    }

    if (this.mode === 'move') {
      moving.onmousemove(event, this.plane);
    }

    if (this.mode === 'addJoint') {
      joint.onmousemove(event, gisdPage.lines);
    }

    if (this.mode === 'ruler') {
      ruler.onmousemove(event, this.plane);
    }

    if (this.mode === 'label') {
      isometricLabels.onmousemove(event, this.plane);
    }
  };

  onmouseup = (event) => {
    if (this.mode === 'axes') {
      axes.onmouseup(event);
    }

    if (this.mode === 'move') {
      moving.onmouseup(event);
      this.activateObj();
    }

    if (this.mode === 'ruler') {
      ruler.onmouseup(event);
    }

    if (this.mode === 'label') {
      isometricLabels.onmouseup(event);
    }

    this.isDown = false;
    this.isMove = false;
  };

  mouseWheel = (event) => {
    isometricLabelList.setPosRot();
  };

  deActivateObj() {
    const obj = this.actObj;
    this.actObj = null;
    if (!obj) return;
    if (!obj.userData.isIsometry) return;

    if (obj.userData.isTube) {
      obj.userData.line.material.color.set(this.colorDef);
    }

    if (obj.userData.isObj) {
      obj.children.forEach((child) => {
        child.material.color.set(this.colorDef);
      });
    }

    if (obj.userData.isJoint) {
      obj.material.color.set(this.colorDef);
    }
  }

  activateObj() {
    let obj = null;
    if (this.isDown && !this.isMove) {
      obj = this.actObj;
    } else {
      this.actObj = null;
    }

    if (!obj) return;
    if (!obj.userData.isIsometry) return;

    if (obj.userData.isTube) {
      obj.userData.line.material.color.set(this.colorAct);
    }

    if (obj.userData.isObj) {
      obj.children.forEach((child) => {
        child.material.color.set(this.colorAct);
      });
    }

    if (obj.userData.isJoint) {
      obj.material.color.set(this.colorAct);
    }
  }

  // получаем массив uuid выбранных объектов
  getListSelectedObjs() {
    let str = '';
    const uuids = [];
    const list = this.listSelectObjs;

    for (let i = 0; i < list.length; i++) {
      uuids.push(list[i].uuid);
      str += '"' + list[i].uuid + '",';
    }

    //console.log(uuids);
    console.log(str);
  }

  upListObjs({ obj }) {
    const result = this.checkObj({ obj });

    this.setMaterial({ obj, act: !result.exist });

    if (result.exist) {
      this.listSelectObjs.splice(result.ind, 1);
    } else {
      this.listSelectObjs.push(obj);
    }
  }

  // проверяем объект, если в списке уже выбранных объектов
  checkObj({ obj }) {
    const list = this.listSelectObjs;

    let exist = false;
    let ind = -1;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (obj === item) {
        exist = true;
        ind = i;
      }
    }

    return { exist, ind };
  }

  // назначаем материал для объекта , если он выбран или нет
  setMaterial({ obj, act }) {
    act ? (obj.material.wireframe = true) : (obj.material.wireframe = false);
  }
}

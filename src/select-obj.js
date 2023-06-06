import * as THREE from 'three';

import { modelsContainerInit, mapControlInit, ruler, moving, isometricLabels, isometricLabelList, gisdPage, joint } from './index';

export class IsometricModeService {
  mode = 'select';
  mapControlInit;
  modelsContainerInit;
  plane;
  meshes;
  materials = { def: null, act: null };
  listSelectObjs = [];

  isometricSchemeService;

  constructor() {
    this.mapControlInit = mapControlInit;
    this.modelsContainerInit = modelsContainerInit;
    this.isometricSchemeService = gisdPage;
    this.plane = this.initPlane();

    this.materials.def = new THREE.MeshStandardMaterial({ color: 0xffff00, wireframe: false });
    this.materials.act = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });

    document.addEventListener('mousedown', this.onmousedown);
    document.addEventListener('mousemove', this.onmousemove);
    document.addEventListener('mouseup', this.onmouseup);
    document.addEventListener('wheel', this.mouseWheel);

    document.addEventListener('keydown', this.onKeyDown);
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
  };

  changeMode(mode) {
    this.mode = mode;
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
    const tubes = this.isometricSchemeService.tubes;
    const valves = this.isometricSchemeService.valves;
    const tees = this.isometricSchemeService.tees;
    const joins = this.isometricSchemeService.joins;
    const rulerObjs = ruler.rulerObjs;
    const labelObjs = isometricLabels.labelObjs;

    const ray = this.rayIntersect(event, [...tubes, ...valves, ...tees, ...joins, ...rulerObjs, ...labelObjs], 'arr');
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
  };

  onmousemove = (event) => {
    isometricLabelList.setPosRot();

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
    if (this.mode === 'move') {
      moving.onmouseup(event);
    }

    if (this.mode === 'ruler') {
      ruler.onmouseup(event);
    }

    if (this.mode === 'label') {
      isometricLabels.onmouseup(event);
    }
  };

  mouseWheel = (event) => {
    isometricLabelList.setPosRot();
  };

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

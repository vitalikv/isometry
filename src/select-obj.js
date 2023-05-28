import * as THREE from 'three';

import { mapControlInit, ruler, moving } from './index';

export class SelectObj {
  type = 'move';
  mapControlInit;
  scene;
  meshes;
  materials = { def: null, act: null };
  listSelectObjs = [];
  moving;

  constructor({ controls, scene, canvas, meshes }) {
    this.mapControlInit = mapControlInit;
    this.scene = scene;
    this.meshes = meshes;

    this.materials.def = new THREE.MeshStandardMaterial({ color: 0xffff00, wireframe: false });
    this.materials.act = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });

    this.moving = moving;

    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('keydown', this.onKeyDown);
  }

  updateMesh(meshes) {
    this.meshes = meshes;
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
    raycaster.params.Line.threshold = 0;
    raycaster.setFromCamera(mouse, this.mapControlInit.control.object);

    let intersects = null;
    if (t === 'one') {
      intersects = raycaster.intersectObject(obj);
    } else if (t === 'arr') {
      intersects = raycaster.intersectObjects(obj, true);
    }

    return intersects;
  }

  changeType(type) {
    this.type = type;
  }

  onMouseDown = (event) => {
    const ray = this.rayIntersect(event, [...this.meshes, ...ruler.rulerObjs], 'arr');
    if (ray.length === 0) return;

    const intersection = ray[0];
    console.log('---', intersection.object);

    // режим веделения
    if (this.type === 'select') {
      this.upListObjs({ obj: intersection.object });
    }

    // режим перетаскивания
    if (this.type === 'move') {
      this.moving.click({ obj: intersection.object, event });
    }

    // режим линейки
    if (this.type === 'ruler') {
      ruler.click({ intersection, event });
    }
  };

  // получаем массив uuid выбранных объектов
  onKeyDown = (event) => {
    if (event.code !== 'Enter') return;

    let str = '';
    const uuids = [];
    const list = this.listSelectObjs;

    for (let i = 0; i < list.length; i++) {
      uuids.push(list[i].uuid);
      str += '"' + list[i].uuid + '",';
    }

    //console.log(uuids);
    console.log(str);
  };

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
    obj.material = act ? this.materials.act.clone() : this.materials.def.clone();
  }
}

import * as THREE from 'three';

import * as Main from './index';
import { MocksIsometry } from './mocks';
import { AttributesUtil } from './back/getUuid';

export class LoaderModel {
  loader;
  mocksIsometry;
  AttributesUtil;
  offset = new THREE.Vector3();
  meshesModel = [];

  constructor({ scene, name }) {
    this.scene = scene;
    this.loader = new THREE.ObjectLoader();
    this.mocksIsometry = new MocksIsometry();
    this.attributesUtil = new AttributesUtil();
  }

  // список объектов по которым нужно считать изометрию
  getSelectedObjs() {
    let list = [
      '7de3ec3c-3105-479e-9e88-85ed8c925735',
      '44e8df7c-2560-418e-b236-d4cb63295af7',
      '6551fc32-a5c0-495e-90b3-25c4bf813c7a',
      '5b098cf9-48a4-4605-9536-aad7442624f0',
      '9572b527-b709-4e1e-93e2-3650b9cd8a92',
      '96445ce0-f4e5-4148-9209-f601bdc30d96',
      '99e148cb-2590-430e-9ddc-deca90a8f88c',
      'd3b4ad7a-12b3-4390-ac34-f7fc9fe4b823',
      '74aaa1ac-1a66-4651-8539-4b7f91575de7',
      '69e76dfb-d41b-48f2-8550-f92bf35a25a0',
      '32dff6b5-4613-4467-9736-93fe2f3a1a8e',
      '04ac1803-99cf-4ebf-a652-eb8f6744ea03',
      'd1c558f6-0239-4663-9789-845981251bfb',
      '2183c8b5-0772-4b6e-aa09-b72efe2757bf',
      '7d1add9a-0ecf-4553-b6a2-43f24d66be87',
      '79b18808-0179-49f4-b029-5864fcddff6e',
      '74ae18bd-41ad-4fc5-b834-3004afeac796',
      '8a0c5017-3739-461b-9595-4fc6b2f40f84',
      'c8dd8578-4584-4cbe-89a4-55c2ab3180a9',
      '75cf4d5b-3c04-43fc-927c-6e8eec4aa604',
      '086c730d-7434-433f-84bc-b830e7146f7b',
      'e77bfaba-2634-4caf-b552-146f856ac382',
      '10d36609-100c-48b3-b8ca-3ba683547c54',
      '01dbabc4-5d58-411f-9408-d9f1fa92e093',
      'ac59c9bd-8edb-49f6-8971-258e8cd6b43e',
      'd625deb8-2cf2-4033-ad18-bcdc237098fd',
      'ab10562a-e9ca-4db9-a570-86e09add9f94',
    ];

    list.push(
      'f6faf3ee-0996-4454-8a05-db7fc6ab23c8',
      '02af993c-812f-4720-b8be-942097c564cb',
      '54a4bc37-977d-4e42-8d5e-6e72c5e9f8d3',
      '364738d2-8799-41f4-920a-e76f8d8c5edc',
      '7ba73ce1-4ed3-4359-a10e-7689c17fcf30',
      '16ac5c90-f626-4141-b430-d18b08857d4e',
      '338d9859-c158-41a2-aa3c-3cce66e8d15f'
    );

    list.push('285ec00f-42f1-4fb8-ad39-ee613d0c0cc6', '2b87c557-d077-49d2-9a50-f688537d54f0');

    list = [];

    return list;
  }

  loaderObj(name) {
    const arrValve = [];

    this.loader.load(
      'img/' + name + '.json',

      (obj) => {
        if (this.offset.length() === 0) {
          this.offset = this.getBoundObject_1({ obj });
        }

        obj.position.add(this.offset);

        if (name === '000-MR1_PIPE01' || name === '0019.005-TH_02.osf') {
          //const type = 1; // можно выделить все объекты
          const type = 2; // можно выделить объекты из списка
          //const type = 3; // можно выделить объекты которых нету в списке

          const listSelectedObjs = this.getSelectedObjs();

          obj.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
              if (listSelectedObjs.length > 0) {
                const ind = listSelectedObjs.findIndex((item) => item === mesh.uuid);
                if (ind === -1) return;
              }

              mesh.material = mesh.material.clone();
              mesh.material.color.set(0xcccccc);

              // трубы
              const list = this.mocksIsometry.listTubeIfcId();
              let add = false;
              for (let i = 0; i < list.length; i++) {
                if (mesh.uuid === list[i]) {
                  add = true;
                  break;
                }
              }
              if (add) {
                mesh.material.color.set(0xa129d9);
                //arrValve.push(mesh);
              }

              // краны
              if (!add) {
                const list = this.mocksIsometry.listValveIfcId();

                for (let i = 0; i < list.length; i++) {
                  if (mesh.uuid === list[i]) {
                    add = true;
                    break;
                  }
                }
                if (add) {
                  mesh.material.color.set(0xbfad04);
                  //arrValve.push(mesh);
                }
              }

              // тройники
              if (!add) {
                const list = this.mocksIsometry.listTeeIfcId();

                for (let i = 0; i < list.length; i++) {
                  if (mesh.uuid === list[i]) {
                    add = true;
                    break;
                  }
                }
                if (add) {
                  mesh.material.color.set(0x02e8cd);
                  arrValve.push(mesh);
                }
              }

              if (type === 1) this.meshesModel.push(mesh);
              if (type === 2 && add) this.meshesModel.push(mesh);
              if (type === 3 && !add) this.meshesModel.push(mesh);
            }
          });
        } else {
          this.meshesModel.push(obj);
        }

        //this.getUuid(this.meshesModel);
        this.getUuid(arrValve);
        Main.setMeshes({ arr: this.meshesModel });

        this.scene.add(obj);
      }
    );
  }

  // получаем GlobalId (uuid который нужен для cs)
  getUuid(arr) {
    const list = [];
    arr.forEach((mesh) => {
      const geomGuid = this.attributesUtil.getGuidByBufferGeometry(mesh.geometry);
      list.push('' + geomGuid[0] + '');
    });
    console.log(list);
  }

  // получаем все трубы(объекты) из списка
  getMeshesTube() {
    const list = this.mocksIsometry.listTubeIfcId();

    const arrMesh = [];

    for (let i = 0; i < list.length; i++) {
      for (let i2 = 0; i2 < this.meshesModel.length; i2++) {
        if (this.meshesModel[i2].uuid === list[i]) {
          arrMesh.push(this.meshesModel[i2]);
          break;
        }
      }
    }

    return arrMesh;
  }

  // получаем все фитинги(объекты) из списка
  getMeshesValve() {
    const list = this.mocksIsometry.listValveIfcId();

    const arrMesh = [];

    for (let i = 0; i < list.length; i++) {
      for (let i2 = 0; i2 < this.meshesModel.length; i2++) {
        if (this.meshesModel[i2].uuid === list[i]) {
          arrMesh.push(this.meshesModel[i2]);
          break;
        }
      }
    }

    return arrMesh;
  }

  // получаем все фитинги(объекты) из списка
  getMeshesTee() {
    const list = this.mocksIsometry.listTeeIfcId();

    const arrMesh = [];

    for (let i = 0; i < list.length; i++) {
      for (let i2 = 0; i2 < this.meshesModel.length; i2++) {
        if (this.meshesModel[i2].uuid === list[i]) {
          arrMesh.push(this.meshesModel[i2]);
          break;
        }
      }
    }

    return arrMesh;
  }

  getBoundObject_1({ obj }) {
    let arr = [];

    obj.updateMatrixWorld(true);

    obj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        arr[arr.length] = child;
      }
    });

    let v = [];

    for (let i = 0; i < arr.length; i++) {
      arr[i].geometry.computeBoundingBox();
      arr[i].geometry.computeBoundingSphere();

      let bound = arr[i].geometry.boundingBox;

      v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);

      v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.max.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
      v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.min.z).applyMatrix4(arr[i].matrixWorld);
    }

    let bound = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

    for (let i = 0; i < v.length; i++) {
      if (v[i].x < bound.min.x) {
        bound.min.x = v[i].x;
      }
      if (v[i].x > bound.max.x) {
        bound.max.x = v[i].x;
      }
      if (v[i].y < bound.min.y) {
        bound.min.y = v[i].y;
      }
      if (v[i].y > bound.max.y) {
        bound.max.y = v[i].y;
      }
      if (v[i].z < bound.min.z) {
        bound.min.z = v[i].z;
      }
      if (v[i].z > bound.max.z) {
        bound.max.z = v[i].z;
      }
    }

    let offset = new THREE.Vector3(
      -((bound.max.x - bound.min.x) / 2 + bound.min.x),
      -((bound.max.y - bound.min.y) / 2 + bound.min.y),
      -((bound.max.z - bound.min.z) / 2 + bound.min.z)
    );

    return offset;
  }
}

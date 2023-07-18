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
      'ca6fe792-9ae3-46ab-a27c-28689bfe5d8d',
      'd5fffdc0-21bf-4d47-a33d-3f76be59f6ee',
      'e2c6a6ac-dead-473f-b198-4ceadf0ec1a5',
      'bf28c05b-5d42-4b3c-801b-cd877ca0e685',
      'e2a85d63-6909-41de-8979-ae595500adac',
      '3d6ce9da-2497-4513-8633-bd2a5ff16a96',
      'be7957d7-3d41-403c-a0e9-877b0ed31dc0',
      'c7cf7786-f18b-4b37-b3fa-1aababdc2aca',
      '3e195fb1-7bf7-4f27-a251-d627d95d22ed',
      '86f91d2c-9909-4baf-9135-5c2b9130ddcd',
      '92c0a722-c328-4406-9308-9d2ec0350dc8',
      '14f2a7b6-be33-494c-9be6-1bf4bc27ae66',
      'b36a8084-6e0c-4654-9df2-34df2ac9f81e',
      '856aee35-3699-425b-b956-3f3289ab48ac',
      'c596ac00-a3de-4e87-90b4-0fef9934c024',
      'afda94bb-8862-436e-8505-7a576aa6f90c',
      'a36243da-ca26-44a4-844d-aefcc735ecbc',
      'f233fc42-9978-45c0-9766-41ee2582693c',
      'a0e35bb3-6581-4e6e-b393-e824f9f7f8b7',
      '8d01394e-d77f-4a4e-8156-7b20da553083',
      'f7d16388-fbfd-48f2-a386-766bd7739c75',
      'aa92fde1-7783-4c01-ac01-a3761b5106f9',
      'd7e03a82-ca06-4877-9e46-7dfa4829bc29',
      '7978ebe6-319a-4e66-9e86-00cf627c7698',
      '54b4c6b4-c005-4ef2-ba92-517bfdb088f6',
      '5c11622c-e520-43d1-906f-3e75e45083d6',
      '1e8177ef-a639-414c-a138-ccf26d6c1a89',
      'a111d141-a7bb-4825-83a1-ddc6fc3aa49d',
      '3a9fac66-f7c6-420c-b6bf-789190977155',
    ];

    list.push(
      'c9ea24d2-dde3-4e8a-87f9-acfc5c87d3d8',
      '20aad36a-da49-4cc7-ba1e-22f02441b1a5',
      '2d0afe31-fe52-4487-8044-56f6cafd4494',
      '1f4ee461-b89f-4af7-918a-75df1ae959a5',
      '08d017e0-51b6-440a-ab9a-e19cee99b561',
      '5eb39556-6448-4894-bb7c-3ffcbabefc35',
      '0b744b37-e0c2-4ca3-84d2-27f6a9265c01'
    );

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
              if (add) mesh.material.color.set(0xa129d9);

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
                  arrValve.push(mesh);
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
                if (add) mesh.material.color.set(0x02e8cd);
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

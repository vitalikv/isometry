import * as THREE from 'three';

import * as Main from './index';
import { MocksIsometry } from './mocks';

export class LoaderModel {
  loader;
  mocksIsometry;
  offset = new THREE.Vector3();
  meshesModel = [];

  constructor({ scene, name }) {
    this.scene = scene;
    this.loader = new THREE.ObjectLoader();
    this.mocksIsometry = new MocksIsometry();
  }

  loaderObj(name) {
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

          obj.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh) {
              mesh.material = mesh.material.clone();

              const list = this.mocksIsometry.listTubeIfcId();

              let add = false;
              for (let i = 0; i < list.length; i++) {
                if (mesh.uuid === list[i]) {
                  add = true;
                  break;
                }
              }

              if (!add) {
                const list = this.mocksIsometry.listValveIfcId();

                for (let i = 0; i < list.length; i++) {
                  if (mesh.uuid === list[i]) {
                    add = true;
                    break;
                  }
                }
              }

              if (type === 1) this.meshesModel.push(mesh);
              if (type === 2) {
                if (add) {
                  this.meshesModel.push(mesh);
                  mesh.material.color.set(0xa129d9);
                }
              }
              if (type === 3) {
                if (!add) this.meshesModel.push(mesh);
                else mesh.material.color.set(0xa129d9);
              }
            }
          });
        } else {
          this.meshesModel.push(obj);
        }

        Main.setMeshes({ arr: this.meshesModel });

        this.scene.add(obj);
      }
    );
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
  getMeshesObj() {
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

import * as THREE from 'three';

import { controls, scene, renderer } from './index';
import { LoaderModel } from './loader-model';
import { SelectObj } from './select-obj';
import { svgConverter } from './svg';

export class ConvertTubesToLines {
  loaderModel;
  svgConverter = svgConverter;
  lines = [];

  constructor() {
    this.loaderModel = new LoaderModel({ scene });
    new SelectObj({ controls, scene, canvas: renderer.domElement, meshes: this.loaderModel.meshes });

    document.addEventListener('keydown', this.onKeyDown);
  }

  loaderObj(name) {
    this.loaderModel.loaderObj(name);
  }

  onKeyDown = (event) => {
    if (event.code === 'Space') {
      const meshes = this.loaderModel.meshes;
      //this.offset = this.loaderModel.offset;

      this.getIsometry({ meshes });
    }

    // создание svg
    if (event.code === 'KeyS') {
      console.log(this.lines);
      this.svgConverter.deleteSvg();

      for (let i = 0; i < this.lines.length; i++) {
        const points = this.lines[i];

        for (let i2 = 0; i2 < points.length - 1; i2++) {
          const line = this.svgConverter.createSvgLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
          line.points = [points[i2], points[i2 + 1]];
          //this.svgConverter.updateSvgLine(controls.object, controls.domElement, line);
        }

        if (points.length > 0) {
          let circle = this.svgConverter.createSvgCircle();
          circle.point = points[0];
          //this.svgConverter.updateSvgCircle(controls.object, controls.domElement, circle);

          circle = this.svgConverter.createSvgCircle();
          circle.point = points[points.length - 1];
          //this.svgConverter.updateSvgCircle(controls.object, controls.domElement, circle);
        }
      }

      this.svgConverter.updateSvg(controls.object, controls.domElement);
    }
  };

  getIsometry({ meshes }) {
    this.lines = [];

    for (let i = 0; i < meshes.length; i++) {
      const points = this.getPointsForLine(meshes[i]);

      this.createLine({ points });

      this.lines.push(points);
    }

    // if (covers.length > 0) {
    //   this.getClosestPoint({ arr: covers });
    //   for (let i = 0; i < covers.length; i++) {
    //     if (covers[i].dist === Infinity) continue;
    //     if (covers[i].id2 === -1) continue;
    //     console.log(i);
    //     //crPol({ path: covers[i].path, posParentObj: covers[i].posParentObj, center: covers[i].center });
    //   }
    // }
  }

  // расчет для одного mesh
  getPointsForLine(obj) {
    obj.visible = false;
    obj.updateMatrixWorld();
    obj.updateMatrix();

    const geometry = obj.geometry.clone();
    geometry.toNonIndexed();
    obj.material.color.set(new THREE.Color(0xff0000));
    obj.material.wireframe = true;

    const arrP = this.getDataPoints({ geometry, obj });

    this.delAbnormalDir({ arr: arrP });

    const points = this.getPointsIntersectionDirs(arrP);

    //this.getFirstEndPoint({ arrP, obj });

    return points;
  }

  // получаем массив с элементами в котором сохранены одинаковые точки по позиции
  getDataPoints({ geometry, obj }) {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');

    const arrP = [];

    for (let i = 0; i < position.array.length; i += 3) {
      const dir = new THREE.Vector3(normal.array[i + 0], normal.array[i + 1], normal.array[i + 2]);
      dir.negate();

      let origin = new THREE.Vector3(position.array[i + 0], position.array[i + 1], position.array[i + 2]);
      origin = origin.applyMatrix4(obj.matrixWorld);
      //origin.add(obj.position.clone());
      //origin.add(offset);

      // this.helperArrow({ dir: dir, pos: origin, length: 1, color: 0x00ff00 });

      let ind = -1;
      for (let i2 = 0; i2 < arrP.length; i2++) {
        for (let i3 = 0; i3 < arrP[i2].pos.length; i3++) {
          if (arrP[i2].pos[i3].distanceTo(origin) < 0.0001) {
            ind = i2;
            break;
          }
          if (ind !== -1) break;
        }
      }

      if (ind === -1) {
        arrP.push({ length: origin.length(), point: [i], dir: [dir], pos: [origin], dirSum: new THREE.Vector3() });
      } else {
        arrP[ind].point.push(i);

        let ext = true;
        for (let i2 = 0; i2 < arrP[ind].dir.length; i2++) {
          if (1 - Math.abs(arrP[ind].dir[i2].dot(dir)) < 0.0001) {
            ext = false;
            break;
          }
        }
        if (ext) arrP[ind].dir.push(dir);
      }
    }

    return arrP;
  }

  // убираем аномальные нормали
  delAbnormalDir({ arr }) {
    for (let n = 0; n < arr.length; n++) {
      const arrD = [];

      for (let n2 = 0; n2 < arr[n].dir.length; n2++) {
        arrD[n2] = { id: n2, sum: 0 };

        for (let n3 = 0; n3 < arr[n].dir.length; n3++) {
          if (n2 === n3) continue;

          arrD[n2].sum += arr[n].dir[n2].dot(arr[n].dir[n3]);
        }
      }
      //console.log(arrD);

      // если вектор направлен перпендикулярно другим dir, то убираем из массива
      for (let n2 = arrD.length - 1; n2 > -1; n2--) {
        if (Math.abs(arrD[n2].sum) < 0.000001) {
          arr[n].dir.splice(arrD[n2].id, 1);
        }
      }

      // складываем отсавшиеся dir, и получаем общий вектор
      const dir = new THREE.Vector3();
      for (let i2 = 0; i2 < arr[n].dir.length; i2++) {
        dir.add(arr[n].dir[i2]);
      }
      arr[n].dirSum = dir.normalize();
    }
  }

  // находим точки пересения нормалей
  // тем самым мы находим центры сегмента труб, чтобы потом можно было строить линию
  getPointsIntersectionDirs(arrP) {
    const centerPos = [];

    for (let i = 0; i < arrP.length; i++) {
      const pos1 = arrP[i].pos[0].clone();
      const dir1 = arrP[i].dirSum;

      for (let i2 = 0; i2 < arrP.length; i2++) {
        if (i === i2) continue;

        const pos2 = arrP[i2].pos[0].clone();
        const dir2 = arrP[i2].dirSum;

        const dot = dir1.dot(dir2);
        if (dot > -0.85 || dot < -0.9999) continue;

        const dist = pos1.distanceTo(pos2);

        const result = this.closestPointsDet(pos1, dir1, pos2, dir2);

        if (result.cross) {
          // точка пересечения должна находится от начала вектора, до бесконечности,
          // если точка находится до начала вектора, то пропускаем
          let pointOnLine = true;
          pointOnLine = result.pos.clone().sub(pos1).normalize().dot(dir1) > 0.99 ? true : false;
          if (pointOnLine) pointOnLine = result.pos.clone().sub(pos2).normalize().dot(dir2) > 0.99 ? true : false;

          const dist1 = result.pos.distanceTo(pos1);
          const dist2 = result.pos.distanceTo(pos2);

          if (pointOnLine && dist * 1 > dist1) {
            // this.helperArrow({ dir: dir1, pos: pos1, length: dist1, color: 0x00ff00 });
            // this.helperArrow({ dir: dir2, pos: pos2, length: dist2, color: 0x0000ff });

            centerPos.push({ pos: result.pos, del: false });
          }
        }
      }
    }

    //console.log(1111, centerPos.length);
    const limitDist = 0.05; // расстояние, которое считается допустимым считать, что точка находится в тойже позиции

    // находим точки, которые находятся в одной позиции
    for (let i = 0; i < centerPos.length; i++) {
      if (centerPos[i].del) continue;

      for (let i2 = 0; i2 < centerPos.length; i2++) {
        if (i === i2) continue;

        if (limitDist > centerPos[i].pos.distanceTo(centerPos[i2].pos)) {
          centerPos[i2].del = true;
        }
      }
    }

    for (let i = centerPos.length - 1; i > -1; i--) {
      if (centerPos[i].del) centerPos.splice(i, 1);
    }

    const points = [];

    for (let i = 0; i < centerPos.length; i++) {
      points.push(centerPos[i].pos);
      //this.helperBox({ pos: centerPos[i].pos, size: 0.1, color: 0x00ff00 });
    }

    //console.log(2222, centerPos.length);

    return points;
  }

  // находим точку пересечения двух линий в 3D
  // решение по ссылке
  // https://discourse.threejs.org/t/find-intersection-between-two-line3/7119
  // https://discourse.threejs.org/t/solved-how-to-find-intersection-between-two-rays/6464/8
  // метод находит точку пересечения, даже если линии не пересеклись
  // но есть проверка на пересечение (если dpnqnDet === 0, то линии пересекаются)
  // по ссылке есть еще один метод, но я выбрал этот
  closestPointsDet(p1, dir1, p2, dir2) {
    const qp = new THREE.Vector3().subVectors(p1, p2);

    const qpDotmp = qp.dot(dir1);
    const qpDotmq = qp.dot(dir2);
    const mpDotmp = dir1.dot(dir1);
    const mqDotmq = dir2.dot(dir2);
    const mpDotmq = dir1.dot(dir2);

    const detp = qpDotmp * mqDotmq - qpDotmq * mpDotmq;
    const detq = qpDotmp * mpDotmq - qpDotmq * mpDotmp;

    const detm = mpDotmq * mpDotmq - mqDotmq * mpDotmp;

    const pnDet = p1.clone().add(dir1.clone().multiplyScalar(detp / detm));
    const qnDet = p2.clone().add(dir2.clone().multiplyScalar(detq / detm));

    const dpnqnDet = pnDet.clone().sub(qnDet).length();

    const cross = Number(dpnqnDet.toFixed(10)) < 0.0001 ? true : false;

    return { cross, pos: qnDet };
  }

  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  // находим стартовую и конечную точку у трубы
  getFirstEndPoint({ arrP, obj }) {
    const arrP_Id = [];

    for (let i = 0; i < arrP.length; i++) {
      const id = arrP[i].point[0];
      const pos = arrP[i].pos[0];

      if (arrP[i].point.length === 3 || arrP[i].dir.length === 3) {
        arrP_Id.push({ id, pos });
      }
    }

    if (arrP_Id.length === 0) return;

    let path = this.getContourPoint({ arr: arrP_Id });
    if (path.length === 0) return;
    let c1 = this.getCenter({ path, posParentObj: obj.position });
    covers.push({ minDist: c1.distanceTo(path[0].pos), center: c1, path, posParentObj: obj.position, id2: -1 });

    let arrP_Id_2 = [];

    for (let i = 0; i < arrP_Id.length; i++) {
      let flag = false;
      for (let i2 = 0; i2 < path.length; i2++) {
        if (arrP_Id[i].id === path[i2].hit) {
          flag = true;
          break;
        }
      }

      if (!flag) arrP_Id_2.push(arrP_Id[i]);
    }

    path = this.getContourPoint({ arr: arrP_Id_2 });
    if (path.length === 0) return;
    let c2 = this.getCenter({ path, posParentObj: obj.position });
    covers.push({ minDist: c2.distanceTo(path[0].pos), center: c2, path, posParentObj: obj.position, id2: -1 });
  }

  getClosestPoint({ arr, id1 = 0 }) {
    let minDist = Infinity;
    let id2 = 0;
    let pos = new THREE.Vector3();

    for (let i = 0; i < arr.length; i++) {
      if (id1 === i) continue;

      let dist = arr[i].center.distanceTo(arr[id1].center);
      if (dist <= minDist) {
        minDist = dist;
        id2 = i;
      }
    }

    if (arr[id1].id2 === -1 && arr[id1].minDist > minDist) {
      arr[id1].id2 = id2;
      arr[id2].id2 = id1;
    }
    arr[id1].dist = arr[id1].minDist > minDist ? minDist : Infinity;
    if (arr.length > id1 + 1) this.getClosestPoint({ arr, id1: id1 + 1 });
  }

  getContourPoint({ arr, id = 0, path = [] }) {
    let minDist = Infinity;
    let hit = -1;
    let id2 = 0;
    let pos = new THREE.Vector3();

    for (let i = 0; i < arr.length; i++) {
      if (id === i) continue;

      if (path.length > 0) {
        if (path[path.length - 1].hit === arr[i].id) continue;
      }

      let dist = arr[id].pos.distanceTo(arr[i].pos);
      if (dist <= minDist) {
        minDist = dist;

        id2 = arr[i].id;
        hit = arr[id].id;
        pos = arr[id].pos;
      }
    }

    let ext = path.findIndex((item) => item.hit === id2);

    path.push({ hit, id2, minDist, pos });

    if (path.length > arr.length) return [];
    if (ext > -1) hit = -1;

    if (hit > -1) {
      id = arr.findIndex((item) => item.id === id2);
      if (id < arr.length) path = this.getContourPoint({ arr, id, path });
    }

    return path;
  }

  getCenter({ path, posParentObj }) {
    let sumPos = new THREE.Vector3();

    for (let i = 0; i < path.length; i++) {
      sumPos.add(path[i].pos);
    }

    sumPos.x /= path.length;
    sumPos.y /= path.length;
    sumPos.z /= path.length;

    this.helperBox({ pos: sumPos, size: 0.1, color: 0x00ff00 });

    return sumPos;
  }

  // todo удалить
  // построение векторов для визуализиции
  helperArrow({ dir, pos, length = 1, color = 0x0000ff }) {
    const helper = new THREE.ArrowHelper(dir, pos, length, color);
    scene.add(helper);
  }

  // todo удалить
  // построение кубов для визуализиции
  helperBox({ pos, size, color = 0x0000ff }) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial({ color, depthTest: true, transparent: true }));
    box.position.copy(pos);
    scene.add(box);
  }
}

let covers = [];

console.log(666, new THREE.Vector3(0, 0, 0).distanceToSquared(new THREE.Vector3(20, 0, 0)));

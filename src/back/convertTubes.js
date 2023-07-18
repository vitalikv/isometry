import * as THREE from 'three';

import { scene } from '../index';

export class ConvertTubes {
  scene;
  lines = [];

  constructor() {
    this.scene = scene; // todo удалить
  }

  getData({ meshes }) {
    this.lines = [];

    for (let i = 0; i < meshes.length; i++) {
      const points = this.getPointsForLine(meshes[i]);
      if (points.length < 2) continue;

      this.lines.push(points);
    }

    this.joinLine();

    return this.lines;
  }

  // расчет для одного mesh
  getPointsForLine(obj) {
    obj.updateMatrixWorld();
    obj.updateMatrix();

    const geometry = obj.geometry.clone();
    geometry.toNonIndexed();

    const arrP = this.getDataPoints({ geometry, obj });

    this.delAbnormalDir({ arr: arrP });

    const points = this.getPointsIntersectionDirs(arrP);

    return points;
  }

  // отображение линий по точкам
  createLine({ points }) {
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);

    return line;
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

      //this.helperArrow({ dir: dir, pos: origin, length: 1, color: 0x00ff00 });

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

  getCenter({ path }) {
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

  // получаем точку из массива
  getPointFromList({ listId, typeId }) {
    const lines = this.lines;

    const numberPoint = typeId === 0 ? 0 : lines[listId].length - 1;

    return lines[listId][numberPoint];
  }

  // получаем точку из массива
  setPointFromList({ listId, typeId, pos }) {
    const lines = this.lines;

    const numberPoint = typeId === 0 ? 0 : lines[listId].length - 1;

    return (lines[listId][numberPoint] = pos);
  }

  // убираем разрывы между трубами (где стыки)
  joinLine() {
    const listDist = [];
    for (let i = 0; i < this.lines.length; i++) {
      const p1_1 = this.getPointFromList({ listId: i, typeId: 0 });
      const p1_2 = this.getPointFromList({ listId: i, typeId: 1 });

      for (let i2 = 0; i2 < this.lines.length; i2++) {
        if (i === i2) continue;

        const p2_1 = this.getPointFromList({ listId: i2, typeId: 0 });
        const p2_2 = this.getPointFromList({ listId: i2, typeId: 1 });

        const inf = { dist: Infinity, pid1: -1, pid2: -1 };
        [p1_1, p1_2].forEach((p1, ind) => {
          const dist1 = p1.distanceTo(p2_1);
          const dist2 = p1.distanceTo(p2_2);

          if (dist1 < dist2 && dist1 < inf.dist) {
            inf.dist = dist1;
            inf.pid1 = ind;
            inf.pid2 = 0;
          } else if (dist2 < inf.dist) {
            inf.dist = dist2;
            inf.pid1 = ind;
            inf.pid2 = 1;
          }
        });
        // console.log(inf);
        // const pos1 = this.getPointFromList({ listId: i2, typeId: inf.pid2 });
        // this.helperSphere({ pos: pos1, size: 0.1, color: 0x0000ff });
        if (inf.dist !== Infinity && inf.dist < 0.4 && inf.dist > 0.01) {
          listDist.push({ dist: inf.dist, lid1: i, lid2: i2, pid1: inf.pid1, pid2: inf.pid2 });
          // const pos1 = this.getPointFromList({ listId: i, typeId: inf.pid1 });
          // this.helperSphere({ pos: pos1, size: 0.1, color: 0x0000ff });
        }
      }
    }

    const pointsHelp = [];
    const listIgnorLine = [];
    let count = 0;
    for (let i = 0; i < listDist.length; i++) {
      const pid1 = listDist[i].pid1;
      const pid2 = listDist[i].pid2;

      const ui1 = listDist[i].lid1 + '' + pid1;
      const ui2 = listDist[i].lid2 + '' + pid2;

      if (listIgnorLine.indexOf(ui1) > -1 && listIgnorLine.indexOf(ui2) > -1) {
        //console.log(ui1, listDist[i].lid1, listDist[i].pid1 === 0 ? 0 : 1);
        continue;
      }

      listIgnorLine.push(ui1, ui2);

      const pos1 = this.getPointFromList({ listId: listDist[i].lid1, typeId: pid1 });
      const pos2 = this.getPointFromList({ listId: listDist[i].lid2, typeId: pid2 });

      const dist = pos1.distanceTo(pos2);
      //if (dist > 0.2) continue;

      let posC = pos2.clone().sub(pos1);
      posC = new THREE.Vector3(posC.x / 2, posC.y / 2, posC.z / 2);
      posC.add(pos1);

      //pointsHelp.push(this.helperSphere({ pos: pos1, size: 0.1, color: 0x0000ff }));
      //pointsHelp.push(this.helperSphere({ pos: pos2, size: 0.1, color: 0xff0000 }));
      // if (pid1 === 0) this.lines[listDist[i].lid1].unshift(posC);
      // else this.lines[listDist[i].lid1].push(posC);

      // if (pid2 === 0) this.lines[listDist[i].lid2].unshift(posC);
      // else this.lines[listDist[i].lid2].push(posC);

      this.setPointFromList({ listId: listDist[i].lid1, typeId: pid1, pos: posC });
      this.setPointFromList({ listId: listDist[i].lid2, typeId: pid2, pos: posC });

      count++;
    }
  }

  // todo удалить
  // построение векторов для визуализиции
  helperArrow({ dir, pos, length = 1, color = 0x0000ff }) {
    const helper = new THREE.ArrowHelper(dir, pos, length, color);
    this.scene.add(helper);
  }

  // todo удалить
  // построение кубов для визуализиции
  helperBox({ pos, size, color = 0x0000ff }) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshStandardMaterial({ color, depthTest: true, transparent: true }));
    box.position.copy(pos);
    this.scene.add(box);

    return box;
  }

  // todo удалить
  // построение sphere для визуализиции
  helperSphere({ pos, size, color = 0x0000ff }) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshStandardMaterial({ color, depthTest: false, transparent: true }));
    sphere.position.copy(pos);
    this.scene.add(sphere);

    return sphere;
  }
}

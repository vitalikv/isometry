import * as THREE from 'three';
import { Vector3 } from 'three';

import { mapControlInit } from './index';

export class IsometricStampLegendService {
  isDown = false;
  container;
  containerSvg;

  elStamp;
  selectedObj = { el: null, type: '' };
  offset = new THREE.Vector2();

  constructor() {
    //this.addStamp();
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
    this.containerSvg = this.createContainerSvg({ container: this.container });
  }

  // создаем печать
  addStamp() {
    if (this.elStamp) return;
    if (!this.container) this.getContainer();

    const div = document.createElement('div');
    div.innerHTML = `
    <div style="position: absolute; left: 30px; bottom: 30px; min-width: 150px; width: 350px; font-family: Gostcadkk; font-size: 22px; background: #fff; z-index: 3; border: 1px solid #000; box-sizing: border-box;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min-content, 150px)); margin: 10px; color: #000;"></div>
      <div style="margin: 10px;">
        Исполнительный четеж соответствует проекту: Установка комплексной подготовки газа (УКПГ-3). Коммуникации по эстакадам в районе метанольного парка
      </div>
    </div>`;

    const elem = div.children[0];
    //elem['style'].cursor = 'pointer';
    this.container.prepend(elem);

    this.elStamp = elem;

    this.updateStamp();
  }

  // создаем пункты для печати с должностями и ф.и.о.
  createElemItem(data) {
    const html = `
    <div style="display: flex; justify-content: space-between; align-items: end; max-width: 200px; margin-bottom: 20px;">
      <div style="margin: auto; min-width: 80px; user-select: none;">
        ${data.name}
      </div>
      <object type="image/svg+xml" data="img/obj/${data.svg}" style="width: 40px; height: 40px; margin: auto;"></object>
    </div>`;

    const div = document.createElement('div');
    div.innerHTML = html;
    const elem = div.children[0];

    return elem;
  }

  createContainerSvg({ container }) {
    const div = document.createElement('div');
    div.style.cssText = 'position: absolute; width: 1px; z-index: 3;';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;
    container.prepend(div);

    this.createSvgCircle({ container: div, ind: 0, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 1, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 2, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 3, x: 0, y: 0 });

    return div;
  }

  // создаем svg точки
  createSvgCircle({ container, ind, x, y }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', '4.2');
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#fff');
    svg.setAttribute('ind', ind);
    svg['userData'] = { divStamp: null };

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', 'none');

    container.children[0].append(svg);
  }

  getSelectedDiv() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    let elem = null;
    const type = this.selectedObj.type;

    if (type === 'div') {
      elem = this.selectedObj.el;
    }

    if (type === 'svgCircle') {
      elem = this.selectedObj.el['userData'].divStamp;
    }

    return elem;
  }

  setPosArrSvgCircle() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;
    if (this.selectedObj.type !== 'div') return;

    const childNodes = this.containerSvg.children[0].childNodes;
    const boundMain = this.container.getBoundingClientRect();
    const bound = this.selectedObj.el.getBoundingClientRect();

    this.setPosSvgCircle({ svg: childNodes[0], x: bound.left, y: bound.top - boundMain.top, divStamp: this.selectedObj.el });
    this.setPosSvgCircle({ svg: childNodes[1], x: bound.left, y: bound.bottom - boundMain.top, divStamp: this.selectedObj.el });
    this.setPosSvgCircle({ svg: childNodes[2], x: bound.right, y: bound.top - boundMain.top, divStamp: this.selectedObj.el });
    this.setPosSvgCircle({ svg: childNodes[3], x: bound.right, y: bound.bottom - boundMain.top, divStamp: this.selectedObj.el });

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      svg.setAttribute('display', '');
    });
  }

  setPosSvgCircle({ svg, x, y, divStamp }) {
    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);
    svg['userData'].divStamp = divStamp;
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;
    if (!this.elStamp) return;
    event.preventDefault();
    event.stopPropagation();

    this.isDown = false;
    this.clearSelectedObj();

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        this.selectedObj.type = 'svgCircle';
      }
    });

    if (this.elStamp.contains(event.target)) {
      this.isDown = true;
      this.selectedObj.el = this.elStamp;
      this.selectedObj.type = 'div';
      this.setPosArrSvgCircle();
    }

    if (this.isDown) {
      mapControlInit.control.enabled = false;
    } else {
      this.hideSvgCircle();
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;

    const elem = this.selectedObj.el;
    const type = this.selectedObj.type;

    if (type === 'div') {
      this.moveDiv({ elem, event });
    }

    if (type === 'svgCircle') {
      this.moveSvgCircle({ elem, event });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
    mapControlInit.control.enabled = true;
  };

  // перемещение штампа
  moveDiv({ elem, event }) {
    const bottom = elem.style.bottom.replace('px', '');
    elem.style.bottom = Number(bottom) - (event.clientY - this.offset.y) + 'px';
    elem.style.left = elem.offsetLeft + (event.clientX - this.offset.x) + 'px';

    this.setPosArrSvgCircle();
  }

  // перемещение svg точки, изменяем размер штампа
  moveSvgCircle({ elem, event }) {
    let x = event.clientX;

    const ind = elem.getAttribute('ind');
    const elems = this.containerSvg.children[0].childNodes;
    const x0 = Math.abs(Number(elems[0].getAttribute('cx')));
    const x2 = Math.abs(Number(elems[2].getAttribute('cx')));

    let dist = ind === '0' || ind === '1' ? x2 - x : x - x0;
    dist = Math.abs(dist);
    if (dist < 210) {
      dist = 210;
      if (ind === '0' || ind === '1') x = x2 - dist;
      else x = x0 + dist;
    }

    if (ind === '0' || ind === '1') {
      elems[0].setAttribute('cx', x);
      elems[1].setAttribute('cx', x);
    }

    if (ind === '2' || ind === '3') {
      elems[2].setAttribute('cx', x);
      elems[3].setAttribute('cx', x);
    }

    const divStamp = elem['userData'].divStamp;

    if (ind === '0' || ind === '1') divStamp.style.left = x + 'px';

    divStamp.style.width = dist + 'px';

    const childNodes = this.containerSvg.children[0].childNodes;
    const boundMain = this.container.getBoundingClientRect();
    const bound = divStamp.getBoundingClientRect();

    this.setPosSvgCircle({ svg: childNodes[0], x: bound.left, y: bound.top - boundMain.top, divStamp });
    this.setPosSvgCircle({ svg: childNodes[1], x: bound.left, y: bound.bottom - boundMain.top, divStamp });
    this.setPosSvgCircle({ svg: childNodes[2], x: bound.right, y: bound.top - boundMain.top, divStamp });
    this.setPosSvgCircle({ svg: childNodes[3], x: bound.right, y: bound.bottom - boundMain.top, divStamp });
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  hideSvgCircle() {
    if (!this.containerSvg) return;

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      svg.setAttribute('display', 'none');
    });
  }

  updateStamp() {
    if (!this.elStamp) return;

    this.elStamp.children[0].innerHTML = '';

    const data = [];
    data.push({ name: 'Линия', svg: 'line.svg' });
    data.push({ name: 'Отвод', svg: 'bend.svg' });
    data.push({ name: 'Стык', svg: 'joint.svg' });
    data.push({ name: 'Тройник', svg: 'tee.svg' });
    data.push({ name: 'Кран', svg: 'valve.svg' });

    data.forEach((item) => this.elStamp.children[0].append(this.createElemItem(item)));
  }

  deleteDiv() {
    const div = this.getSelectedDiv();
    if (!div) return;

    div.remove();
    this.elStamp = null;

    this.clearSelectedObj();
    this.hideSvgCircle();
  }

  // удаляем все штампы
  delete() {
    if (this.elStamp) this.elStamp.remove();
    this.elStamp = null;

    this.clearSelectedObj();
    this.hideSvgCircle();

    if (this.containerSvg) this.containerSvg.remove();
    this.containerSvg = null;
    this.container = null;
  }
}

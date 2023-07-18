import * as THREE from 'three';

import { mapControlInit } from './index';

export class IsometricStampService {
  isDown = false;
  container;
  containerSvg;
  arrStamp = [];
  selectedObj = { el: null, type: '' };
  offset = new THREE.Vector2();

  constructor() {
    //this.addStamp('1');
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');

    this.containerSvg = this.createContainerSvg({ container: this.container });
  }

  async addStamp(type) {
    if (!this.container) this.getContainer();

    let url = '';
    if (type === '1') url = 'img/stamp/logo1.jpg';
    if (type === '2') url = 'img/stamp/logo2.jpg';

    const data = await this.xhrImg_1(url);

    const div = document.createElement('div');
    div.innerHTML = `
    <div style="position: absolute; width: 420px; height: 200px; background: #fff; z-index: 3; border: 1px solid #D1D1D1;">
      <img src="${data}" style="width: 100%; height: 100%; object-fit: contain;">
    </div>`;
    const elem = div.children[0];
    elem['style'].cursor = 'pointer';
    this.container.prepend(elem);

    this.arrStamp.push(elem);
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

    //svg.setAttributeNS(null, 'style', 'fill: none; stroke: blue; stroke-width: 1px;' );
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

  xhrImg_1(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.responseType = 'blob';
      request.open('GET', url, true);
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          const data = window.URL.createObjectURL(request.response);
          resolve(data);
        }
      };
      request.send();
    });
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;
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

    this.arrStamp.forEach((stamp) => {
      if (stamp.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = stamp;
        this.selectedObj.type = 'div';

        this.setPosArrSvgCircle();
      }
    });

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
    elem.style.top = elem.offsetTop + (event.clientY - this.offset.y) + 'px';
    elem.style.left = elem.offsetLeft + (event.clientX - this.offset.x) + 'px';

    this.setPosArrSvgCircle();
  }

  // перемещение svg точки, изменяем размер штампа
  moveSvgCircle({ elem, event }) {
    const cx = elem.getAttribute('cx');
    const cy = elem.getAttribute('cy');

    //console.log(event.clientX - this.offset.x);
    const x = Number(cx) + (event.clientX - this.offset.x);
    const y = Number(cy) + (event.clientY - this.offset.y);
    elem.setAttribute('cx', x);
    elem.setAttribute('cy', y);

    const ind = elem.getAttribute('ind');

    const elems = this.containerSvg.children[0].childNodes;

    if (ind === '0') {
      elems[1].setAttribute('cx', x);
      elems[2].setAttribute('cy', y);
    }

    if (ind === '1') {
      elems[0].setAttribute('cx', x);
      elems[3].setAttribute('cy', y);
    }

    if (ind === '2') {
      elems[0].setAttribute('cy', y);
      elems[3].setAttribute('cx', x);
    }

    if (ind === '3') {
      elems[2].setAttribute('cx', x);
      elems[1].setAttribute('cy', y);
    }

    const divStamp = elem['userData'].divStamp;

    const boundMain = this.container.getBoundingClientRect();
    const bound0 = elems[0].getBoundingClientRect();
    const bound1 = elems[1].getBoundingClientRect();
    const bound2 = elems[2].getBoundingClientRect();
    divStamp.style.top = bound0.top - boundMain.top + 4.2 + 'px';
    divStamp.style.left = bound0.left + 4.2 + 'px';

    divStamp.style.width = bound2.left - bound0.left + 'px';
    divStamp.style.height = bound1.top - bound0.top + 'px';
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

  deleteDiv() {
    const div = this.getSelectedDiv();
    if (!div) return;

    div.remove();
    this.clearSelectedObj();
    this.hideSvgCircle();
  }

  // удаляем все штампы
  delete() {
    this.arrStamp.forEach((stamp) => {
      stamp.remove();
    });

    this.arrStamp = [];

    this.clearSelectedObj();
    this.hideSvgCircle();

    if (this.containerSvg) this.containerSvg.remove();
    this.containerSvg = null;
    this.container = null;
  }
}

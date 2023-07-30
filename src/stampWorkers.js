import * as THREE from 'three';

import { mapControlInit } from './index';

export class IsometricStampWorkersService {
  isDown = false;
  container;
  containerSvg;
  arrStamp = [];
  selectedObj = { el: null, type: '' };
  offset = new THREE.Vector2();

  listData = [];
  listJob = [];

  elListJob;
  itemJob;
  elBlock;

  constructor() {
    this.listData.push({ job: ['Руководитель', 'Сварочных работ'], worker: 'Ф.И.О.' });
    this.listData.push({ job: ['Руководитель', 'Монтажных работ'], worker: 'Ф.И.О.' });

    this.listJob.push(['Руководитель', 'Сварочных работ']);
    this.listJob.push(['Руководитель', 'Монтажных работ']);
    this.listJob.push(['Сварщик']);
    this.listJob.push(['Проектировщик']);
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
    this.containerSvg = this.createContainerSvg({ container: this.container });

    this.elBlock = this.createElemBlock();
    this.elListJob = this.createElemListJob(this.listJob);
  }

  // создаем печать
  addStamp({ data = this.listData }) {
    if (!this.container) this.getContainer();

    const div = document.createElement('div');
    div.innerHTML = `
    <div style="position: absolute; left: 30px; bottom: 30px; background: #fff; z-index: 3; border: 3px solid #6580A5; box-sizing: border-box;">
      <div style="display: flex; flex-direction: column; margin: 10px; font-family: Roboto; font-size: 16px; color: #6580A5;"></div>
      <div style="display: none; width: 30px; margin: auto auto 10px auto;"></div>
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.0);"></div>
    </div>`;

    const elem = div.children[0];
    //elem['style'].cursor = 'pointer';
    this.container.prepend(elem);

    data.forEach((item) => elem.children[0].append(this.createElemItem(item)));
    elem.children[1].append(this.createElemPlus({ container: elem.children[0] }));

    this.arrStamp.push(elem);
  }

  // создаем пункты для печати с должностями и ф.и.о.
  createElemItem(data) {
    let htmlJob = ``;
    data.job.forEach((item) => (htmlJob += `<div>${item}</div>`));

    const html = `
    <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 20px;">
      <div style="position: relative; min-width: 150px; user-select: none; cursor: pointer;">
        ${htmlJob}
      </div>
      <div style="min-width: 100px; width: 100%;">
        <div style="margin-bottom: 0px; min-width: 30px; border-bottom: 1px solid #6580A5;"></div>
      </div>
      <div style="">${data.worker}</div>
      <div style="display: none; margin-left: 10px; transform: rotate(-45deg); font-size: 20px; color: #5c5c5c; user-select: none; cursor: pointer;">+</div>
    </div>`;

    const div = document.createElement('div');
    div.innerHTML = html;
    const elem = div.children[0];

    const job = elem.children[0];
    const name = elem.children[2];
    const del = elem.children[3];

    job.onpointerdown = (e) => {
      job.prepend(this.elListJob);
      job.prepend(this.elBlock);
      this.elBlock.style.display = '';
      this.elListJob.style.display = '';

      this.itemJob = job;
    };

    name.onmousedown = (e) => {
      // e.preventDefault();
      e.stopPropagation();

      name.setAttribute('spellcheck', 'false');
      name.setAttribute('contenteditable', 'true');

      name.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          name.removeAttribute('spellcheck');
          name.removeAttribute('contenteditable');
        }
        this.setPosArrSvgCircle();
      };
    };

    del.onpointerdown = (e) => {
      const length = elem.parentElement.children.length;

      if (length > 1) elem.remove();
      this.setPosArrSvgCircle();
    };

    return elem;
  }

  // создаем elem для добавления новой строчки в печати
  createElemPlus({ container }) {
    const html = `
    <div style="text-align: center; user-select: none; cursor: pointer;">+</div>`;

    const div = document.createElement('div');
    div.innerHTML = html;
    const elem = div.children[0];

    elem.onpointerdown = (e) => {
      container.append(this.createElemItem({ job: ['Должность'], worker: 'Ф.И.О.' }));
    };

    return elem;
  }

  // подложка показывается, когда появляется список должностей
  createElemBlock() {
    const div = document.createElement('div');
    div.innerHTML = `
    <div style="display: none; position: fixed; left: 0px; top: 0px; width: 100%; height: 100%; font-family: arial, sans-serif; background: rgba(0, 0, 0, 0.0);">
    </div>`;

    const elem = div.children[0];

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      elem.style.display = 'none';
      this.elListJob.style.display = 'none';
    };

    return elem;
  }

  // список с должностями
  createElemListJob(data) {
    let div = document.createElement('div');
    div.innerHTML = `
    <div style="display: none; position: absolute; bottom: 0; left: 0; width: 150px; z-index: 1; font-family: Roboto; font-size: 14px; color: #6580A5; background: rgb(255, 255, 255); border: 1px solid #6580A5;">
      <div style="display: flex; justify-content: space-between; align-items: center; height: 22px; z-index: 1; border-bottom: 1px solid #D1D1D1; user-select: none;">
        <div style="margin-left: 16px; margin-right: 12px; font-size: 12px; color: #9E9E9E;">
          Должность
        </div>
      </div>
      <div style="font-size: 14px; cursor: pointer;">
      </div>
    </div>`;

    const container = div.children[0];

    data.forEach((item) => {
      let htmlJob = ``;
      item.forEach((txt) => (htmlJob += `<div>${txt}</div>`));

      const div = document.createElement('div');
      const htmlItem = `
      <div style="height: 39px; box-sizing: border-box; border-bottom: 1px solid #D1D1D1; user-select: none;">
        <div style="display: flex; align-items: center; box-sizing: border-box; width: 100%; height: 100%;">
          <div style="margin-left: 12px; margin-right: 12px;">
            ${htmlJob}
          </div>
        </div>
      </div>`;

      div.innerHTML = htmlItem;
      const elem = div.children[0];
      container.children[1].append(elem);

      elem.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.style.display = 'none';
        this.elBlock.style.display = 'none';
        this.itemJob.innerHTML = elem.children[0].children[0].innerHTML;
        this.setPosArrSvgCircle();
      };
    });

    return container;
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
    event.preventDefault();
    event.stopPropagation();

    this.isDown = false;
    this.clearSelectedObj();

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        this.selectedObj.type = 'svgCircle';

        this.actStamp();
      }
    });

    this.arrStamp.forEach((stamp) => {
      if (stamp.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = stamp;
        this.selectedObj.type = 'div';

        this.actStamp();
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
    if (dist < 335) {
      dist = 335;
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
  }

  clearSelectedObj() {
    this.deActStamp();

    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  // при клике на печать показываем скрытые элементы и скрываем блокирующую подложку
  actStamp() {
    if (!this.selectedObj.el) return;

    const divStamp = this.selectedObj.type === 'svgCircle' ? this.selectedObj.el['userData'].divStamp : this.selectedObj.el;

    divStamp.children[0].childNodes.forEach((item) => {
      item.children[3].style.display = '';
    });

    divStamp.children[1].style.display = '';
    divStamp.children[2].style.display = 'none';
  }

  // при даекативации печати скрываем вспомгательные элементы и ставим блокирующую подложку
  deActStamp() {
    if (!this.selectedObj.el) return;

    const divStamp = this.selectedObj.type === 'svgCircle' ? this.selectedObj.el['userData'].divStamp : this.selectedObj.el;

    divStamp.children[0].childNodes.forEach((item) => {
      item.children[3].style.display = 'none';
    });

    divStamp.children[1].style.display = 'none';
    divStamp.children[2].style.display = '';
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

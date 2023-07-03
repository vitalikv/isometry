import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class IsometricSheetsService {
  container;
  elemWrap;
  elemSheet;
  formatSheet = '';
  isDown = false;
  offset = new THREE.Vector2();

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
  }

  showHideSheet(formatSheet) {
    if (formatSheet === this.formatSheet) {
      this.delete();
    } else {
      this.delete();
      this.createSvgSheet(formatSheet);
    }
  }

  async createSvgSheet(formatSheet) {
    if (!this.container) this.getContainer();
    this.formatSheet = formatSheet;

    const div = document.createElement('div');
    div.innerHTML = `<div style="position: absolute; width: 420px; left: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // left
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // bottom
    div.innerHTML += `<div style="position: absolute; width: 365px; right: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // right
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; top: 0; background: #ccc; z-index: 2;"></div>`; // top
    div.style.userSelect = 'none';

    let url = '';
    if (this.formatSheet === 'A4_2') {
      url = 'img/sheets/A4_2_1.svg';
    }
    if (this.formatSheet === 'A3_4') {
      url = 'img/sheets/A3_4.svg';
    }

    const data = await this.xhrImg_1(url);

    div.innerHTML += `<div style="position: absolute; width: 100%; height: 100%; z-index: 2;">${data}</div>`;
    //translateX(50%);
    this.container.prepend(div);

    this.elemWrap = div;
    this.elemSheet = this.elemWrap.children[4].children[0];

    this.elemSheet.style.width = '100%';
    this.elemSheet.style.height = '100%';

    const svgLine = this.elemSheet.children[0];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.append(svgLine);
    g.setAttribute('fill', 'none');
    this.elemSheet.prepend(g);
    this.elemSheet.setAttribute('fill', '');

    const svgTxt1 = this.elemSheet.children[2];
    const svgTxt2 = this.elemSheet.children[3];
    const svgTxt3 = this.elemSheet.children[5];

    this.createLabel({ txt: 'название', fontSize: '10', delElem: svgTxt1 });
    this.createLabel({ txt: 'образец', fontSize: '8', delElem: svgTxt2, rotate: 0 });
    this.createLabel({ txt: '1', fontSize: '6', delElem: svgTxt3 });

    this.setPosSheet();
  }

  setPosSheet() {
    const rectC = this.container.getBoundingClientRect();
    const rect = this.elemSheet.children[0].getBoundingClientRect();

    const offset = { el1: 60, el2: 73, el3: 5, el4: 5 };

    if (this.formatSheet === 'A3_4') {
      offset.el1 = 50;
      offset.el2 = 3;
    }

    this.elemWrap.children[0]['style'].width = rect.left + offset.el1 + 'px';
    this.elemWrap.children[1]['style'].height = rectC.bottom - rect.bottom + offset.el2 + 'px';
    this.elemWrap.children[2]['style'].width = rectC.width - rect.right + offset.el3 + 'px';
    this.elemWrap.children[3]['style'].height = -rectC.top + rect.top + offset.el4 + 'px';
  }

  // удаляем из svg листа текст и заменяем на свой и создаем событие при клике на свой текст
  createLabel({ txt, fontSize, delElem, rotate = 0 }) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.elemWrap.children[4].children[0].appendChild(elem);

    const bbox = delElem.getBBox();
    delElem.remove();

    elem.setAttribute('x', bbox.x + bbox.width / 2);
    elem.setAttribute('y', bbox.y + bbox.height / 2);
    //elem.setAttribute('transform-origin', 'center');
    //elem.setAttribute('transform-box', ' fill-box');
    elem.setAttribute('transform', 'rotate(' + rotate + ', ' + (bbox.x + bbox.width / 2) + ',' + (bbox.y + bbox.height) + ')');

    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    elem.setAttribute('font-family', 'arial,sans-serif');

    elem.style.cursor = 'pointer';

    elem.textContent = txt;

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rectC = this.container.getBoundingClientRect();
      const rect = elem.getBoundingClientRect();

      const elem2 = document.createElement('input');
      elem2.style.position = 'absolute';
      elem2.style.top = rect.top - rectC.top + 'px';
      elem2.style.left = rect.left - 50 + rect.width / 2 + 'px';
      elem2.style.zIndex = '3';
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.fontSize = '20px';
      elem.style.fontFamily = 'arial,sans-serif';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';
      elem2.textContent = '';
      this.container.append(elem2);

      elem2.focus();

      elem2.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          const txt = elem2.value;
          elem2.remove();

          if (txt !== '') elem.textContent = txt;
          elem.style.display = '';
        }
      };

      elem.style.display = 'none';
    };

    console.log(elem);
  }

  xhrImg_1(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          const data = request.responseText;
          resolve(data);
        }
      };
      request.send();
    });
  }

  // создаем svg контур из линий
  createSvgPath(cdm) {
    if (!cdm) {
      cdm = {};
    }

    var arr = [];

    var svgContainer = this.container.children[0].children[4];

    var xmlns = 'http://www.w3.org/2000/svg';
    var boxWidth = 300;
    var boxHeight = 300;

    var svgElem = document.createElementNS(xmlns, 'svg');
    svgElem.setAttributeNS(null, 'viewBox', '0 0 ' + boxWidth + ' ' + boxHeight);
    svgElem.setAttributeNS(null, 'width', '100%');
    svgElem.setAttributeNS(null, 'height', '100%');

    cdm.color = '#ff0';
    for (var i = 0; i < 1; i++) {
      var el = document.createElementNS(xmlns, 'path');

      const path =
        'M198 273V1H83M198 273H188M198 273V280M78 273V283M78 273H68M78 273H188M78 283H68M78 283V288M13 283H20M13 283V288M13 283V273M78 288H68M78 288H188M13 288H20M13 288H6M68 283V288M68 283H53M68 283V273M68 288H53M53 283V288M53 283H30M53 283V273M53 288H30M30 283V288M30 283H20M30 283V273M30 288H20M20 283V288M20 283V273M1 263V288H6M1 263H6M1 263V228M6 263V288M6 263V228M6 263H13M1 228H6M1 228V203M6 228H13M6 228V203M13 228V203M13 228V263M1 203H6M1 203V178M6 203H13M6 203V178M13 203V178M1 178H6M1 178V143H6M6 178H13M6 178V143M13 178V143M6 143H13M13 143V15M13 263V273M13 15V1H83M13 15H83V1M13 273H20M20 273H30M30 273H53M53 273H68M188 273V280M188 288H198V280M188 288V280M188 280H198';

      //el.setAttribute('d', 'M100 100, 300 100, 300 600, 200 600');
      el.setAttribute('d', path);
      el.setAttribute('stroke-width', '2px');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'rgb(255, 162, 23)');
      //el.setAttribute('display', 'none');

      if (cdm.dasharray) {
        el.setAttribute('stroke-dasharray', '20 10');
      }

      if (cdm.stroke_width) {
        el.setAttribute('stroke-width', cdm.stroke_width);
      }

      if (cdm.fill) {
        el.setAttribute('fill', cdm.fill);
      }

      if (cdm.color) {
        el.setAttribute('stroke', cdm.color);
      }

      if (cdm.display) {
        el.setAttribute('display', cdm.display);
      }

      el.userData = {};
      el.userData.svg = {};
      el.userData.svg.path = {};
      el.userData.svg.path.arrP = [];
      el.userData.svg.path.arrS = cdm.arrS ? cdm.arrS : [];

      svgElem.appendChild(el);

      arr[arr.length] = el;
    }

    svgContainer.appendChild(svgElem);

    return arr;
  }

  onmousedown = (event) => {
    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    this.isDown = true;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.elemWrap) return;

    for (var i = 0; i < this.elemWrap.children.length; i++) {
      const elem = this.elemWrap.children[i];

      if (i !== 3) elem.style.top = elem.offsetTop + (event.clientY - this.offset.y) + 'px';
      if (i !== 0) elem.style.left = elem.offsetLeft + (event.clientX - this.offset.x) + 'px';
    }

    this.setPosSheet();

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    this.offset = new THREE.Vector2();
  };

  delete() {
    if (!this.elemWrap) return;

    this.formatSheet = '';
    this.elemWrap.remove();
    this.elemWrap = null;
  }
}

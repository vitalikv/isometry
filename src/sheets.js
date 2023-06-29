import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class IsometricSheetsService {
  container;
  elemSheet;
  isDown = false;
  offset = new THREE.Vector2();

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
  }

  showHideSheet() {
    if (!this.elemSheet) this.createSvgSheet();
    else this.delete();
  }

  async createSvgSheet() {
    if (!this.container) this.getContainer();

    const div = document.createElement('div');
    div.innerHTML = `<div style="position: absolute; width: 420px; left: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`;
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`;
    div.innerHTML += `<div style="position: absolute; width: 365px; right: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`;
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; top: 0; background: #ccc; z-index: 2;"></div>`;

    div.style.userSelect = 'none';
    const data = await this.xhrImg_1('img/sheets/A4_2_1.svg');

    div.innerHTML += `<div style="position: absolute; height: 100%; transform: translateX(50%); z-index: 2;">${data}</div>`;

    this.container.prepend(div);

    div.children[4].children[0].attributes.width.value = '100%';
    div.children[4].children[0].attributes.height.value = '100%';

    const rectC = this.container.getBoundingClientRect();
    const rect = div.children[4].getBoundingClientRect();

    div.children[0].style.width = rect.left + 60 + 'px';
    div.children[1].style.height = rect.height - rect.bottom + 90 + 'px';
    div.children[2].style.width = rectC.width - rect.right + 5 + 'px';
    div.children[3].style.height = rect.top + 5 + 'px';

    this.elemSheet = div;

    const svgLine = div.children[4].children[0].children[0];
    const svgTxt1 = div.children[4].children[0].children[2];
    const svgTxt2 = div.children[4].children[0].children[3];
    const svgTxt3 = div.children[4].children[0].children[5];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.append(svgLine);
    g.setAttribute('fill', 'none');
    div.children[4].children[0].prepend(g);
    div.children[4].children[0].setAttribute('fill', '');

    this.createLabel({ txt: 'название', fontSize: '10', delElem: svgTxt1 });
    this.createLabel({ txt: 'образец', fontSize: '8', delElem: svgTxt2, rotate: 0 });
    this.createLabel({ txt: '1', fontSize: '6', delElem: svgTxt3 });
  }

  createLabel({ txt, fontSize, delElem, rotate = 0 }) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    this.elemSheet.children[4].children[0].appendChild(elem);

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

      const rect = elem.getBoundingClientRect();

      const elem2 = document.createElement('input');
      elem2.style.position = 'absolute';
      elem2.style.top = rect.top + 'px';
      elem2.style.left = rect.left - 50 + rect.width / 2 + 'px';
      //elem2.style.transform = 'translateX(50%)';
      elem2.style.zIndex = 3;
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

    console.log(this.elemSheet);
    this.isDown = true;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.elemSheet) return;

    for (var i = 0; i < this.elemSheet.children.length; i++) {
      const elem = this.elemSheet.children[i];

      if (i !== 3) elem.style.top = elem.offsetTop + (event.clientY - this.offset.y) + 'px';
      if (i !== 0) elem.style.left = elem.offsetLeft + (event.clientX - this.offset.x) + 'px';
    }

    const rectC = this.container.getBoundingClientRect();
    const rect = this.elemSheet.children[4].getBoundingClientRect();

    this.elemSheet.children[0].style.width = rect.left + 60 + 'px';
    this.elemSheet.children[1].style.height = rect.height - rect.bottom + 90 + 'px';
    this.elemSheet.children[2].style.width = rectC.width - rect.right + 5 + 'px';
    this.elemSheet.children[3].style.height = rect.top + 5 + 'px';

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    this.offset = new THREE.Vector2();
  };

  delete() {
    if (!this.elemSheet) return;

    this.elemSheet.remove();
    this.elemSheet = null;
  }
}

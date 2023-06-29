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
    div.innerHTML = `<div style="position: absolute; width: 420px; left: 0; top: 0; bottom: 0; background: #ccc;"></div>`;
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; bottom: 0; background: #ccc;"></div>`;
    div.innerHTML += `<div style="position: absolute; width: 365px; right: 0; top: 0; bottom: 0; background: #ccc;"></div>`;
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; top: 0; background: #ccc;"></div>`;

    div.style.userSelect = 'none';
    //div.style.width = '50%';
    //div.style.margin = 'auto';
    const data = await this.xhrImg_1('img/sheets/A4_2_1.svg');

    div.innerHTML += `<div style="position: absolute; height: 100%; transform: translateX(50%);">${data}</div>`;

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

    var svg = document.querySelector('#svgFrame');

    for (var i = 0; i < cdm.count; i++) {
      var el = document.createElementNS(infProject.settings.svg.tag, 'path');

      el.setAttribute('d', 'M100 100, 300 100, 300 600, 200 600');
      el.setAttribute('stroke-width', '2px');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'rgb(255, 162, 23)');
      el.setAttribute('display', 'none');

      if (cdm.arrS) {
        var path = 'M';

        for (var i2 = 0; i2 < cdm.arrS.length; i2++) {
          path += cdm.arrS[i2].x + ' ' + cdm.arrS[i2].y + ',';
        }

        el.setAttribute('d', path);
      }

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

      svg.appendChild(el);

      infProject.svg.arr[infProject.svg.arr.length] = el;
      arr[arr.length] = el;
    }

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

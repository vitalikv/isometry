import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class IsometricSheetsService {
  container;

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
  }

  async createSvgSheet() {
    if (!this.container) this.getContainer();

    const div = document.createElement('div');
    div.innerHTML = `<div style="position: absolute; width: 420px; left: 0; top: 0; bottom: 0; background: #fff;"></div>`;
    div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; bottom: 0; background: #fff;"></div>`;
    div.innerHTML += `<div style="position: absolute; width: 365px; right: 0; top: 0; bottom: 0; background: #fff;"></div>`;

    div.style.userSelect = 'none';
    //div.style.width = '50%';
    //div.style.margin = 'auto';
    const data = await this.xhrImg_1('img/sheets/A4_2_1.svg');

    div.innerHTML += `<div style="position: absolute; height: 100%; transform: translateX(50%);">${data}</div>`;

    this.container.prepend(div);

    div.children[3].children[0].attributes.width.value = '100%';
    div.children[3].children[0].attributes.height.value = '100%';

    const rectC = this.container.getBoundingClientRect();
    const rect = div.children[3].getBoundingClientRect();

    div.children[0].style.width = rect.left + 60 + 'px';
    div.children[2].style.width = rectC.width - rect.right + 5 + 'px';
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
}

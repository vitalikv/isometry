import * as THREE from 'three';

import { mapControlInit, modelsContainerInit, gisdPage } from './index';

export class IsometricSheetsService {
  container;
  elemWrap;
  elemSheet;
  arrSvgCircle = [];
  boxsInput = [];
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

  async createSvgSheet(formatSheet, boxsInput = []) {
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
    if (this.formatSheet === 'A1_2') {
      url = 'img/sheets/A1_2.svg';
    }

    const data = await this.xhrImg_1(url);

    div.innerHTML += `<div style="position: absolute; width: 100%; height: 100%; z-index: 2;">${data}</div>`;
    div.style.fontFamily = 'Gostcadkk';
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

    this.createLabel({ txt: '', fontSize: '10', delElem: svgTxt1 });
    this.createLabel({ txt: '', fontSize: '8', delElem: svgTxt2, rotate: 0 });
    this.createLabel({ txt: '', fontSize: '6', delElem: svgTxt3 });

    this.sheetSetup({
      format: this.formatSheet,
      containerWr: this.container,
      container: this.elemSheet,
      path: svgLine.attributes.d.value,
      boxsInput,
    });

    this.setPosSheet();
  }

  setPosSheet() {
    const points = this.getArrSvgCircle();
    const rectC = this.container.getBoundingClientRect();
    const rect = this.elemSheet.getBoundingClientRect();

    let idPoints = [12, 1];

    if (this.formatSheet === 'A3_4') {
      idPoints = [0, 42];
    }
    if (this.formatSheet === 'A1_2') {
      idPoints = [0, 42];
    }

    function getScreenCoords(svg) {
      const x = svg.getAttribute('cx');
      const y = svg.getAttribute('cy');
      const ctm = svg.getCTM();

      const xn = ctm.e + x * ctm.a + y * ctm.c;
      const yn = ctm.f + x * ctm.b + y * ctm.d;

      return { x: xn, y: yn };
    }

    const p1 = getScreenCoords(points[idPoints[0]]);
    const p2 = getScreenCoords(points[idPoints[1]]);

    this.elemWrap.children[0]['style'].width = p1.x + 'px';
    this.elemWrap.children[1]['style'].height = rectC.bottom - rect.top - p1.y + 'px';
    this.elemWrap.children[2]['style'].width = rectC.right - p2.x + 'px';
    this.elemWrap.children[3]['style'].height = rectC.top - rect.top + p2.y + 'px';
  }

  setPosSheet2() {
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

    return;
    elem.setAttribute('x', bbox.x + bbox.width / 2);
    elem.setAttribute('y', bbox.y + bbox.height / 2);
    //elem.setAttribute('transform-origin', 'center');
    //elem.setAttribute('transform-box', ' fill-box');
    elem.setAttribute('transform', 'rotate(' + rotate + ', ' + (bbox.x + bbox.width / 2) + ',' + (bbox.y + bbox.height / 2) + ')');

    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    //elem.setAttribute('font-family', 'arial,sans-serif');

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
      //elem.style.fontFamily = 'arial,sans-serif';
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
    this.arrSvgCircle = [];
    this.boxsInput = [];
    this.elemWrap.remove();
    this.elemWrap = null;
  }

  // настройка листа(создание точек, боксов и с текстами)
  sheetSetup({ format, containerWr, container, path, boxsInput }) {
    const arrCoord = this.getPosPointsFromPath({ path });

    this.createGroupSvgCircle({ container, arrCoord });

    let boxs = [];
    let boxsInputDef = [];

    if (format === 'A4_2') {
      boxs = [{ ids: [41, 42, 2, 43] }, { ids: [12, 13, 0, 45] }, { ids: [26, 38, 40, 12] }];

      boxsInputDef = [
        { fontSize: 3.65, rot: -90, ids: [12, 17, 27, 30], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [27, 29, 32, 30], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [29, 33, 34, 32], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [33, 36, 37, 34], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [36, 39, 40, 37], txt: '' },
        { fontSize: '10', rot: 0, ids: [9, 5, 3, 15], txt: 'Название' },
        { fontSize: '8', rot: 0, ids: [41, 42, 2, 43], txt: 'Образец' },
        { fontSize: '6', rot: 0, ids: [15, 44, 4, 45], txt: '1' },
      ];
    }

    if (format === 'A3_4') {
      boxs = [{ ids: [38, 39, 40, 41] }, { ids: [3, 11, 43, 47] }, { ids: [24, 35, 37, 0] }];

      boxsInputDef = [
        { fontSize: 3.65, rot: -90, ids: [2, 25, 1, 0], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [25, 28, 27, 1], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [28, 30, 31, 27], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [30, 33, 34, 31], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [33, 36, 37, 34], txt: '' },
        { fontSize: '10', rot: 0, ids: [5, 8, 44, 14], txt: 'Название' },
        { fontSize: '8', rot: 0, ids: [38, 39, 40, 41], txt: 'Образец' },
        { fontSize: '6', rot: 0, ids: [14, 46, 45, 47], txt: '1' },
      ];
    }

    if (format === 'A1_2') {
      boxs = [{ ids: [38, 39, 40, 41] }, { ids: [3, 11, 43, 47] }, { ids: [24, 35, 37, 0] }];

      boxsInputDef = [
        { fontSize: 3.65, rot: -90, ids: [2, 25, 1, 0], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [25, 28, 27, 1], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [28, 30, 31, 27], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [30, 33, 34, 31], txt: '' },
        { fontSize: 3.65, rot: -90, ids: [33, 36, 37, 34], txt: '' },
        { fontSize: '10', rot: 0, ids: [5, 8, 44, 14], txt: 'Название' },
        { fontSize: '8', rot: 0, ids: [38, 39, 40, 41], txt: 'Образец' },
        { fontSize: '6', rot: 0, ids: [14, 46, 45, 47], txt: '1' },
      ];
    }

    if (boxsInput.length === 0) boxsInput = boxsInputDef;

    this.createGroupSvgBoxInput({ containerWr, container, arrCoord, boxs: boxsInput });

    this.createGroupSvgBox({ container, arrCoord, boxs });
  }

  // получаем массив точек для выбранного path (производим парсинг)
  getPosPointsFromPath({ path }) {
    let type = '';
    let indCoord = 0;
    let coord = [];
    let arrCoord = [];

    for (let i = 0; i < path.length; i++) {
      if (path[i] === 'M' || path[i] === 'V' || path[i] === 'H') {
        if (coord.length > 0) arrCoord.push([...coord]);
      }

      if (path[i] === 'M') {
        type = path[i];
        coord = [];
        indCoord = 0;
        coord[indCoord] = '';
        continue;
      }

      if (path[i] === 'H') {
        type = path[i];
        coord[0] = '';
        continue;
      }

      if (path[i] === 'V') {
        type = path[i];
        coord[1] = '';
        continue;
      }

      // обнволяем координаты точки по оси X
      if (type === 'H') {
        coord[0] += '' + path[i];
      }

      // обнволяем координаты точки по оси Y
      if (type === 'V') {
        coord[1] += '' + path[i];
      }

      // новая точка X и Y
      if (type === 'M') {
        if (path[i] === ' ') {
          indCoord = 1;
          coord[indCoord] = '';
          continue;
        }

        coord[indCoord] += '' + path[i];
      }
    }

    if (coord.length > 0) arrCoord.push(coord); // сохраняем последние координаты

    //убираем дубли из массива
    const map = new Map();
    for (let i = 0; i < arrCoord.length; i++) {
      map.set(arrCoord[i][0] + '' + arrCoord[i][1], arrCoord[i]);
    }
    arrCoord = Array.from(map.values());

    return arrCoord;
  }

  // создаем группу с точками svg
  createGroupSvgCircle({ container, arrCoord }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    g.setAttribute('fill', 'none');
    //container.prepend(g);   // ставит в начало списка
    container.append(g); // ставит в конец списка

    for (let i = 0; i < arrCoord.length; i++) {
      let coord = arrCoord[i];
      const svg = this.createSvgCircle({ x: coord[0], y: coord[1] });
      this.arrSvgCircle.push(svg);
      g.appendChild(svg);

      this.initEventSvgCircle({ svg, ind: i });
    }
  }

  // создаем svg точки
  createSvgCircle({ x, y }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', '1.2');
    svg.setAttribute('stroke-width', '0.7px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');

    svg.setAttribute('fill', '#fff');

    //svg.setAttributeNS(null, 'style', 'fill: none; stroke: blue; stroke-width: 1px;' );
    //svg.setAttribute('display', 'none');

    return svg;
  }

  // событие по клику
  initEventSvgCircle({ svg, ind }) {
    const elem = svg;

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log(ind);
    };
  }

  // создаем группу с SvgBox (закрывашки для пустых мест у листа)
  createGroupSvgBox({ container, arrCoord, boxs }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    g.setAttribute('fill', 'none');
    container.prepend(g); // ставит в начало списка
    //container.append(g); // ставит в конец списка

    boxs.forEach((box) => {
      const points = box.ids.map((id) => arrCoord[id]);
      const svg = this.createSvgBox({ points });
      g.prepend(svg);
    });
  }

  // создаем группу с SvgBoxInput (чтобы можно было в полях вписывать текст)
  createGroupSvgBoxInput({ containerWr, container, arrCoord, boxs }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    //g.setAttribute('fill', 'none');
    container.prepend(g); // ставит в начало списка
    //container.append(g); // ставит в конец списка

    boxs.forEach((box) => {
      const points = box.ids.map((id) => arrCoord[id]);
      const svg = this.createSvgBox({ points, color: '#cccccc', fillOpacity: 0.0 });

      g.append(svg);
      svg.style.cursor = 'pointer';
      const svgTxt = this.createSvgBoxText({ svgBox: svg, rot: box.rot, fontSize: box.fontSize, txt: box.txt });
      g.prepend(svgTxt);

      box.svgTxt = svgTxt;
      this.initEventSvgBoxInput({ containerWr, container, svg, svgTxt });
    });

    this.boxsInput = boxs;
  }

  createSvgBox({ points, color = '#ffffff', fillOpacity = null }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    //svg.setAttribute("d", 'M100 100, 300 100, 300 600, 200 600');
    svg.setAttribute('stroke-width', '0.5px');
    svg.setAttribute('fill', color);
    if (fillOpacity !== null) svg.setAttribute('fill-opacity', fillOpacity);
    svg.setAttribute('stroke', '#444444');

    let path = 'M';
    for (let i = 0; i < points.length; i++) {
      path += points[i][0] + ' ' + points[i][1] + ',';
    }
    path += points[0][0] + ' ' + points[0][1] + ','; // добавляем в конец массива 1-ую точку, чтобы замкнуть линию

    svg.setAttribute('d', path);

    return svg;
  }

  // добавляем text в box
  createSvgBoxText({ svgBox, rot = 0, fontSize = '3.65', txt = '' }) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    const bbox = svgBox.getBBox();

    elem.setAttribute('x', bbox.x + bbox.width / 2);
    elem.setAttribute('y', bbox.y + bbox.height / 2);
    //elem.setAttribute('transform-origin', 'center');
    //elem.setAttribute('transform-box', ' fill-box');
    elem.setAttribute('transform', 'rotate(' + rot + ', ' + (bbox.x + bbox.width / 2) + ',' + (bbox.y + bbox.height / 2) + ')');

    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    //elem.setAttribute('font-family', 'arial,sans-serif');

    //elem.style.cursor = 'pointer';

    elem.textContent = txt;

    return elem;
  }

  // событие по Box
  initEventSvgBoxInput({ containerWr, container, svg, svgTxt }) {
    const elem = svg;

    let down = () => {
      elem.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        svgTxt.style.display = 'none';
        elem.onpointerdown = null;

        const rectC = containerWr.getBoundingClientRect();
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
        //elem.style.fontFamily = 'arial,sans-serif';
        elem2.style.borderRadius = '4px';
        elem2.style.padding = '10px';
        elem2.value = svgTxt.textContent;
        containerWr.append(elem2);

        elem2.focus();

        elem2.onkeydown = (e2) => {
          if (e2.code === 'Enter') {
            const txt = elem2.value;
            elem2.remove();

            svgTxt.textContent = txt;
            svgTxt.style.display = '';

            down();
          }
        };
      };
    };

    down();
  }

  getArrSvgCircle() {
    return this.arrSvgCircle;
  }

  getArrBoxsInput() {
    let boxs = [];

    this.boxsInput.forEach((box) => {
      let item = { fontSize: box.fontSize, rot: box.rot, ids: box.ids, txt: box.svgTxt.textContent };
      boxs.push(item);
    });

    return boxs;
  }
}

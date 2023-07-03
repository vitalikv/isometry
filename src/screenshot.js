import html2canvas from 'html2canvas';

import { modelsContainerInit, mapControlInit, renderer, isometricSheetsService } from './index';

export class IsometricScreenshot {
  mapControlInit;

  constructor() {
    this.mapControlInit = mapControlInit;

    //document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyH') this.htmlToImg();
  };

  // изображение из scene
  sceneToImg() {
    return new Promise((resolve, reject) => {
      //const domElement = this.mapControlInit.control.domElement;
      const domElement = renderer.domElement;

      const img = new Image();

      img.onload = () => {
        resolve(img);
      };
      img.src = domElement.toDataURL('image/png');
    });
  }

  // изображение из svg
  svgToImg() {
    return new Promise((resolve, reject) => {
      let stop = true;
      if (isometricSheetsService.elemWrap && isometricSheetsService.elemWrap.children.length > 0 && isometricSheetsService.elemWrap.children[4]) {
        stop = false;
      }

      if (stop) return resolve(null);

      const domElement = renderer.domElement;
      const svgSheet = isometricSheetsService.elemWrap.children[4].children[0];
      svgSheet.setAttribute('width', domElement.clientWidth);
      svgSheet.setAttribute('height', domElement.clientHeight);
      const svgString = new XMLSerializer().serializeToString(svgSheet);

      const img = new Image();

      img.onload = () => {
        resolve(img);
      };
      img.src = `data:image/svg+xml;base64,${window.btoa(svgString)}`;
      svgSheet.setAttribute('width', '100%');
      svgSheet.setAttribute('height', '100%');
    });
  }

  // не использую потому что есть библиотека html2canvas
  // получаю canvas и svg собственной сборки
  async testScreenshot() {
    const img1 = await this.sceneToImg();
    const img2 = await this.svgToImg();

    const domElement = renderer.domElement;

    const canvas = document.createElement('canvas');
    canvas.width = domElement.clientWidth;
    canvas.height = domElement.clientHeight;
    const context = canvas.getContext('2d');

    context.drawImage(img1, 0, 0);
    if (img2) context.drawImage(img2, 0, 0);

    const strMime = 'image/png';
    const imgData = canvas.toDataURL(strMime);

    this.saveImg({ data: imgData.replace(strMime, 'image/octet-stream'), name: 'isometry.png' });
  }

  // способ сохранения svg в изображение с data:image/svg+xml;base64
  testSvgToImg1() {
    const svgSheet = isometricSheetsService.elemWrap.children[4].children[0];
    svgSheet.setAttribute('width', svgSheet.clientWidth);
    svgSheet.setAttribute('height', svgSheet.clientHeight);
    const svgString = new XMLSerializer().serializeToString(svgSheet);

    const domElement = renderer.domElement;

    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = domElement.clientWidth;
    canvas.height = domElement.clientHeight;
    const context = canvas.getContext('2d');

    img.onload = () => {
      console.log(svgSheet);
      context.drawImage(img, 0, 0);

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({ data: imgData.replace(strMime, 'image/octet-stream'), name: 'isometry.png' });
    };
    img.src = `data:image/svg+xml;base64,${window.btoa(svgString)}`;
  }

  // способ сохранения svg в изображение с DOMURL и new Blob
  testSvgToImg2() {
    const svgSheet = isometricSheetsService.elemWrap.children[4].children[0];
    svgSheet.setAttribute('width', svgSheet.clientWidth);
    svgSheet.setAttribute('height', svgSheet.clientHeight);
    const svgString = new XMLSerializer().serializeToString(svgSheet);

    const domElement = renderer.domElement;

    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = domElement.clientWidth;
    canvas.height = domElement.clientHeight;
    const context = canvas.getContext('2d');

    const DOMURL = self.URL || self.webkitURL || self;
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = DOMURL.createObjectURL(svg);

    img.onload = () => {
      context.drawImage(img, 0, 0);

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({ data: imgData.replace(strMime, 'image/octet-stream'), name: 'isometry.png' });

      DOMURL.revokeObjectURL(imgData);
    };
    img.src = url;
  }

  // библиотека html2canvas конвертит canvas, html, svg в изображение (установка через npm)
  testHtmlToImg() {
    const container = document.querySelector('#labels-container-div');

    html2canvas(container).then((canvas) => {
      console.log(canvas);
      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({ data: imgData.replace(/^data:image\/png/, 'data:application/octet-stream'), name: 'isometry.png' });
    });
  }

  async screenshot() {
    const container = document.querySelector('#labels-container-div');

    const img1 = await this.sceneToImg();

    html2canvas(container, { backgroundColor: null }).then((img2) => {
      const domElement = renderer.domElement;

      const canvas = document.createElement('canvas');
      canvas.width = domElement.clientWidth;
      canvas.height = domElement.clientHeight;
      const context = canvas.getContext('2d');

      context.drawImage(img1, 0, 0);
      context.drawImage(img2, 0, 0);

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({ data: imgData.replace(strMime, 'image/octet-stream'), name: 'isometry.png' });
    });
  }

  saveImg({ name, data }) {
    const link = document.createElement('a');

    document.body.appendChild(link);
    link.download = name;
    link.href = data;
    link.click();
    document.body.removeChild(link);
  }
}

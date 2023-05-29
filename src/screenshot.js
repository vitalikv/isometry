import { modelsContainerInit, mapControlInit, renderer } from './index';

export class IsometricScreenshot {
  mapControlInit;

  constructor() {
    this.mapControlInit = mapControlInit;

    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyH') this.screenshot();
  };

  screenshot() {
    //const domElement = this.mapControlInit.control.domElement;
    const domElement = renderer.domElement;

    const img = new Image();
    img.src = domElement.toDataURL('image/png');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = domElement.clientWidth;
      canvas.height = domElement.clientHeight;

      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const sourceX = 0;
      const sourceY = 0;
      const sourceWidth = img.width - sourceX * 2;
      const sourceHeight = img.height;

      const width = canvas.width;
      const height = canvas.height;
      const x = canvas.width / 2 - width / 2;
      const y = canvas.height / 2 - height / 2;

      context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({ data: imgData.replace(strMime, 'image/octet-stream'), name: 'isometry.png' });
    };
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

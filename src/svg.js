import * as THREE from 'three';

class ConverterToSvg {
  container;
  line;

  arr = { line: [], circle: [] };

  constructor() {
    this.container = this.createSvgContainer();
  }

  createSvgContainer() {
    const div = document.createElement('div');
    div.style.cssText = 'position: fixed; top: 0; height:100%; width:100%; z-index: 1;';
    div.innerHTML = `<svg id="svgFrame" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><g id="isometry"></g></svg>`;

    document.body.append(div);

    return div.children[0].children[0];
  }

  // создаем svg line елемент
  createSvgLine({ x1, y1, x2, y2, params = {} }) {
    const line = {};
    const container = this.container;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);

    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', '2px');
    //svg.setAttribute('stroke', 'rgb(255, 162, 23)');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    //svg.setAttribute('display', 'none');

    if (params.dasharray) {
      svg.setAttribute('stroke-dasharray', '20 10');
    }

    if (params.color) {
      svg.setAttribute('stroke', cdm.color);
    }

    if (params.display) {
      svg.setAttribute('display', cdm.display);
    }

    // line.userData = {};
    // line.userData.svg = {};
    // line.userData.svg.line = {};
    // line.userData.svg.line.p = [new THREE.Vector3(), new THREE.Vector3()];
    line.svg = svg;
    line.points = [new THREE.Vector3(), new THREE.Vector3()];

    container.appendChild(svg);

    this.arr.line.push(line);

    return line;
  }

  // создаем svg circle елемент
  createSvgCircle() {
    const circle = {};
    const container = this.container;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', 0);
    svg.setAttribute('cy', 0);

    svg.setAttribute('r', 4.2);
    svg.setAttribute('stroke-width', '2px');
    //svg.setAttribute('stroke', 'rgb(255, 162, 23)');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');

    svg.setAttribute('fill', '#fff');

    //svg.setAttributeNS(null, 'style', 'fill: none; stroke: blue; stroke-width: 1px;' );
    //svg.setAttribute('display', 'none');

    circle.svg = svg;
    circle.point = new THREE.Vector3();

    container.appendChild(svg);

    this.arr.circle.push(circle);

    return circle;
  }

  updateSvg(camera, canvas) {
    for (let i = 0; i < this.arr.line.length; i++) {
      this.updateSvgLine(camera, canvas, this.arr.line[i]);
    }
    for (let i = 0; i < this.arr.circle.length; i++) {
      this.updateSvgCircle(camera, canvas, this.arr.circle[i]);
    }
  }

  // обновляем положение svg на экране (конвертируем из 3D в screen)
  updateSvgLine(camera, canvas, line) {
    const el = line.svg;
    const points = line.points;
    //camera.updateProjectionMatrix();

    const pos1 = this.getPosition2D({ camera, canvas, pos: points[0] });
    el.setAttribute('x1', pos1.x);
    el.setAttribute('y1', pos1.y);

    const pos2 = this.getPosition2D({ camera, canvas, pos: points[1] });
    el.setAttribute('x2', pos2.x);
    el.setAttribute('y2', pos2.y);
  }

  // обновляем положение svg на экране (конвертируем из 3D в screen)
  updateSvgCircle(camera, canvas, circle) {
    const el = circle.svg;
    const point = circle.point;

    const pos = this.getPosition2D({ camera, canvas, pos: point });

    el.setAttribute('cx', pos.x);
    el.setAttribute('cy', pos.y);
  }

  getPosition2D({ camera, canvas, pos }) {
    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return { x, y };
  }

  deleteSvg() {
    for (let i = 0; i < this.arr.line.length; i++) {
      const obj = this.arr.line[i];
      obj.svg.remove();
    }
    for (let i = 0; i < this.arr.circle.length; i++) {
      const obj = this.arr.circle[i];
      obj.svg.remove();
    }

    this.arr.line = [];
    this.arr.circle = [];
  }

  createSvgScheme({ lines }) {
    //console.log(this.lines);
    this.deleteSvg();
    for (let i = 0; i < lines.length; i++) {
      const points = lines[i];
      for (let i2 = 0; i2 < points.length - 1; i2++) {
        const line = this.createSvgLine({ x1: 0, y1: 0, x2: 0, y2: 0 });
        line.points = [points[i2], points[i2 + 1]];
        //this.updateSvgLine(controls.object, controls.domElement, line);
      }
      if (points.length > 0) {
        let circle = this.createSvgCircle();
        circle.point = points[0];
        //this.updateSvgCircle(controls.object, controls.domElement, circle);
        circle = this.createSvgCircle();
        circle.point = points[points.length - 1];
        //this.updateSvgCircle(controls.object, controls.domElement, circle);
      }
    }
    //this.updateSvg(controls.object, controls.domElement);
  }
}

export const svgConverter = new ConverterToSvg();

// создаем svg line елемент
export function createSvgLine(cdm) {
  if (!cdm) {
    cdm = {};
  }

  var arr = [];

  const container = document.body;

  // let div1 = document.createElement('div');
  // div1.style.cssText = 'position: fixed; height:100%; width:100%; background: #ccc; z-index: 1;';
  // container.append(div1);

  let div = document.createElement('div');
  div.innerHTML = `<svg id="svgFrame" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" style="position: fixed; top: 0;  z-index: 1"></svg>`;
  let svg = div.children[0];
  container.append(svg);

  //var svg = document.querySelector('#svgFrame');

  var x1 = cdm.x1 ? cdm.x1 : 100;
  var y1 = cdm.y1 ? cdm.y1 : 300;
  var x2 = cdm.x2 ? cdm.x2 : 600;
  var y2 = cdm.y2 ? cdm.y2 : 300;

  for (var i = 0; i < cdm.count; i++) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);

    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke-width', '2px');
    line.setAttribute('stroke', 'rgb(255, 162, 23)');
    //line.setAttribute('display', 'none');

    if (cdm.dasharray) {
      line.setAttribute('stroke-dasharray', '20 10');
    }

    if (cdm.color) {
      line.setAttribute('stroke', cdm.color);
    }

    if (cdm.display) {
      line.setAttribute('display', cdm.display);
    }

    // line.userData = {};
    // line.userData.svg = {};
    // line.userData.svg.line = {};
    // line.userData.svg.line.p = [new THREE.Vector3(), new THREE.Vector3()];

    svg.appendChild(line);

    //infProject.svg.arr[infProject.svg.arr.length] = line;
    arr[arr.length] = line;
  }

  return arr;
}

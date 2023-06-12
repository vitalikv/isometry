export class PanelRp {
  container$;
  btns$ = [];

  gisdPage;
  isometricScreenshot;
  isometricMode;
  isometricLabelList;
  readWrite;

  constructor({ gisdPage, isometricScreenshot, isometricMode, isometricLabelList, readWrite, joint, addObj }) {
    this.gisdPage = gisdPage;
    this.joint = joint;
    this.isometricScreenshot = isometricScreenshot;
    this.isometricMode = isometricMode;
    this.isometricLabelList = isometricLabelList;
    this.readWrite = readWrite;
    this.addObj = addObj;

    this.init();
  }

  init() {
    this.crPanel();
    this.btns$[0] = this.crBtn({ txt: 'изометрия' });
    this.btns$[1] = this.crBtn({ txt: 'изображение' });
    this.btns$[2] = this.crBtn({ txt: 'размер' });
    this.btns$[3] = this.crBtn({ txt: 'сноска' });
    this.btns$[4] = this.crBtn({ txt: 'инф. блок' });
    this.btns$[5] = this.crBtn({ txt: 'стык' });
    this.btns$[6] = this.crBtn({ txt: 'сохранить' });

    this.btns$[7] = this.crBtn({ txt: 'труба' });
    this.btns$[8] = this.crBtn({ txt: 'кран' });
    this.btns$[9] = this.crBtn({ txt: 'тройник' });
    this.btns$[10] = this.crBtn({ txt: 'обвод' });

    this.initEvent();
  }

  initEvent() {
    this.container$.onmousedown = (e) => {
      e.stopPropagation();
    };

    this.btns$[0].onmousedown = () => {
      this.gisdPage.getIsometry();
      this.isometricMode.changeMode('move');
    };

    this.btns$[1].onmousedown = () => {
      this.isometricScreenshot.screenshot();
    };

    this.btns$[2].onmousedown = () => {
      this.changeBackground(this.btns$[2]);
      this.isometricMode.changeMode('ruler');
    };

    this.btns$[3].onmousedown = () => {
      this.isometricMode.changeMode('label');
    };

    this.btns$[4].onmousedown = () => {
      this.isometricLabelList.init();
    };

    this.btns$[5].onmousedown = () => {
      this.isometricMode.changeMode('addJoint');
      this.joint.activate();
    };

    this.btns$[6].onmousedown = () => {
      this.readWrite.write();
    };

    this.btns$[7].onmousedown = () => {
      this.addObj.enable('tube');
    };

    this.btns$[8].onmousedown = () => {
      this.addObj.enable('valve');
    };

    this.btns$[9].onmousedown = () => {
      this.addObj.enable('tee');
    };

    this.btns$[10].onmousedown = () => {
      this.addObj.enable('corner');
    };
  }

  crPanel() {
    const css = `position: absolute; top: 0; right: 0; width: 248px; height: 700px; background: #F0F0F0; border: 1px solid #D1D1D1; border-radius: 4px; font-family: arial,sans-serif; z-index: 1;`;

    const html = `
    <div style="${css}">
      <div nameId="btns" style="margin: 15px;"></div>
    </div>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    this.container$ = div.children[0];
    document.body.append(this.container$);
  }

  crBtn({ txt }) {
    const css = `width: 100%; height: 30px; margin-top: 15px; font-size: 16px; text-align: center; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;`;

    const html = `
    <div style="${css}">
      ${txt}
    </div>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    div = div.children[0];

    this.container$.querySelector('[nameId="btns"]').append(div);

    return div;
  }

  changeBackground(elem$) {
    console.log(elem$.style.background);
    elem$.style.background = elem$.style.background === 'rgb(204, 204, 204)' ? 'rgb(255, 255, 255)' : 'rgb(204, 204, 204)';
  }
}

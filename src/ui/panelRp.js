export class PanelRp {
  container$;
  btns$ = [];

  gisdPage;
  isometricScreenshot;
  isometricMode;
  isometricLabelList;

  constructor({ gisdPage, isometricScreenshot, isometricMode, isometricLabelList }) {
    this.gisdPage = gisdPage;
    this.isometricScreenshot = isometricScreenshot;
    this.isometricMode = isometricMode;
    this.isometricLabelList = isometricLabelList;
    this.init();
  }

  init() {
    this.crPanel();
    this.btns$[0] = this.crBtn({ txt: 'изометрия' });
    this.btns$[1] = this.crBtn({ txt: 'изображение' });
    this.btns$[2] = this.crBtn({ txt: 'размер' });
    this.btns$[3] = this.crBtn({ txt: 'сноска' });
    this.btns$[4] = this.crBtn({ txt: 'инф. блок' });

    this.initEvent();
  }

  initEvent() {
    this.btns$[0].onmousedown = () => {
      this.gisdPage.getIsometry();
      this.isometricMode.changeMode('move');
    };

    this.btns$[1].onmousedown = () => {
      this.isometricScreenshot.screenshot();
    };

    this.btns$[2].onmousedown = () => {
      this.isometricMode.changeMode('ruler');
    };

    this.btns$[3].onmousedown = () => {
      this.isometricMode.changeMode('label');
    };

    this.btns$[4].onmousedown = () => {
      this.isometricLabelList.init();
    };
  }

  crPanel() {
    const css = `position: absolute; top: 0; right: 0; width: 248px; height: 300px; background: #F0F0F0; border: 1px solid #D1D1D1; border-radius: 4px; font-family: arial,sans-serif; z-index: 1;`;

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
}

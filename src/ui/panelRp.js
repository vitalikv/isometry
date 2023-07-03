export class PanelRp {
  container$;
  btns$ = [];

  isometricSchemeService;
  isometricScreenshot;
  isometricMode;
  isometricLabelList;
  saveLoad;
  isometricLineStyle;

  constructor({
    isometricSchemeService,
    isometricScreenshot,
    isometricMode,
    isometricLabelList,
    saveLoad,
    joint,
    addObj,
    isometricLineStyle,
    isometricSheetsService,
  }) {
    this.isometricSchemeService = isometricSchemeService;
    this.joint = joint;
    this.isometricScreenshot = isometricScreenshot;
    this.isometricMode = isometricMode;
    this.isometricLabelList = isometricLabelList;
    this.saveLoad = saveLoad;
    this.addObj = addObj;
    this.isometricLineStyle = isometricLineStyle;
    this.isometricSheetsService = isometricSheetsService;

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

    this.btns$[11] = this.crBtn({ txt: 'сплошная тонкая' });
    this.btns$[12] = this.crBtn({ txt: 'сплошная толстая' });
    this.btns$[13] = this.crBtn({ txt: 'штриховая' });

    this.btns$[14] = this.crBtn({ txt: 'загрузка' });

    this.btns$[15] = this.crBtn({ txt: 'лист А4' });
    this.btns$[16] = this.crBtn({ txt: 'лист А3' });

    this.initEvent();
  }

  initEvent() {
    this.container$.onmousedown = (e) => {
      //e.preventDefault();
      e.stopPropagation();
    };

    this.btns$[0].onmousedown = () => {
      this.isometricSchemeService.getIsometry();
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
      this.saveLoad.save();
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

    this.btns$[11].onmousedown = () => {
      this.isometricLineStyle.setTypeLine('basic');
    };

    this.btns$[12].onmousedown = () => {
      this.isometricLineStyle.setTypeLine('thick');
    };

    this.btns$[13].onmousedown = () => {
      this.isometricLineStyle.setTypeLine('dashed');
    };

    this.btns$[14].onmousedown = () => {
      this.saveLoad.load();
    };

    this.btns$[15].onmousedown = () => {
      this.isometricSheetsService.showHideSheet('A4_2');
    };

    this.btns$[16].onmousedown = () => {
      this.isometricSheetsService.showHideSheet('A3_4');
    };
  }

  crPanel() {
    const css = `position: absolute; top: 0; right: 0; width: 248px; height: 900px; background: #F0F0F0; border: 1px solid #D1D1D1; border-radius: 4px; font-family: arial,sans-serif; z-index: 4;`;

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

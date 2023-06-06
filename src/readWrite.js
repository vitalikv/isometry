import { gisdPage } from './index';

export class ReadWrite {
  write() {
    const isometry = gisdPage.jsonIsometry;
    const str = JSON.stringify(isometry);
    console.log(str);

    const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(str);

    let link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = data;
    link.download = 'isometry.json';
    link.click();
    document.body.removeChild(link);
  }
}

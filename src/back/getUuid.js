import { BufferGeometry } from 'three';

export class AttributesUtil {
  getGuidByBufferGeometry(geo) {
    return this.getGuidRecursive(geo.userData);
  }

  getGuidRecursive(object) {
    let guids = [];

    for (const property in object) {
      if (property === 'GlobalId') {
        guids.push(object[property]['value']);
      }
      if (typeof object[property] === 'object' && object[property] !== null) {
        guids.push(...this.getGuidRecursive(object[property]));
      }
    }

    return [...new Set(guids)];
  }

  getSetGuidByBufferGeometry(geo) {
    return this.getSetGuidRecursive(geo.userData);
  }

  getSetGuidRecursive(object) {
    let guids = new Set();

    for (const property in object) {
      if (property === 'GlobalId') guids.add(object[property]['value']);

      if (typeof object[property] === 'object' && object[property] !== null) {
        this.getSetGuidRecursive(object[property]).forEach((guid) => guids.add(guid));
      }
    }

    return guids;
  }
}

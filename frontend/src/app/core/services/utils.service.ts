import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  // random generate 6 random chars
  generateId(len: number = 6) {
    let start = 3;
    return Math.random().toString(36).substring(start, len + start);
  }

  modifyWidgets(dashboard: any) {
    // add extra info item behaviors
    console.log('passing dashbaord', dashboard);

    for (let i = 0; i < dashboard.widgets.length; i++) {
      const wd: any = dashboard.widgets[i];
      //wd.id = this.utils.generateId(); // we set it manually to test
      const mod = { 'xMd': wd.gridPos.x, 'yMd': wd.gridPos.y, 'dragAndDrop': true, 'resizable': true };
      wd.gridPos = { ...wd.gridPos, ...mod };
    }
    console.log('modified dashbaord', dashboard);
    //return dashboard;
  }

  // searches an array of objects for a specify key value and
  // returns the matched object
  getObjectByKey(objs, key, value ) {
    for (let i = 0; i < objs.length; i++ ) {
        if ( objs[i][key] === value ) {
            return objs[i];
        }
    }
  }

  // ex: Revenue for {{tag.colo}} and {{tag.hostgroup}} -> Revenue for BF1 and WestCoastCluster
  tagMacro(metric: any, inputString: string): string {
    const regExp = /{{([^}}]+)}}/g; // get chars between {{}}
    const matches = inputString.match(regExp);
    if (matches) {
      let tagValues = new Array<string>();
      let captureGroupToValueMap = {};
      for (let i = 0; i < matches.length; i++) {
        const captureGroup = matches[i];
        const captureGroupSplit = captureGroup.split('.');
        if (captureGroupSplit.length === 1) {
          return inputString;
        }
        const keyword = captureGroupSplit[0].substring(2).toLowerCase().trim();
        const tagKey = captureGroupSplit[1].substring(0, captureGroupSplit[1].length - 2).toLowerCase().trim();
        captureGroupToValueMap[captureGroup] = captureGroup;

        // get tag values
        if (keyword === 'tag' && tagKey) {
          for (const [key, value] of Object.entries(metric['tags'])) {
            if (key.toLowerCase() === tagKey) {
              captureGroupToValueMap[captureGroup] = value;
            }
          }
        }

        // set tag values in string
        for (const [_captureGroup, tagValue] of Object.entries(captureGroupToValueMap)) {
          inputString = inputString.replace(_captureGroup, tagValue.toString());
        }
      }
    }
    return inputString;
  }


  getArrayAggregate( aggregate, arr ) {
    switch ( aggregate.toLowerCase() ) {
        case 'sum':
            return arr.reduce((a, b) => !isNaN(b) ? a + b : a, 0);
        case 'avg':
            return arr.reduce((a, b) => !isNaN(b) ? a + b : a, 0) / arr.length;
        case 'min':
            return arr.reduce((a, b) => !isNaN(b) && a > b ?  b : a, Infinity);
        case 'max':
            return arr.reduce((a, b) => !isNaN(b) && a < b ?  b : a, -Infinity);
        default:
            return null;
    }
  }

}

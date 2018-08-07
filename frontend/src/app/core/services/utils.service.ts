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

}

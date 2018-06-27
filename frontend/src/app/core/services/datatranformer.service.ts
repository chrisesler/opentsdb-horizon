import { Injectable } from '@angular/core';
import { IDygraphOptions } from '../../shared/modules/dygraphs/IDygraphOptions';

@Injectable({
  providedIn: 'root'
})
export class DatatranformerService {

  constructor() { }

  // options will also be update of its labels array
  yamasToDygraph(options: IDygraphOptions, result: any): any {
    let normalizedData = [];
    let dpsHash = {};
    // generate a hash for all the keys, might have missing time
    // from multiple metric
    for (let k in result) {
      let g = result[k];
      // build lable
      let label = Object.values(g.tags).join('-');
      // only pushing in if not exits, since we use same reference for view/edit
      if (!options.labels.includes(label)) {
        options.labels.push(label);     
      }
      for (let date in g.dps) {
        dpsHash[date] = true
      }
    }
    // console.log('dpsHash', dpsHash);
    let dpsHashKey = Object.keys(dpsHash);
    dpsHash = undefined;
    // sort time in case  new insert somewhere
    dpsHashKey.sort((a: any, b: any) => {
      return a - b;
    });

    for (let idx = 0, len = dpsHashKey.length; idx < len; idx++) {
      let dpsMs: any = dpsHashKey[idx];
      normalizedData[idx] = [new Date(dpsMs * 1000)];
      for (let k in result) {
        let g = result[k];
        (g.dps[dpsMs] !== undefined) ? normalizedData[idx].push(g.dps[dpsMs]) : normalizedData[idx].push(null);
      }
    }
    console.log('normalizedData', options.labels, normalizedData);
    // return normalizedData;
    return Object.assign(normalizedData);
  }
}

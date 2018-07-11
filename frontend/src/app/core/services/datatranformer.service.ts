import { Injectable } from '@angular/core';
import { IDygraphOptions } from '../../shared/modules/dygraphs/IDygraphOptions';
import { isArray } from 'util';

@Injectable({
  providedIn: 'root'
})
export class DatatranformerService {

  constructor() { }
// options will also be update of its labels array
yamasToDygraph(options: IDygraphOptions, normalizedData: any[], result: any): any {  
  if (normalizedData[0].length === 1) {
    // there is no data in here but default, reset it
    normalizedData = [];
  } else {
    // it has data, we need to append new data to exisiting one
    // it only happens in case of multiple groups on same graph

  }
  let dpsHash = {};
  // generate a hash for all the keys, might have missing time
  // from multiple metric
  for (let k in result) {
    let g = result[k];
    // build lable, it's to send exactly duplicate metric
    let label = g.metric + ':' + Object.values(g.tags).join('-');
    // only pushing in if not exits, since we use same reference for view/edit
    if (!options.labels.includes(label)) {
      options.labels.push(label);     
    }
    // extract date of all series to fill it up, 
    for (let date in g.dps) {
      dpsHash[date] = true
    }
  }
  let dpsHashKey = Object.keys(dpsHash);
  dpsHash = undefined;
  // sort time in case  new insert somewhere
  dpsHashKey.sort((a: any, b: any) => {
    return a - b;
  });  
  for (let idx = 0, len = dpsHashKey.length; idx < len; idx++) {
    let dpsMs: any = dpsHashKey[idx];
    // if there is more than 1 group of query in widget, we append data from second group.
    // since they have same time range and downsample
    if (!isArray(normalizedData[idx])) {
      // convert to milisecond
      normalizedData[idx] = [dpsMs * 1000];
    }
    for (let k in result) {
      let g = result[k];
      (g.dps[dpsMs] !== undefined) ? normalizedData[idx].push(g.dps[dpsMs]) : normalizedData[idx].push(null);
    }
  }

  //return Object.assign(normalizedData);
  return JSON.parse(JSON.stringify(normalizedData));
}  
  // build opentsdb query base on this of full quanlify metrics for exploer | adhoc
  // defaulf time will be one hour from now
  buildAdhocYamasQuery(metrics: any[]) {
    let query = {
      start: '1h-ago',
      queries: []
    };
    for (let i = 0; i < metrics.length; i++) {
      let m = metrics[i];
      let q = {
        aggregator: 'zimsum',
        explicitTags: false,
        downsample: '1m-avg-nan',
        metric: m.metric,
        rate: false,
        rateOptions: {
          counter: false,
          resetValue: 1
        },
        filters: []
      };
      
      for (let k in m) {
        if (k !== 'metric') {
          let filter = {
            type: 'literal_or',
            tagk: k,
            filter: m[k],
            groupBy: true
          };
          q.filters.push(filter);
        }
      }
      query.queries.push(q);
    }

    return query;
  }
}

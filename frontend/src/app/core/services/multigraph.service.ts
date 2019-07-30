import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MultigraphService {

  constructor() { }


  // to get all groupby tags of a wigdet
  getGroupByTags(queries: any[]): string[] {
    let ret = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      for (let j = 0; j < query.metrics.length; j++) {
        const metric = query.metrics[j];
        if (metric.groupByTags && metric.groupByTags.length) {
          ret = ret.concat(metric.groupByTags.filter((item) => {
            return ret.indexOf(item) < 0;
          }));
        }
      }
    }
    return ret;
  }
}

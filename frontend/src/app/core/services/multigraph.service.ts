import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MultigraphService {

  constructor() { }

  // fill up tag values from rawdata
  fillMultiTagValues(multiConf: any, rawdata: any): any {
    // console.log('hill - rawdata', rawdata);
    const xTemp = multiConf.x ? '{{' + Object.keys(multiConf.x).join('}}/{{') + '}}' : 'x';
    const yTemp = multiConf.y ? '{{' + Object.keys(multiConf.y).join('}}/{{') + '}}' : 'y';
    let xCombine = [];
    let yCombine = [];
    const lookupData = {};
    const results = {};
    // const xValues = [];
    // const yValues = [];
    for (let i = 0; i < rawdata.results.length; i++) {
      const dataSrc = rawdata.results[i];
      if (dataSrc.source && dataSrc.source.indexOf('summarizer:') === -1) {
        for (let j = 0; j < dataSrc.data.length; j++) {
          const tags = { metric_group: dataSrc.data[j].metric, ...dataSrc.data[j].tags};
          let x = xTemp;
          let y = yTemp;
          const tagKeys = Object.keys(tags);
          for ( let k = 0; k < tagKeys.length; k++ ) {
            const key = tagKeys[k];
            if ( multiConf.x && x.indexOf(key) !== -1 ) {
              x = x.replace('{{' + key + '}}', tags[key]);
              if (multiConf.x[key] && !multiConf.x[key].includes(tags[key])) {
                multiConf.x[key].push(tags[key]);
              }
            }
            if ( multiConf.y && y.indexOf(key) !== -1 ) {
              y = y.replace('{{' + key + '}}', tags[key]);
              if (!multiConf.y[key].includes(tags[key])) {
                multiConf.y[key].push(tags[key]);
              }
            }
          }
          // console.log("series" + j , "x="+x, "y="+y );
          if ( !lookupData[y] ) {
            /* if ( !yValues.includes(y)) {
              yValues.push(y);
            } */
            lookupData[y] = {};
          }
          if ( !lookupData[y][x] ) {
            /* if ( !xValues.includes( x)) {
              xValues.push(x);
            } */
            lookupData[y][x] = {
              results: [{
                source: dataSrc.source,
                timeSpecification: dataSrc.timeSpecification,
                data: []
              }]
            };
          }
          lookupData[y][x].results[0].data.push(dataSrc.data[j]);
        }
      }
    }
    // let build the master results table
    const xAll = multiConf.x ? [] : [['x']];
    const yAll = multiConf.y ? [] : [['y']];
    for (const tag in multiConf.x) {
      if (multiConf.x.hasOwnProperty(tag)) {
        xAll.push(multiConf.x[tag]);
      }
    }
    for (const tag in multiConf.y) {
      if (multiConf.y.hasOwnProperty(tag)) {
        yAll.push(multiConf.y[tag]);
      }
    }
    for (let i = 0; i < xAll.length; i++) {
      xCombine = this.combineKeys(xCombine, xAll[i]);
    }
    for (let i = 0; i < yAll.length; i++) {
      yCombine = this.combineKeys(yCombine, yAll[i]);
    }
    for (let i = 0; i < yCombine.length; i++) {
        for (let j = 0; j < xCombine.length; j++) {
            if ((multiConf.layout === 'grid' || lookupData[yCombine[i]]) && !results[yCombine[i]]) { 
                results[yCombine[i]] = {};
            }
            if (!results[yCombine[i]][xCombine[j]] && multiConf.layout === 'grid') {
                results[yCombine[i]][xCombine[j]] = {};
            }
            if (lookupData[yCombine[i]] && lookupData[yCombine[i]][xCombine[j]]) {
                results[yCombine[i]][xCombine[j]] = lookupData[yCombine[i]][xCombine[j]];
            }
        }
    }
    if ( !Object.keys(lookupData).length ) {
      results['y'] = {'x': rawdata };
    }
    return results;
  }

  // build multigraph config
  buildMultiConf(multigraph: any): any {
    const conf: any = {};
    if (multigraph) {
      for (let i = 0; i < multigraph.chart.length; i++) {
        const chart = multigraph.chart[i];
        if (chart.displayAs === 'x') {
          if (!conf['x']) { conf['x'] = {}; }
          conf['x'][chart.key] = [];
        } else if (chart.displayAs === 'y') {
          if (!conf['y']) { conf['y'] = {}; }
          conf['y'][chart.key] = [];
        } else {
          if (!conf['g']) { conf['g'] = {}; }
          conf['g'][chart.key] = [];
        }
      }
      conf.layout = multigraph.layout;
    }
    return conf;
  }

  // combine keys
  combineKeys(a: string[], b: string[]): string[] {
    const ret = [];
    if ( !a.length ) { return b; }
    if ( !b.length ) { return a; }
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        ret.push(a[i] + '/' + b[j]);
      }
    }
    return ret;
  }

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

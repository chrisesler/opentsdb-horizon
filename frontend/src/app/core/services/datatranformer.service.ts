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
    }

    let dpsHash = {};
    // generate a hash for all the keys, might have missing time
    // from multiple metric
    for (let gid in result) {
      for (let k in result[gid]) {
        let g = result[gid][k];
        // build lable, it's to send exactly duplicate metric
        let label = g.metric + ':' + Object.values(g.tags).join('-');
        // only pushing in if not exits, since we use same reference for view/edit
        if (!options.labels.includes(label)) {
          options.labels.push(label);     
        }
        // extract date of all series to fill it up, 
        for (let date in g.dps) {
          dpsHash[date] = true;
        }
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
        normalizedData[idx] = [new Date(dpsMs * 1000)];
      }
      for (let gid in result) {
        for (let k in result[gid]) {
          let g = result[gid][k];
          (g.dps[dpsMs] !== undefined) ? normalizedData[idx].push(g.dps[dpsMs]) : normalizedData[idx].push(null);
        }
      }
    }
    return [...normalizedData];
  }

    yamasToChartJS( chartType, options, vConfig, data, groupData, stacked ) {
        switch ( chartType ) {
            case 'bar':
                return this.getChartJSFormattedDataBar(options, vConfig, data, groupData, stacked);
            case 'donut':
                return this.getChartJSFormattedDataDonut(options, vConfig, data, groupData, stacked);
        }
    }

    /**
     * converts data to chartjs bar or stacked bar chart format
     *
     * Stacked bar chart - datasets format
     *   [ dataset-1, dataset-2, .. ] where
     *   dataset-x format is:
     *       {
     *           data: [ {x:"x1", y: 20} , {x:"x2", y: 30}, .. ],
     *           backgroundColor: '#ccc'
     *       }
     *   We wanted to stack based on stack labels.
     *   So, we are going to generate series for each stack labels.
     */

    getChartJSFormattedDataBar( options, vConfig, datasets, groupData, stacked ) {
      // stack colors
        const colors = [];

        options.scales.xAxes[0].stacked = stacked;
        options.scales.yAxes[0].stacked = stacked;

        // generate labels
        for ( let i = 0; i < vConfig.length; i++ ) {
            const label = vConfig[i].stackLabel;
            const color = vConfig[i].color;
            if ( (stacked && !options.stackSeries[label]) ) {
                options.stackSeries[label] =  { label: label, color: color, datasetIndex: Object.keys(options.stackSeries).length };
                datasets.push( { data: [], backgroundColor: color, label: 'group' } );
            } else if ( !stacked && !options.labels.includes(label) ) {
                options.labels.push( label );
                colors.push(color);
            }
        }

        // we want to display bar chart if there is only one group
        if ( !stacked && !datasets.length ) {
            datasets.push ( { data: [], backgroundColor: colors } );
        } else if ( stacked ) {
            options.labels.concat(Object.keys(groupData));
        }

        // set dataset values
        for (let gid in groupData ) {
          for ( let i = 0; i < groupData[gid].length; i++ ) {
              const mData: any = groupData[gid][i].dps;
              let sum = 0;
              const n = Object.keys(mData).length;
              for ( let k in mData ) {
                  if (!isNaN(mData[k])) {
                      sum += mData[k];
                  }
              }
              const label = stacked ? gid : vConfig[i].stackLabel;
              const dsIndex = stacked ? options.stackSeries[vConfig[i].stackLabel].datasetIndex : 0;
              console.log()
              datasets[dsIndex].data.push( { x: label, y: sum }  );
          }
        }
        return [...datasets];
    }

    getChartJSFormattedDataDonut(options, vConfig, datasets, groupData, stacked) {
        const gid = Object.keys(groupData)[0];
        const rawdata = groupData[gid];
        // stack colors
        const colors = [];
        options.labels = [];

        // generate labels
        for ( let i = 0; i < vConfig.length; i++ ) {
            const label = vConfig[i].stackLabel;
            if (!options.labels.includes(label)) {
                options.labels.push(label);
            }
        }

        datasets = [ {data: [], backgroundColor: []} ];
        // set dataset values
        for ( let i = 0; i < rawdata.length; i++ ) {
            const mData: any = rawdata[i].dps;
            let sum = 0;
            const n = Object.keys(mData).length;
            for ( let k in mData ) {
                if (!isNaN(mData[k])) {
                    sum += mData[k];
                }
            }
            datasets[0].data.push( sum );
            datasets[0].backgroundColor.push(vConfig[i].color);
        }
        return [...datasets];
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

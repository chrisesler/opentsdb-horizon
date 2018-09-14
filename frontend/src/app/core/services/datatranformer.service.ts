import { Injectable } from '@angular/core';
import { IDygraphOptions } from '../../shared/modules/dygraphs/IDygraphOptions';
import { isArray } from 'util';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class DatatranformerService {

  constructor(private util: UtilsService ) {  }

  // options will also be update of its labels array
  yamasToDygraph(widget, options: IDygraphOptions, normalizedData: any[], result: any): any {

    if (normalizedData[0].length === 1) {
      // there is no data in here but default, reset it
      normalizedData = [];
    }

    let dpsHash = {};
    // generate a hash for all the keys, might have missing time
    // from multiple metric
    for (let gid in result) {
        const gConfig = widget? this.util.getObjectByKey(widget.query.groups, 'id', gid) : {};
        const mConfigs = gConfig ? gConfig.queries : [];
      for (let k in result[gid]) {
        let g = result[gid][k];
        // build lable, it's to send exactly duplicate metric
        let label = g.metric ;//+ ':' + Object.values(g.tags).join('-');
        const mConfig = gConfig? this.getMetricConfigurationByName(label, mConfigs) : {};
        const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
        // only pushing in if not exits, since we use same reference for view/edit
        if (!options.labels.includes(label)) {
          options.labels.push(label);     
        }

        if ( options.series ) {
            options.series[label] = {
                strokeWidth: vConfig.lineWeight? parseFloat(vConfig.lineWeight): 1,
                //strokePattern: this.getStrokePattern(vConfig.lineType),
                color: vConfig.color? vConfig.color : '#000000',
                axis: !vConfig.axis || vConfig.axis === 'y' ? 'y' : 'y2'
            };
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

    yamasToChartJS( chartType, options, config, data, groupData, stacked = false ) {
        switch ( chartType ) {
            case 'bar':
                return this.getChartJSFormattedDataBar(options, config, data, groupData, stacked);
            case 'horizontalBar':
                return this.getChartJSFormattedDataBar(options, config, data, groupData, stacked);
            case 'donut':
                return this.getChartJSFormattedDataDonut(options, config, data, groupData);
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

    getChartJSFormattedDataBar( options, config, datasets, groupData, stacked ) {
      // stack colors
        const colors = [];
        const metrics = [];

        const nGroups = config.groups.length;
        const wSettings = config.settings;

        options.scales.xAxes[0].stacked = stacked;
        options.scales.yAxes[0].stacked = stacked;

        if ( stacked && wSettings.visual ) {
            const stacks = wSettings.visual.stacks;
            for ( let i = 0; i < stacks.length; i++ ) {
                /*
                options.stackSeries[stacks[i].label] =  {
                                                            label: stacks[i].label,
                                                            color: stacks[i].color,
                                                            datasetIndex: Object.keys(options.stackSeries).length
                                                        };
                */
                datasets.push( { data: Array(nGroups).fill(null), backgroundColor: stacks[i].color, label: stacks[i].label } );
            }
            for ( let i = 0; i < nGroups; i++ ) {
                const label = config.groups[i].settings.visual.label;
                if ( !options.labels.includes(label) ) {
                    options.labels.push(label);
                }
            }
        } else {
            const gid = Object.keys(groupData)[0];
            const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
            const mConfigs = gConfig.queries;
            datasets[0] = {data: [], backgroundColor: []};
            for ( let i = 0; i < mConfigs.length; i++ ) {
                const metric = this.util.getUniqueNameFromMetricConfig(mConfigs[i]);
                metrics.push(metric);
                const vConfig = mConfigs[i].settings.visual;
                let label = vConfig.stackLabel ? vConfig.stackLabel : metric;
                const color = vConfig.color;
                label = label.length <= 20 ? label : label.substr(0, 17) + '..';
                options.labels.push( label );
                datasets[0].data.push(null);
                datasets[0].backgroundColor.push(color);
                colors.push(color);
            }
        }

        // set dataset values
        for (let gid in groupData ) {
          const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
          const mConfigs = gConfig.queries;
          for ( let i = 0; i < groupData[gid].length; i++ ) {
              const metric = this.util.getUniqueNameFromMetricConfig(groupData[gid][i]);
              const mConfig = this.getMetricConfigurationByName(metric, mConfigs);
              const mData: any = Object.values(groupData[gid][i].dps);
              const index = stacked ? options.labels.indexOf(gConfig.settings.visual.label) : metrics.indexOf(metric);
              const dsIndex = stacked ? mConfig.settings.visual.stack : 0;
              datasets[dsIndex].data[index] = this.util.getArrayAggregate( mConfig.settings.visual.aggregator, mData );
          }
        }
        return [...datasets];
    }

    getMetricConfigurationByName( name, configs ) {
        const config = {};
        for (let i = 0; i < configs.length; i++ ) {
            const metric = this.util.getUniqueNameFromMetricConfig(configs[i]);
            if ( name === metric ) {
                return configs[i];
            }
        }
        return config;
    }

    getChartJSFormattedDataDonut(options, config, datasets, groupData) {
        options.labels = [];
        datasets[0] = {data: [], backgroundColor: []};
        if (!groupData) {
            return datasets;
        }
        const gid = Object.keys(groupData)[0];
        const rawdata = groupData[gid];
        const metrics = [];


        const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
        const mConfigs = gConfig.queries;

        for ( let i = 0; i < mConfigs.length; i++ ) {
            const metric = this.util.getUniqueNameFromMetricConfig(mConfigs[i]);
            metrics.push(metric);
            const vConfig = mConfigs[i].settings.visual;
            let label = vConfig.stackLabel ? vConfig.stackLabel : metric;
            const color = vConfig.color;
            label = label.length <= 20 ? label : label.substr(0, 17) + '..';
            options.labels.push( label );
            datasets[0].data.push(null);
            datasets[0].backgroundColor.push(color);
        }
        options.legend = config.settings.legend;
        options.plugins.labels = config.settings.legend.showPercentages ? {
                render: 'percentage',
                precision: 2
            } : false;

        for ( let i = 0; i < rawdata.length; i++ ) {
            const metric = this.util.getUniqueNameFromMetricConfig(rawdata[i]);
            const mConfig = this.getMetricConfigurationByName(metric, mConfigs);
            const mData: any = Object.values(rawdata[i].dps);
            const index = metrics.indexOf(metric);
            datasets[0].data[index] =  this.util.getArrayAggregate( mConfig.settings.visual.aggregator, mData ) ;
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

  buildMetricObject(m) {
    const q = {
        aggregator: 'zimsum',
        explicitTags: false,
        downsample: '1m-avg-nan',
        metric: m.metric,
        rate: false,
        rateOptions: {
          counter: false,
          resetValue: 1
        },
        filters: [],
        settings: {
            visual: {
                visible: true
            }
        }
      };

      for (const k in m) {
        if (k !== 'metric') {
          const filter = {
            type: 'literal_or',
            tagk: k,
            filter: m[k],
            groupBy: true
          };
          q.filters.push(filter);
        }
      }
    return q;
  }
}

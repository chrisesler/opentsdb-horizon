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
    const mSeconds = { 's': 1, 'm': 60, 'h': 3600, 'd': 864000 };
    for (let gid in result) {
        const gConfig = widget? this.util.getObjectByKey(widget.query.groups, 'id', gid) : {};
        const mConfigs = gConfig ? gConfig.queries : [];
        if (gConfig && gConfig.settings.visual.visible && result[gid] && result[gid].results) {
            // sometimes opentsdb returns empty results
            for ( let i = 0;  i < result[gid].results.length; i++ ) {
                const queryResults = result[gid].results[i];
                const source = queryResults.source.split(":")[1].replace("m",'');
                const timeSpecification = queryResults.timeSpecification;
                const mConfig = mConfigs[source];
                const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
                for ( let j = 0; j < queryResults.data.length; j ++ ) {
                    const data = queryResults.data[j].NumericType;
                    const tags = queryResults.data[j].tags;
                    const metric = vConfig.label || queryResults.data[j].metric;
                    const numPoints = data.length;

                    let label = options.labels.length.toString();
                    if ( vConfig.visible ) {
                        options.labels.push(label);
                        options.visibility.push(true);
                        if ( options.series ) {
                            options.series[label] = {
                                strokeWidth: vConfig.lineWeight? parseFloat(vConfig.lineWeight): 1,
                                strokePattern: this.getStrokePattern(vConfig.lineType),
                                color: vConfig.color? vConfig.color : '#000000',
                                axis: !vConfig.axis || vConfig.axis === 'y1' ? 'y' : 'y2',
                                metric: metric,
                                tags: tags
                            };
                        }
                        const seriesIndex = options.labels.indexOf(label);
                        const unit = timeSpecification.interval.replace(/[0-9]/g, '');
                        for (let k = 0; k< numPoints ; k++ ) {
                            if (!isArray(normalizedData[k])) {
                                const time = timeSpecification.start + ( k * mSeconds[unit] );
                                normalizedData[k] = [ new Date(time * 1000) ];
                            }
                            normalizedData[k][seriesIndex]= !isNaN(data[k]) ? data[k] : null;
                        }
                    }
                }
            }
            
            
        }

    }
    console.log("normalized data", normalizedData);
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
        const metricIndices = [];
        let stacks = [];

        // only visible groups
        const nGroups = config.groups.filter( d => d.settings.visual.visible ).length;
        const wSettings = config.settings;

        options.scales.xAxes[0].stacked = stacked;
        options.scales.yAxes[0].stacked = stacked;

        if ( stacked && wSettings.visual ) {
            stacks = wSettings.visual.stacks;
            if ( !datasets.length ) {
                for ( let i = 0; i < stacks.length; i++ ) {
                    datasets.push( { data: Array(nGroups).fill(null), backgroundColor: stacks[i].color, label: stacks[i].label } );
                }
            }

            for ( let i = 0; i < nGroups; i++ ) {
                const label = config.groups[i].title;
                if ( !options.labels.includes(label) ) {
                    options.labels.push(label);
                }
            }
        } else {
            const gid = Object.keys(groupData)[0];
            const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
            const mConfigs = gConfig.queries;
            datasets[0] = {data: [], backgroundColor: []};
            options.labels = [];
            for ( let i = 0; i < mConfigs.length; i++ ) {
                const mid = 'm' + i;
                const vConfig = mConfigs[i].settings.visual;
                if ( vConfig.visible ) {
                    metricIndices.push(mid);
                    let label = vConfig.stackLabel ? vConfig.stackLabel : mConfigs[i].metric;
                    const color = vConfig.color;
                    label = label.length <= 20 ? label : label.substr(0, 17) + '..';
                    options.labels.push( label );
                    datasets[0].data.push(null);
                    datasets[0].backgroundColor.push(color);
                    colors.push(color);
                }
            }
        }

        // set dataset values
        for (let gid in groupData ) {
          const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
          const mConfigs = gConfig ? gConfig.queries : [];
          const results = groupData[gid].results;
          for ( let i = 0; results && i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const configIndex = mid.replace('m', '');
            const aggs = results[i].data[0].NumericSummaryType.aggregations;
            const key = Object.keys(results[i].data[0].NumericSummaryType.data[0])[0];
            const aggData = results[i].data[0].NumericSummaryType.data[0][key];
            const mConfig = mConfigs[configIndex];
            if ( mConfig.settings && mConfig.settings.visual.visible ) {
                const aggrIndex = aggs.indexOf(mConfig.settings.visual.aggregator);
                const index = stacked ? options.labels.indexOf(gConfig.title) : metricIndices.indexOf(mid);
                const dsIndex = stacked ? stacks.findIndex(d => d.id === mConfig.settings.visual.stack) : 0; 
                datasets[dsIndex].data[index] = aggData[aggrIndex]; 
                console.log(mid, dsIndex, index,aggData[aggrIndex])
                console.log(mid, mConfig.settings.visual.aggregator, aggrIndex, aggData, aggData[aggrIndex] );
            }
          }
        }
        return [...datasets];
    }

    getChartJSFormattedDataDonut(options, config, datasets, groupData) {
        datasets[0] = {data: [], backgroundColor: []};
        if (!groupData) {
            return datasets;
        }
        const gid = Object.keys(groupData)[0];
        const results = groupData[gid].results;
        const metricIndices = [];


        const gConfig = this.util.getObjectByKey(config.groups, 'id', gid);
        const mConfigs = gConfig.queries;

        for ( let i = 0; i < mConfigs.length; i++ ) {
            const metric = 'm' + i;
            const vConfig = mConfigs[i].settings.visual;
            const color = vConfig.color;
            if ( vConfig.visible ) {
                metricIndices.push(metric);
                datasets[0].data.push(null);
                datasets[0].backgroundColor.push(color);
            }
        }

        for ( let i = 0; results && i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const configIndex = mid.replace('m', '');
            const aggs = results[i].data[0].NumericSummaryType.aggregations;
            const key = Object.keys(results[i].data[0].NumericSummaryType.data[0])[0];
            const aggData = results[i].data[0].NumericSummaryType.data[0][key];
            const mConfig = mConfigs[configIndex];
            if ( mConfig.settings && mConfig.settings.visual.visible ) {
                const index = metricIndices.indexOf(mid);
                const aggrIndex = aggs.indexOf(mConfig.settings.visual.aggregator);
                datasets[0].data[index] =  aggData[aggrIndex];
            }
        }
        return [...datasets];
    }

    getStrokePattern( lineType ) {
        let pattern = [];
        switch ( lineType ) {
            case 'solid':
                pattern = [];
                break;
            case 'dashed':
                pattern = [4, 4];
                break;
            case 'dotted':
                pattern = [2, 3];
                break;
            case 'dot-dashed':
                pattern = [4, 4, 2];
                break;
        }
        return pattern;
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
                visible: true,
                color: '#000000'
            }
        }
      };

      for (const k in m) {
        if (k !== 'metric') {
          const filter = {
            type: 'literalor',
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

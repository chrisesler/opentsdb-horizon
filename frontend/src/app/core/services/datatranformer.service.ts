import { Injectable } from '@angular/core';
import { IDygraphOptions } from '../../shared/modules/dygraphs/IDygraphOptions';
import barChartPlotter from '../../shared/dygraphs/plotters';
import { isArray } from 'util';
import { UtilsService } from './utils.service';
import { group } from '@angular/animations';

@Injectable({
  providedIn: 'root'
})
export class DatatranformerService {

  constructor(private util: UtilsService ) {  }

  // options will also be update of its labels array
  yamasToDygraph(widget, options: IDygraphOptions, normalizedData: any[], result: any): any {
    if ( normalizedData.length && normalizedData[0].length === 1 ) {
      // there is no data in here but default, reset it
      normalizedData = [];
    }
    if ( result === undefined || Object.keys(result).length === 0 ) {
        return normalizedData;
    }
    const mSeconds = { 's': 1, 'm': 60, 'h': 3600, 'd': 86400 };
    let vMetricsLen = 0;
    let vAutoColorMetricsLen = 0;
    const dict = {};
    let yMax = 0, y2Max = 0;
    for (const qid in result) {
        if (result.hasOwnProperty(qid)) {
        const gConfig = widget ? this.util.getObjectByKey(widget.queries, 'id', qid) : {};
        const mConfigs = gConfig ? gConfig.metrics : [];
        if (gConfig && gConfig.settings.visual.visible && result[qid] && result[qid].results) {
            const mvConfigs = mConfigs.filter(item => item.settings.visual.visible);
            const mAutoConfigs = mConfigs.filter(item => item.settings.visual.visible && item.settings.visual.color === 'auto');

            vMetricsLen += mvConfigs.length;
            vAutoColorMetricsLen += mAutoConfigs.length;
            dict[qid] = {};
            for ( let i = 0;  i < result[qid].results.length; i++ ) {
                const queryResults = result[qid].results[i];
                const [ source, mid ] = queryResults.source.split(":");
                const mIndex = mid.replace( /\D+/g, '');
                const mConfig = mConfigs[mIndex];
                const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
                if ( vConfig.visible ) {
                    if (!dict[qid][mid]) {
                        dict[qid][mid] = { hashes: {}};

                    }
                    if ( source === 'summarizer') {
                        dict[qid][mid]['summarizer'] = {};
                        const n = queryResults.data.length;
                        for ( let j = 0; j < n; j ++ ) {
                            const tags = queryResults.data[j].tags;
                            const hash = JSON.stringify(tags);
                            const aggs = queryResults.data[j].NumericSummaryType.aggregations;
                            const key = Object.keys(queryResults.data[j].NumericSummaryType.data[0])[0];
                            const data = queryResults.data[j].NumericSummaryType.data[0][key];
                            const aggData = {};
                            for ( let k = 0; k < aggs.length; k++ ) {
                                aggData[aggs[k]] = data[k];
                            }
                            dict[qid][mid]['summarizer'][hash] = aggData;
                            const mConfig = mConfigs[mIndex].settings.visual;
                            if ( !mConfig.axis || mConfig.axis === 'y1' ) {
                                yMax = yMax < aggData['max'] ? aggData['max'] : yMax;
                            } else {
                                y2Max = y2Max < aggData['max'] ? aggData['max'] : y2Max;
                            }
                        }
                    } else {
                        dict[qid][mid]['values'] = {}; // queryResults.data;
                        const n = queryResults.data.length;
                        for ( let j = 0; j < n; j ++ ) {
                            const tags = queryResults.data[j].tags;
                            let hash = JSON.stringify(tags);
                            dict[qid][mid]['values'][hash] = queryResults.data[j].NumericType;
                        }
                    }
                }
            }
        }
    }
}
    options.axes.y.tickFormat.max = yMax;
    options.axes.y2.tickFormat.max = y2Max;

    let autoColors =  this.util.getColors( null , vAutoColorMetricsLen );
    autoColors = vAutoColorMetricsLen > 1 ? autoColors : [autoColors];
    let cIndex = 0;
    for (const qid in result) {
        if (result.hasOwnProperty(qid)) {
        const gConfig = widget? this.util.getObjectByKey(widget.queries, 'id', qid) : {};
        const mConfigs = gConfig ? gConfig.metrics : [];
        const summary = [];
        if (gConfig && gConfig.settings.visual.visible && result[qid] && result[qid].results) {
            // sometimes opentsdb returns empty results
            for ( let i = 0;  i < result[qid].results.length; i++ ) {
                const queryResults = result[qid].results[i];
                const [ source, mid ] = queryResults.source.split(":");
                if ( source === 'summarizer') {
                    continue;
                } else {

                }
                const mIndex = mid.replace( /\D+/g, '')

                const timeSpecification = queryResults.timeSpecification;
                const mConfig = mConfigs[mIndex];
                const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
                const n = queryResults.data.length;
                const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++]: mConfig.settings.visual.color;
                const colors = n === 1 ? 
                    [color] :  this.util.getColors( vMetricsLen === 1 && mConfig.settings.visual.color === 'auto' ? null: color , n ) ;
                for ( let j = 0; j < n; j ++ ) {
                    const data = queryResults.data[j].NumericType;
                    const tags = queryResults.data[j].tags;
                    const hash = JSON.stringify(tags);
                    const metric = vConfig.label || queryResults.data[j].metric;
                    const numPoints = data.length;
                    let label = options.labels.length.toString();
                    if ( vConfig.visible ) {
                        const aggData = dict[qid][mid]['summarizer'][hash];
                        options.labels.push(label);
                        options.visibility.push(true);
                        if ( options.series ) {
                            options.series[label] = {
                                strokeWidth: vConfig.lineWeight ? parseFloat(vConfig.lineWeight) : 1,
                                strokePattern: this.getStrokePattern(vConfig.lineType),
                                color: colors[j],
                                axis: !vConfig.axis || vConfig.axis === 'y1' ? 'y' : 'y2',
                                metric: metric,
                                tags: { metric: !mConfig.expression ?
                                        queryResults.data[j].metric : this.getLableFromMetricTags(metric, tags), ...tags},
                                aggregations: aggData
                            };
                            if ( vConfig.type === 'bar') {
                                options.series[label].plotter = barChartPlotter;
                            }
                            options.series[label].label = this.getLableFromMetricTags(metric, options.series[label].tags);
                        }
                        const seriesIndex = options.labels.indexOf(label);
                        const unit = timeSpecification.interval.replace(/[0-9]/g, '');

                        // tslint:disable-next-line: radix
                        const m = parseInt(timeSpecification.interval);
                        for (let k = 0; k < numPoints ; k++ ) {
                            if (!Array.isArray(normalizedData[k])) {
                                const time = timeSpecification.start + ( m * k * mSeconds[unit] );
                                normalizedData[k] = [ new Date(time * 1000) ];
                            }
                            normalizedData[k][seriesIndex] = !isNaN(data[k]) ? data[k] : null;
                        }
                    }
                }
            }
        }
    }
    }
    return [...normalizedData];
  }

    yamasToChartJS( chartType, options, widget, data, queryData, stacked = false ) {
        switch ( chartType ) {
            case 'bar':
                return this.getChartJSFormattedDataBar(options, widget, data, queryData, stacked);
            case 'horizontalBar':
                return this.getChartJSFormattedDataBar(options, widget, data, queryData, stacked);
            case 'donut':
                return this.getChartJSFormattedDataDonut(options, widget, data, queryData);
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

    getChartJSFormattedDataBar( options, widget, datasets, queryData, stacked ) {
        if ( queryData === undefined || Object.keys(queryData).length === 0 ) {
            return datasets;
        }
        // stack colors
        const colors = [];
        const metricIndices = [];
        let stacks = [];

        // only visible groups
        const nGroups = widget.queries.filter( d => d.settings.visual.visible ).length;
        const wSettings = widget.settings;

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
                const label = widget.queries[i].title;
                if ( !options.labels.includes(label) ) {
                    options.labels.push(label);
                }
            }
        } else {
            datasets[0] = {data: [], backgroundColor: [], tooltipData: []};
            options.labels = [];
        }

        // set dataset values
        // tslint:disable-next-line:forin
        for (let qid in queryData ) {
            const gConfig = this.util.getObjectByKey(widget.queries, 'id', qid);
            const mConfigs = gConfig ? gConfig.metrics : [];
            const mvConfigs = mConfigs.filter(item => item.settings.visual.visible);
            const mAutoConfigs = mConfigs.filter(item => item.settings.visual.visible && item.settings.visual.color === 'auto');
            let autoColors =  this.util.getColors( null , mAutoConfigs.length );
            autoColors = mAutoConfigs.length > 1 ? autoColors : [autoColors];
            let cIndex = 0;
            const results = queryData[qid].results? queryData[qid].results : [];
            for ( let i = 0;  i < results.length; i++ ) {
                const mid = results[i].source.split(':')[1];
                const configIndex = mid.replace( /\D+/g, '')
                const mConfig = mConfigs[configIndex];
                if ( !mConfig.settings.visual.visible ) {
                    continue;
                }
                const n = results[i].data.length;
                const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++]: mConfig.settings.visual.color;
                const colors = n === 1 ? [color] :  this.util.getColors( mvConfigs.length === 1 && mConfig.settings.visual.color === 'auto' ? null: color , n ) ;
                for ( let j = 0;  j < n; j++ ) {
                    const aggs = results[i].data[j].NumericSummaryType.aggregations;
                    const tags = results[i].data[j].tags;
                    const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                    const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                    let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : results[i].data[j].metric;
                    const aggrIndex = aggs.indexOf(widget.queries[0].metrics[i].summarizerValue);
                    label = this.getLableFromMetricTags(label, { metric: results[i].data[j].metric, ...tags});
                    options.labels.push(label);
                    datasets[0].data.push(aggData[aggrIndex]);
                    datasets[0].backgroundColor.push(colors[j]);
                    datasets[0].tooltipData.push({ metric: results[i].data[j].metric, ...tags });
                }
            }
        }
        return [...datasets];
    }

    getLableFromMetricTags(label, tags ) {
        const regex = /\{\{([\w-.:\/]+)\}\}/ig
        const matches = label.match(regex);
        if ( matches ) {
            for ( let i = 0, len = matches.length; i < len; i++ ) {
                const key = matches[i].replace(/\{|\}/g,'');
                label = label.replace(matches[i], tags[key]? tags[key] : '');
            }
        } else {
            for ( let k in tags ) {
                if ( k !== 'metric' ) {
                    label = label + '-' + tags[k];
                }
            }
        }
        label = label.length > 50 ? label.substr(0, 48) + '..' : label;
        return label;
    }

    getChartJSFormattedDataDonut(options, widget, datasets, queryData) {
        datasets[0] = {data: [], backgroundColor: [], tooltipData: [] };
        options.labels = [];
        if ( queryData === undefined || Object.keys(queryData).length === 0) {
            return datasets;
        }
        const qid = Object.keys(queryData)[0];
        const results = queryData[qid].results ? queryData[qid].results : [];

        const metricIndices = [];
        const gConfig = this.util.getObjectByKey(widget.queries, 'id', qid);
        const mConfigs = gConfig.metrics;

       for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const configIndex = mid.replace( /\D+/g, '');
            const mConfig = mConfigs[configIndex];
            const aggregator = mConfig.settings.visual.aggregator[0] || 'sum';
            const n = results[i].data.length;
            const colors = n === 1 ? [mConfig.settings.visual.color] : this.util.getColors( mConfig.settings.visual.color , n );
            for ( let j = 0; j < n; j++ ) {
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericType)[0];
                const aggData = results[i].data[j].NumericType[key];
                if ( mConfig.settings && mConfig.settings.visual.visible ) {
                    let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : results[i].data[j].metric;
                    const aggrIndex = aggs.indexOf(aggregator);
                    label = this.getLableFromMetricTags(label, { metric:results[i].data[j].metric, ...tags});
                    options.labels.push(label);
                    datasets[0].data.push(aggData);
                    datasets[0].backgroundColor.push(colors[j]);
                    datasets[0].tooltipData.push({metric: results[i].data[j].metric, ...tags});
                }
            }
        }
        return [...datasets];
    }
    yamasToD3Donut(options, widget, queryData) {
        options.data = [];
        if ( queryData === undefined || Object.keys(queryData).length === 0) {
            return {...options};
        }
        const qid = Object.keys(queryData)[0];
        const results = queryData[qid].results ? queryData[qid].results : [];

        const gConfig = this.util.getObjectByKey(widget.queries, 'id', qid);
        const mConfigs = gConfig.metrics;
        const mvConfigs = mConfigs.filter(item => item.settings.visual.visible);
        const mAutoConfigs = mConfigs.filter(item => item.settings.visual.visible && item.settings.visual.color === 'auto');
        let autoColors =  this.util.getColors( null , mAutoConfigs.length );
        autoColors = mAutoConfigs.length > 1 ? autoColors : [autoColors];
        let cIndex = 0;
       for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const configIndex = mid.replace( /\D+/g, '');
            const mConfig = mConfigs[configIndex];
            if ( !mConfig.settings.visual.visible ) {
                continue;
            }

            const n = results[i].data.length;
            const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++]: mConfig.settings.visual.color;
            const colors = n === 1 ? [color] :  this.util.getColors( mvConfigs.length === 1 && mConfig.settings.visual.color === 'auto' ? null: color , n ) ;
            for ( let j = 0; j < n; j++ ) {
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : results[i].data[j].metric;
                const aggrIndex = aggs.indexOf(widget.queries[0].metrics[i].summarizerValue);
                label = this.getLableFromMetricTags(label, { metric:results[i].data[j].metric, ...tags});
                const o = { label: label, value: aggData[aggrIndex], color: colors[j], tooltipData: tags};
                options.data.push(o);
            }
        }

        return {...options};
    }

    yamasToD3Bar(options, widget, queryData) {
        options.data = [];
        if ( queryData === undefined || Object.keys(queryData).length === 0) {
            return {...options};
        }
        const qid = Object.keys(queryData)[0];
        const results = queryData[qid].results ? queryData[qid].results : [];

        const gConfig = this.util.getObjectByKey(widget.queries, 'id', qid);
        const mConfigs = gConfig.metrics;

       for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const configIndex = mid.replace( /\D+/g, '');
            const mConfig = mConfigs[configIndex];
            if ( !mConfig || !mConfig.settings.visual.visible ) {
                continue;
            }
            // todo - remove line below. kept for overrideColor
            const aggregator = widget.settings.time.downsample.aggregators ? widget.settings.time.downsample.aggregators[0] : 'avg';
            const n = results[i].data.length;
            const color =  mConfig.settings.visual.color === 'auto' ? '' : mConfig.settings.visual.color;
            for ( let j = 0; j < n; j++ ) {
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : results[i].data[j].metric;
                const aggrIndex = aggs.indexOf(aggregator);
                label = this.getLableFromMetricTags(label, { metric:results[i].data[j].metric, ...tags});
                // tslint:disable-next-line:max-line-length
                const o = { label: label, value: aggData[aggs.indexOf(widget.queries[0].metrics[i].summarizerValue)], color: this.overrideColor(aggData[aggrIndex], color, widget.settings.visual.conditions), tooltipData: tags};
                options.data.push(o);
            }
        }

        return {...options};
    }

    overrideColor(value, color, conditions) {
        value = value.toFixed(2);
        for ( let i = 0; conditions && i < conditions.length ; i++ ) {
            switch( conditions[i].operator ) {
                case 'gt':
                    if ( conditions[i].value !== '' && value > conditions[i].value ) {
                        return conditions[i].color;
                    }
                    break;
                case 'ge':
                    if ( conditions[i].value !== '' && value >= conditions[i].value ) {
                        return conditions[i].color;
                    }
                    break;
                case 'lt':
                    if ( conditions[i].value !== '' && value < conditions[i].value ) {
                        return conditions[i].color;
                    }
                    break;
                case 'le':
                    if ( conditions[i].value !== '' && value <= conditions[i].value ) {
                        return conditions[i].color;
                    }
                    break;
            }
        }
        return color;
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
        const v = k !== 'metric' ? m[k] : m[k].substr(m[k].indexOf('.')+1);
          const filtertype = m[k].indexOf('*') !== -1 ? 'wildcard' : 'literalor';
          const filter = {
            type: filtertype,
            tagk: k,
            filter: v ,
            groupBy: false
          };
          q.filters.push(filter);
      }
    return q;
  }
}

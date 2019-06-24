import { Injectable } from '@angular/core';
import { IDygraphOptions } from '../../shared/modules/dygraphs/IDygraphOptions';
import { barChartPlotter, heatmapPlotter, stackedAreaPlotter } from '../../shared/dygraphs/plotters';
import { UtilsService } from './utils.service';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class DatatranformerService {

   REGDSID = /q?(\d+)?_?(m|e)(\d+).*/;
  // tslint:disable:max-line-length
  constructor(private util: UtilsService ) {  }

  // options will also be update of its labels array
  yamasToDygraph(widget, options: IDygraphOptions, normalizedData: any[], result: any): any {
    result = { ...result };
    if ( normalizedData.length && normalizedData[0].length === 1 ) {
      // there is no data in here but default, reset it
      normalizedData = [];
    }
    if ( result === undefined || !result.results || !result.results.length ) {
        return normalizedData;
    }
    const mSeconds = { 's': 1, 'm': 60, 'h': 3600, 'd': 86400 };
    const dict = {};
    const queryResults = [];
    const wdQueryStats = this.util.getWidgetQueryStatistics(widget.queries);
    let isStacked = false;
    let areaAxis = 'y1';
    let yMax = 0, y2Max = 0;
    let areaMax = 0;

            for ( let i = 0;  i < result.results.length; i++ ) {
                queryResults.push(result.results[i]);
                const [ source, mid ] = result.results[i].source.split(':');
                const qids = this.REGDSID.exec(mid);
                const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
                const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );
                const gConfig = widget.queries[qIndex];
                const mConfig = widget.queries[qIndex].metrics[mIndex];
                const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
                queryResults[i] = Object.assign( {}, queryResults[i], {visualType: vConfig.type || 'line'} );
                if ( gConfig.settings.visual.visible && vConfig.visible ) {
                    if (!dict[mid]) {
                        dict[mid] = { hashes: {}};

                    }
                    if ( source === 'summarizer') {
                        dict[mid]['summarizer'] = {};
                        const n = queryResults[i].data.length;
                        for ( let j = 0; j < n; j ++ ) {
                            const tags = queryResults[i].data[j].tags;
                            const hash = JSON.stringify(tags);
                            const aggs = queryResults[i].data[j].NumericSummaryType.aggregations;
                            const key = Object.keys(queryResults[i].data[j].NumericSummaryType.data[0])[0];
                            const data = queryResults[i].data[j].NumericSummaryType.data[0][key];
                            const aggData = {};
                            for ( let k = 0; k < aggs.length; k++ ) {
                                aggData[aggs[k]] = data[k];
                            }
                            dict[mid]['summarizer'][hash] = aggData;
                            if ( !vConfig.axis || vConfig.axis === 'y1' ) {
                                yMax = yMax < aggData['max'] ? aggData['max'] : yMax;
                            } else {
                                y2Max = y2Max < aggData['max'] ? aggData['max'] : y2Max;
                            }
                        }
                    } else {
                        dict[mid]['values'] = {}; // queryResults.data;
                        const n = queryResults[i].data.length;
                        for ( let j = 0; j < n; j ++ ) {
                            const tags = queryResults[i].data[j].tags;
                            const hash = JSON.stringify(tags);
                            dict[mid]['values'][hash] = queryResults[i].data[j].NumericType;
                            const max = d3.max(queryResults[i].data[j].NumericType);
                            if ( vConfig.type === 'area' && max !== undefined ) {
                                areaMax += Number(max);
                                isStacked = true;
                                areaAxis = vConfig.axis || 'y1';
                            }
                        }
                    }
                }
            }
    queryResults.sort( (a, b) => a.visualType - b.visualType );
    options.axes.y.tickFormat.max = yMax;
    options.axes.y2.tickFormat.max = y2Max;
    const axis = areaAxis === 'y1' ? 'y' : 'y2';
    if ( isStacked && options.axes[axis].valueRange[1] === null  ) {
        areaMax = areaMax < y2Max ? y2Max : areaMax;
        options.axes[axis].valueRange[1] = Math.ceil(areaMax + areaMax * 0.05);
    }

    let autoColors =  this.util.getColors( null , wdQueryStats.nVisibleAutoColors );
    autoColors = wdQueryStats.nVisibleAutoColors > 1 ? autoColors : [autoColors];

            // sometimes opentsdb returns empty results
            for ( let i = 0;  i < queryResults.length; i++ ) {
                const [ source, mid ] = queryResults[i].source.split(':');
                if ( source === 'summarizer') {
                    continue;
                }
                const qids = this.REGDSID.exec(mid);
                const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
                const mIndex = this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );

                const timeSpecification = queryResults[i].timeSpecification;
                const qid = widget.queries[qIndex].id;
                const gConfig = widget.queries[qIndex];
                const mConfig = widget.queries[qIndex].metrics[mIndex];
                const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
                const n = queryResults[i].data.length;
                const colorIndex = mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color ? wdQueryStats.mVisibleAutoColorIds.indexOf( qid + '-' + mConfig.id ) : -1;
                const color = mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color ? autoColors[colorIndex] : mConfig.settings.visual.color;
                const colors = n === 1 ?
                    [color] :  this.util.getColors( wdQueryStats.nVisibleMetrics === 1 && (mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color) ? null : color , n ) ;
                for ( let j = 0; j < n; j ++ ) {
                    const data = queryResults[i].data[j].NumericType;
                    const tags = queryResults[i].data[j].tags;
                    const hash = JSON.stringify(tags);
                    const mLabel = this.util.getWidgetMetricDefaultLabel(widget.queries, qIndex, mIndex);
                    const metric = vConfig.label ? vConfig.label : mConfig.expression ? mLabel : queryResults[i].data[j].metric;
                    const numPoints = data.length;
                    const label = options.labels.length.toString();
                    if ( gConfig.settings.visual.visible && vConfig.visible ) {
                        const aggData = dict[mid]['summarizer'][hash];
                        options.labels.push(label);
                        options.visibility.push(true);
                        if ( options.series ) {
                            options.series[label] = {
                                strokeWidth: vConfig.lineWeight ? parseFloat(vConfig.lineWeight) : 1,
                                strokePattern: this.getStrokePattern(vConfig.lineType),
                                color: colors[j],
                                fillGraph: vConfig.type === 'area' ? true : false,
                                isStacked: vConfig.type === 'area' ? true : false,
                                axis: !vConfig.axis || vConfig.axis === 'y1' ? 'y' : 'y2',
                                metric: metric,
                                tags: { metric: !mConfig.expression ?
                                        queryResults[i].data[j].metric : mLabel, ...tags},
                                aggregations: aggData,
                                group: vConfig.type
                            };
                            if ( vConfig.type === 'bar') {
                                options.series[label].plotter = barChartPlotter;
                            } else if ( vConfig.type === 'area' ) {
                                options.series[label].plotter = stackedAreaPlotter;
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
    return [...normalizedData];
  }

  yamasToHeatmap(widget, options: IDygraphOptions, normalizedData: any[], result: any): any {

    normalizedData = [];
    options.series = {};
    const mSeconds = { 's': 1, 'm': 60, 'h': 3600, 'd': 86400 };
    options.plotter = heatmapPlotter;
    let cIndex = 0;
    let min = Infinity, max = -Infinity;
    // find min and max from the series. used in yaxis range

    if ( result && result.results ) {
        // sometimes opentsdb returns empty results
        for ( let i = 0;  i < result.results.length; i++ ) {
            const queryResults = result.results[i];
            const [ source, mid ] = queryResults.source.split(':');
            if ( source === 'summarizer') {
                continue;
            }
            const qids = this.REGDSID.exec(mid);
            const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
            const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );
            const gConfig = widget.queries[qIndex];
            const mConfig = widget.queries[qIndex].metrics[mIndex];
            const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
            const n = queryResults.data.length;
            for ( let j = 0; j < n; j ++ ) {
                const data = queryResults.data[j].NumericType;
                const numPoints = data.length;
                if ( gConfig.settings.visual.visible && vConfig.visible ) {
                    for (let k = 0; k < numPoints ; k++ ) {
                        if (!isNaN(data[k]) && data[k] < min) {
                            min = data[k];
                        }
                        if (!isNaN(data[k]) && data[k] > max) {
                            max = data[k];
                        }
                    }
                }
            }
        }
    }
    options.axes.y.valueRange = [Math.floor(min), Math.ceil(max)];
    options.labels = ['x'].concat( Array.from( Array(options.heatmap.buckets), (x, index) => (index + 1).toString()));
    options.heatmap.x = [];

    const y = d3.scaleQuantize()
                .domain([min, max])
                .range(Array.from( Array(options.heatmap.buckets), (x, index) => (index + 1)));

    const autoColors =  ['#3F00FF']; // we support single metric on heatmap, use this.util.getColors if multiple

    if ( result && result.results ) {
        // sometimes opentsdb returns empty results
        for ( let i = 0;  i < result.results.length; i++ ) {
            const queryResults = result.results[i];
            const [ source, mid ] = queryResults.source.split(':');
            const qids = this.REGDSID.exec(mid);
            const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
            const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );

            const gConfig = widget.queries[qIndex];
            const mConfig = widget.queries[qIndex].metrics[mIndex];
            const vConfig = mConfig && mConfig.settings ? mConfig.settings.visual : {};
            if ( source === 'summarizer' || !gConfig.settings.visual.visible || !vConfig.visible) {
                continue;
            }

            const timeSpecification = queryResults.timeSpecification;
            const n = queryResults.data.length;
            const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++] : mConfig.settings.visual.color;
            options.heatmap.nseries = n;
            options.heatmap.color = color;

            for ( let j = 0; j < n; j ++ ) {
                const data = queryResults.data[j].NumericType;
                const tags = queryResults.data[j].tags;
                const numPoints = data.length;
                const mLabel = this.util.getWidgetMetricDefaultLabel(widget.queries, 0, mIndex);
                    let metric = vConfig.label ? vConfig.label : mConfig.expression ? mLabel : queryResults.data[j].metric;
                    metric = this.getLableFromMetricTags(metric, { metric: !mConfig.expression ? queryResults.data[j].metric : mLabel, ...tags});
                    const unit = timeSpecification.interval.replace(/[0-9]/g, '');
                    const m = parseInt(timeSpecification.interval, 10);
                    for (let k = 0; k < numPoints ; k++ ) {
                        const time = (timeSpecification.start + ( m * k * mSeconds[unit] )) * 1000;
                        if (!Array.isArray(normalizedData[k])) {
                            normalizedData[k] = Array( options.heatmap.buckets + 1 ).fill(null);
                            normalizedData[k][0] = new Date(time);
                            options.heatmap.x.push(time);
                        }
                            if ( !isNaN(data[k]) ) {
                                const bucket = y(data[k]);
                                    normalizedData[k][bucket] += 1;
                                if (!options.series[bucket]) {
                                    options.series[bucket] = {};
                                }
                                if (!options.series[bucket][time]) {
                                    options.series[bucket][time] = [];
                                }
                                options.series[bucket][time].push({label: metric, v: data[k]});
                            }
                    }
            }
        }
    }


    // ranking
    const bucketValues = [];
    for ( let i = 0; i < normalizedData.length; i++ ) {
        for ( let j = 1; j < normalizedData[i].length; j++ ) {
            if ( normalizedData[i][j] !== null && !bucketValues.includes(normalizedData[i][j]) ) {
                bucketValues.push(normalizedData[i][j]);
            }
        }
    }
    bucketValues.sort((a, b) => a - b);
    options.heatmap.bucketValues = bucketValues;
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
        if ( queryData === undefined || !queryData.results || !queryData.results.length ) {
            return datasets;
        }

        options.scales.xAxes[0].stacked = stacked;
        options.scales.yAxes[0].stacked = stacked;

        datasets[0] = {data: [], backgroundColor: [], tooltipData: []};
        options.labels = [];
        const wdQueryStats = this.util.getWidgetQueryStatistics(widget.queries);
        let autoColors =  this.util.getColors( null , wdQueryStats.nVisibleAutoColors );
        autoColors = wdQueryStats.nVisibleAutoColors > 1 ? autoColors : [autoColors];

        let cIndex = 0;
        const results = queryData.results ? queryData.results : [];
        for ( let i = 0;  i < results.length; i++ ) {
            const qids = this.REGDSID.exec(results[i].source.split(':')[1]);
            const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
            const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );
            const gConfig = widget.queries[qIndex];
            const mConfig = widget.queries[qIndex].metrics[mIndex];
            if ( !gConfig.settings.visual.visible || !mConfig.settings.visual.visible ) {
                continue;
            }
            const n = results[i].data.length;
            const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++] : mConfig.settings.visual.color;
            const colors = n === 1 ? [color] :  this.util.getColors( wdQueryStats.nVisibleMetrics === 1 && (mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color) ? null : color , n ) ;
            for ( let j = 0;  j < n; j++ ) {
                const summarizer = this.getSummarizerOption(widget, qIndex, mIndex);
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                const mLabel = this.util.getWidgetMetricDefaultLabel(widget.queries, 0, mIndex);
                let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : mConfig.expression ? mLabel : results[i].data[j].metric;
                const aggrIndex = aggs.indexOf(summarizer);
                label = this.getLableFromMetricTags(label, { metric: !mConfig.expression ? results[i].data[j].metric : mLabel, ...tags});
                options.labels.push(label);
                datasets[0].data.push(aggData[aggrIndex]);
                datasets[0].backgroundColor.push(colors[j]);
                datasets[0].tooltipData.push({ metric: !mConfig.expression ? results[i].data[j].metric : mLabel, ...tags });
            }
        }
        return [...datasets];
    }

    getLableFromMetricTags(label, tags, len= 50 ) {
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
        label = label.length > len ? label.substr(0, len - 2) + '..' : label;
        return label;
    }

    getChartJSFormattedDataDonut(options, widget, datasets, queryData) {
        datasets[0] = {data: [], backgroundColor: [], tooltipData: [] };
        options.labels = [];
        if ( queryData === undefined || !queryData.results || !queryData.results.length ) {
            return datasets;
        }
        const results = queryData.results ? queryData.results : [];

        const metricIndices = [];
        const gConfig = widget.queries[0];
        const mConfigs = gConfig.metrics;

       for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const qids = this.REGDSID.exec(mid);
            const configIndex =  this.util.getDSIndexToMetricIndex(widget.queries[0], parseInt(qids[3], 10) - 1, qids[2] );
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
        if ( queryData === undefined || !queryData.results || !queryData.results.length ) {
            return {...options};
        }
        const results = queryData.results ? queryData.results : [];

        // const gConfig = widget.queries[0];
        // const mConfigs = gConfig.metrics;
        // const mvConfigs = mConfigs.filter(item => item.settings.visual.visible);
        // const mAutoConfigs = mConfigs.filter(item => item.settings.visual.visible && ( item.settings.visual.color === 'auto' || !item.settings.visual.color ));
        // let autoColors =  this.util.getColors( null , mAutoConfigs.length );
        // autoColors = mAutoConfigs.length > 1 ? autoColors : [autoColors];

        const wdQueryStats = this.util.getWidgetQueryStatistics(widget.queries);
        let autoColors =  this.util.getColors( null , wdQueryStats.nVisibleAutoColors );
        autoColors = wdQueryStats.nVisibleAutoColors > 1 ? autoColors : [autoColors];

        let cIndex = 0;
        for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const qids = this.REGDSID.exec(mid);
            const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
            const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );
            const gConfig = widget.queries[qIndex];
            const mConfig = widget.queries[qIndex].metrics[mIndex];
            if ( !gConfig.settings.visual.visible || !mConfig.settings.visual.visible ) {
                continue;
            }

            const n = results[i].data.length;
            const color = mConfig.settings.visual.color === 'auto' ? autoColors[cIndex++]: mConfig.settings.visual.color;
            const colors = n === 1 ? [color] :  this.util.getColors( wdQueryStats.nVisibleMetrics  === 1 && ( mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color ) ? null: color , n ) ;
            for ( let j = 0; j < n; j++ ) {
                const summarizer = this.getSummarizerOption(widget, 0, mIndex);
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                const mLabel = this.util.getWidgetMetricDefaultLabel(widget.queries, 0, mIndex);
                let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : mConfig.expression ? mLabel : results[i].data[j].metric;
                const aggrIndex = aggs.indexOf(summarizer);
                label = this.getLableFromMetricTags(label, { metric: !mConfig.expression ? results[i].data[j].metric : mLabel, ...tags});
                const o = { label: label, value: aggData[aggrIndex], color: colors[j], tooltipData: tags};
                options.data.push(o);
            }
        }

        return {...options};
    }

    yamasToD3Bar(options, widget, queryData) {
        options.data = [];
        if ( queryData === undefined || !queryData.results || !queryData.results.length ) {
            return {...options};
        }
        const results = queryData.results ? queryData.results : [];

        for ( let i = 0; i < results.length; i++ ) {
            const mid = results[i].source.split(':')[1];
            const qids = this.REGDSID.exec(mid);
            const qIndex = qids[1] ? parseInt(qids[1], 10) - 1 : 0;
            const mIndex =  this.util.getDSIndexToMetricIndex(widget.queries[qIndex], parseInt(qids[3], 10) - 1, qids[2] );
            const gConfig = widget.queries[qIndex];
            const mConfig = widget.queries[qIndex].metrics[mIndex];
            if ( !gConfig.settings.visual.visible || !mConfig.settings.visual.visible ) {
                continue;
            }

            const n = results[i].data.length;
            const color =  mConfig.settings.visual.color === 'auto' || !mConfig.settings.visual.color ? '' : mConfig.settings.visual.color;
            for ( let j = 0; j < n; j++ ) {
                const summarizer = this.getSummarizerOption(widget, qIndex, mIndex);
                const aggs = results[i].data[j].NumericSummaryType.aggregations;
                const tags = results[i].data[j].tags;
                const key = Object.keys(results[i].data[j].NumericSummaryType.data[0])[0];
                const aggrIndex = aggs.indexOf(summarizer);
                const aggData = results[i].data[j].NumericSummaryType.data[0][key];
                const mLabel = this.util.getWidgetMetricDefaultLabel(widget.queries, 0, mIndex);
                let label = mConfig.settings.visual.label ? mConfig.settings.visual.label : mConfig.expression ? mLabel : results[i].data[j].metric;
                label = this.getLableFromMetricTags(label, { metric: !mConfig.expression ? results[i].data[j].metric : mLabel, ...tags});
                if ( !isNaN(aggData[aggrIndex])) {
                    const o = { label: label, value: aggData[aggrIndex], color: this.overrideColor(aggData[aggrIndex], color, widget.settings.visual.conditions), tooltipData: tags};
                    options.data.push(o);
                }
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

    getSummarizerOption(widget: any, qIndex: number, metricIndex: number) {
        let summarizerOption;
        if (widget.queries[qIndex].metrics[metricIndex].summarizer) {
            summarizerOption = widget.queries[qIndex].metrics[metricIndex].summarizer;
        } else if ( widget.settings.time.downsample.aggregators && widget.settings.time.downsample.aggregators[qIndex]) { // todo: remove once summarizer exposed for all widgets
            summarizerOption = widget.settings.time.downsample.aggregators[qIndex];
        } else {
            summarizerOption = 'avg';
        }
        return summarizerOption;
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

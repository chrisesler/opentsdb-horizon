import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YamasService {

    constructor() { }

    buildQuery( time, query, downsample: any = {} , summaryOnly= false, sorting) {

        const transformedQuery: any = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };

        const mids = [];
        let filterId = '';
        let outputIds = [];
        let hasMetricTS = false;
        let groupByIds = [];

        // add filters
        if ( query.filters.length ) {
            filterId = 'filter';
            // tslint:disable-next-line:prefer-const
            let _filter: any = this.getFilterQuery(query);
            _filter.id = filterId;

            if (query.settings.explicitTagMatch) {
                transformedQuery.filters = [
                    { filter : { type: 'ExplicitTags', filter: _filter.filter }, id: filterId }
                ];
            } else {
                transformedQuery.filters = [_filter];
            }
        }

        for (let j = 0; j < query.metrics.length; j++) {
            const isExpression = query.metrics[j].expression ? true : false;

            if ( query.metrics[j].expression ) {
                // need to create the expression query for each aggregators
                // foreach aggregator create expression query, downsample, groupby 
                const res = this.getExpressionQuery(query, summaryOnly, downsample, query.metrics[j], j, filterId);
                transformedQuery.executionGraph = transformedQuery.executionGraph.concat(res.queries);
                outputIds = outputIds.concat(res.eids);
            } else {
                hasMetricTS = true;
                const q: any = this.getMetricQuery(query, j);
                if ( filterId ) {
                    q.filterId = filterId;
                }
                transformedQuery.executionGraph.push(q);
                const aggregators = downsample.aggregators || ['avg'];
                for ( let i = 0; i < aggregators.length; i++ ) {
                    const prefix = 'm' + j + '-' + aggregators[i];
                    const dsId = prefix + '-downsample';
                    // add downsample for the expression
                    transformedQuery.executionGraph.push(this.getQueryDownSample(summaryOnly, downsample, aggregators[i], dsId, [q.id]));

                    const groupbyId = prefix + '-groupby';
                    groupByIds.push(groupbyId);
                    transformedQuery.executionGraph.push(this.getQueryGroupBy(query, query.metrics[j].tagAggregator,  [dsId], groupbyId));
                    outputIds.push(groupbyId);
                }
            }
        }

        if ( hasMetricTS ) {

        }
        // if ( !summaryOnly ) {

        // }

        if (sorting && sorting.order && sorting.limit) {
            transformedQuery.executionGraph.push(this.getTopN(sorting.order, sorting.limit, outputIds));
            transformedQuery.executionGraph.push(this.getQuerySummarizer(['topn']));
        } else {
            // transformedQuery.executionGraph.push(this.getQuerySummarizer(['groupby']));
            transformedQuery.executionGraph.push(this.getQuerySummarizer(outputIds));
        }


        transformedQuery.serdesConfigs = [{
            id: 'JsonV3QuerySerdes',
            filter: summaryOnly ? ['summarizer'] : outputIds.concat(['summarizer']) // outputIds : outputIds.concat(['summarizer'])
        }];
        console.log('tsdb query', JSON.stringify(transformedQuery));
        return transformedQuery;
    }

    getMetricQuery(query, index) {
        const mid = 'm' + index;
        const q = {
            id: mid, // using the loop index for now, might need to generate its own id
            type: 'TimeSeriesDataSource',
            metric: {
                type: 'MetricLiteral',
                metric:  query.namespace + '.' + query.metrics[index].name
            },
            fetchLast: false,
        };

        return q;
    }

    getTopN(order: string, count: number, sources: string[]) {

        let _order: boolean = true;  // true is topN
        if (order.toLowerCase() === 'bottom') {
            _order = false;
        }

        return {
            'id': 'topn',
            'type': 'topn',
            'sources': sources,
            'aggregator': 'avg',
            'top': _order,
            'count': count
        };
    }

    getFilterQuery(query) {
        const filters = query.filters ? this.transformFilters(query.filters) : [];
        const filter = {
                        filter : {
                            type: 'Chain',
                            op: 'AND',
                            filters: filters
                        }
                    };
        return filter;
    }

    getExpressionQuery(query, summaryOnly, downsample, config, index, filterId) {
        const eids = [];
        const queries = [];
        const sources = {};
        const aggregators = downsample.aggregators || ['avg'];
        for ( let i = 0; i < config.metrics.length; i++ ) {
            const mid = 'm' + index.toString() + (i + 1);

            const q: any = {
                id: mid, // using the loop index for now, might need to generate its own id
                type: 'TimeSeriesDataSource',
                metric: {
                    type: 'MetricLiteral',
                    metric: config.metrics[i].name
                },
                fetchLast: false,
            };

            if ( filterId ) {
                q.filterId = filterId;
            }
            queries.push(q);
            for ( let j = 0; j < aggregators.length; j++ ) {
                // const q = JSON.parse(JSON.stringify(res.expression));
                const id = mid +   '-' + aggregators[j];
                const dsId = id + '-downsample';
                // add downsample for the expression
                queries.push(this.getQueryDownSample(summaryOnly, downsample, aggregators[j], dsId, [mid]));
                // add groupby for the expression
                const groupbyId = id + '-groupby'  ;
                //groupByIds.push(groupbyId);
                queries.push(this.getQueryGroupBy(query, query.metrics[index].tagAggregator,  [dsId], groupbyId));
                if ( !sources[aggregators[j]] ) {
                    sources[aggregators[j]] = [];
                }
                sources[aggregators[j]].push(groupbyId);
            }
        }
        for ( let j = 0; j < aggregators.length; j++ ) {
            const eid = "m" + index;
            const expression = {
                id: eid,
                type: 'expression',
                expression: config.expression,
                join: {
                    type: 'Join',
                    //joinType: 'NATURAL_OUTER' // Optional.
                },
                interpolatorConfigs: [{
                    dataType: 'numeric',
                    fillPolicy: 'NAN',
                    realFillPolicy: 'NONE'
                }],
                variableInterpolators: {},
                sources: sources[aggregators[j]]
            };
            queries.push(expression);
            eids.push(eid);
        }
        return { queries: queries, eids: eids };
    }

    transformFilters(fConfigs) {
        const filters = [];
        for (let k = 0;  k < fConfigs.length; k++) {
            const f = fConfigs[k];
            const values = f.filter;
            const filter = values.length === 1 ? this.getFilter(f.tagk, values[0]) : this.getChainFilter(f.tagk, values);
            filters.push(filter);
        }
        return filters;
    }

    getFilter(key, v) {
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex', 'librange': 'TagValueLibrange'};
        const regexp = v.match(/regexp\((.*)\)/);
        var filtertype = 'literalor';
        if (regexp) {
            filtertype = 'regexp';
            v = regexp[1];
        } else if (v.match(/librange\((.*)\)/)) {
            const librange = v.match(/librange\((.*)\)/);
            filtertype = 'librange';
            v = librange[1];
        }
        const filter = {
            type: filterTypes[filtertype],
            filter: v,
            tagKey: key
        };
        return filter;
    }

    getChainFilter(key, values) {
        const chain = {
                        'type': 'Chain',
                        'op': 'OR',
                        'filters': []
                    };
        for ( let i = 0, len = values.length; i < len; i++ ) {
            chain.filters.push(this.getFilter(key, values[i]));
        }
        return chain;
    }

    getQueryGroupBy(query, tagAggregator, sources, id= null) {
        const filters = query.filters || [];
        const tagKeys = [];
        let aggregator =  tagAggregator || 'sum';
        for ( let i = 0; filters && i < filters.length; i++ ) {
            if ( filters[i].groupBy ) {
                tagKeys.push(filters[i].tagk);
            }
        }
        const metricGroupBy =  {
            id: id ? id : 'groupby',
            type: 'groupby',
            aggregator: aggregator,
            tagKeys: tagKeys,
            interpolatorConfigs: [
                {
                    dataType: 'numeric',
                    fillPolicy: 'NAN',
                    realFillPolicy: 'NONE'
                }
            ],
            sources: sources
        };
        return metricGroupBy;
    }

    getQueryDownSample(summary, dsSetting, aggregator, id= null, sources= []) {
        let dsValue = dsSetting.value || 'auto';
        if ('custom' === dsSetting.value) {
            dsValue = dsSetting.customValue + dsSetting.customUnit;
        }
        const downsample =  {
            id: id ? id : 'downsample',
            type: 'downsample',
            aggregator: aggregator || 'avg',
            interval: dsValue, //summary ? '0all' : dsValue,
            runAll: false, // summary ? true : false,
            fill: true,
            interpolatorConfigs: [
                {
                    dataType: 'numeric',
                    fillPolicy: 'NAN',
                    realFillPolicy: 'NONE'
                }
            ],
            sources: sources
        };
        return downsample; // { downsamples: downsamples, dsIds: ids };
    }

    getQuerySummarizer(sources= []) {
        const summarizer =  {
            id: 'summarizer',
            sources: sources ? sources : ['groupby'],
            summaries: ['avg', 'max', 'min', 'count', 'sum', 'first', 'last'],
        };
        return summarizer;
    }
}

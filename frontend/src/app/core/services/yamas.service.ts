import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YamasService {

    constructor() { }

    // buildQuery( time, metrics, downsample= {} , summary= false) {
    buildQuery( time, query, downsample:any = {} , summaryOnly= false) {
        const transformedQuery: any = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };

        const mids = [];
        let filterId = '';
        const outputIds = [];
        let hasMetricTS = false;

        // add filters
        if ( query.filters.length ) {
            filterId = 'filter';
            const filter: any = this.getFilterQuery(query);
            filter.id = filterId;
            transformedQuery.filters = [filter];
        }

        for (let j = 0; j < query.metrics.length; j++) {
            const isExpression = query.metrics[j].expression ? true : false;

            if ( query.metrics[j].expression ) {
                // need to create the expression query for each aggregators
                // foreach aggregator create expression query, downsample, groupby 
                const res = this.getExpressionQuery(query.metrics[j], j, filterId);
                const aggregators = downsample.aggregators || ['avg'];
                // add metrics for the expression
                transformedQuery.executionGraph = transformedQuery.executionGraph.concat(res.queries);
                for ( let i = 0; i < aggregators.length; i++ ) {
                    const q = JSON.parse(JSON.stringify(res.expression));
                    q.id = "m" + j + '-' + aggregators[i];
                    const dsId = q.id + '-downsample';
                    // add downsample for the expression
                    transformedQuery.executionGraph.push(this.getQueryDownSample(summaryOnly, downsample, aggregators[i], dsId, res.mids));
                    // add groupby for the expression
                    const groupbyId = q.id + '-groupby'  ;
                    transformedQuery.executionGraph.push(this.getQueryGroupBy(query, query.metrics[j].tagAggregator,  [dsId], groupbyId));
                    q.sources = [groupbyId];
                    transformedQuery.executionGraph.push(q);
                    outputIds.push(q.id);
                }
            } else {
                hasMetricTS = true;
                const q: any = this.getMetricQuery(query, j);
                if ( filterId ) {
                    q.filterId = filterId;
                }
                transformedQuery.executionGraph.push(q);
                const aggregators = downsample.aggregators || ['avg'];
                for ( let i = 0; i < aggregators.length; i++ ) {
                    const prefix = "m" + j + '-' + aggregators[i];
                    const dsId = prefix + '-downsample';
                    // add downsample for the expression
                    transformedQuery.executionGraph.push(this.getQueryDownSample(summaryOnly, downsample, aggregators[i], dsId, [q.id]));

                    const groupbyId = prefix + '-groupby';
                    transformedQuery.executionGraph.push(this.getQueryGroupBy(query, query.metrics[j].tagAggregator,  [dsId], groupbyId));
                    outputIds.push(groupbyId);
                }
            }
        }

        if ( hasMetricTS ) {
            
        }
        // if ( !summaryOnly ) {
            transformedQuery.executionGraph.push(this.getQuerySummarizer(outputIds));
        // }

        transformedQuery.serdesConfigs = [{
            id: 'JsonV3QuerySerdes',
            filter: summaryOnly ? ['summarizer'] : outputIds.concat(['summarizer']) // outputIds : outputIds.concat(['summarizer'])
        }];
        console.log("tsdb query", JSON.stringify(transformedQuery))
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

    getExpressionQuery(config, index, filterId) {
        const mids = [];

        const queries = [];
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
            mids.push(mid);
        }
        const expression = {
            type: 'expression',
            expression: config.expression,
            join: {
                type: 'Join',
                joinType: 'NATURAL'
            },
            interpolatorConfigs: [{
                dataType: 'numeric',
                fillPolicy: 'NAN',
                realFillPolicy: 'NONE'
            }],
            variableInterpolators: {},
            sources: []
        };
        return { expression: expression, queries: queries, mids: mids };
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
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex'};
        const regexp = v.match(/regexp\((.*)\)/);
        v = regexp ? regexp[1] : v;
        const type = regexp  ? 'regexp' : 'literalor';
        const filter = {
            type: filterTypes[type],
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
        console.log("----groupby-----", metricGroupBy.tagKeys, metricGroupBy.aggregator);
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

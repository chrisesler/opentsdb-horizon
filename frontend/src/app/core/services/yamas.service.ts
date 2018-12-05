import { Injectable } from '@angular/core';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YamasService {

    constructor() { }

    // buildQuery( time, metrics, downsample= {} , summary= false) {
    buildQuery( time, query, downsample= {} , summaryOnly= false) {
        const transformedQuery: any = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };

        const mids = [];
        let filterId = '';
        const outputIds = [];

        // add filters
        if ( query.filters.length ) {
            filterId = 'filter';
            const filter: any = this.getFilterQuery(query);
            filter.id = filterId;
            transformedQuery.filters = [filter];
        }

        for (let j = 0; j < query.metrics.length; j++) {
            const isExpression = query.metrics[j].expression ? true : false;

            let q;
            if ( query.metrics[j].expression ) {
                const res = this.getExpressionQuery(query.metrics[j], j, filterId);
                q = res.expression;
                // add metrics for the expression
                transformedQuery.executionGraph = transformedQuery.executionGraph.concat(res.queries);
                // add downsample for the expression
                const ds = this.getQueryDownSample(downsample, q.id, res.mids);
                transformedQuery.executionGraph.push(ds);
                // add groupby for the expression
                const groupbyId = 'groupby-' + q.id;
                transformedQuery.executionGraph.push(this.getQueryGroupBy(query, [ds.id], groupbyId));
                q.sources = [groupbyId];
                transformedQuery.executionGraph.push(q);
                outputIds.push(q.id);
            } else {
                q = this.getMetricQuery(query, j);
                if ( filterId ) {
                    q.filterId = filterId;
                }
                transformedQuery.executionGraph.push(q);
                mids.push(q.id);
                outputIds.push('groupby');
            }
        }

        const dsConfig = this.getQueryDownSample(downsample);
        dsConfig.sources = mids;
        transformedQuery.executionGraph.push(dsConfig);
        transformedQuery.executionGraph.push(this.getQueryGroupBy(query, ['downsample']));
        transformedQuery.executionGraph.push(this.getQuerySummarizer(outputIds));

            transformedQuery.serdesConfigs = [{
                id: 'JsonV3QuerySerdes',
                filter: summaryOnly ? ['summarizer'] : outputIds.concat(['summarizer'])
            }];
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
        const eid = 'm' + index;
        const mids = [];

        const queries = [];
        for ( let i = 0; i < config.metrics.length; i++ ) {
            const mid = 'm' + index.toString()  + (i + 1);

            const q: any = {
                id: mid, // using the loop index for now, might need to generate its own id
                type: 'TimeSeriesDataSource',
                metric: {
                    type: 'MetricLiteral',
                    metric: config.metrics[i]
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
            id: eid,
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

    getQueryGroupBy(query, sources= [], id= null) {
        const filters = query.filters || [];
        const tagKeys = [];
        let aggregator = 'sum';
        for ( let i = 0; filters && i < filters.length; i++ ) {
            if ( filters[i].aggregator === 'unmerge' ) {
                tagKeys.push(filters[i].tagk);
            } else {
                // set the aggregator from any non-groupby tag filter
                aggregator = filters[i].aggregator;
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

    getQueryDownSample(dsSetting, qid= null, sources= []) {
        let dsValue = dsSetting.value || 'auto';
        if ('custom' === dsSetting.value) {
            dsValue = dsSetting.customValue + dsSetting.customUnit;
        }
        const downsample =  {
            id: 'downsample' + ( qid ? '-' + qid : ''),
            type: 'downsample',
            aggregator: dsSetting.aggregator || 'avg',
            interval: dsValue,
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
        return downsample;
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

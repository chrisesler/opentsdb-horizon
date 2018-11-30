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
        const groupbyIds = [];

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
            let sources = [];
            if ( query.metrics[j].name) {

                q = this.getMetricQuery(query, j);
                if ( filterId ) {
                    q.filterId = filterId;
                }
                sources = [q.id];
                transformedQuery.executionGraph.push(q);
                mids.push(q.id);
            } else {
                // const res = this.getExpressionQuery(query.metrics[j], j);
                // q = res.expression;
                // transformedQuery.executionGraph = transformedQuery.executionGraph.concat(res.queries);
                // sources = res.qids;
            }

            /*
            if ( !summaryOnly  ) {
                q.sources = [groupby.id];
                // groupbyIds.push(groupby.id);
                if ( isExpression ) {
                    transformedQuery.executionGraph.push(q);
                }

            }
            */
        }

        const dsConfig = this.getQueryDownSample(downsample);
        dsConfig.sources = mids;
        transformedQuery.executionGraph.push(dsConfig);
        transformedQuery.executionGraph.push(this.getQueryGroupBy(query, ['downsample']));
        transformedQuery.executionGraph.push(this.getQuerySummarizer());

            transformedQuery.serdesConfigs = [{
                id: 'JsonV3QuerySerdes',
                filter: summaryOnly ? ['summarizer'] : [ 'groupby', 'summarizer']
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

    getExpressionQuery(query, index) {
        let filters = [];
        const eid = 'm' + index;
        const qids = [];
        let expValue = query.metrics[index].expression;
        filters = query.filters ? this.transformFilters(query.filters) : [];
        const queries = [];
        for ( let i = 0; i < query.metrics.length; i++ ) {
            const mid = 'm' + index.toString()  + (i + 1);

            const q = {
                id: mid, // using the loop index for now, might need to generate its own id
                type: 'TimeSeriesDataSource',
                metric: {
                    type: 'MetricLiteral',
                    metric: query.metrics[i].metric
                },
                fetchLast: false,
                filter: {}
            };
            if ( filters.length ) {
                q.filter = {
                    type: 'Chain',
                    filters: filters
                };
            } else {
                delete q.filter;
            }
            queries.push(q);
            qids.push(mid);
            const regex = new RegExp( 'm' + (i + 1) , 'g');
            expValue = expValue.replace( regex, mid);
        }
        const expression = {
            id: eid,
            type: 'expression',
            expression: expValue,
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
        return { expression: expression, queries: queries, qids: qids };
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

    getQueryGroupBy(query, sources= []) {
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
            id: 'groupby',
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
        let dsValue = dsSetting.value || '1m';
        switch ( dsSetting.value ) {
            case 'auto':
                dsValue = '5m';
                break;
            case 'custom':
                dsValue = dsSetting.customValue + dsSetting.customUnit;
                break;
        }
        const downsample =  {
            id: 'downsample' + ( qid ? '-' + qid : ''),
            type: 'downsample',
            aggregator: dsSetting.aggregator || 'sum',
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

    getQuerySummarizer() {
        const summarizer =  {
            id: 'summarizer',
            summaries: ['sum', 'max', 'min', 'count', 'avg', 'first', 'last'],
            sources: ['groupby']
        };
        return summarizer;
    }
}

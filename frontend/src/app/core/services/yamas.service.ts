import { Injectable } from '@angular/core';

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
        const groupbyIds = [];

        for (let j = 0; j < query.metrics.length; j++) {
            const isExpression = query.metrics[j].expression ? true : false;

            let q;
            let sources = [];
            if ( query.metrics[j].name) {

                q = this.getMetricQuery(query, j);

                sources = [q.id];
                transformedQuery.executionGraph.push(q);
            } else {
                // const res = this.getExpressionQuery(query.metrics[j], j);
                // q = res.expression;
                // transformedQuery.executionGraph = transformedQuery.executionGraph.concat(res.queries);
                // sources = res.qids;
            }

            mids.push(q.id);
            if ( !summaryOnly  ) {
                transformedQuery.executionGraph.push(this.getQueryDownSample(downsample, q.id, sources));
                const groupby = this.getMetricGroupBy(query, j, q.id, [ 'downsample' + '-' + q.id]);
                transformedQuery.executionGraph.push(groupby);

                q.sources = [groupby.id];
                groupbyIds.push(groupby.id);
                if ( isExpression ) {
                    transformedQuery.executionGraph.push(q);
                }

            }
        }

        if ( summaryOnly ) {
            const dsConfig = this.getQueryDownSample(downsample);
            dsConfig.sources = mids;
            transformedQuery.executionGraph.push(dsConfig);
            transformedQuery.executionGraph.push(this.getMetricGroupBy(query, null, null, ['downsample']));
            transformedQuery.executionGraph.push(this.getQuerySummarizer());
        } else {
            transformedQuery.executionGraph.push({
                id: 'summarizer',
                summaries: ['sum', 'max', 'min', 'count', 'avg', 'first', 'last'],
                sources: groupbyIds
            });

            transformedQuery.serdesConfigs = [{
                id: 'JsonV3QuerySerdes',
                filter: [ ...groupbyIds, 'summarizer']
            }];
        }
        return transformedQuery;
    }

    getMetricQuery(query, index) {
        const mid = 'm' + index;
        let filters = [];
        const q = {
            id: mid, // using the loop index for now, might need to generate its own id
            type: 'TimeSeriesDataSource',
            metric: {
                type: 'MetricLiteral',
                metric:  query.namespace + '.' + query.metrics[index].name
            },
            fetchLast: false,
            filter: {}
        };
        filters = query.filters ? this.transformFilters(query.filters) : [];
        if ( filters.length ) {
            q.filter = {
                type: 'Chain',
                op: 'AND',
                filters: filters
            };
        } else {
            delete q.filter;
        }
        return q;
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

    getMetricGroupBy(query= null, index= null, qid= null, sources= []) {
        const filters = query.filters || [];
        const tagKeys = [];
        for ( let i = 0; filters && i < filters.length; i++ ) {
            if ( filters[i].groupBy ) {
                tagKeys.push(filters[i].tagk);
            }
        }
        const groupById = 'groupby' + (qid ? '-' + qid : '');
        const metricGroupBy =  {
            id: groupById,
            type: 'groupby',
            aggregator: 'sum', // mConfig.aggregator,
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

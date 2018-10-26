import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YamasService {

    constructor() { }

    buildQuery( time, metrics, downsample= {} , summary= false) {

        const query = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };
        const mids = [];

        for (let j = 0; j < metrics.length; j++) {
            const isExpression = metrics[j].expression ? true : false;

            if ( isExpression )  {
                // continue;
            }

            let q;
            let sources = [];
            if ( metrics[j].metric) {
                q = this.getMetricQuery(metrics[j], j);
                sources = [q.id];
                query.executionGraph.push(q);
            } else {
                const res = this.getExpressionQuery(metrics[j], j);
                q = res.expression;
                query.executionGraph = query.executionGraph.concat(res.queries);
                sources = res.qids;
            }

            mids.push(q.id);
            if ( !summary  ) {
                query.executionGraph.push(this.getQueryDownSample(downsample, q.id, sources));
                const groupby = this.getMetricGroupBy(metrics[j], q.id, [ 'downsample' + '-' + q.id]);
                query.executionGraph.push(groupby);
                q.sources = [groupby.id];
                if ( isExpression ) {
                    query.executionGraph.push(q);
                }
            }
        }

        if ( summary ) {
            const dsConfig = this.getQueryDownSample(downsample);
            dsConfig.sources = mids;
            query.executionGraph.push(dsConfig);
            query.executionGraph.push(this.getMetricGroupBy(null, null, ['downsample']));
            query.executionGraph.push(this.getQuerySummarizer());
        }
        return query;
    }

    getMetricQuery(m, index) {
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex'};
        const mid = 'm' + index;
        const filters = [];
        for (let k = 0; m.filters && k < m.filters.length; k++) {
            const f = m.filters[k];
            const filter = {
                type: filterTypes[f.type],
                filter: f.filter,
                tagKey: f.tagk
            };
            filters.push(filter);
        }
        const q = {
            id: mid, // using the loop index for now, might need to generate its own id
            type: 'TimeSeriesDataSource',
            metric: {
                type: 'MetricLiteral',
                metric: m.metric
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
        return q;
    }

    getExpressionQuery(query, index) {
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex'};
        const filters = [];
        const eid = 'm' + index;
        const qids = [];
        let expValue = query.expression;
        for (let k = 0; query.filters && k < query.filters.length; k++) {
            const f = query.filters[k];
            const filter = {
                type: filterTypes[f.type],
                filter: f.filter,
                tagKey: f.tagk
            };
            filters.push(filter);
        }
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

    getMetricGroupBy(mConfig= null, qid= null, sources= []) {
        const filters = mConfig && mConfig.filters ? mConfig.filters : [];
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
            aggregator: 'sum', //mConfig.aggregator,
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

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
        const mid = 'm' + index;
        let filters = [];
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
        filters = m.filters ? this.transformFilters(m.filters) : [];
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
        let filters = [];
        const eid = 'm' + index;
        const qids = [];
        let expValue = query.expression;
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
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex'};
        const filters = [];
        for (let k = 0;  k < fConfigs.length; k++) {
            const f = fConfigs[k];
            const filter = {
                type: filterTypes[f.type],
                filter: Array.isArray(f.filter) ? f.filter.join('|') : f.filter,
                tagKey: f.tagk
            };
            filters.push(filter);
        }
        return filters;
    }


    createFilters(metric: any, dashboardTags: any): Array<any> {
        const filterTypes = {   'literalor': 'TagValueLiteralOr',
                                'wildcard': 'TagValueWildCard',
                                'regexp': 'TagValueRegex',
                                'literal': 'TagValueLiteralOr' };
        const filters = [];
        if (!dashboardTags) {
            dashboardTags = [];
        }

        for (let k = 0; metric.filters && k < metric.filters.length; k++) {
            const f = metric.filters[k];
            const filter = {
                type: filterTypes[f.type],
                filter: f.filter,
                tagKey: f.tagk
            };
            if (!this.isTagKeyAlsoADashboardTagKey(f.tagk, dashboardTags)) {
                filters.push(filter);
            }
        }

        // Dashboard Tags
        for (let tag of dashboardTags) {
            const filter = {
                type: 'TagValueLiteralOr',
                filter: '',
                tagKey: tag.key
            };

            // append tag values together
            let _filter = '';
            for (let tagValue of tag.selectedValues) {

                // only set tagValue if not empty
                if (tagValue.trim().length) {

                    if (String(tagValue).includes('*')) { // set to wildcard
                        _filter = tagValue;
                        filter.type = 'TagValueWildCard';
                        break;
                    } else if (_filter.length) { // append to existing string
                        _filter = _filter + '|' + tagValue;
                    } else { // empty string
                        _filter = tagValue;
                    }
                }
            }
            // set the appended tag keys to filter
            filter.filter = _filter;

             if (filter.tagKey.trim().length && filter.filter.trim().length) {
                filters.push(filter);
            }
        }
        return filters;
    }

    isTagKeyAlsoADashboardTagKey(key: string, dashboardTags: any) {
        for (let tag of dashboardTags) {
            console.log(tag);
            // tag values exist, tag keys are equal
            if (String(tag.key).trim() === key.trim()) {
                return true;
            }
        }
        return false;
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

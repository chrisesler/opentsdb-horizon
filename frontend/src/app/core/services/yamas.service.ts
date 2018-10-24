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
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex'};
        for (let j = 0; j < metrics.length; j++) {
            const m = metrics[j];
            const mid = 'm' + j;
            const filters = [];
            mids.push(mid);
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

            query.executionGraph.push(q);
            if ( !summary ) {
                query.executionGraph.push(this.getQueryDownSample(downsample, mid));
                query.executionGraph.push(this.getMetricGroupBy(m, mid));
            }
        }

        if ( summary ) {
            const dsConfig = this.getQueryDownSample(downsample);
            dsConfig.sources = mids;
            query.executionGraph.push(dsConfig);
            query.executionGraph.push(this.getMetricGroupBy());
            query.executionGraph.push(this.getQuerySummarizer());
        }
        console.log(JSON.stringify(query));
        return query;
    }

    getMetricGroupBy(mConfig= null, mid= null) {
        const filters = mConfig && mConfig.filters ? mConfig.filters : [];
        const tagKeys = [];
        for ( let i = 0; filters && i < filters.length; i++ ) {
            if ( filters[i].groupBy ) {
                tagKeys.push(filters[i].tagk);
            }
        }
        const groupById = 'groupby' + (mid ? '-' + mid : '');
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
            sources: ['downsample' + (mid ? '-' + mid : '')]
        };
        return metricGroupBy;
    }

    getQueryDownSample(dsSetting, mid= null) {
        let dsValue = dsSetting.value || '1m';
        const mids = mid ? [mid] : [];
        switch ( dsSetting.value ) {
            case 'auto':
                dsValue = '5m';
                break;
            case 'custom':
                dsValue = dsSetting.customValue + dsSetting.customUnit;
                break;
        }
        const downsample =  {
            id: 'downsample' + ( mid ? '-' + mid : ''),
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
            sources: mids
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

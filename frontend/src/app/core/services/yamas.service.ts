import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YamasService {
    query: any;
    downsample: any;
    time: any;
    transformedQuery:any;

    constructor() { }

    buildQuery( time, query, downsample: any = {} , summaryOnly= false, sorting) {

        this.query = query;
        this.downsample = downsample;
        this.time = time;
        this.transformedQuery = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };

        const mids = [];
        let hasCommonFilter = false;
        let filterId = query.filters.length ? 'filter' : '';
        let outputIds = [];
        let groupByIds = [];

        this.downsample.aggregator = this.downsample.aggregators ? this.downsample.aggregators[0] : 'avg';

        for (let j = 0; j < query.metrics.length; j++) {
            const isExpression = query.metrics[j].expression ? true : false;

            if ( query.metrics[j].expression ) {
                const q = this.getExpressionQuery(j);
                this.transformedQuery.executionGraph.push(q);
                outputIds.push(q.id);
            } else {
                const q: any = this.getMetricQuery(j);
                if ( query.metrics[j].groupByTags && !this.checkTagsExistInFilter(query.metrics[j].groupByTags) ) {
                    const filter = this.getFilterQuery(j);
                    q.filter = filter.filter;
                } else if ( filterId ) {
                    hasCommonFilter = true;
                    q.filterId = filterId;
                }
                this.transformedQuery.executionGraph.push(q);
                const aggregator = downsample.aggregator;
                const prefix = 'm' + j + '-' + aggregator;
                let dsId = prefix + '-downsample';
                // add downsample for the expression
                this.transformedQuery.executionGraph.push(this.getQueryDownSample(downsample, aggregator, dsId, [q.id]));

                // add function definition
                const res = this.getFunctionQueries(j, dsId);
                if ( res.queries.length ) {
                    this.transformedQuery.executionGraph = this.transformedQuery.executionGraph.concat(res.queries);
                    dsId = res.queries[res.queries.length-1].id;
                }

                const groupbyId = prefix + '-groupby';
                groupByIds.push(groupbyId);
                this.transformedQuery.executionGraph.push(this.getQueryGroupBy(query.metrics[j].tagAggregator, query.metrics[j].groupByTags, [dsId], groupbyId));
                outputIds.push(groupbyId);
            }
        }

        // add common filters
        if ( query.filters.length && hasCommonFilter) {
            let _filter: any = this.getFilterQuery();
            _filter.id = filterId;
            this.transformedQuery.filters = [_filter];
        }

        if (sorting && sorting.order && sorting.limit) {
            this.transformedQuery.executionGraph.push(this.getTopN(sorting.order, sorting.limit, outputIds));
            this.transformedQuery.executionGraph.push(this.getQuerySummarizer(['topn']));
        } else {
            // transformedQuery.executionGraph.push(this.getQuerySummarizer(['groupby']));
            this.transformedQuery.executionGraph.push(this.getQuerySummarizer(outputIds));
        }


        this.transformedQuery.serdesConfigs = [{
            id: 'JsonV3QuerySerdes',
            filter: summaryOnly ? ['summarizer'] : outputIds.concat(['summarizer']) // outputIds : outputIds.concat(['summarizer'])
        }];
        console.log('tsdb query', JSON.stringify(this.transformedQuery));
        return this.transformedQuery;
    }

    getMetricQuery(index) {
        const mid = 'm' + index;
        const q = {
            id: mid, // using the loop index for now, might need to generate its own id
            type: 'TimeSeriesDataSource',
            metric: {
                type: 'MetricLiteral',
                metric:  this.query.namespace + '.' + this.query.metrics[index].name
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
            'aggregator': this.downsample.aggregator,
            'top': _order,
            'count': count
        };
    }

    getFilterQuery(index = -1) {
        const filters = this.query.filters ? this.transformFilters(this.query.filters) : [];
        const groupByTags = this.query.metrics[index] ? this.query.metrics[index].groupByTags : [];
        let filter:any = {
                        filter : {
                            type: 'Chain',
                            op: 'AND',
                            filters: filters
                        }
                    };
        // add groupby tags to filters if its not there
        for ( let i = 0;  groupByTags && i < groupByTags.length; i++ ) {
            const index = this.query.filters.findIndex(d => d.tagk === groupByTags[i]);
            if ( index === -1 ) {
                filter.filter.filters.push( this.getFilter(groupByTags[i], 'regexp(.*)'));
            }
        }
        if ( this.query.settings.explicitTagMatch ) {
            filter = { filter : { type: 'ExplicitTags', filter: filter.filter } };
        }
        return filter;
    }

    addTagGroupByFilters( filter, groupByTags ) {
        const gFilters = [];
        
    }

    getSourceIndexById(id) {
        const metrics = this.query.metrics;
        const index = this.query.metrics.findIndex(d => d.id === id );
        const qid  =  'm' + index;
        return index;
    }

    getGroupbyTagsByQId(index, aggregator) {
        let groupByTags = [];
        let expression = undefined;
        if (this.query.metrics[index] && this.query.metrics[index].expression) {
            expression = this.query.metrics[index].expression;
        }
        if (expression) {
            // replace {{<id>}} with query source id
            const re = new RegExp(/\{\{(.+?)\}\}/, "g");
            let matches = [];
            let i =0;
            while(matches = re.exec(expression)) {
                const id = matches[1];
                const mindex = this.query.metrics.findIndex(d => d.id === id );
                // const sourceId = 'm' + mindex;
                const mTags = this.getGroupbyTagsByQId( mindex, aggregator);
                groupByTags = i === 0 ? mTags : groupByTags.filter(v => mTags.includes(v));
                i++;
            }
        } else {
            const id =   'm' + index + '-' + aggregator + '-groupby';
            const qindex = this.transformedQuery.executionGraph.findIndex(d => d.id === id );
            if (qindex > -1) {
                groupByTags  =  this.transformedQuery.executionGraph[qindex].tagKeys || [];
            }
        }
        return groupByTags;
    }

    getFunctionQueries(index, ds) {
        const queries = [];
        const funs = this.query.metrics[index].functions || [];
        for ( let i =0; i < funs.length; i++ ) {
            const id = "m" + index + '-rate-' + i;
            const fxCall = funs[i].fxCall;
            switch ( fxCall ) {
                case 'RateOfChange':
                case 'CounterToRate':
                    const q = {
                            "id": id ,
                            "type": "rate",
                            "interval": funs[i].val,
                            "counter": fxCall === 'RateOfChange' ? false : true,
                            "sources": [ds]
                        };
                    queries.push(q);
                    ds = id;
                break;
            }
        }
        return { queries: queries };
    }
    getExpressionQuery(index) {
        const config = this.query.metrics[index];
        const aggregator = this.downsample.aggregator;
        const eid = "m" + index;

        const sources = [];
        const  expression = config.expression;
        let transformedExp = expression;

        // replace {{<id>}} with query source id
        const re = new RegExp(/\{\{(.+?)\}\}/, "g");
        let matches = [];
        while(matches = re.exec(expression)) {
            const id = matches[1];
            const idreg = new RegExp( '\\{\\{' + id + '\\}\\}' , 'g');
            const mindex = this.getSourceIndexById(id);
            const sourceId = 'm' + mindex;
            let gsourceId = sourceId;
            if (mindex > -1) {
                gsourceId = this.query.metrics[mindex].expression === undefined ? sourceId + '-' + aggregator + '-groupby' : sourceId ; 
            } 
            transformedExp = transformedExp.replace( idreg, sourceId );
            sources.push(gsourceId);
        }
        
        const joinTags = {};
        const groupByTags = this.getGroupbyTagsByQId( index,  aggregator);;
        for ( let i=0; i < groupByTags.length; i++ ) {
            const tag = groupByTags[i];
            joinTags[tag] = tag;
        }
        const econfig = {
            id: eid,
            type: 'expression',
            expression: transformedExp,
            join: {
                type: 'Join',
                joinType: groupByTags.length ? 'INNER' : 'NATURAL_OUTER', 
                joins: joinTags
            },
            interpolatorConfigs: [{
                dataType: 'numeric',
                fillPolicy: 'NAN',
                realFillPolicy: 'NONE'
            }],
            variableInterpolators: {},
            sources: sources
        };
        return econfig;
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

    getQueryGroupBy(tagAggregator, tagKeys, sources, id= null) {
        let aggregator =  tagAggregator || 'sum';

        const metricGroupBy =  {
            id: id ? id : 'groupby',
            type: 'groupby',
            aggregator: aggregator,
            tagKeys: tagKeys ? tagKeys : [],
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

    getQueryDownSample(dsSetting, aggregator, id= null, sources= []) {
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

    checkTagsExistInFilter(tags) {
        const filters = this.query.filters;
        let exists = true;

        for ( let i = 0; i < tags.length; i++ ) {
            const index = filters.findIndex(d => d.tagk === tags[i]);
            if ( index === -1 ) {
                exists = false;
            }
        }
        return exists;
    }
}

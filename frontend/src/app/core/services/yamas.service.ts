import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class YamasService {
    queries: any = [];
    downsample: any;
    time: any;
    transformedQuery:any;

    constructor( private utils: UtilsService ) { }

    buildQuery( time, queries, downsample: any = {} , summaryOnly= false, sorting) {

        this.downsample = {...downsample};
        this.time = time;
        this.transformedQuery = {
            start: time.start,
            end: time.end,
            executionGraph: []
        };

        this.queries = queries;
        const outputIds = [];

        for ( const i in this.queries ) {
            if ( this.queries[i]) {
                let hasCommonFilter = false;
                const filterId = this.queries[i].filters.length ? 'filter-' + this.queries[i].id  : '';
                const groupByIds = [];

                this.downsample.aggregator = this.downsample.aggregators ? this.downsample.aggregators[0] : 'avg';

                for (let j = 0; j < this.queries[i].metrics.length; j++) {

                    if ( this.queries[i].metrics[j].expression ) {
                        const q = this.getExpressionQuery(i, j);
                        this.transformedQuery.executionGraph.push(q);
                        let dsId = q.id;
                        // add function definition
                        const res = this.getFunctionQueries(i, j, dsId);
                        if ( res.queries.length ) {
                            this.transformedQuery.executionGraph = this.transformedQuery.executionGraph.concat(res.queries);
                            dsId = res.queries[res.queries.length-1].id;
                        }
                        outputIds.push(dsId);
                    } else {
                        const q: any = this.getMetricQuery(i, j);
                        if ( this.queries[i].metrics[j].groupByTags && !this.checkTagsExistInFilter(i, this.queries[i].metrics[j].groupByTags) ) {
                            const filter = this.getFilterQuery(i, j);
                            q.filter = filter.filter;
                        } else if ( filterId ) {
                            hasCommonFilter = true;
                            q.filterId = filterId;
                        }
                        this.transformedQuery.executionGraph.push(q);
                        const aggregator = downsample.aggregator;
                        let dsId = q.id + '-downsample';
                        // add downsample for the expression
                        this.transformedQuery.executionGraph.push(this.getQueryDownSample(downsample, aggregator, dsId, [q.id]));

                        // add function definition
                        const res = this.getFunctionQueries(i, j, dsId);
                        if ( res.queries.length ) {
                            this.transformedQuery.executionGraph = this.transformedQuery.executionGraph.concat(res.queries);
                            dsId = res.queries[res.queries.length-1].id;
                        }

                        const groupbyId = q.id + '-groupby';
                        groupByIds.push(groupbyId);
                        this.transformedQuery.executionGraph
                            .push(this.getQueryGroupBy(this.queries[i].metrics[j].tagAggregator, this.queries[i].metrics[j].groupByTags, [dsId], groupbyId));
                        outputIds.push(groupbyId);
                    }
                }

                // add common filters
                if ( this.queries[i].filters.length && hasCommonFilter) {
                    if ( !this.transformedQuery.filters ) {
                        this.transformedQuery.filters = [];
                    }
                    const _filter: any = this.getFilterQuery(i);
                    _filter.id = filterId;
                    this.transformedQuery.filters.push(_filter);
                }
            }
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

    getMetricQuery(qindex, mindex) {
        const mid = this.utils.getDSId(this.queries, qindex, mindex);
        const q = {
            id: mid, // using the loop index for now, might need to generate its own id
            type: 'TimeSeriesDataSource',
            metric: {
                type: 'MetricLiteral',
                metric:  this.queries[qindex].namespace + '.' + this.queries[qindex].metrics[mindex].name
            },
            fetchLast: false,
        };

        return q;
    }

    getTopN(order: string, count: number, sources: string[]) {

        let _order = true;  // true is topN
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

    getFilterQuery(qindex, mindex = -1) {
        const filters = this.queries[qindex].filters ? this.transformFilters(this.queries[qindex].filters) : [];
        const groupByTags = this.queries[qindex].metrics[mindex] ? this.queries[qindex].metrics[mindex].groupByTags : [];
        let filter:any = {
                        filter : {
                            type: 'Chain',
                            op: 'AND',
                            filters: filters
                        }
                    };
        // add groupby tags to filters if its not there
        for ( let i = 0;  groupByTags && i < groupByTags.length; i++ ) {
            const index = this.queries[qindex].filters.findIndex(d => d.tagk === groupByTags[i]);
            if ( index === -1 ) {
                filter.filter.filters.push( this.getFilter(groupByTags[i], 'regexp(.*)'));
            }
        }
        if ( this.queries[qindex].settings.explicitTagMatch ) {
            filter = { filter : { type: 'ExplicitTags', filter: filter.filter } };
        }
        return filter;
    }

    addTagGroupByFilters( filter, groupByTags ) {
        const gFilters = [];
    }

    getSourceIndexById(qindex, id) {
        const index = this.queries[qindex].metrics.findIndex(d => d.id === id );
        return index;
    }

    getFunctionQueries(qindex, index, ds) {
        const queries = [];
        const funs = this.queries[qindex].metrics[index].functions || [];
        for ( let i = 0; i < funs.length; i++ ) {
            const id = 'm' + index + '-rate-' + i;
            const fxCall = funs[i].fxCall;
            const q = {
                'id': id ,
                'type': 'rate',
                'interval': funs[i].val,
                'counter': false,
                'dropResets': false,
                'deltaOnly': false,
                'sources': [ds]
            };
            switch ( fxCall ) {
                case 'RateOfChange':
                    q.deltaOnly = false;
                    break;
                case 'RateDiff':
                    q.deltaOnly = true;
                    break;
                case 'CounterToRate':
                    q.counter = true;
                    q.dropResets = true;
                    q.deltaOnly = false;
                    break;
                case 'CounterDiff':
                    q.counter = true;
                    q.dropResets = true;
                    q.deltaOnly = true;
                break;
            }
            queries.push(q);
            ds = id;
        }
        return { queries: queries };
    }

    getExpressionQuery(qindex, mindex) {
        const config = this.queries[qindex].metrics[mindex];
        const eid = this.utils.getDSId(this.queries, qindex, mindex);

        const sources = [];
        const  expression = config.expression;
        let transformedExp = expression;

        // replace {{<id>}} with query source id
        const re = new RegExp(/\{\{(.+?)\}\}/, 'g');
        let matches = [];
        while (matches = re.exec(expression)) {
            const id = matches[1];
            const idreg = new RegExp( '\\{\\{' + id + '\\}\\}' , 'g');
            const sindex = this.getSourceIndexById(qindex, id);
            const sourceId = this.utils.getDSId(this.queries, qindex, sindex);
            let gsourceId = sourceId;
            if (sindex > -1) {
                gsourceId = this.queries[qindex].metrics[sindex].expression === undefined ? sourceId +  '-groupby' : sourceId ;
            }
            transformedExp = transformedExp.replace( idreg, ' ' + sourceId + ' ' );
            sources.push(gsourceId);
        }
        const joinTags = {};
        const groupByTags = config.groupByTags || [];
        for ( let i = 0; i < groupByTags.length; i++ ) {
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
        const filterTypes = {
            'literalor': 'TagValueLiteralOr',
            'wildcard': 'TagValueWildCard',
            'regexp': 'TagValueRegex',
            'librange': 'TagValueLibrange'
        };
        const regexp = v.match(/regexp\((.*)\)/);
        let filtertype = 'literalor';
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
    
    getOrFilters(key, values) {
        const filterTypes = { 'literalor': 'TagValueLiteralOr', 'wildcard': 'TagValueWildCard', 'regexp': 'TagValueRegex', 'librange': 'TagValueLibrange'};
        const filters = [];
        const literals = [];
        for ( let i = 0, len = values.length; i < len; i++ ) {
            let v = values[i];
            const regexp = v.match(/regexp\((.*)\)/);
            var filtertype = 'literalor';
            if (regexp) {
                filtertype = 'regexp';
                v = regexp[1];
            } else if (v.match(/librange\((.*)\)/)) {
                const librange = v.match(/librange\((.*)\)/);
                filtertype = 'librange';
                v = librange[1];
            } else {
                literals.push(v);
            }
            if ( filtertype !== 'literalor' ) {
                const filter = {
                    type: filterTypes[filtertype],
                    filter: v,
                    tagKey: key
                };
                filters.push(filter);
            }
        }
        
        if ( literals.length ) {
            const filter = {
                type: 'TagValueLiteralOr',
                filter: literals.join('|'),
                tagKey: key
            };
            filters.push(filter);
        }
        return filters;
    }

    getChainFilter(key, values) {
        const chain:any = {
                        'type': 'Chain',
                        'op': 'OR',
                        'filters': []
                    };
        chain.filters = this.getOrFilters(key, values);
        return chain;
    }

    getQueryGroupBy(tagAggregator, tagKeys, sources, id= null) {
        const aggregator =  tagAggregator || 'sum';

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
            interval: dsValue, // summary ? '0all' : dsValue,
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

    checkTagsExistInFilter(qindex, tags) {
        const filters = this.queries[qindex].filters;
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

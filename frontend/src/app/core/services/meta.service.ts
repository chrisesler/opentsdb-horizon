import { Injectable } from '@angular/core';
import { UtilsService } from '../services/utils.service';


@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(private utilsService: UtilsService) { }

  getQuery(type, params) {
    params = Array.isArray(params) ? params : [params];
    const metaQuery:any = {
      "from": 0,
      "to": 1,
      "order": "ASCENDING",
      "type": type,
      "aggregationSize": 1000,
      "queries": [],
    };

    for ( let i = 0, len = params.length; i < len; i++ ) {
      const query:any = {
                          "filter": {
                          "type": "Chain",
                          "filters": []
                      }};
      query.id = params[i].id || 'id-' + i;
      query.namespace =  type !== 'NAMESPACES' ? params[i].namespace : this.utilsService.convertPatternTSDBCompat(params[i].search);
      if ( type === 'TAG_KEYS_AND_VALUES') {
        metaQuery.aggregationField =  params[i].tagkey;
        query.filter.filters.push({
          type: 'TagValueRegex',
          filter: this.utilsService.convertPatternTSDBCompat(params[i].search),
          tagKey: params[i].tagkey
        });
      }
      switch( type ) {
        case 'METRICS':
          query.filter.filters.push({
            'type': "MetricRegex",
            'metric': this.utilsService.convertPatternTSDBCompat(params[i].search)
          });
          break;

        // set the metrics filter only if its set. tsdb requires atleast one filter in the query
        case 'TAG_KEYS':
            query.filter.filters.push({
              "type": "TagKeyRegex",
              "filter": this.utilsService.convertPatternTSDBCompat(params[i].search)
            });
          break;
      }

      if ( params[i].metrics && params[i].metrics.length ) {
        for ( let j = 0; j < params[i].metrics.length; j++ ) {
          query.filter.filters.push({
            'type': 'MetricLiteral',
            'metric': params[i].metrics[j]
          });
        }
      }

      for (let k = 0;  params[i].tags && k < params[i].tags.length; k++) {
          const f = params[i].tags[k];
          const values = f.filter;
          const filter:any = values.length === 1 ? this.getFilter(f.tagk, values[0]) : this.getChainFilter(f.tagk, values);
          query.filter.filters.push(filter);
      }
      metaQuery.queries.push(query);
    }

    return metaQuery;
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
}

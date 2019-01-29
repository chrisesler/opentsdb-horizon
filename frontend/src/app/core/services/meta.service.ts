import { Injectable } from '@angular/core';
import { UtilsService } from '../services/utils.service';


@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(private utilsService: UtilsService) { }

  getQuery(type, params) {
    const query:any = {
      "from": 0,
      "to": 1,
      "order": "ASCENDING",
      "type": type,
      "aggregationSize": 100,
      "namespace": type !== 'NAMESPACES' ? params.namespace : this.utilsService.convertPatternTSDBCompat(params.search),
      "filter": {
          "type": "Chain",
          "filters": []
      }
    };

    let filter: any = {};
    if ( type === 'TAG_KEYS_AND_VALUES') {
      query.aggregationField =  params.tagkey;
      filter = {
        type: 'TagValueRegex',
        filter: this.utilsService.convertPatternTSDBCompat(params.search),
        tagKey: params.tagkey
      };
      query.filter.filters.push(filter);
    }
    switch( type ) {
      // remove the host filter later. tsdb requires atleast one filter in the query
      case 'NAMESPACES':
        filter = {
          'type': 'TagValueRegex',
          'filter': '.*',
          'tagKey': 'host'
        };
        query.filter.filters.push(filter);
        break;
      case 'METRICS':
        filter = {
          'type': "MetricRegex",
          'metric': this.utilsService.convertPatternTSDBCompat(params.search)
        };
        query.filter.filters.push(filter);
        break;

      // set the metrics filter only if its set. tsdb requires atleast one filter in the query
      case 'TAG_KEYS':
        filter = {
          "type": "TagKeyRegex",
          "filter": this.utilsService.convertPatternTSDBCompat(params.search)
        };
        query.filter.filters.push(filter);
        break;
    }

    if ( params.metrics && params.metrics.length ) {
      filter = {
        "type": "MetricRegex",
        "metric": params.metrics.join('|')
      };
      query.filter.filters.push(filter);
    }

    for (let k = 0;  params.tags && k < params.tags.length; k++) {
        const f = params.tags[k];
        const values = f.filter;
        const filter:any = values.length === 1 ? this.getFilter(f.tagk, values[0]) : this.getChainFilter(f.tagk, values);
        query.filter.filters.push(filter);
    }

    return query;
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

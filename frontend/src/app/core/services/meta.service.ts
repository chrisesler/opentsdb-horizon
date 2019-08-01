import { Injectable } from '@angular/core';
import { UtilsService } from '../services/utils.service';


@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(private utilsService: UtilsService) { }

  getQuery(source, type, params, andOp = true) {
    const [ mSource, fType ] = source.split(':');
    params = Array.isArray(params) ? params : [params];
    const metaQuery: any = {
      'from': 0,
      'to': 1,
      'order': 'ASCENDING',
      'type': type,
      'source': mSource === 'aurastatus' ? 'aurastatus' : '',
      'aggregationSize': 1000,
      'queries': [],
    };

    for ( let i = 0, len = params.length; i < len; i++ ) {
      const filters = [];
      const query: any = {};
      query.id = params[i].id || 'id-' + i;
      query.namespace =  type !== 'NAMESPACES' ? params[i].namespace : this.utilsService.convertPatternTSDBCompat(params[i].search);
      if ( type === 'TAG_KEYS_AND_VALUES') {
        metaQuery.aggregationField =  params[i].tagkey;
        filters.push({
          type: 'TagValueRegex',
          filter: this.utilsService.convertPatternTSDBCompat(params[i].search),
          tagKey: params[i].tagkey
        });
      }
      switch( type ) {
        case 'METRICS':
          filters.push({
            'type': 'MetricRegex',
            'metric': this.utilsService.convertPatternTSDBCompat(params[i].search)
          });
          break;

        // set the metrics filter only if its set. tsdb requires atleast one filter in the query
        case 'TAG_KEYS':
            if ( mSource === 'meta' ) {
              filters.push({
                'type': 'TagKeyRegex',
                'filter': this.utilsService.convertPatternTSDBCompat(params[i].search)
              });
            }
          break;
      }

      if (params[i].metrics && params[i].metrics.length) {
        if (andOp) {
          for (let j = 0; j < params[i].metrics.length; j++) {
            filters.push({
              'type': 'MetricLiteral',
              'metric': params[i].metrics[j]
            });
          }
        } else {
          filters.push({
            'type': 'MetricLiteral',
            'metric': params[i].metrics.join('|')
          });
        }
      }

      if ( mSource === 'aurastatus' && (type === 'TAG_KEYS' || type === 'TAG_KEYS_AND_VALUES') ) {
        filters.unshift({
          'type': 'FieldLiteralOr',
          'key': 'statusType',
          'filter': fType === 'alert' ? 'alert' : 'check'
        });
      }

      for (let k = 0;  params[i].tags && k < params[i].tags.length; k++) {
          const f = params[i].tags[k];
          const values = f.filter;
          const filter:any = values.length === 1 ? this.getFilter(f.tagk, values[0]) : this.getChainFilter(f.tagk, values);
          filters.push(filter);
      }
      if ( filters.length ) {
        query.filter = {
                          'type': 'Chain',
                          'filters': filters
                        };
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
    const literalorV = [];
    const chain = {
                    'type': 'Chain',
                    'op': 'OR',
                    'filters': []
                };
    for ( let i = 0, len = values.length; i < len; i++ ) {
      const regexp = values[i].match(/regexp\((.*)\)/);
      const v = regexp ? regexp[1] : values[i];
      const type = regexp  ? 'regexp' : 'literalor';
      if ( type === 'regexp') {
        chain.filters.push(this.getFilter(key, values[i]));
      } else {
        literalorV.push(v);
      }
    }

    if ( literalorV.length > 0 ) {
      chain.filters.push({ type: 'TagValueLiteralOr', filter: literalorV.join('|'), tagKey: key});
    }
    return chain;
  }
}

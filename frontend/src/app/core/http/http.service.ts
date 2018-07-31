import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { UtilsService } from  '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient, private utilsService: UtilsService) { }

  private testDashboard: any = {
    id: 'abcdfg',
    settings: {
      title: 'my test dashboard'
    },
    widgets: [
      {
        id: 'abcd',
        gridPos: { x: 0, y: 0, w: 6, h: 5 },
        settings: {
          title: 'my widget title',
          component_type: 'LinechartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          start: '1h-ago',
          end: '',
          downsample: '60m-avg-nan',
          groups: [
            {
              id: 'gaga',
              title: 'group 2',
              visual: {},
              queries: [
                {
                  metric: 'Flickr.yapache.response_time',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'colo',
                      filter: '*',
                      groupBy: true
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'cdft',
        gridPos: { x: 6, y: 0, w: 6, h: 5 },
        settings: {
          title: 'my widget second title',
          component_type: 'LinechartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          start: '1h-ago',
          end: '',
          downsample: '60m-avg-nan',
          groups: [
            {
              id: 'werd',
              title: 'group 2',
              visual: {},
              queries: [
                {
                  metric: 'Flickr.yapache.requests',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'host',
                      filter: '*',
                      groupBy: false
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'multigroup',
        gridPos: { x: 0, y: 6, w: 6, h: 5 },
        settings: {
          title: 'my widget third title',
          component_type: 'LinechartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          start: '1h-ago',
          end: '',
          downsample: '60m-avg-nan',
          groups: [
            {
              id: 'werd',
              title: 'group 1',
              visual: {},
              queries: [
                {
                  metric: 'Flickr.yapache.requests',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'host',
                      filter: '*',
                      groupBy: true
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  }
                }
              ]
            },
            {
              id: 'gffg',
              title: 'group 2',
              visual: {},
              queries: [
                {
                  metric: 'Flickr.yapache.response_time',
                  filters: [
                    {
                      type: 'wildcard',
                      tagk: 'colo',
                      filter: '*',
                      groupBy: true
                    }
                  ],
                  aggregator: 'zimsum',
                  explicitTags: false,
                  rate: false,
                  rateOptions: {
                    counter: false,
                    resetValue: 1
                  }
                }
              ]
            }
          ]
        }
      },
      {
        id: 'bar',
        gridPos: { x: 6, y: 6, w: 6, h: 5 },
        settings: {
          title: 'Bar Chart',
          component_type: 'BarchartWidgetComponent',
          data_source: 'yamas'
        },
        query: {
          start: '1h-ago',
          end: '',
          downsample: '60m-avg-nan',
          groups: [
            {
              id: 'werd',
              title: 'group 1',
              visual: {},
              queries: [
                {
                    aggregator: 'zimsum',
                    explicitTags:false,
                    metric:'Flickr.search.com.yahoo.titan.vespa.DefaultVespaRepository.vespa.findBy.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                },
                {
                    aggregator: 'zimsum',
                    downsample: '60m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.search.com.flickr.search.domain.vespa.repository.VespaMediaResponseDeserializer.vespa.totalNumberOfResults.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1,
                },
                {
                    aggregator: 'zimsum',
                    downsample: '60m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.search.com.flickr.search.domain.vespa.repository.VespaMediaResponseDeserializer.vespa.deserializeCollection.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1
                },
                {
                    aggregator: 'zimsum',
                    downsample: '60m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.search.com.flickr.search.adapters.rest.SearchRestAdapter./search.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1
                },
                {
                    aggregator: 'zimsum',
                    downsample: '60m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.search.com.flickr.catalog.domain.legacy.media.MediaRepositoryV1.findAll.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1
                },
                {
                    aggregator: 'zimsum',
                    downsample: '60m-avg-nan',
                    explicitTags:false,
                    metric:'Flickr.search.com.flickr.aggregation.adapters.rest.AggregationFrameworkTagsRestAdapter./tags/toptrending/year.requests.Count',
                    rate: false,
                    rateOptions : {
                        counter: false,
                        resetValue: 1
                    },
                    counter: false,
                    resetValue: 1
                }
              ]
            }

          ]
        }
      }
    ]
  };

  getDashoard(id: string): Observable<any> {
    // modify widget to support responsive, drag and drop, resize before return
    this.utilsService.modifyWidgets(this.testDashboard);
    return Observable.of(this.testDashboard);
  }

  /* to handle error  with more info */
  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // a client-side or network error occured
      console.log('An error occured:', error.error.message);
    } else {
      // the backend returned unsuccessful response code
      // the response body may contain clues of what went wrong
      console.error(
        `backend return code ${error.status}, ` +
        `body was: ${error.error}`
      );
    }
    return throwError(
      'Something bad happened; please try again later.'
    );
  }
  /* will refactor later */
  getYamasData(query: any): Observable<any> {
    const headers = new HttpHeaders(
      { 'Content-Type': 'application/json' });
    // let apiUrl = environment.tsdb_host + '/api/query';
    return this.http.post('/tsdb/queryData', query, { headers, withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }
  /* post to search for metric */
  searchMetrics(queryObj: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post('/search/msearch', queryObj, { headers, withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

}

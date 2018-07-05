import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  private dashboard: any  = {
    id: '123456',
    settings: {
      title: 'my dashboard'
    },
    widgets: [
      {
        gridPos: {
          x: 0, y: 0,
          w: 6, h: 5
        },
        config: {
          title: 'LinechartWidgetComponent',
          component_type: 'LinechartWidgetComponent',
          data_source: 'opentsdb',
          query: {
            start: '1526250610000',
            end: '1526337010000',
            queries: [
              {
                aggregator: 'zimsum',
                metric: 'Flickr.yapache.requests',
                rate: false,
                rateOptions: {
                  counter: false,
                  resetValue: 1
                },
                explicitTags: false,
                downsample: '60m-avg-nan',
                filters:[
                  {
                    type: 'wildcard',
                    tagk: 'host',
                    filter: '*.bf1.*',
                    groupBy: false
                  },
                  {
                    type: 'wildcard',
                    tagk: 'colo',
                    filter: '*',
                    groupBy: true
                  }
                ]
              }
            ]
          }
        }
      },
      {
        gridPos: {
          x: 0, y: 5,
          w: 6, h: 5,
        },
        config: {
          title: 'PlaceholderWidgetComponent',
          component_type: 'PlaceholderWidgetComponent',
          data_source: ''
        }
      },
      {
        gridPos: {
          x: 6, y: 0,
          w: 6, h: 5
        },
        config: {
          title: 'LinechartWidgetComponent',
          component_type: 'LinechartWidgetComponent',
          data_source: 'opentsdb',
          query: {
            start: '1526250610000',
            end: '1526337010000',
            queries: [
              {
                aggregator: 'zimsum',
                metric: 'Flickr.yapache.requests',
                rate: false,
                rateOptions: {
                  counter: false,
                  resetValue: 1
                },
                explicitTags: false,
                downsample: '60m-avg-nan',
                filters: [
                  {
                    type: 'wildcard',
                    tagk: 'host',
                    filter: 'www29*.bf1.*',
                    groupBy: true
                  }
                ]
              }
            ]
          }
        }
      },
      {
        gridPos: {
          x: 6, y: 5,
          w: 6, h: 5
        },
        config: {
          title: 'DeveloperWidgetComponent',
          component_type: 'DeveloperWidgetComponent',
          data_source: 'opentsdb',
          query: {
            start: '1526250610000',
            end: '1526337010000',
            queries: [
              {
                aggregator: 'zimsum',
                metric: 'Flickr.yapache.requests',
                rate: false,
                rateOptions: {
                  counter: false,
                  resetValue: 1
                },
                explicitTags: false,
                downsample: '60m-avg-nan',
                filters: [
                  {
                    type: 'wildcard',
                    tagk: 'host',
                    filter: '*.bf1.*',
                    groupBy: false
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  };

  getDashoard(id: string): Observable<any> {
    return Observable.of(this.dashboard);
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

  /* post the openTsdb query api */
  getDataByPost(wconfig: any): Observable<any> {
    const headers = new HttpHeaders(
      { 'Content-Type': 'application/json' });
    // let apiUrl = environment.tsdb_host + '/api/query';
    return this.http.post('/tsdb/queryData', wconfig.query, { headers, withCredentials: true })
      .pipe(
        catchError(this.handleError)
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

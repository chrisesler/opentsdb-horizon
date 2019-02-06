import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { MetaService } from '../services/meta.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  regexMetricFormat = /([^\.]*)\.([^\.]*)\.(.*)/;
  constructor(private http: HttpClient, private metaService: MetaService) { }
 
  getDashoard(id: string): Observable<any> {
    const apiUrl = environment.configdb + '/object/' + id;
    return this.http.get( apiUrl, { withCredentials: true })
                    .pipe(
                        map( (data: any)  => JSON.parse(data.content) )
                    );
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
    // simple random from 0 to length of hosts - 1
    const metricsUrl = environment.tsdb_host + '/api/query/graph';
    //const metricsUrl = environment.tsdb_hosts[Math.floor(Math.random() * (environment.tsdb_hosts.length - 1))] + '/api/query/graph';
    return this.http.post(metricsUrl, query, { headers, withCredentials: true });
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

    getNamespaces(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('NAMESPACES', queryObj);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
          .pipe(
            map((res:any) => res.results[0].namespaces),
          );
    }

    getTagKeys(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        const newQueryParams = {};
        for(let i = 0, len = queryObj.metrics.length; i < len; i++ ) {
          const res = queryObj.metrics[i].match(this.regexMetricFormat);
          const namespace = res[1];
          const metric = res[2] + "." + res[3];
          if ( !newQueryParams[namespace] ) {
            newQueryParams[namespace] = { search:'', namespace: namespace, metrics: [] };
          }
          newQueryParams[namespace].metrics.push(metric);
        }
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('TAG_KEYS', Object.values(newQueryParams));
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res:any) => {
                            
                            let tagkeys = [];
                            for ( let i = 0, len = res.results.length; i < len; i++ ) {
                              const keys = res.results[i].tagKeys.filter(item => tagkeys.indexOf(item.key) === -1);
                              tagkeys  = tagkeys.concat(keys.map(d => d.name ));
                            }
                            return tagkeys;
                          })
                        );
    }

    getMetricsByNamespace(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('METRICS', queryObj);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res:any) => res.results[0].metrics)
                        );
    }

    getNamespaceTagKeys(queryObj: any): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      const apiUrl = environment.metaApi + '/search/timeseries';
      const query = this.metaService.getQuery('TAG_KEYS', queryObj);
      return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res:any) => res.results[0].tagKeys)
                        );
    }

    getTagValuesByNamespace(queryObj: any): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      const apiUrl = environment.metaApi + '/search/timeseries';
      const query = this.metaService.getQuery('TAG_KEYS_AND_VALUES', queryObj);
      return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res:any) => res.results[0].tagKeysAndValues[queryObj.tagkey].values),
                        );
    }

    // results should filter the lists from already selected filters
    getTagValues(queryObj: any): Observable<string[]> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        const newQueryParams = {};
        for(let i = 0, len = queryObj.metrics.length; i < len; i++ ) {
          const res = queryObj.metrics[i].match(this.regexMetricFormat);
          const namespace = res[1];
          const metric = res[2] + "." + res[3];
          if ( !newQueryParams[namespace] ) {
            newQueryParams[namespace] = { tagkey:queryObj.tag.key, search:queryObj.tag.value, namespace: namespace, metrics: [] };
          }
          newQueryParams[namespace].metrics.push(metric);
        }
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('TAG_KEYS_AND_VALUES', Object.values(newQueryParams));
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res:any) => {
                            
                            let tagvalues = [];
                            for ( let i = 0, len = res.results.length; i < len; i++ ) {
                              const keys = res.results[i].tagKeysAndValues[queryObj.tag.key].values.filter(item => tagvalues.indexOf(item.key) === -1);
                              tagvalues  = tagvalues.concat(keys.map(d => d.name ));
                            }
                            return tagvalues;
                          })
                        );
    }

    getDashboardByPath(path: string) {
      const apiUrl = environment.configdb + '/dashboard/' + path;
      const httpOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true,
        observe: 'response' as 'response'
      };
      return this.http.get( apiUrl, httpOptions);      
    } 

    getDashboards() {
        const apiUrl = environment.configdb + '/object';
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const params = { 'userId': 'user.arunmohzi', 'type': 'DASHBOARD'};
        //console.log("get dahboards params", apiUrl, params);
        return this.http.get( apiUrl, { params: params, headers, withCredentials: true });
    }

    // id is not use for now, but just carry it here
    saveDashboard(id, data) {
        const apiUrl = environment.configdb + '/dashboard/file';
        const httpOptions = {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          withCredentials: true,
          observe: 'response' as 'response'
        };
        //console.log("save dahboard params", apiUrl, data);
        return this.http.put( apiUrl, data, httpOptions);
    }

    deleteDashboard(id) {
        const apiUrl = environment.configdb + '/object/' + id;
        return this.http.delete(apiUrl, { withCredentials: true });
    }

    userNamespaces() {
        const apiUrl = environment.configdb + '/namespace/member';
        const httpOptions = {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          withCredentials: true, 
          observe: 'response' as 'response'
        };
        return this.http.get(apiUrl, httpOptions);
    }
}

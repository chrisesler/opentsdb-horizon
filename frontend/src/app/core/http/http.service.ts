import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient, private utilsService: UtilsService) { }
 
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
      // '/tsdb/queryData'
    const apiUrl = environment.tsdb_host + '/api/query/graph';
    return this.http.post(apiUrl, query, { headers, withCredentials: true });
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
        return this.http.post('/search/namespaces', queryObj, { headers, withCredentials: true })
          .pipe(
            catchError(this.handleError)
          );
    }

    getTagKeys(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post('/search/tagkeys', queryObj, { headers, withCredentials: true })
          .pipe(
            catchError(this.handleError)
          );
    }

    getMetricsByNamespace(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post('/search/nsmetrics', queryObj, { headers, withCredentials: true })
          .pipe(
            catchError(this.handleError)
          );
    }

    getNamespaceTagKeys(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post('/search/nstagkeys', queryObj, { headers, withCredentials: true });
    }

    getTagValuesByNamespace(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post('/search/nstagvalues', queryObj, { headers, withCredentials: true })
          .pipe(
            catchError(this.handleError)
          );
    }

    // results should filter the lists from already selected filters
    getTagValues(queryObj: any): Observable<string[]> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
        return this.http.post<string[]>('/search/tagvalues', queryObj, { headers, withCredentials: true });
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
        const apiUrl = environment.configdb + '/namespace';
        const httpOptions = {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          withCredentials: true, 
          observe: 'response' as 'response'
        };
        return this.http.get(apiUrl, httpOptions);
    }
}

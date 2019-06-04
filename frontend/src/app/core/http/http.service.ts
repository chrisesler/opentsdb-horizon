import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { MetaService } from '../services/meta.service';

@Injectable({
    providedIn: 'root'
})
export class HttpService {

    override_host = {
        tsdb_host: '',
        meta_host: '',
        cfgdb_host: ''
    };

    regexMetricFormat = /([^\.]*)\.([^\.]*)\.(.*)/;
    constructor(private http: HttpClient, private metaService: MetaService) { }

    getDashoard(id: string): Observable<any> {
        const apiUrl = environment.configdb + '/object/' + id;
        return this.http.get(apiUrl, { withCredentials: true })
            .pipe(
                map((data: any) => JSON.parse(data.content))
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
        // const metricsUrl = environment.tsdb_host + '/api/query/graph';
        const metricsUrl = environment.tsdb_hosts[Math.floor(Math.random() * (environment.tsdb_hosts.length - 1))] + '/api/query/graph';
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
                map((res: any) => res ? res.results[0].namespaces : []),
            );
    }

    getTagKeys(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const newQueryParams = {};
        for (let i = 0, len = queryObj.metrics.length; i < len; i++) {
            const res = queryObj.metrics[i].match(this.regexMetricFormat);
            const namespace = res[1];
            const metric = res[2] + '.' + res[3];
            if (!newQueryParams[namespace]) {
                newQueryParams[namespace] = { search: '', namespace: namespace, metrics: [] };
            }
            newQueryParams[namespace].metrics.push(metric);
        }
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('TAG_KEYS', Object.values(newQueryParams));
        console.log('tag query for query', query);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
            .pipe(
                map((res: any) => {

                    let tagkeys = [];
                    for (let i = 0, len = res.results.length; i < len; i++) {
                        const keys = res.results[i].tagKeys.filter(item => tagkeys.indexOf(item.key) === -1);
                        tagkeys = tagkeys.concat(keys.map(d => d.name));
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
                map((res: any) => res ? res.results[0].metrics : [])
            );
    }

    getTagKeysForQueries(widgets): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const newQueries = [];
        let hasMetric = false;
        for (let i = 0, len = widgets.length; i < len; i++) {
            const queries = widgets[i].queries;
            for (let j = 0;  j < queries.length; j++) {
                const q = { id: widgets[i].id + ':' + queries[j].id, search: '', namespace: queries[j].namespace, metrics: [] };
                for (let k = 0;  k < queries[j].metrics.length; k++) {
                    if ( queries[j].metrics[k].expression === undefined ) {
                        q.metrics.push(queries[j].metrics[k].name);
                        hasMetric = true;
                    }
                }
                newQueries.push(q);
            }
        }
        if ( hasMetric ) {
            const query = this.metaService.getQuery('TAG_KEYS', newQueries);
            console.log('the query', query);
            const apiUrl = environment.metaApi + '/search/timeseries';
            return this.http.post(apiUrl, query, { headers, withCredentials: true });
        } else {
            return of({ 'results': [] });
        }
    }
    getNamespaceTagKeys(queryObj: any): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('TAG_KEYS', queryObj);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
            .pipe(
                map((res: any) => res ? res.results[0].tagKeys : [])
            );
    }

    getTagValuesByNamespace(queryObj: any): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      const apiUrl = environment.metaApi + '/search/timeseries';
      const query = this.metaService.getQuery('TAG_KEYS_AND_VALUES', queryObj, false);
      return this.http.post(apiUrl, query, { headers, withCredentials: true })
                        .pipe(
                          map((res: any) => res && res.results[0].tagKeysAndValues[queryObj.tagkey] ?
                            res.results[0].tagKeysAndValues[queryObj.tagkey].values : []),
                        );
    }

    // results should filter the lists from already selected filters
    getTagValues(queryObj: any): Observable<string[]> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const newQueryParams = {};
        for (let i = 0, len = queryObj.metrics.length; i < len; i++) {
            const res = queryObj.metrics[i].match(this.regexMetricFormat);
            const namespace = res[1];
            const metric = res[2] + '.' + res[3];
            if (!newQueryParams[namespace]) {
                newQueryParams[namespace] = { tagkey: queryObj.tag.key, search: queryObj.tag.value, namespace: namespace, metrics: [] };
            }
            newQueryParams[namespace].metrics.push(metric);
        }
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery('TAG_KEYS_AND_VALUES', Object.values(newQueryParams), false);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
            .pipe(
                map((res: any) => {
                    // console.log('the res', res);
                    let tagvalues = [];
                    for (let i = 0; res && i < res.results.length; i++) {
                        if (Object.keys(res.results[i].tagKeysAndValues).length > 0 && res.results[i].tagKeysAndValues[queryObj.tag.key]) {
                            const keys = res.results[i].tagKeysAndValues[queryObj.tag.key].values
                                .filter(item => tagvalues.indexOf(item.key) === -1);
                            tagvalues = tagvalues.concat(keys.map(d => d.name));
                        }
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
        return this.http.get(apiUrl, httpOptions);
    }

    getDashboardById(id: string) {
        const apiUrl = environment.configdb + '/dashboard/file/' + id;
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        return this.http.get(apiUrl, httpOptions);
    }

    getDashboards() {
        const apiUrl = environment.configdb + '/object';
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const params = { 'userId': 'user.arunmohzi', 'type': 'DASHBOARD' };
        // console.log("get dahboards params", apiUrl, params);
        return this.http.get(apiUrl, { params: params, headers, withCredentials: true });
    }

    // id is not use for now, but just carry it here
    saveDashboard(id, data) {
        const apiUrl = environment.configdb + '/dashboard/file';
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        // console.log("save dahboard params", apiUrl, data);
        return this.http.put(apiUrl, data, httpOptions);
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

    getUserFolderData() {
        const apiUrl = environment.configdb + '/dashboard/topFolders';
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        console.log('[API] getUserFolderData', apiUrl, httpOptions);
        return this.http.get(apiUrl, httpOptions);
    }

    getRecipients(namespace: string) {
        const apiUrl = environment.configdb + '/namespace/' + namespace + '/contact';
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        return this.http.get(apiUrl, httpOptions);
    }

    postRecipient(data: any) {
        const apiUrl = environment.configdb + '/namespace/' + data.namespace + '/contact';
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        // tslint:disable:prefer-const
        let serverData: any = {};
        serverData[data.type] = [];
        let recipient: any = {... data};
        delete recipient.type;
        delete recipient.namespace;
        serverData[data.type][0] = recipient;
        return this.http.post(apiUrl, serverData, httpOptions);
    }

    updateRecipient(data: any) {
        const apiUrl = environment.configdb + '/namespace/' + data.namespace + '/contact';
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        // tslint:disable:prefer-const
        let serverData: any = {};
        serverData[data.type] = [];
        let recipient: any = {... data};
        delete recipient.type;
        delete recipient.namespace;
        serverData[data.type][0] = recipient;
        return this.http.put(apiUrl, serverData, httpOptions);
    }

    deleteRecipient(data: any) {
        const apiUrl = environment.configdb + '/namespace/' + data.namespace + '/contact/delete';
        // tslint:disable-next-line:prefer-const
        let httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
            withCredentials: true,
            observe: 'response' as 'response'
        };
        // tslint:disable-next-line:prefer-const
        let serverData: any = {};
        serverData[data.type] = [];
        serverData[data.type][0] = { name: data.name };
        return this.http.put(apiUrl, serverData, httpOptions);
    }

    saveAlert(namespace, payload: any): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const apiUrl = environment.configdb + '/namespace/' + namespace + '/alert';
        if ( !payload.data[0].id  ) {
            return this.http.post(apiUrl, payload.data, { headers, withCredentials: true });
        } else {
            // payload.data[0].id = payload.id;
            return this.http.put(apiUrl, payload.data, { headers, withCredentials: true });
        }
    }

    getAlertDetailsById(id: number): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const apiUrl = environment.configdb + '/alert/' + id;
        return this.http.get(apiUrl, { headers, withCredentials: true });
    }

    getAlerts(options): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
          });
        const apiUrl = environment.configdb + '/namespace/' + options.namespace + '/alert';
        return this.http.get(apiUrl, { headers, withCredentials: true });
    }

    deleteAlerts(namespace, payload): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const apiUrl = environment.configdb + '/namespace/' + namespace + '/alert/delete';
        // console.log("deleteA;lert", namespace, payload);
        return this.http.put(apiUrl, payload.data, { headers, withCredentials: true });
    }
}

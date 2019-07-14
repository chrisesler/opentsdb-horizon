import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { MetaService } from '../services/meta.service';
import { YamasService } from '../services/yamas.service';
import { UtilsService } from '../services/utils.service';
import { LoggerService } from '../services/logger.service';

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
    constructor(
        private http: HttpClient,
        private metaService: MetaService,
        private utils: UtilsService,
        private logger: LoggerService,
        private yamasService: YamasService) { }

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

    getNamespaces(queryObj: any, source= 'meta'): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const apiUrl = environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery(source, 'NAMESPACES', queryObj);
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
        const query = this.metaService.getQuery('meta', 'TAG_KEYS', Object.values(newQueryParams));
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
        const query = this.metaService.getQuery('meta', 'METRICS', queryObj);
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
        for (let i = 0, len = widgets.length; i < len; i++) {
            const queries = widgets[i].queries;
            for (let j = 0;  j < queries.length; j++) {
                let hasMetric = false;
                const q = { id: widgets[i].id + ':' + queries[j].id, search: '', namespace: queries[j].namespace, metrics: [] };
                for (let k = 0;  k < queries[j].metrics.length; k++) {
                    if ( queries[j].metrics[k].expression === undefined ) {
                        q.metrics.push(queries[j].metrics[k].name);
                        hasMetric = true;
                    }
                }
                if ( hasMetric ) {
                    newQueries.push(q);
                }
            }
        }
        if ( newQueries.length ) {
            const query = this.metaService.getQuery('meta', 'TAG_KEYS', newQueries);
            // console.log('hill - query dashboard tag key', query);
            const apiUrl = environment.metaApi + '/search/timeseries';
            return this.http.post(apiUrl, query, { headers, withCredentials: true });
        } else {
            return of({ 'results': [] });
        }
    }
    getNamespaceTagKeys(queryObj: any, source = 'meta'): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const apiUrl =  environment.metaApi + '/search/timeseries';
        const query = this.metaService.getQuery(source, 'TAG_KEYS', queryObj);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
            .pipe(
                map((res: any) => res ? res.results[0].tagKeys : [])
            );
    }

    getTagValuesByNamespace(queryObj: any, source = 'meta'): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      const apiUrl =  environment.metaApi + '/search/timeseries';
      const query = this.metaService.getQuery(source, 'TAG_KEYS_AND_VALUES', queryObj, false);
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
        const query = this.metaService.getQuery('meta', 'TAG_KEYS_AND_VALUES', Object.values(newQueryParams), false);
        return this.http.post(apiUrl, query, { headers, withCredentials: true })
            .pipe(
                map((res: any) => {
                    // console.log('the res', res);
                    let tagvalues = [];
                    for (let i = 0; res && i < res.results.length; i++) {
                        if (Object.keys(res.results[i].tagKeysAndValues).length > 0 && res.results[i].tagKeysAndValues[queryObj.tag.key]) {
                            const keys = res.results[i].tagKeysAndValues[queryObj.tag.key].values
                                .filter(item => tagvalues.indexOf(item.name) === -1);
                            tagvalues = tagvalues.concat(keys.map(d => d.name));
                        }
                    }
                    return tagvalues.sort(this.utils.sortAlphaNum);
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
        this.logger.api('saveAlert', {namespace, payload});
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
        this.logger.api('getAlertDetailsById', {id});
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const apiUrl = environment.configdb + '/alert/' + id;
        return this.http.get(apiUrl, { headers, withCredentials: true });
    }

    getAlerts(options): Observable<any> {
        // this.logger.api('getAlerts', {options});
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
          });
        const apiUrl = environment.configdb + '/namespace/' + options.namespace + '/alert';
        return this.http.get(apiUrl, { headers, withCredentials: true });
    }

    deleteAlerts(namespace, payload): Observable<any> {
        this.logger.api('deleteAlerts', {namespace, payload});
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
        });
        const apiUrl = environment.configdb + '/namespace/' + namespace + '/alert/delete';
        // console.log("deleteA;lert", namespace, payload);
        return this.http.put(apiUrl, payload.data, { headers, withCredentials: true });
    }

    getEvents(wid: string, time: any, eventQueries: any[]) {
        const query = this.yamasService.buildEventsQuery(time, eventQueries);
        // todo: send query to tsdb and add time
        let now = new Date().getTime();
        // const apiUrl = environment.configdb + '/namespace/' + namespace + '/contact';
        // const httpOptions = {
        //     headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        //     withCredentials: true,
        //     observe: 'response' as 'response'
        // };
        // return this.http.get(apiUrl, httpOptions);

        if (eventQueries[0].namespace !== 'Yamas') {
            return {
                wid: wid,
                time: time,
                events: [
                {
                    title: 'Event 10X',
                    // tslint:disable:max-line-length
                    message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                    source: 'aws',
                    namespace: 'not yamas',
                    priority: 'low',
                    tags: {
                        'host': 'tsdbr-1.yms.gq1.yahoo.com',
                        '_application': 'tsdb'
                    },
                    eventId: '123456',
                    timestamp: now - (3 * 600 * 1000),
                    endTimestamp: now,
                }
            ], eventQueries: eventQueries};
        }

        return { events: [
            {
                wid: wid,
                time: time,
                title: 'Event 1',
                // tslint:disable:max-line-length
                message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                source: 'aws',
                namespace: 'yamas',
                priority: 'low',
                tags: {
                    'host': 'tsdbr-1.yms.gq1.yahoo.com',
                    '_application': 'tsdb'
                },
                eventId: '123456',
                timestamp: now - (3 * 600 * 1000),
                endTimestamp: now,
            },
            {
                title: 'Event 2',
                message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                source: 'aws',
                timestamp: now - (4.1 * 600 * 1000),
                eventId: '1234568',
                namespace: 'yamas',
                priority: 'low',
                tags: {
                    'host': 'tsdbr-1.yms.gq1.yahoo.com',
                    '_application': 'tsdb'
                },
             },
            {
                title: 'Event 3',
                message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                source: 'aws',
                timestamp: now - (4.22 * 600 * 1000),
                eventId: '1234569',
                namespace: 'yamas',
                priority: 'low',
                tags: {
                    'host': 'tsdbr-1.yms.gq1.yahoo.com',
                    '_application': 'tsdb'
                },
            },
            {
                title: 'Event 4',
                message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                source: 'sd',
                timestamp: now - (4.23 * 600 * 1000),
                eventId: '1234560',
                namespace: 'yamas',
                priority: 'low',
                tags: {
                    'host': 'tsdbr-1.yms.gq1.yahoo.com',
                    '_application': 'tsdb'
                },
            },
            {
                title: 'Event 5',
                message: 'Super looooooooooong message. sfjsfdsjf sdljfls;jf;ldsj f;ldsjfldsjfljsdlfjdslfj sd;ljfsdljflsdjf;lsdjf sdlfjds;lfjsd;lj f;lsjd fldsjf;ldsj;fljsd;l fjsd;l jfs;dljfs;ldj fsldjflsdjlf jsdf',
                source: 'sd',
                timestamp: now - (5.22 * 600 * 1000),
                eventId: '1234561',
                namespace: 'yamas',
                priority: 'low',
                tags: {
                    'host': 'tsdbr-1.yms.gq1.yahoo.com',
                    '_application': 'tsdb'
                },
            }
        ], eventQueries: eventQueries};
    }
}

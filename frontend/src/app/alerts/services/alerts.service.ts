import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class AlertsService {

    get headers(): any {
        return new HttpHeaders({
            'Content-Type': 'application/json'
        });
    }

    constructor(
        private http: HttpClient
    ) { }

    apiLog(type: string, params?: any) {
        if (params) {
            console.group(
                '%cAPI%c' + type,
                'color: white; background-color: purple; padding: 4px 8px; font-weight: bold;',
                'color: purple; padding: 4px 8px; border: 1px solid purple;'
            );
            console.log('%cParams', 'font-weight: bold;', params);
            console.groupEnd();
        } else {
            console.log(
                '%cAPI%c' + type,
                'color: white; background-color: purple; padding: 4px 8px; font-weight: bold;',
                'color: purple; padding: 4px 8px; border: 1px solid purple;'
            );
        }
    }

    apiError(msg: any) {
        console.log(
            '%cERROR%cAn error occurred',
            'color: white; background-color: red; padding: 4px 8px; font-weight: bold;',
            'color: red; padding: 4px 8px; border: 1px solid red;',
            msg
        );
    }

    /**
     * HTTP METHOD CONSTRUCTORS
     */

    httpGet(url: string, params?: any) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        if (params) {
            httpOptions.params = new HttpParams(params);
        }

        return this.http.get(url, httpOptions);
    }

    httpPut(url: string, body: any, params?: any) {
        // console.log('url', url);
        // console.log('body', body);
        // console.log('params', params || null);
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        if (params) {
            httpOptions.params = new HttpParams(params);
        }

        return this.http.put(url, body, httpOptions);
    }

    /**
     * Error Handler
     *
     * to handle error with more info
     */

    handleError(error: HttpErrorResponse) {

        if (error.error instanceof ErrorEvent) {
            // a client-side or network error occured
            this.apiError(error.error.message);
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

    /**
     * API METHODS
     */

    getUserNamespaces() {
        this.apiLog('Get Namespaces I Belong to');
        const apiUrl = environment.configdb2 + '/namespace/member';
        return this.httpGet(apiUrl);
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
}

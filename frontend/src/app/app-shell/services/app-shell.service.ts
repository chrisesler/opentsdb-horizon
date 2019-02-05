import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { UtilsService } from '../../core/services/utils.service';

@Injectable()
export class AppShellService {

    private _uid: string;

    get headers(): any {
        return {
            'Content-Type': 'application/json'
        };
    }

    constructor(
        private http: HttpClient
    ) {}

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

    /* to handle error  with more info */
    // TODO : Better Error messaging
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

    getFolderList(folderId?: any, namespaceId?: any ) {
        const apiUrl = environment.configdb2 + '/folder';
        const params = { 'recursive': 'true' };
        const headers = new HttpHeaders(this.headers);

        return this.http.get(apiUrl, {
            params: params,
            headers: headers,
            withCredentials: true,
            responseType: 'json'
        })
        .pipe(
            catchError(this.handleError)
        );
    }

    createFolder(folder: any) {
        const apiUrl = environment.configdb2 + '/folder';
        const headers = new HttpHeaders(this.headers);

        return this.http.post(
            apiUrl,
            folder,
            { headers, withCredentials: true }
        ).pipe(
            catchError(this.handleError)
        );

    }

    getUserProfile() {
        const apiUrl = environment.configdb2 + '/user';
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        this.apiLog('Get User Profile', {
            apiUrl
        });

        return this.http.get(apiUrl, {
            headers: headers,
            withCredentials: true,
            observe: 'response'
        });
    }

    createUser() {
        const apiUrl = environment.configdb2 + '/user';
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        this.apiLog('Create User', {
            apiUrl
        });

        return this.http.post(apiUrl, {}, {
            // headers: headers,
            withCredentials: true,
            observe: 'response'
        });
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { UtilsService } from '../../core/services/utils.service';

@Injectable({
    providedIn: 'root'
})
export class AppShellService {

    private _uid: string;

    get headers(): any {
        return {
            'Content-Type': 'application/json'
        };
    }

    constructor(
        private http: HttpClient
    ) {
        this.getUid();
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

    getUid() {
        const self = this;
        return this.http.get('/uid')
            .pipe(
                map(
                    (res: any) => {
                        self._uid = res.uid;
                        console.log('RES', res);
                        return Observable.of(res);
                    }
                ),
                catchError(
                    error => {
                        // fallback...
                        // TODO: remove
                        self._uid = 'cesler';
                        if ( error.status === 401 ) {
                            return error;
                        }
                        return Observable.of('uid-check-error');
                    }
                )
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
}

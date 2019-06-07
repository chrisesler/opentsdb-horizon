import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

import { LoggerService } from '../../../../core/services/logger.service';
import { namespace } from 'd3';

@Injectable()
export class DbfsService {

    constructor(
        private logger: LoggerService,
        private http: HttpClient
    ) { }

    /**
     * Error Handler
     *
     * to handle error with more info
     */

    handleError(error: HttpErrorResponse) {

        if (error.error instanceof ErrorEvent) {
            // a client-side or network error occured
            this.logger.error('DbfsService :: An API error occurred', error.error.message);
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

    loadResources() {
        const apiUrl = environment.configdb + '/dashboard/topFolders';

        this.logger.api('DbfsService :: Load Resources', { apiUrl });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        return this.http.get(apiUrl, httpOptions);
    }

    getFolderByPath(path: string, topFolder?: any) {
        const params: any = {};
        let apiUrl: string;

        if (topFolder && topFolder.type && topFolder.value) {
            const tokenType = (topFolder.type === 'user') ? 'userId' : 'namespace';
            apiUrl = environment.configdb + '/dashboard/topFolders?' + tokenType + '=' + topFolder.value;
            params[tokenType] = topFolder.value;
        } else {
            apiUrl = environment.configdb + '/dashboard' + path;
        }

        this.logger.api('DbfsService :: Get Folder By Path', { path, topFolder, apiUrl, params });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json',
            params
        };

        return this.http.get(apiUrl, httpOptions);

    }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

import { LoggerService } from '../../core/services/logger.service';

@Injectable()
export class DashboardNavigatorService {

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
            this.logger.error('DashboardNavigatorService :: An API error occurred', error.error.message);
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
     * User
     */

    // get a specific user
    getUser(id?: string) {

        let apiUrl = environment.configdb + '/user';

        if (id) {
            apiUrl = apiUrl + '/' + id;
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        this.logger.api('DashboardNavigatorService :: ' + (id ? 'Get Specific User' : 'Get User'), {
            id,
            apiUrl
        });

        return this.http.get(apiUrl, {
            headers: headers,
            withCredentials: true,
            observe: 'response'
        });

    }

    getAllUsers() {

        const apiUrl = environment.configdb + '/user/list';

        this.logger.api('DashboardNavigatorService :: Get User List', { apiUrl });

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

    // get my namespaces
    getUserNamespaces() {

        const apiUrl = environment.configdb + '/namespace/member';

        this.logger.api('DashboardNavigatorService :: Get Namespaces I Belong to', { apiUrl });

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

    // get namespaces I follow
    getUserFollowed() {

        const apiUrl = environment.configdb + '/namespace/follower';

        this.logger.api('DashboardNavigatorService :: Get Namespaces I Follow', { apiUrl });

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

    /** Starting folders - AKA Top Level folders and namespaces */
    getDashboardResourceList() {

        const apiUrl = environment.configdb + '/dashboard/topFolders';

        this.logger.api('DashboardNavigatorService :: Get Navigation Resource List', { apiUrl });

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

    /** Folders */
    getFolderById(id: number) {

        const params = { id };

        const apiUrl = environment.configdb + '/dashboard/folder';

        this.logger.api('DashboardNavigatorService :: Get Dashboard Folder By Id', { apiUrl, id });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json',
            params
        };

        return this.http.get(apiUrl, httpOptions).pipe(
            catchError(this.handleError)
        );
    }

    getFolderByPath(path: string, topFolder?: any) {

        const params: any = {};
        let apiUrl: string;

        if (topFolder && topFolder.type && topFolder.value) {
            apiUrl = environment.configdb + '/dashboard/topFolders';

            switch (topFolder.type) {
                case 'user':
                    apiUrl += '?userId=' + topFolder.value;
                    params.userId = topFolder.value;
                    break;
                case 'namespace':
                    apiUrl += '?namespace=' + topFolder.value;
                    params.namespace = topFolder.value;
                    break;
                default:
                    break;
            }

        } else {
            apiUrl = environment.configdb + '/dashboard' + path;
        }

        this.logger.api('DashboardNavigatorService :: Get Dashboard Folder By Path', { path, topFolder, apiUrl, params });

        /*return this.httpGet(apiUrl, params).pipe(
            catchError(this.handleError)
        );*/


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

    createFolder(folder: any) {

        const body = folder;
        // can not have an id
        // TODO: some checking to see if an id exists... maybe they want an update instead?
        const apiUrl = environment.configdb + '/dashboard/folder';

        this.logger.api('DashboardNavigatorService :: Create Dashboard Folder', { body, apiUrl });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        return this.http.put(apiUrl, folder, httpOptions).pipe(
            catchError(this.handleError)
        );
    }

    updateFolder(id: number, folder: any) {

        const body = folder;
        body.id = id;

        const apiUrl = environment.configdb + '/dashboard/folder';

        this.logger.api('DashboardNavigatorService :: Update Dashboard Folder', { id, folder, apiUrl });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        return this.http.put(apiUrl, body, httpOptions).pipe(
            catchError(this.handleError)
        );
    }

    // IF TRASHFOLDER IS TRUE
    // destination path is either /user/<userid>/trash
    // or /namespace/<namespace>/trash
    // ELSE
    // destination path is either /user/<userid>/<path>
    // or /namespace/<namespace>/path

    moveFolder(payload: any) {

        // ?? do we need to do something else if it is trash? maybe verify destinationPath is trash folder?

        const body = {
            sourceId: payload.sourceId,
            destinationId: payload.destinationId
        };

        const apiUrl = environment.configdb + '/dashboard/folder/move';

        // tslint:disable-next-line:max-line-length
        this.logger.api('DashboardNavigatorService :: ' + ((payload.trashFolder) ? 'Trash' : 'Move') + ' Dashboard Folder', { payload, apiUrl});

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        return this.http.put(apiUrl, body, httpOptions).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * FILES
     */

    getFileById(id: number) {

        const params = { id: id.toString() };
        const apiUrl = environment.configdb + '/dashboard/file';

        this.logger.api('DashboardNavigatorService :: Dashboard File By id', { id, apiUrl });

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

    getFileByPath(path: string) {
        this.logger.api('DashboardNavigatorService :: Get File By Path');
    }

    createFile(file: any) {
        this.logger.api('DashboardNavigatorService :: Create Dashboard File');
    }

    updateFile(id: number, file: any) {
        this.logger.api('DashboardNavigatorService :: Update Dashboard File');
    }

    trashFile(filePath: string, user: string) {
        this.logger.api('DashboardNavigatorService :: Trash Dashboard File');
    }

    // basically the same as moveFolder... even same endpoint?
    moveFile(payload: any) {

        // ?? do we need to do something else if it is trash? maybe verify destinationPath is trash folder?

        const body = {
            sourceId: payload.sourceId,
            destinationId: payload.destinationId
        };

        const apiUrl = environment.configdb + '/dashboard/folder/move';

        // tslint:disable-next-line:max-line-length
        this.logger.api('DashboardNavigatorService :: ' + ((payload.trashFolder) ? 'Trash' : 'Move') + ' Dashboard File', { payload, apiUrl });

        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        return this.http.put(apiUrl, body, httpOptions).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * NAMESPACES
     */

    getNamespaceMembers(namespaceId: number) {
        this.logger.api('DashboardNavigatorService :: Get a namespaces members');
    }

    getNamespaceFollowers(namespaceId: number) {
        this.logger.api('DashboardNavigatorService :: Get a namespaces followers');
    }

    followNamespace(namespaceId: number) {
        this.logger.api('DashboardNavigatorService :: Follow namespace');
    }

    unfollowNamespace(namespaceId: number) {
        this.logger.api('DashboardNavigatorService :: Unfollow namespace');
    }

}

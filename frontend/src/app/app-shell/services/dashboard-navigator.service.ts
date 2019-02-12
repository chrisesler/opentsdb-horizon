import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class DashboardNavigatorService {

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
     * HTTP METHOD CUSTRUCTORS
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

        this.apiLog('HTTP GET', params);
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

        this.apiLog(id ? 'Get Specific User' : 'Get User', {
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
        this.apiLog('Get User List');
        const apiUrl = environment.configdb + '/user/list';
        this.httpGet(apiUrl);
    }

    // get my namespaces
    getUserNamespaces() {
        this.apiLog('Get Namespaces I Belong to');
        const apiUrl = environment.configdb + '/namespace/member';
        return this.httpGet(apiUrl);
    }

    // get namespaces I follow
    getUserFollowed() {
        this.apiLog('Get Namespaces I Follow');
        const apiUrl = environment.configdb + '/namespace/follower';
        return this.httpGet(apiUrl);
    }

    /** Starting folders - AKA Top Level folders and namespaces */
    getDashboardResourceList() {
        this.apiLog('Get Navigation Resource List');
        const apiUrl = environment.configdb + '/dashboard/topFolders';
        return this.httpGet(apiUrl);
    }

    /** Folders */
    getFolderById(id: number) {
        this.apiLog('Get Dashboard Folder By Id');

        const params = { id };
        const apiUrl = environment.configdb + '/dashboard/folder';

        return this.httpGet(apiUrl, params).pipe(
            catchError(this.handleError)
        );
    }

    getFolderByPath(path: string, topFolder?: any) {

        let params: any = {};
        let apiUrl: string;

        if ( topFolder && topFolder.type && topFolder.value ) {
            apiUrl = environment.configdb + '/dashboard/topFolders';
            params = new HttpParams();
            switch (topFolder.type) {
                case 'user':
                    apiUrl += '?userId=' + topFolder.value;
                    params.set('userId', topFolder.value);
                    break;
                case 'namespace':
                    apiUrl += '?namespace=' + topFolder.value;
                    params.set('namespace', topFolder.value);
                    break;
                default:
                    break;
            }

        } else {
            apiUrl = environment.configdb + '/dashboard' + path;
        }

        this.apiLog('Get Dashboard Folder By Path', {path, topFolder, apiUrl, params});

        /*return this.httpGet(apiUrl, params).pipe(
            catchError(this.handleError)
        );*/


        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        const httpOptions: any = {
            headers,
            withCredentials: true,
            responseType: 'json'
        };

        if (params) {
            httpOptions.params = params;
        }

        this.apiLog('HTTP GET', httpOptions);
        return this.http.get(apiUrl, httpOptions);
    }

    createFolder(folder: any) {

        const body = folder;
        // can not have an id
        // TODO: some checking to see if an id exists... maybe they want an update instead?
        const apiUrl = environment.configdb + '/dashboard/folder';

        this.apiLog('Create Dashboard Folder', { body, apiUrl });
        return this.httpPut(apiUrl, body).pipe(
            catchError(this.handleError)
          );
    }

    updateFolder(id: number, folder: any) {
        this.apiLog('Update Dashboard Folder');
        const body = folder;
        body.id = id;

        const apiUrl = environment.configdb + '/dashboard/folder';
        return this.httpPut(apiUrl, body);
    }

    // IF TRASHFOLDER IS TRUE
    // destination path is either /user/<userid>/trash
    // or /namespace/<namespace>/trash
    // ELSE
    // destination path is either /user/<userid>/<path>
    // or /namespace/<namespace>/path

    moveFolder(payload: any) {
        this.apiLog(((payload.trashFolder) ? 'Trash' : 'Move') + ' Dashboard Folder', payload);

        // ?? do we need to do something else if it is trash? maybe verify destinationPath is trash folder?

        const body = {
            sourceId: payload.sourceId,
            destinationId: payload.destinationId
        };

        const apiUrl = environment.configdb + '/dashboard/folder/move';
        return this.httpPut(apiUrl, body);
    }

    /**
     * FILES
     */

    getFileById(id: number) {
        this.apiLog('Dashboard File By id');

        const params = { id: id.toString() };
        const apiUrl = environment.configdb + '/dashboard/file';

        return this.httpGet(apiUrl, params);
    }

    getFileByPath(path: string) {
        this.apiLog('Get File By Path');
    }

    createFile(file: any) {
        this.apiLog('Create Dashboard File');
    }

    updateFile(id: number, file: any) {
        this.apiLog('Update Dashboard File');
    }

    trashFile(filePath: string, user: string) {
        this.apiLog('Trash Dashboard File');
    }

    // basically the same as moveFolder... even same endpoint?
    moveFile(payload: any) {
        this.apiLog(((payload.trashFolder) ? 'Trash' : 'Move') + ' Dashboard File');

        // ?? do we need to do something else if it is trash? maybe verify destinationPath is trash folder?

        const body = {
            sourceId: payload.sourceId,
            destinationId: payload.destinationId
        };

        const apiUrl = environment.configdb + '/dashboard/folder/move';
        return this.httpPut(apiUrl, body);
    }

    /**
     * NAMESPACES
     */

    getNamespaceMembers(namespaceId: number) {
        this.apiLog('Get a namespaces members');
    }

    getNamespaceFollowers(namespaceId: number) {
        this.apiLog('Get a namespaces followers');
    }

    followNamespace(namespaceId: number) {

    }

    unfollowNamespace(namespaceId: number) {

    }

}

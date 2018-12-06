import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
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

    apiLog(type: string) {
        console.log(
            '%cAPI%c' + type,
            'color: white; background-color: purple; padding: 4px 8px; font-weight: bold;',
            'color: purple; padding: 4px 8px; border: 1px solid purple;'
        );
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
            withCredentials: true
        };

        if (params) {
            httpOptions.params = new HttpParams(params);
        }

        return this.http.get(url, httpOptions);
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
    getUser(id: string) {}

    // get my namespaces
    getUserNamespaces() {}

    // get namespaces I follow
    getUserFollowed() {}

    /** Starting folders - AKA Top Level folders and namespaces */
    getDashboardResourceList() {
        this.apiLog('Navigation Resource List');
        const apiUrl = environment.configdb2 + '/dashboard/myfolders';
        return this.httpGet(apiUrl);
    }

    /** Folders */
    getFolderById(id: number) {
        this.apiLog('Dashboard Folder By Id');

        const params = { id };
        const apiUrl = environment.configdb2 + '/dashboard/folder';

        return this.httpGet(apiUrl, params);
    }

    getFolderByPath(path: string) {
        this.apiLog('Dashboard Folder By Path');

        const params = { path };
        const apiUrl = environment.configdb2 + '/dashboard/folder';

        return this.httpGet(apiUrl, params);
    }

    createFolder(folder: any) {}

    updateFolder(folder: any) {}

    trashFolder(folderPath: string, user: string) {}

    moveFolder(sourcePath: string, destinationPath: string) {}

    /**
     * FILES
     */

    getFileById(id: number) {
        this.apiLog('Dashboard File By id');

        const params = { id: id.toString() };
        const apiUrl = environment.configdb2 + '/dashboard/file';

        return this.httpGet(apiUrl, params);
    }

    getFileByPath(path: string) {}

    createFile(file: any) {}

    updateFile(file: any) {}

    trashFile(filePath: string, user: string) {}

    moveFile(sourcePath: string, destinationPath: string) {}

    /**
     * NAMESPACES
     */

    getNamespaceMembers(namespaceId: number) {}

    getNamespaceFollowers(namespaceId: number) {}

    followNamespace(namespaceId: number) {}

    unfollowNamespace(namespaceId: number) {}

}

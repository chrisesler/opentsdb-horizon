import { State, StateContext, Action, Store, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { map, tap, catchError, reduce } from 'rxjs/operators';

import { DbfsService } from '../services/dbfs.service';
import { DbfsUtilsService } from '../services/dbfs-utils.service';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { copyStyles } from '@angular/animations/browser/src/util';

/** INTERFACES */

// common
export interface DbfsCommonResourceModel {
    // common from config db
    id: number;
    name: string;
    path: string;
    fullPath: string;
    createdTime?: number;
    createdBy?: string; // should be userid
    updatedTime?: number;
    updatedBy?: string; // should be userid
    type?: string;
    // common used within horizon
    resourceType: string; // folder || file
    ownerType: string; // user || namespace
    icon?: string;
    namespace?: string; // namespace alias
}

// file models
export interface DbfsFileModel extends DbfsCommonResourceModel {
    parentPath: string;
}

// folder models

export interface DbfsFolderModel extends DbfsCommonResourceModel {
    subfolders?: any[];
    files?: any[];
    loaded?: boolean;
}

export interface DbfsSyntheticFolderModel extends DbfsCommonResourceModel {
    synthetic: boolean;
    root?: boolean;
    personal?: any[];
    namespaces?: any[];

    // items needed for miniNav
    moveEnabled?: boolean;
    selectEnabled?: boolean;
    noDisplay?: boolean;
    selected?: boolean;
}

// namespace model (DIFFERENT from namespace folder)
export interface DbfsNamespaceModel {
    // these should always have value
    id: number;
    name: string;
    alias: string;
    // these possibly could come back null depending on where data comes from
    createdTime?: any;
    createdBy?: any;
    updatedTime?: any;
    updatedBy?: any;
    dhtracks?: any;
    enabled?: any;
    meta?: any;
}

// state model
export interface DbfsResourcesModel {
    user: {
        userid: any;
        name: string;
        memberNamespaces: string[];
    };
    namespaces: {}; // namespaces data... NOT namespace folder
    folders: {}; // user and namespace folders
    files: {}; // user and namespace files (dashboards)
    error: {};
    loaded: boolean;
}

/** ACTIONS */


export class DbfsLoadResources {
    public static type = '[DBFS Resources] Load Resources';
    constructor() {}
}

export class DbfsLoadResourcesSuccess {
    public static type = '[DBFS Resources] Load Resources Success';
    constructor(public readonly response: any) {}
}

export class DbfsLoadResourcesError {
    public static type = '[DBFS Resources] Load Resources Error';
    constructor(public readonly error: any) {}
}

/** STATE */

@State<DbfsResourcesModel>({
    name: 'Resources',
    defaults: {
        user: {
            userid: '',
            name: '',
            memberNamespaces: []
        },
        namespaces: {},
        folders: {},
        files: {},
        error: {},
        loaded: false
    }
})

export class DbfsResourcesState {
    constructor(
        private utils: UtilsService,
        private logger: LoggerService,
        private store: Store,
        private service: DbfsService,
        private dbfsUtils: DbfsUtilsService
    ) {}

    /** Selectors */
    @Selector() static getUser(state: DbfsResourcesModel) {
        return state.user;
    }

    @Selector() static getNamespaceData(state: DbfsResourcesModel) {
        return state.namespaces;
    }

    @Selector() static getFolderResources(state: DbfsResourcesModel) {
        return state.folders;
    }

    @Selector() static getFileResources(state: DbfsResourcesModel) {
        return state.files;
    }

    @Selector() static getResourceError(state: DbfsResourcesModel) {
        return state.error;
    }

    @Selector() static getResourcesLoaded(state: DbfsResourcesModel) {
        return state.loaded;
    }

    public static getFolderResource(path: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            // tslint:disable-next-line: prefer-const
            let data = {...state.folders[path]};
            if (data.root === true) {
                data.personal = data.personal.map( subPath => state.folders[subPath] );
                data.namespaces = data.namespaces( ns => state.folders[ns]);
            }

            return data;
        });
    }

    /** Actions */

    @Action(DbfsLoadResources)
    loadResources(ctx: StateContext<DbfsResourcesModel>, {}: DbfsLoadResources) {
        this.logger.action('State :: Load Navigation Resource List');
        const state = ctx.getState();

        return this.service.loadResources().pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsLoadResourcesSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DbfsLoadResourcesError(error)))
        );
    }

    @Action(DbfsLoadResourcesSuccess)
    loadResourcesSuccess(ctx: StateContext<DbfsResourcesModel>, { response }: DbfsLoadResourcesSuccess) {
        this.logger.success('State :: Load Navigation Resource List', response);

        const state = ctx.getState();
        // extract user data
        let user = response.user;
        user.memberNamespaces = [];
        let namespaces = {};
        let folders = {};
        let files = {};

        // extract namespaces, and assign ids to user.memberNamespaces
        // for namespaces: DbfsNamespaceModel
        for (const ns of response.memberNamespaces) {
            namespaces[ns.namespace.alias] = ns.namespace;
            folders[ns.folder.fullPath] = ns.folder;
            user.memberNamespaces.push(ns.namespace.alias);
        }

        // create master resource '/'
        // DbfsSyntheticFolderModel

        // create each individual namespace resource
        // DbfsFolderModel

        // create each individual folder resources
        // DbfsFolderModel


        ctx.setState({...state,
            user,
            namespaces,
            folders,
            loaded: true
        });

    }

    @Action(DbfsLoadResourcesError)
    loadResourcesError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadResourcesError) {
        this.logger.error('State :: Load Navigation Resource List', error);
        ctx.dispatch({ error });
    }

}


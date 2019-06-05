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
    resourceType?: string; // folder || file
    ownerType?: string; // user || namespace
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
    trashFolder?: boolean;
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
        // & create each individual namespace folder resource
        // for namespaces: DbfsNamespaceModel
        for (const ns of response.memberNamespaces) {
            // namespace resource
            namespaces[ns.namespace.alias] = ns.namespace;
            // namespace folder resource
            const nsFolder = <DbfsFolderModel>{...ns.folder,
                ownerType: 'namespace',
                resourceType: 'folder',
                icon: 'd-dashboard-tile',
                loaded: false
            };

            if (nsFolder.subfolders.length > 0) {
                nsFolder.subfolders = nsFolder.subfolders.map(item => {
                    const folder = <DbfsFolderModel>{...item,
                        resourceType: 'folder',
                        ownerType: 'user',
                        icon: 'd-folder',
                        loaded: false,
                        moveEnabled: true,
                        selectEnabled: true,
                        subfolders: [],
                        files: []
                    };
                    if (folder.name.toLowerCase() === 'trash') {
                        folder.icon = 'd-trash';
                        folder.trashFolder = true;
                    }
                    folders[folder.fullPath] = folder;
                    return item.fullPath;
                });
            }

            if (nsFolder.files.length > 0) {
                nsFolder.files = nsFolder.files.map(item => {
                    const file = <DbfsFileModel>{...item,
                        resourceType: 'file',
                        ownerType: 'user',
                        icon: 'd-dashboard-tile',
                        parentPath: nsFolder.fullPath
                    };
                    files[file.fullPath] = file;
                    return item.fullPath;
                });
            }

            folders[ns.folder.fullPath] = nsFolder;
            // add to user member namespaces
            user.memberNamespaces.push(ns.namespace.alias);
        }

        // create master resource '/'
        // DbfsSyntheticFolderModel
        const panelRoot = <DbfsSyntheticFolderModel>{
            id: 0,
            name: 'Dashboards',
            path: ':panel-root:',
            fullPath: ':panel-root:',
            synthetic: true,
            personal: [],
            namespaces: []
        };
        folders[panelRoot.fullPath] = panelRoot;

        const miniPanelRoot = <DbfsSyntheticFolderModel>{
            id: 0,
            name: 'Dashboards',
            path: ':mini-root:',
            fullPath: ':mini-root:',
            synthetic: true,
            subfolders: [
                '/' + user.userid.replace('.', '/'),
                ':member-namespaces:'
            ]
        };

        folders[miniPanelRoot.fullPath] = miniPanelRoot;

        // create each individual folder resources
        // DbfsFolderModel

        const userFolder = <DbfsFolderModel>{...response.personalFolder,
            resourceType: 'folder',
            ownerType: 'user',
            icon: 'd-dashboard-tile',
            loaded: true
        };
        folders[userFolder.fullPath] = userFolder;
        panelRoot.personal.push(userFolder.fullPath);

        const favFolder = <DbfsFolderModel>{
            id: 0,
            name: 'My Favorites',
            path: '/' + user.userid.replace('.', '/') + '/favorites',
            fullPath: '/' + user.userid.replace('.', '/') + '/favorites',
            files: [],
            resourceType: 'favorites',
            ownerType: 'user',
            icon: 'd-star',
            synthetic: true,
            loaded: false
        };
        folders[favFolder.fullPath] = favFolder;
        panelRoot.personal.push(favFolder.fullPath);

        // frequently visited
        const freqFolder = <DbfsFolderModel>{
            id: 0,
            name: 'Frequently Visited',
            path: '/' + user.userid.replace('.', '/') + '/frequently-visited',
            fullPath: '/' + user.userid.replace('.', '/') + '/frequently-visited',
            files: [],
            resourceType: 'frequentlyVisited',
            ownerType: 'user',
            icon: 'd-duplicate',
            synthetic: true,
            loaded: false
        };
        folders[freqFolder.fullPath] = freqFolder;
        panelRoot.personal.push(freqFolder.fullPath);

        // recently visited
        const recvFolder = <DbfsFolderModel>{
            id: 0,
            name: 'Recently Visited',
            path: '/' + user.userid.replace('.', '/') + '/recently-visited',
            fullPath: '/' + user.userid.replace('.', '/') + '/recently-visited',
            files: [],
            resourceType: 'recentlyVisited',
            ownerType: 'user',
            icon: 'd-time',
            synthetic: true,
            loaded: false
        };
        folders[recvFolder.fullPath] = recvFolder;
        panelRoot.personal.push(recvFolder.fullPath);

        // USER Trash
        // tslint:disable-next-line: max-line-length
        const userTrash = response.personalFolder.subfolders.filter( item => item.fullPath === '/' + user.userid.replace('.', '/') + '/trash');
        const userTrashIdx = response.personalFolder.subfolders.indexOf(userTrash[0]);
        const trashFolder  = <DbfsFolderModel>{...userTrash[0],
            resourceType: 'folder',
            ownerType: 'user',
            icon: 'd-trash',
            trashFolder: true,
            loaded: false
        };
        folders[trashFolder.fullPath] = trashFolder;
        panelRoot.personal.push(trashFolder.fullPath);
        userFolder.subfolders.splice(userTrashIdx, 1);


        // member namespace list
        const mbrnsFolder = <DbfsFolderModel> {
            id: 0,
            name: 'Namespaces',
            path: ':member-namespaces:',
            fullPath: ':member-namespaces:',
            subfolders: [],
            resourceType: 'userMemberNamespaces',
            icon: 'd-dashboard-tile',
            synthetic: true,
            loaded: false,
            moveEnabled: false,
            selectEnabled: false
        }

        // add namespaces to paneRoot.namespaces
        // & the memberNamespace list
        for (const ns of user.memberNamespaces) {
            mbrnsFolder.subfolders.push('/namespace/' + ns);
            panelRoot.namespaces.push('/namespace/' + ns);
        }

        folders[mbrnsFolder.fullPath] = mbrnsFolder;

        // FILES

        userFolder.subfolders = userFolder.subfolders.map(item => {
            const folder = <DbfsFolderModel>{...item,
                resourceType: 'folder',
                ownerType: 'user',
                icon: 'd-folder',
                loaded: false,
                moveEnabled: true,
                selectEnabled: true,
                subfolders: [],
                files: []
            };
            folders[folder.fullPath] = folder;
            return item.fullPath;
        });

        userFolder.files = userFolder.files.map(item => {
            const file = <DbfsFileModel>{...item,
                resourceType: 'file',
                ownerType: 'user',
                icon: 'd-dashboard-tile',
                parentPath: userFolder.fullPath
            };
            files[file.fullPath] = file;
            return item.fullPath;
        });


        ctx.setState({...state,
            user,
            namespaces,
            folders,
            files,
            loaded: true
        });

    }

    @Action(DbfsLoadResourcesError)
    loadResourcesError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadResourcesError) {
        this.logger.error('State :: Load Navigation Resource List', error);
        ctx.dispatch({ error });
    }

}


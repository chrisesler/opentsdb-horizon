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
    topFolder?: boolean;
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

// user model
export interface DbfsUserModel {
    userid: string;
    name: string;
    memberNamespaces: any[];
}

// state model
export interface DbfsResourcesModel {
    // activeUser is ID of user the cookie belongs to
    activeUser: string;
    users: {}; // when pulling users other than active user
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
    public static type = '[DBFS Resources] Load Resources ERROR';
    constructor(public readonly error: any) {}
}

export class DbfsLoadSubfolder {
    public static type = '[DBFS Resources] Load Subfolder';
    constructor(public readonly path: any) {}
}

export class DbfsLoadSubfolderSuccess {
    public static type = '[DBFS Resources] Load Subfolder SUCCESS';
    constructor(public readonly response: any) {}
}

export class DbfsLoadSubfolderError {
    public static type = '[DBFS Resources] Load Subfolder ERROR';
    constructor(public readonly error: any) {}
}

/** STATE */

@State<DbfsResourcesModel>({
    name: 'Resources',
    defaults: {
        activeUser: '',
        users: {},
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
    @Selector() static getUsersData(state: DbfsResourcesModel) {
        return state.users;
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

            if (data.personal) {
                data.personal = data.personal.map( subPath => state.folders[subPath] );

            }
            if (data.namespaces) {
                data.namespaces = data.namespaces.map( ns => state.folders[ns] );
            }

            if (data.subfolders) {
                data.subfolders = data.subfolders.map( subPath => state.folders[subPath] );
            }

            if (data.files) {
                data.files = data.files.map( subPath => state.files[subPath] );
            }

            return data;
        });
    }

    public static getUser(userid?: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            // tslint:disable-next-line: prefer-const
            const id = (userid) ? userid : state.activeUser;
            const user = state.users[id];
            return (user) ? user : {};
            return user;
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
        // keys for the user member namespaces
        user.memberNamespaces = [];
        // assign active user id (user who the cookie belongs to)
        let activeUser = user.userid.slice(5);
        // users hash
        let users = {};
        // add user object to hash
        users[activeUser] = user;
        // namespace hash (NOT namespace folders)
        let namespaces = {};
        // folders hash (includes user and namespace folders)
        // folder.fullPath is the key
        let folders = {};
        // files hash (includes user and namespace files)
        // file.fullPath is the key
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
                loaded: false,
                topFolder: true,
                name: ns.namespace.name // have to override nsFolder.name because all the namespace folder names come back as 'HOME'
            };

            if (nsFolder.subfolders.length > 0) {
                nsFolder.subfolders = nsFolder.subfolders.map(item => {
                    const folder = <DbfsFolderModel>{...item,
                        resourceType: 'folder',
                        ownerType: 'namespace',
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
                nsFolder.subfolders.sort((a: any, b: any) => {
                    return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
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
                nsFolder.files.sort((a: any, b: any) => {
                    return this.utils.sortAlphaNum(files[a].name, files[b].name);
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

        // master resource for mini navigator
        const miniPanelRoot = <DbfsSyntheticFolderModel>{
            id: 0,
            name: 'Dashboards',
            path: ':mini-root:',
            fullPath: ':mini-root:',
            synthetic: true,
            subfolders: [
                '/user/' + activeUser,
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
            loaded: true,
            topFolder: true,
            // override name because it always comes back as 'HOME'
            name: 'My Dashboards'
        };
        folders[userFolder.fullPath] = userFolder;
        panelRoot.personal.push(userFolder.fullPath);

        const favFolder = <DbfsFolderModel>{
            id: 0,
            name: 'My Favorites',
            path: '/user/' + activeUser + '/favorites',
            fullPath: '/user/' + activeUser + '/favorites',
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
            path: '/user/' + activeUser + '/frequently-visited',
            fullPath: '/user/' + activeUser + '/frequently-visited',
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
            path: '/user/' + activeUser + '/recently-visited',
            fullPath: '/user/' + activeUser + '/recently-visited',
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
        const userTrash = response.personalFolder.subfolders.filter( item => item.fullPath === '/user/' + activeUser + '/trash');
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

        mbrnsFolder.subfolders.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
        });

        panelRoot.namespaces.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
        });

        folders[mbrnsFolder.fullPath] = mbrnsFolder;

        // USER SUBFOLDERS & FILES

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

        userFolder.subfolders.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
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

        userFolder.files.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(files[a].name, files[b].name);
        });

        // SPECIAL FOLDERS
        const namespaceListFolder = <DbfsFolderModel>{
            id: 0,
            name: 'Namespace List',
            path: ':list-namespaces:',
            fullPath: ':list-namespaces:',
            resourceType: 'list',
            ownerType: 'dynamic',
            icon: 'd-search',
            loaded: false,
            synthetic: true,
            moveEnabled: false,
            selectEnabled: false
        };
        folders[namespaceListFolder.fullPath] = namespaceListFolder;

        const userListFolder = <DbfsFolderModel>{
            id: 0,
            name: 'User List',
            path: ':list-users:',
            fullPath: ':list-users:',
            resourceType: 'list',
            ownerType: 'dynamic',
            icon: 'd-search',
            loaded: false,
            synthetic: true,
            moveEnabled: false,
            selectEnabled: false
        };
        folders[userListFolder.fullPath] = userListFolder;

        // update state
        ctx.setState({...state,
            activeUser,
            users,
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


    @Action(DbfsLoadSubfolder)
    loadSubfolder(ctx: StateContext<DbfsResourcesModel>, { path }: DbfsLoadSubfolder) {
        this.logger.action('State :: Load SubFolder', { path });
        const state = ctx.getState();

        const folder = state.folders[path];
        let topFolder: any = false;

        if (folder.topFolder) {
            const tValue = folder.fullPath.split('/')[2];
            topFolder = {
                type: folder.ownerType,
                value: tValue.toLowerCase()
            };
        }

        return this.service.getFolderByPath(folder.path, topFolder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsLoadSubfolderSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DbfsLoadSubfolderError(error)))
        );
    }

    @Action(DbfsLoadSubfolderSuccess)
    loadSubfolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response }: DbfsLoadSubfolderSuccess) {
        this.logger.success('State :: Load SubFolder', response);
        //ctx.dispatch({ error });
    }

    @Action(DbfsLoadSubfolderError)
    loadSubfolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadSubfolderError) {
        this.logger.error('State :: Load SubFolder', error);
        ctx.dispatch({ error });
    }

}


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
    user?: string;
    locked?: boolean;
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
    // moveEnabled?: boolean;
    // selectEnabled?: boolean;
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
    memberNamespaces?: any[];
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
    dynamicLoaded: {
        users: boolean;
        namespaces: boolean;
    };
    resourceAction: {};
}

/** ACTIONS */

export class DbfsResetResourceAction {
    static readonly type = '[DBFS Resources] reset resource action';
    constructor () {}
}

export class DbfsLoadResources {
    public static type = '[DBFS Resources] Load Resources';
    constructor () {}
}

export class DbfsLoadResourcesSuccess {
    public static type = '[DBFS Resources] Load Resources Success';
    constructor (public readonly response: any) {}
}

export class DbfsLoadResourcesError {
    public static type = '[DBFS Resources] Load Resources ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsLoadSubfolder {
    public static type = '[DBFS Resources] Load Subfolder';
    constructor (public readonly path: any) {}
}

export class DbfsLoadSubfolderSuccess {
    public static type = '[DBFS Resources] Load Subfolder SUCCESS';
    constructor (public readonly response: any) {}
}

export class DbfsLoadSubfolderError {
    public static type = '[DBFS Resources] Load Subfolder ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsLoadUsersList {
    public static type = '[DBFS Resources] Load Users List';
    constructor (public readonly resourceAction: any) {}
}

export class DbfsLoadUsersListSuccess {
    public static type = '[DBFS Resources] Load Users List SUCCESS';
    constructor (
        public readonly response: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsLoadUsersListError {
    public static type = '[DBFS Resources] Load Users List ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsLoadNamespacesList {
    public static type = '[DBFS Resources] Load Namespaces List';
    constructor (public readonly resourceAction: any) {}
}

export class DbfsLoadNamespacesListSuccess {
    public static type = '[DBFS Resources] Load Namespaces List SUCCESS';
    constructor (
        public readonly response: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsLoadNamespacesListError {
    public static type = '[DBFS Resources] Load Namespaces List ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsLoadTopFolder {
    public static type = '[DBFS Resources] Load Top Folder';
    constructor (
        public readonly type: any,
        public readonly key: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsLoadTopFolderSuccess {
    public static type = '[DBFS Resources] Load Top Folder SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
}

export class DbfsLoadTopFolderError {
    public static type = '[DBFS Resources] Load Top Folder ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsCreateFolder {
    public static type = '[DBFS Resources] Create Folder';
    constructor (
        public readonly folder: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsCreateFolderSuccess {
    public static type = '[DBFS Resources] Create Folder SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
}

export class DbfsCreateFolderError {
    public static type = '[DBFS Resources] Create Folder ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsUpdateFolder {
    public static type = '[DBFS Resources] Update Folder';
    constructor (
        public readonly folder: any,
        public readonly originPath: string,
        public readonly resourceAction: any
    ) {}
}

export class DbfsUpdateFolderSuccess {
    public static type = '[DBFS Resources] Update Folder SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
}

export class DbfsUpdateFolderError {
    public static type = '[DBFS Resources] Update Folder ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsDeleteFolder {
    public static type = '[DBFS Resources] Delete Folder';
    constructor (
        public readonly folders: any[],
        public readonly resourceAction: any
    ) {}
}

export class DbfsDeleteFolderSuccess {
    public static type = '[DBFS Resources] Delete Folder SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
}

export class DbfsDeleteFolderError {
    public static type = '[DBFS Resources] Delete Folder ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsDeleteDashboard {
    public static type = '[DBFS Resources] Delete Dashboard';
    constructor (
        public readonly file: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsDeleteDashboardSuccess {
    public static type = '[DBFS Resources] Delete Dashboard SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
}

export class DbfsDeleteDashboardError {
    public static type = '[DBFS Resources] Delete Dashboard ERROR';
    constructor (public readonly error: any) {}
}

export class DbfsAddPlaceholderFolder {
    public static type = '[DBFS Resources] Add Placeholder Folder';
    constructor (
        public readonly path: any,
        public readonly resourceAction: any
    ) {}
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
        loaded: false,
        dynamicLoaded: {
            users: false,
            namespaces: false
        },
        resourceAction: {}
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

    @Selector() static getNamespacesData(state: DbfsResourcesModel) {
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

    @Selector() static getDynamicLoaded(state: DbfsResourcesModel) {
        return state.dynamicLoaded;
    }

    @Selector() static getUsersListLoaded(state: DbfsResourcesModel) {
        return state.dynamicLoaded.users;
    }

    @Selector() static getNamespacesListLoaded(state: DbfsResourcesModel) {
        return state.dynamicLoaded.namespaces;
    }

    @Selector() static getResourceAction(state: DbfsResourcesModel) {
        return state.resourceAction;
    }

    @Selector() static getNamespacesList(state: DbfsResourcesModel) {
        let namespaces = [];
        const nsKeys = Object.keys(state.namespaces).sort((a: any, b: any) => {
            const aa = a.toLowerCase().split(/(\d+)/);
            const bb = b.toLowerCase().split(/(\d+)/);
            for (let x = 0; x < Math.max(aa.length, bb.length); x++) {
                if (aa[x] !== undefined && bb[x] !== undefined && aa[x] !== bb[x]) {
                    const cmp1 = (isNaN(parseInt(aa[x], 10))) ? aa[x] : parseInt(aa[x], 10);
                    const cmp2 = (isNaN(parseInt(bb[x], 10))) ? bb[x] : parseInt(bb[x], 10);
                    if (cmp1 === undefined || cmp2 === undefined) {
                        return aa.length - bb.length;
                    } else {
                        return (cmp1 < cmp2) ? -1 : 1;
                    }
                }
            }
            return 0;
        });
        namespaces = nsKeys.map(item => state.namespaces[item]);
        return namespaces;
    }

    @Selector() static getUsersList(state: DbfsResourcesModel) {
        let users = [];
        const uKeys = Object.keys(state.users).sort((a: any, b: any) => {
            const aa = a.toLowerCase().split(/(\d+)/);
            const bb = b.toLowerCase().split(/(\d+)/);
            for (let x = 0; x < Math.max(aa.length, bb.length); x++) {
                if (aa[x] !== undefined && bb[x] !== undefined && aa[x] !== bb[x]) {
                    const cmp1 = (isNaN(parseInt(aa[x], 10))) ? aa[x] : parseInt(aa[x], 10);
                    const cmp2 = (isNaN(parseInt(bb[x], 10))) ? bb[x] : parseInt(bb[x], 10);
                    if (cmp1 === undefined || cmp2 === undefined) {
                        return aa.length - bb.length;
                    } else {
                        return (cmp1 < cmp2) ? -1 : 1;
                    }
                }
            }
            return 0;
        });
        users = uKeys.map(item => state.users[item]);
        return users;
    }

    public static getFolderResource(path: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            if (!state.folders[path]) {
                return {notFound: true}
            }
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

    // just folder, no mapping. Need it for basic info like id, name, path for create/update
    public static getFolder(path: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            const data = {...state.folders[path]};
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
    /** Utils */

    private normalizeFolder(rawFolder: any, locked?: boolean) {
        const details = this.dbfsUtils.detailsByFullPath(rawFolder.fullPath);
        const folder = <DbfsFolderModel>{...rawFolder,
            ownerType: details.type,
            resourceType: 'folder',
            icon: 'd-folder',
            loaded: false
        };

        if (!folder.files) {
            folder.files = [];
        }

        if (!folder.subfolders) {
            folder.subfolders = [];
        }

        if (details.topFolder) {
            folder.topFolder = true;
        }

        folder[details.type] = details.typeKey;

        // locked flag
        if (locked) {
            folder.locked = true;
        }

        return folder;
    }

    private normalizeFile(rawFile: any, locked?: boolean) {
        const details = this.dbfsUtils.detailsByFullPath(rawFile.fullPath);
        const file = <DbfsFileModel>{...rawFile,
            resourceType: 'file',
            ownerType: details.type,
            icon: 'd-dashboard-tile',
            parentPath: details.parentPath
        };
        file[details.type] = details.typeKey;
        // locked flag
        if (locked) {
            file.locked = true;
        }
        return file;
    }

    private resourceLockCheck(path: string, state: any) {
        const details = this.dbfsUtils.detailsByFullPath(path);
        if (
            (details.type === 'user' && details.typeKey !== state.activeUser) ||
            (details.type === 'namespace' && state.users[state.activeUser].memberNamespaces.indexOf(details.typeKey) === -1)
        ) {
            return true;
        }
        return false;
    }

    /** Actions */

    @Action(DbfsResetResourceAction)
    resetResourceAction(ctx: StateContext<DbfsResourcesModel>, { }: DbfsResetResourceAction) {
        this.logger.action('State :: Reset Resource Action');
        ctx.patchState({
            resourceAction: {}
        });
    }

    /** loading resources */

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

        // initial data setup
        // extract user data
        let user = response.user;
        // keys for the user member namespaces
        user.memberNamespaces = [];
        // assign active user id (user who the cookie belongs to)
        let activeUser = user.userid.slice(5);
        user.alias = activeUser;
        // users hash (all users)
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
            /*const nsFolder = <DbfsFolderModel>{...ns.folder,
                ownerType: 'namespace',
                resourceType: 'folder',
                icon: 'd-dashboard-tile',
                loaded: false,
                topFolder: true,
                namespace: ns.namespace.alias,
                name: ns.namespace.name // have to override nsFolder.name because all the namespace folder names come back as 'HOME'
            };*/

            const nsFolder = this.normalizeFolder(ns.folder);
            nsFolder.name = ns.namespace.name;

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
                        files: [],
                        namespace: ns.namespace.alias
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
                        parentPath: nsFolder.fullPath,
                        namespace: ns.namespace.alias
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
            name: 'My Dashboards',
            user: activeUser
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
            loaded: false,
            user: activeUser
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
            loaded: false,
            user: activeUser
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
            loaded: false,
            user: activeUser
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
            loaded: false,
            user: activeUser,
            subfolders: [],
            files: []
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
        };

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
                files: [],
                user: activeUser
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
                parentPath: userFolder.fullPath,
                user: activeUser
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
            name: 'All Namespaces',
            path: ':list-namespaces:',
            fullPath: ':list-namespaces:',
            resourceType: 'list',
            ownerType: 'dynamic',
            icon: 'd-list',
            loaded: false,
            synthetic: true,
            moveEnabled: false,
            selectEnabled: false
        };
        folders[namespaceListFolder.fullPath] = namespaceListFolder;

        const userListFolder = <DbfsFolderModel>{
            id: 0,
            name: 'All Users',
            path: ':list-users:',
            fullPath: ':list-users:',
            resourceType: 'list',
            ownerType: 'dynamic',
            icon: 'd-user-group-solid',
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

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify(state.folders));
        const files = JSON.parse(JSON.stringify(state.files));

        const locked = this.resourceLockCheck(response.fullPath, state);

        const folder = this.normalizeFolder(response, locked);
        folder.loaded = true;

        if (folder.subfolders) {
            folder.subfolders = folder.subfolders.map( f => {
                folders[f.fullPath] = this.normalizeFolder(f, locked);
                return f.fullPath;
            });
            folder.subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
            });
        }

        if (folder.files) {
            folder.files = folder.files.map( f => {
                files[f.fullPath] = this.normalizeFile(f, locked);
                return f.fullPath;
            });
            folder.files.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(files[a].name, files[b].name);
            });
        }

        folders[folder.fullPath] = folder;

        ctx.setState({...state,
            folders,
            files,
            loaded: true
        });
    }

    @Action(DbfsLoadSubfolderError)
    loadSubfolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadSubfolderError) {
        this.logger.error('State :: Load SubFolder', error);
        ctx.dispatch({ error });
    }

    @Action(DbfsLoadUsersList)
    loadUsersList(ctx: StateContext<DbfsResourcesModel>, { resourceAction }: DbfsLoadUsersList) {
        this.logger.action('State :: Load Users');

        return this.service.getUsersList().pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsLoadUsersListSuccess(payload, resourceAction));
            }),
            catchError( error => ctx.dispatch(new DbfsLoadUsersListError(error)))
        );
    }

    @Action(DbfsLoadUsersListSuccess)
    loadUsersListSuccess(ctx: StateContext<DbfsResourcesModel>, { response, resourceAction }: DbfsLoadUsersListSuccess) {
        this.logger.success('State :: Load Users', response);
        const state = ctx.getState();

        const dynamicLoaded = JSON.parse(JSON.stringify({...state.dynamicLoaded}));

        const users = JSON.parse(JSON.stringify({...state.users}));

        for (const usr of response) {
            usr.alias = usr.userid.slice(5);
            if (!users[usr.alias]) {
                users[usr.alias] = <DbfsUserModel>usr;
            }
        }

        dynamicLoaded.users = true;

        ctx.patchState({
            users,
            dynamicLoaded,
            resourceAction
        });
    }

    @Action(DbfsLoadUsersListError)
    loadUsersListError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadUsersListError) {
        this.logger.error('State :: Load Users', error);
        ctx.dispatch({ error });
    }

    @Action(DbfsLoadNamespacesList)
    loadNamespacesList(ctx: StateContext<DbfsResourcesModel>, { resourceAction }: DbfsLoadNamespacesList) {
        this.logger.action('State :: Load Namespaces', { resourceAction });
        return this.service.getNamespacesList().pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsLoadNamespacesListSuccess(payload, resourceAction));
            }),
            catchError( error => ctx.dispatch(new DbfsLoadNamespacesListError(error)))
        );
    }

    @Action(DbfsLoadNamespacesListSuccess)
    loadNamespacesListSuccess(ctx: StateContext<DbfsResourcesModel>, { response, resourceAction }: DbfsLoadNamespacesListSuccess) {
        this.logger.success('State :: Load Namespaces', response);
        const state = ctx.getState();
        const dynamicLoaded = JSON.parse(JSON.stringify({...state.dynamicLoaded}));

        const namespaces = JSON.parse(JSON.stringify({...state.namespaces}));

        for (const ns of response) {
            namespaces[ns.alias] = <DbfsNamespaceModel>ns;
        }

        dynamicLoaded.namespaces = true;

        ctx.patchState({
            namespaces,
            dynamicLoaded,
            resourceAction
        });

    }

    @Action(DbfsLoadNamespacesListError)
    loadNamespacesListError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadNamespacesListError) {
        this.logger.error('State :: Load Namespaces', error);
        ctx.dispatch({ error });
    }

    @Action(DbfsLoadTopFolder)
    loadTopFolder(ctx: StateContext<DbfsResourcesModel>, { type, key, resourceAction }: DbfsLoadTopFolder) {
        this.logger.action('State :: Load Top Folder', { type, key, resourceAction });

        const path = '/' + type + '/' + key;
        const topFolder: any = { type };
        topFolder.value = (type === 'user') ? 'user.' + key : key;

        return this.service.getFolderByPath(path, topFolder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsLoadTopFolderSuccess(payload, { type, key, resourceAction }));
            }),
            catchError( error => ctx.dispatch(new DbfsLoadTopFolderError(error)))
        );
    }

    @Action(DbfsLoadTopFolderSuccess)
    loadTopFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsLoadTopFolderSuccess) {
        this.logger.success('State :: Load Top Folder', { response, args });
        const state = ctx.getState();

        const resourceAction = args.resourceAction;

        const folders = JSON.parse(JSON.stringify({...state.folders}));
        const files = JSON.parse(JSON.stringify({...state.files}));

        const storeKey = args.type + 's';
        const tmpFolder = (args.type === 'namespace') ? response : response.personalFolder;

        const locked = this.resourceLockCheck(tmpFolder.fullPath, state);

        // check if it is the folder belongs to activeUser or activeUser's member namespaces
        // if not, flag it as locked
        /*const details = this.dbfsUtils.detailsByFullPath(response.fullPath);
        if (args.type === 'user' && details.typeKey !== state.activeUser) {
            locked = true;
        }
        if (args.type === 'namespace' && state.users[state.activeUser].memberNamespaces.indexOf(details.typeKey) === -1) {
            locked = true;
        }*/

        /*const folder = <DbfsFolderModel>{...tmpFolder,
            ownerType: args.type,
            resourceType: 'folder',
            icon: 'd-dashboard-tile',
            loaded: true,
            topFolder: true,
            locked
        };*/
        const folder = this.normalizeFolder(tmpFolder, locked);
        folder.loaded = true;

        // setting type namespace/user : value
        // i.e. folder['namespace'] = 'yamas'
        folder[args.type] = args.key;

        // have to override topFolder name because all the Top folder names come back as 'HOME'
        folder.name = state[storeKey][args.key].name;

        // clean subfolders
        folder.subfolders = folder.subfolders.map(item => {
            /*const subFolder = <DbfsFolderModel>{...item,
                resourceType: 'folder',
                ownerType: args.type,
                icon: 'd-folder',
                loaded: false,
                moveEnabled: true,
                selectEnabled: true,
                locked,
                subfolders: [],
                files: []
            };*/
            const subFolder = this.normalizeFolder(item, locked);

            //subFolder[args.type] = args.key;

            folders[subFolder.fullPath] = subFolder;

            return subFolder.fullPath;
        });

        folder.subfolders = folder.subfolders.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
        });

        folder.files = folder.files.map(item => {
            /*const file = <DbfsFileModel>{...item,
                resourceType: 'file',
                ownerType: args.type,
                icon: 'd-dashboard-tile',
                parentPath: folder.fullPath,
                locked
            };*/
            const file = this.normalizeFile(item, locked);
            //file[args.type] = args.key;

            files[file.fullPath] = file;
            return item.fullPath;
        });

        folder.files.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(files[a].name, files[b].name);
        });

        folders[folder.fullPath] = folder;

        ctx.patchState({
            folders,
            files,
            resourceAction
        });

    }

    @Action(DbfsLoadTopFolderError)
    loadTopFolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsLoadTopFolderError) {
        this.logger.error('State :: Load Top Folder', error);
        ctx.dispatch({ error });
    }

    /** Create Folder */

    @Action(DbfsCreateFolder)
    createFolder(ctx: StateContext<DbfsResourcesModel>, { folder, resourceAction }: DbfsCreateFolder) {
        this.logger.action('State :: Create Folder', { folder, resourceAction });

        return this.service.createFolder(folder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsCreateFolderSuccess(payload, { folder, resourceAction }));
            }),
            catchError( error => ctx.dispatch(new DbfsCreateFolderError(error)))
        );
    }

    @Action(DbfsCreateFolderSuccess)
    createFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsCreateFolderSuccess) {
        this.logger.success('State :: Create Folder', { response, args });

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));

        const details = this.dbfsUtils.detailsByFullPath(response.fullPath);

        /*const folder = <DbfsFolderModel>{...response,
            ownerType: details.type,
            resourceType: 'folder',
            icon: 'd-folder',
            loaded: false,
            topFolder: true,
            files: [],
            subfolders: [],
            selectEnabled: true,
            moveEnabled: true
        };*/
        const folder = this.normalizeFolder(response);
        folder.loaded = true;

        folder[details.type] = details.typeKey;

        folders[folder.fullPath] = folder;

        // update parent
        if (!folders[details.parentPath].subfolders) {
            folders[details.parentPath].subfolders = [];
        }
        folders[details.parentPath].subfolders.push(folder.fullPath);

        // re-sort parent folders
        if (folders[details.parentPath].subfolders.length > 1) {
            folders[details.parentPath].subfolders = folders[details.parentPath].subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(a, b);
            });
        }

        ctx.patchState({...state,
            folders,
            resourceAction: args.resourceAction
        });
    }

    @Action(DbfsCreateFolderError)
    createFolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsCreateFolderError) {
        this.logger.error('State :: Create Folder', error);
        ctx.dispatch({ error });
    }

    /** Delete Folder(s) */

    @Action(DbfsDeleteFolder)
    deleteFolder(ctx: StateContext<DbfsResourcesModel>, { folders, resourceAction }: DbfsDeleteFolder) {
        const state = ctx.getState();

        if (folders.length > 0) {
            this.logger.action('State :: Delete Folder', { folders, resourceAction });
            const folderPath = folders.shift();
            const source = state.folders[folderPath];
            const details = this.dbfsUtils.detailsByFullPath(folderPath);
            const destination = state.folders[details.trashPath]; // trash folder

            console.log('DELETE FOLDERS', {folders, folderPath, source, details, destination});

            return this.service.trashFolder(source.id, destination.id).pipe(
                map( (payload: any) => {
                    ctx.dispatch(new DbfsDeleteFolderSuccess(payload, { folders, resourceAction, originDetails: details }));
                }),
                catchError( error => ctx.dispatch(new DbfsDeleteFolderError(error)))
            );
        }
    }

    @Action(DbfsDeleteFolderSuccess)
    deleteFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsDeleteFolderSuccess) {
        this.logger.success('State :: Delete Folder', { response, args });
        const state = ctx.getState();
        const folders = JSON.parse(JSON.stringify({...state.folders}));
        const files = JSON.parse(JSON.stringify({...state.files}));

        // get keys of folders and files that may contain the original path
        const folderKeys = Object.keys(folders).filter(item => item.includes(args.originDetails.fullPath));
        const fileKeys = Object.keys(files).filter(item => item.includes(args.originDetails.fullPath));

        // remove from origin parent folder subfolders
        const opfIdx = folders[args.originDetails.parentPath].subfolders.indexOf(args.originDetails.fullPath);
        folders[args.originDetails.parentPath].subfolders.splice(opfIdx, 1);

        // remove cache of children folders
        if (folderKeys.length > 0) {
            for ( const key of folderKeys) {
                delete folders[key];
            }
        }

        // remove cache of children files
        if (fileKeys.length > 0) {
            for ( const key of fileKeys) {
                delete files[key];
            }
        }

        // get new folder details
        const details = this.dbfsUtils.detailsByFullPath(response.fullPath);

        const folder = <DbfsFolderModel>{...response,
            ownerType: details.type,
            resourceType: 'folder',
            icon: 'd-folder',
            loaded: false,
            topFolder: true,
            files: [],
            subfolders: [],
            selectEnabled: true,
            moveEnabled: true
        };

        folder[details.type] = details.typeKey;

        folders[folder.fullPath] = folder;

        // update parent
        if (!folders[details.parentPath].subfolders) {
            folders[details.parentPath].subfolders = [];
        }
        folders[details.parentPath].subfolders.push(folder.fullPath);

        // re-sort parent folders
        if (folders[details.parentPath].subfolders.length > 1) {
            folders[details.parentPath].subfolders = folders[details.parentPath].subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(a, b);
            });
        }

        ctx.patchState({...state,
            folders,
            files
        });

        // see if you need to run it some more
        if (args.folders.length > 0) {
            ctx.dispatch(new DbfsDeleteFolder(args.folders, args.resourceAction));
        } else {
            // its done running the loop... run the resourceAction (if any)
            ctx.patchState({...state,
                resourceAction: args.resourceAction
            });
        }
    }

    @Action(DbfsDeleteFolderError)
    deleteFolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsDeleteFolderError) {
        this.logger.error('State :: Delete Folder', error);
        ctx.dispatch({ error });
    }

    @Action(DbfsUpdateFolder)
    updateFolder(ctx: StateContext<DbfsResourcesModel>, { folder, originPath, resourceAction }: DbfsUpdateFolder) {
        this.logger.action('State :: Update Folder', { folder, originPath, resourceAction });
        const args = {
            originDetails: this.dbfsUtils.detailsByFullPath(originPath),
            resourceAction
        };

        return this.service.updateFolder(folder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsUpdateFolderSuccess(payload, args));
            }),
            catchError( error => ctx.dispatch(new DbfsUpdateFolderError(error)))
        );
    }

    @Action(DbfsUpdateFolderSuccess)
    updateFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsUpdateFolderSuccess) {
        this.logger.success('State :: Update Folder', { response, args });

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));
        const files = JSON.parse(JSON.stringify({...state.files}));

        // get keys of folders and files that may contain the original path
        const folderKeys = Object.keys(folders).filter(item => item.includes(args.originDetails.fullPath));
        const fileKeys = Object.keys(files).filter(item => item.includes(args.originDetails.fullPath));

        // remove from origin parent folder subfolders
        const opfIdx = folders[args.originDetails.parentPath].subfolders.indexOf(args.originDetails.fullPath);
        folders[args.originDetails.parentPath].subfolders.splice(opfIdx, 1);

        // remove cache of children folders
        if (folderKeys.length > 0) {
            for ( const key of folderKeys) {
                delete folders[key];
            }
        }

        // remove cache of children files
        if (fileKeys.length > 0) {
            for ( const key of fileKeys) {
                delete files[key];
            }
        }

        // update file
        // get new folder details
        const details = this.dbfsUtils.detailsByFullPath(response.fullPath);

        const folder = <DbfsFolderModel>{...response,
            ownerType: details.type,
            resourceType: 'folder',
            icon: 'd-folder',
            loaded: false,
            topFolder: true,
            files: [],
            subfolders: [],
            selectEnabled: true,
            moveEnabled: true
        };

        folder[details.type] = details.typeKey;

        folders[folder.fullPath] = folder;

        // update parent
        if (!folders[details.parentPath].subfolders) {
            folders[details.parentPath].subfolders = [];
        }
        folders[details.parentPath].subfolders.push(folder.fullPath);

        // re-sort parent folders
        if (folders[details.parentPath].subfolders.length > 1) {
            folders[details.parentPath].subfolders = folders[details.parentPath].subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(a, b);
            });
        }

        ctx.setState({...state,
            folders,
            files,
            resourceAction: args.resourceAction
        });
    }

    @Action(DbfsUpdateFolderError)
    updateFolderError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsUpdateFolderError) {
        this.logger.error('State :: Update Folder', error);
        ctx.dispatch({ error });
    }


    /* Files */
    @Action(DbfsDeleteDashboard)
    deleteDashboard(ctx: StateContext<DbfsResourcesModel>, { file, resourceAction }: DbfsDeleteDashboard) {
        this.logger.action('State :: Delete Dashboard', { file, resourceAction });
        const state = ctx.getState();
        const originDetails = this.dbfsUtils.detailsByFullPath(file);
        const source = state.files[file];
        const destination = state.folders[originDetails.trashPath];
        console.log(originDetails, source, destination);

        return this.service.trashFile(source.id, destination.id).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsDeleteDashboardSuccess(payload, { file, resourceAction, originDetails }));
            }),
            catchError( error => ctx.dispatch(new DbfsDeleteDashboardError(error)))
        );
    }

    @Action(DbfsDeleteDashboardSuccess)
    deleteDashboardSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsDeleteDashboardSuccess) {
        this.logger.success('State :: Delete Dashboard', { response, args });

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));
        const files = JSON.parse(JSON.stringify({...state.files}));

        // remove old cache
        delete files[args.originDetails.fullPath];

        // remove reference from original parent
        const opfIdx = folders[args.originDetails.parentPath].files.indexOf(args.originDetails.fullPath);
        folders[args.originDetails.parentPath].files.splice(opfIdx, 1);

        // update - should now be in trash folder
        const details = this.dbfsUtils.detailsByFullPath(response.fullPath);

        const file = <DbfsFileModel>{...response,
            resourceType: 'file',
            ownerType: details.type,
            icon: 'd-dashboard-tile',
            parentPath: details.parentPath
        };
        file[details.type] = details.typeKey;

        files[file.fullPath] = file;

        // update new parent
        folders[details.parentPath].files.push(file.fullPath);
        folders[details.parentPath].files.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(a.name, b.name);
        });

        ctx.patchState({...state,
            folders,
            files,
            resourceAction: args.resourceAction
        });
    }

    @Action(DbfsDeleteDashboardError)
    deleteDashboardError(ctx: StateContext<DbfsResourcesModel>, { error }: DbfsDeleteDashboardError) {
        this.logger.error('State :: Delete Dashboard', error);
        ctx.dispatch({ error });
    }

    @Action(DbfsAddPlaceholderFolder)
    addPlaceholderFolder(ctx: StateContext<DbfsResourcesModel>, { path, resourceAction }: DbfsAddPlaceholderFolder) {
        this.logger.action('State :: Add Placeholder Folder', { path, resourceAction });
        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));

        const locked = this.resourceLockCheck(path, state);

        const tmpFolder = {
            id: 0,
            name: 'loading',
            fullPath: path,
            path: path,
            files: [],
            subfolders: [],
            type: 'DASHBOARD'
        };

        const folder = this.normalizeFolder(tmpFolder, locked);

        folders[path] = folder;

        ctx.patchState({...state,
            folders,
            resourceAction
        });

    }

}


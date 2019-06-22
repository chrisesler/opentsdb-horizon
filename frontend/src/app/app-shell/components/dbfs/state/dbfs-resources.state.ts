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
import {
    DbfsFileModel,
    DbfsFolderModel,
    DbfsNamespaceModel,
    DbfsResourcesModel,
    DbfsSyntheticFolderModel,
    DbfsUserModel
} from './dbfs-resources.interfaces';

/** ACTIONS */

export class DbfsResourcesError {
    static readonly type = '[DBFS Resources] Error happened';
    constructor(
        public readonly error: any,
        public readonly label: string = 'Generic Error'
    ) {}
}

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

export class DbfsLoadSubfolder {
    public static type = '[DBFS Resources] Load Subfolder';
    constructor (
        public readonly path: any,
        public readonly resourceAction: any
    ) {}
}

export class DbfsLoadSubfolderSuccess {
    public static type = '[DBFS Resources] Load Subfolder SUCCESS';
    constructor (
        public readonly response: any,
        public readonly resourceAction: any
    ) {}
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

export class DbfsMoveResource {
    public static type = '[DBFS Resources] Move Resource';
    constructor (
        public readonly sourceId: number,
        public readonly destinationId: number,
        public readonly originPath: string,
        public readonly resourceAction: any
    ) {}
}

export class DbfsMoveResourceSuccess {
    public static type = '[DBFS Resources] Move Resource SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
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

export class DbfsUpdateFile {
    public static type = '[DBFS Resources] Update File';
    constructor (
        public readonly file: any,
        public readonly originPath: string,
        public readonly resourceAction: any
    ) {}
}

export class DbfsUpdateFileSuccess {
    public static type = '[DBFS Resources] Update File SUCCESS';
    constructor (
        public readonly response: any,
        public readonly args: any
    ) {}
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

export class DbfsDeleteDashboard {
    public static type = '[DBFS Resources] Delete Dashboard';
    constructor (
        public readonly file: any,
        public readonly resourceAction: any
    ) {}
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
                return { notFound: true };
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

    public static getFile(path: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            const data = {...state.files[path]};
            return data;
        });
    }

    public static getUser(userid?: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            // tslint:disable-next-line: prefer-const
            const id = (userid) ? userid : state.activeUser;
            const user = state.users[id];
            return user;
        });
    }
    /** Utils */
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
                return ctx.dispatch(new DbfsLoadResourcesSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Load Navigation Resource List')))
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
            const nsFolder = this.dbfsUtils.normalizeFolder(ns.folder);
            nsFolder.name = ns.namespace.name;

            if (nsFolder.subfolders.length > 0) {
                nsFolder.subfolders = nsFolder.subfolders.map(item => {

                    const folder = this.dbfsUtils.normalizeFolder(item);
                    folders[folder.fullPath] = folder;
                    return item.fullPath;
                });
                nsFolder.subfolders.sort((a: any, b: any) => {
                    return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
                });
            }

            if (nsFolder.files.length > 0) {
                nsFolder.files = nsFolder.files.map(item => {
                    const file = this.dbfsUtils.normalizeFile(item);
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
            name: 'Top Level',
            path: ':mini-root:',
            fullPath: ':mini-root:',
            synthetic: true,
            moveEnabled: false,
            selectEnabled: false,
            subfolders: [
                '/user/' + activeUser,
                ':member-namespaces:'
            ]
        };

        folders[miniPanelRoot.fullPath] = miniPanelRoot;

        // create each individual folder resources
        // DbfsFolderModel

        const userFolder = this.dbfsUtils.normalizeFolder(response.personalFolder);
        userFolder.loaded = true;
        userFolder.name = 'My Dashboards';

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

        const trashFolder = this.dbfsUtils.normalizeFolder(userTrash[0]);
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
            const folder = this.dbfsUtils.normalizeFolder(item);
            folders[folder.fullPath] = folder;
            return item.fullPath;
        });

        userFolder.subfolders.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
        });

        userFolder.files = userFolder.files.map(item => {
            const file = this.dbfsUtils.normalizeFile(item);
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

    @Action(DbfsLoadSubfolder)
    loadSubfolder(ctx: StateContext<DbfsResourcesModel>, { path, resourceAction }: DbfsLoadSubfolder) {
        this.logger.action('State :: Load SubFolder', { path, resourceAction });
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
                return ctx.dispatch(new DbfsLoadSubfolderSuccess(payload, resourceAction));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Load Subfolder')))
        );
    }

    @Action(DbfsLoadSubfolderSuccess)
    loadSubfolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, resourceAction }: DbfsLoadSubfolderSuccess) {
        this.logger.success('State :: Load SubFolder', response);

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify(state.folders));
        const files = JSON.parse(JSON.stringify(state.files));

        const locked = this.resourceLockCheck(response.fullPath, state);

        let folder;

        if (folders[response.fullPath]) {
            folder = folders[response.fullPath];
            folder.subfolders = response.subfolders;
            folder.files = response.files;
        } else {
            folder = this.dbfsUtils.normalizeFolder(response, locked);
        }

        folder.loaded = true;

        if (folder.subfolders) {
            folder.subfolders = folder.subfolders.map( f => {
                folders[f.fullPath] = this.dbfsUtils.normalizeFolder(f, locked);
                return f.fullPath;
            });
            folder.subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
            });
        }

        if (folder.files) {
            folder.files = folder.files.map( f => {
                files[f.fullPath] = this.dbfsUtils.normalizeFile(f, locked);
                return f.fullPath;
            });
            folder.files.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(files[a].name, files[b].name);
            });
        }

        folders[folder.fullPath] = folder;

        ctx.patchState({
            folders,
            files,
            resourceAction
        });
    }

    @Action(DbfsLoadUsersList)
    loadUsersList(ctx: StateContext<DbfsResourcesModel>, { resourceAction }: DbfsLoadUsersList) {
        this.logger.action('State :: Load Users');

        return this.service.getUsersList().pipe(
            map( (payload: any) => {
                return ctx.dispatch(new DbfsLoadUsersListSuccess(payload, resourceAction));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Load Users')))
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


    @Action(DbfsLoadNamespacesList)
    loadNamespacesList(ctx: StateContext<DbfsResourcesModel>, { resourceAction }: DbfsLoadNamespacesList) {
        this.logger.action('State :: Load Namespaces', { resourceAction });
        return this.service.getNamespacesList().pipe(
            map( (payload: any) => {
                return ctx.dispatch(new DbfsLoadNamespacesListSuccess(payload, resourceAction));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Load Namespaces')))
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

    @Action(DbfsLoadTopFolder)
    loadTopFolder(ctx: StateContext<DbfsResourcesModel>, { type, key, resourceAction }: DbfsLoadTopFolder) {
        this.logger.action('State :: Load Top Folder', { type, key, resourceAction });

        const path = '/' + type + '/' + key;
        const topFolder: any = { type };
        topFolder.value = (type === 'user') ? 'user.' + key : key;

        return this.service.getFolderByPath(path, topFolder).pipe(
            map( (payload: any) => {
                return ctx.dispatch(new DbfsLoadTopFolderSuccess(payload, { type, key, resourceAction }));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Load Top Folder')))
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

        const folder = this.dbfsUtils.normalizeFolder(tmpFolder, locked);
        folder.loaded = true;

        // have to override topFolder name because all the Top folder names come back as 'HOME'
        if ( folder.fullPath === '/user/' + state.activeUser ) {
            folder.name = 'My Dashboards';
        } else {
            folder.name = state[storeKey][args.key].name;
        }

        // clean subfolders
        folder.subfolders = folder.subfolders.map(item => {
            const subFolder = this.dbfsUtils.normalizeFolder(item, locked);
            folders[subFolder.fullPath] = subFolder;
            return subFolder.fullPath;
        });

        folder.subfolders = folder.subfolders.sort((a: any, b: any) => {
            return this.utils.sortAlphaNum(folders[a].name, folders[b].name);
        });

        folder.files = folder.files.map(item => {
            const file = this.dbfsUtils.normalizeFile(item, locked);
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

    /** Create Folder */

    @Action(DbfsCreateFolder)
    createFolder(ctx: StateContext<DbfsResourcesModel>, { folder, resourceAction }: DbfsCreateFolder) {
        this.logger.action('State :: Create Folder', { folder, resourceAction });

        return this.service.createFolder(folder).pipe(
            map( (payload: any) => {
                return ctx.dispatch(new DbfsCreateFolderSuccess(payload, { folder, resourceAction }));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Create Folder')))
        );
    }

    @Action(DbfsCreateFolderSuccess)
    createFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsCreateFolderSuccess) {
        this.logger.success('State :: Create Folder', { response, args });

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));

        const folder = this.dbfsUtils.normalizeFolder(response);
        folder.loaded = true;

        folders[folder.fullPath] = folder;

        // update parent
        if (!folders[folder.parentPath].subfolders) {
            folders[folder.parentPath].subfolders = [];
        }
        folders[folder.parentPath].subfolders.push(folder.fullPath);

        // re-sort parent folders
        if (folders[folder.parentPath].subfolders.length > 1) {
            folders[folder.parentPath].subfolders = folders[folder.parentPath].subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(a, b);
            });
        }

        ctx.patchState({
            folders,
            resourceAction: args.resourceAction
        });
    }

    /** Delete Folder(s) */
    // this can handle bulk deletes
    @Action(DbfsDeleteFolder)
    deleteFolder(ctx: StateContext<DbfsResourcesModel>, { folders, resourceAction }: DbfsDeleteFolder) {
        const state = ctx.getState();

        if (folders.length > 0) {
            this.logger.action('State :: Delete Folder', { folders, resourceAction });
            const folderPath = folders.shift();
            const source = state.folders[folderPath];
            const details = this.dbfsUtils.detailsByFullPath(folderPath);
            const destination = state.folders[details.trashPath]; // trash folder

            return this.service.trashFolder(source.id, destination.id).pipe(
                map( (payload: any) => {
                    return ctx.dispatch(new DbfsDeleteFolderSuccess(payload, { folders, resourceAction, originDetails: details }));
                }),
                catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Delete Folder')))
            );
        }
    }

    @Action(DbfsDeleteFolderSuccess)
    deleteFolderSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsDeleteFolderSuccess) {
        this.logger.success('State :: Delete Folder', { response, args });

        ctx.dispatch(new DbfsUpdateFolderSuccess(response, { originDetails: args.originDetails, resourceAction: {} }));

        // see if you need to run it some more (batch mode)
        if (args.folders.length > 0) {
            ctx.dispatch(new DbfsDeleteFolder(args.folders, args.resourceAction));
        } else {
            // its done running the loop... run the resourceAction (if any)
            const state = ctx.getState();
            ctx.patchState({...state,
                resourceAction: args.resourceAction
            });
        }
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
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Update Folder')))
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
        const folder = this.dbfsUtils.normalizeFolder(response);
        folders[folder.fullPath] = folder;

        // update parent
        if (!folders[folder.parentPath].subfolders) {
            folders[folder.parentPath].subfolders = [];
        }
        folders[folder.parentPath].subfolders.push(folder.fullPath);

        // re-sort parent folders
        if (folders[folder.parentPath].subfolders.length > 1) {
            folders[folder.parentPath].subfolders = folders[folder.parentPath].subfolders.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(a, b);
            });
        }

        ctx.patchState({
            folders,
            files,
            resourceAction: args.resourceAction
        });
    }

    /* Files */

    @Action(DbfsUpdateFile)
    updateFile(ctx: StateContext<DbfsResourcesModel>, { file, originPath, resourceAction }: DbfsUpdateFile) {
        this.logger.action('State :: Update Folder', { file, originPath, resourceAction });
        const args = {
            originDetails: this.dbfsUtils.detailsByFullPath(originPath),
            resourceAction
        };

        return this.service.updateFile(file).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DbfsUpdateFileSuccess(payload, args));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Update File')))
        );
    }

    @Action(DbfsUpdateFileSuccess)
    updateFileSuccess(ctx: StateContext<DbfsResourcesModel>, { response, args }: DbfsUpdateFileSuccess) {
        this.logger.success('State :: Update File', { response, args });

        const state = ctx.getState();

        const folders = JSON.parse(JSON.stringify({...state.folders}));
        const files = JSON.parse(JSON.stringify({...state.files}));

        // remove from origin parent folder files
        const opfIdx = folders[args.originDetails.parentPath].files.indexOf(args.originDetails.fullPath);
        folders[args.originDetails.parentPath].files.splice(opfIdx, 1);

        // remove cache of file
        delete files[args.originDetails.fullPath];

        // update file
        const file = this.dbfsUtils.normalizeFile(response);

        // update parent
        if (!folders[file.parentPath].files) {
            folders[file.parentPath].files = [];
        }
        folders[file.parentPath].files.push(file.fullPath);

        // re-sort parent files
        if (folders[file.parentPath].files.length > 1) {
            folders[file.parentPath].files = folders[file.parentPath].files.sort((a: any, b: any) => {
                return this.utils.sortAlphaNum(files[a].name, files[b].name);
            });
        }

        ctx.patchState({
            folders,
            files,
            resourceAction: args.resourceAction
        });
    }

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
                return ctx.dispatch(new DbfsUpdateFileSuccess(payload, { file, resourceAction, originDetails }));
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Delete Dashboard')))
        );
    }


    // generic Resource action
    @Action(DbfsMoveResource)
    moveResource(ctx: StateContext<DbfsResourcesModel>, { sourceId, destinationId, originPath, resourceAction }: DbfsMoveResource) {
        this.logger.error('State :: Move Folder', { sourceId, destinationId, originPath, resourceAction });

        const state = ctx.getState();

        const args = {
            originDetails: this.dbfsUtils.detailsByFullPath(originPath),
            resourceAction
        };

        const type: string = (state.files[originPath]) ? 'file' : 'folder';

        return this.service.moveFolder(sourceId, destinationId).pipe(
            map( (payload: any) => {
                if ( type === 'file') {
                    return ctx.dispatch(new DbfsUpdateFileSuccess(payload, args));
                } else {
                    return ctx.dispatch(new DbfsUpdateFolderSuccess(payload, args));
                }
            }),
            catchError( error => ctx.dispatch(new DbfsResourcesError(error, 'Move Folder')))
        );
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

        const folder = this.dbfsUtils.normalizeFolder(tmpFolder, locked);

        folders[path] = folder;

        ctx.patchState({
            folders,
            resourceAction
        });

    }

    @Action(DbfsResourcesError)
    resourcesError(ctx: StateContext<DbfsResourcesModel>, { error, label }: DbfsResourcesError) {
        this.logger.error('State :: ' + label, error);
        ctx.dispatch({ error });
    }

}


import {
    State,
    StateContext,
    Store,
    Action,
    Selector,
    createSelector
} from '@ngxs/store';

import { environment } from '../../../environments/environment';

import { LoggerService } from '../../core/services/logger.service';

import {
    map,
    tap,
    catchError,
    reduce
} from 'rxjs/operators';

import {
    DashboardNavigatorService
} from '../services/dashboard-navigator.service';

/** Model interfaces */

import {
    DBNAVFile,
    DBNAVFolder,
    DBNAVPanelModel,
    DBNAVStateModel,
    MiniNavPanelModel
} from './dashboard-navigator.interfaces';

/** Action Definitions */

import {
    DBNAVloadNavResources,
    DBNAVloadNavResourcesSuccess,
    DBNAVloadNavResourcesFail,
    DBNAVloadSubfolder,
    DBNAVloadSubfolderSuccess,
    DBNAVloadSubfolderFail,
    DBNAVcreateFolder,
    DBNAVcreateFolderSuccess,
    DBNAVcreateFolderFail,
    DBNAVupdateFolder,
    DBNAVupdateFolderSuccess,
    DBNAVupdateFolderFail,
    DBNAVmoveFolder,
    DBNAVmoveFolderSuccess,
    DBNAVmoveFolderFail,
    DBNAVcreateFile,
    DBNAVcreateFileSuccess,
    DBNAVcreateFileFail,
    DBNAVupdateFile,
    DBNAVupdateFileSuccess,
    DBNAVupdateFileFail,
    DBNAVmoveFile,
    DBNAVmoveFileSuccess,
    DBNAVmoveFileFail,
    DBNAVaddPanel,
    DBNAVgetFolderResource,
    DBNAVupdatePanels,
    DBNAVloadFolderResource,
    DBNAVloadFolderResourceSuccess,
    DBNAVloadFolderResourceFail,
    MiniNavOpenNavigator,
    MiniNavOpenNavigatorFail,
    MiniNavCloseNavigator,
    MiniNavLoadPanel,
    MiniNavRemovePanel,
    MiniNavCreateFolder,
    MiniNavCreateFolderSuccess,
    MiniNavCreateFolderFail,
    // MiniNavMoveFolder,
    // MiniNavMoveFolderSuccess,
    // MiniNavMoveFolderFail,
    MiniNavMarkFolderSelected,
    MiniNavResetFolderSelected
} from './dashboard-navigator.actions';

/** Other */

import { DBState } from '../../dashboard/state/dashboard.state';

// -- GET INITIAL RESOURCES -- //



/** Define State
 *
 * Navigator Children
 * - DashboardNavigatorState
 *
 * Possible New Navigator Children
 * - metric explorer
 * - alerts
 * - status
 * - annotations
 * - admin
 * - favorites
 * - namespaces
 * - resources
*/


@State<DBNAVStateModel>({
    name: 'DashboardNavigator',
    defaults: {
        user: {
            userid: '',
            name: '',
            memberNamespaces: []
        },
        resourceData: {
            personal: {},
            namespaces: {}
        },
        loading: false,
        loaded: false,
        error: {},
        panels: [],
        currentPanelIndex: 0,
        currentResourceType: 'master',
        currentNamespaceId: 0,
        status: '',
        panelAction: {},
        miniNavigator: {
            panels: [],
            panelIndex: 0,
            moveTargetPath: false,
            selected: {
                panel: false,
                folder: false
            }
        }
    }
})

export class DashboardNavigatorState {

    constructor (
        private logger: LoggerService,
        private navService: DashboardNavigatorService,
        private store: Store
    ) {}

    /**************************
     * SELECTORS
     **************************/

    @Selector() static getResourceData(state: DBNAVStateModel) {
        return state.resourceData;
    }

    @Selector() static getPersonalResourceData(state: DBNAVStateModel) {
        return state.resourceData.personal;
    }

    @Selector() static getNamespaceResourceData(state: DBNAVStateModel) {
        return state.resourceData.namespaces;
    }

    public static getFolderResource(path: string, type: string) {
        return createSelector([DashboardNavigatorState], (state: DBNAVStateModel) => {
            return state.resourceData[type][path];
        });
    }

    @Selector([DBState])
    static getLoadedDashboard(dbstate) {
        return {...dbstate.loadedDB};
    }

    @Selector() static getDBNavError(state: DBNAVStateModel) {
        return state.error;
    }

    @Selector() static getDBNAVLoaded(state: DBNAVStateModel) {
        return state.loaded;
    }

    @Selector() static getDBNavCurrentPanelIndex(state: DBNAVStateModel) {
        return state.currentPanelIndex;
    }

    @Selector() static getDBNavCurrentResourceType(state: DBNAVStateModel) {
        return state.currentResourceType;
    }

    @Selector() static getDBNavCurrentNamespaceId(state: DBNAVStateModel) {
        return state.currentNamespaceId;
    }

    @Selector() static getMiniNavPanels(state: DBNAVStateModel) {
        return state.miniNavigator.panels;
    }

    @Selector() static getMiniNavIndex(state: DBNAVStateModel) {
        return state.miniNavigator.panelIndex;
    }

    @Selector() static getDBNavPanels(state: DBNAVStateModel) {
        return state.panels;
    }

    @Selector() static getDBNavStatus(state: DBNAVStateModel) {
        return state.status;
    }

    @Selector() static getDBNavPanelAction(state: DBNAVStateModel) {
        return state.panelAction;
    }

    @Selector() static getMiniNavigator(state: DBNAVStateModel) {
        return state.miniNavigator;
    }

    /**************************
     * UTILS
     **************************/

    sortByName(a: any, b: any) {
        // console.log('SORT BY NAME', a, b);
        const aName = a.name.toLowerCase().trim();
        const bName = b.name.toLowerCase().trim();

        if (aName < bName) { return -1; }
        if (aName > bName) { return 1; }
        return 0;
    }

    // this is a dumb permission check
    // if the item path is personal, and matches the user's id = GOOD
    // if the item path is namespace, check if namespace if one of users memberNamespaces. If matches = GOOD
    // all else will fail
    // TODO: better permission check??
    simplePermissionCheck(ctx: StateContext<DBNAVStateModel>, itemPath: any) {
        const state = ctx.getState();
        const user = {...state.user};
        const userId = user.userid.split('.').pop();

        const path = itemPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const identifier = path[2]; // this is either user id, or namespace

        if (type === 'personal' && userId === identifier) {
            return true;
        }

        if (type === 'namespace') {

            const namespaceMatch = user.memberNamespaces.findIndex(item => item.alias === identifier);
            if (namespaceMatch >= 0) {
                return true;
            }
        }

        return false;
    }

    /**************************
     * ACTIONS
     **************************/


    /**
     * Navigator Resources
     * @param ctx
     * @param param1
     */
    @Action(DBNAVgetFolderResource)
    getFolderResource(ctx: StateContext<DBNAVStateModel>, { path: path, type: type }: DBNAVgetFolderResource) {
        this.logger.action('State :: Get Folder Resource');
        const state = ctx.getState();
        const resources = {...state.resourceData};
        return resources[type][path];
    }

    // Load the default resources
    // Top level personal folders
    // Top level Namespaces you are members of
    @Action(DBNAVloadNavResources)
    loadNavResources(ctx: StateContext<DBNAVStateModel>, {}: DBNAVloadNavResources) {
        this.logger.action('State :: Load Navigation Resource List');
        const state = ctx.getState();
        if (!state.loaded) {
            ctx.patchState({ loading: true});
            return this.navService.getDashboardResourceList().pipe(
                map( (payload: any) => {
                    // console.log('resourceList', payload);
                    ctx.dispatch(new DBNAVloadNavResourcesSuccess(payload));
                }),
                catchError( error => ctx.dispatch(new DBNAVloadNavResourcesFail(error)))
            );
        }

    }

    @Action(DBNAVloadNavResourcesSuccess)
    loadNavResourcesSuccess(ctx: StateContext<DBNAVStateModel>, { response }: DBNAVloadNavResourcesSuccess) {
        const state = ctx.getState();

        this.logger.success('State :: Load Navigation Resource List', response);

        const user = {...state.user,
            name: response.user.name,
            userid: response.user.userid
        };

        // save the raw
        const resourceData = {...state.resourceData};
        const namespaces = [];
        const masterPersonal = [];

        // TODO: Need to build a better way to handle first time users who have NO DASHBOARDS OR FOLDERS
        // TODO: FIX THIS

        // create synthetic folders
        // master
        masterPersonal[0] = <DBNAVFolder>{
            id: 0,
            name: 'My Dashboards',
            path: '/' + user.userid.replace('.', '/'),
            fullPath: '/' + user.userid.replace('.', '/'),
            subfolders: [],
            files: [],
            resourceType: 'personal',
            type: 'DASHBOARD',
            icon: 'd-dashboard-tile',
            topLevel: { type: 'user', value: user.userid },
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[0].fullPath] = masterPersonal[0];
        // favorites
        masterPersonal[1] = <DBNAVFolder>{
            id: 0,
            name: 'My Favorites',
            path: '/' + user.userid.replace('.', '/') + '/favorites',
            fullPath: '/' + user.userid.replace('.', '/') + '/favorites',
            files: [],
            resourceType: 'favorites',
            icon: 'd-star',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[1].fullPath] = masterPersonal[1];
        // frequently visited
        masterPersonal[2] = <DBNAVFolder>{
            id: 0,
            name: 'Frequently Visited',
            path: '/' + user.userid.replace('.', '/') + '/frequently-visited',
            fullPath: '/' + user.userid.replace('.', '/') + '/frequently-visited',
            files: [],
            resourceType: 'frequentlyVisited',
            type: 'DASHBOARD',
            icon: 'd-duplicate',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[2].fullPath] = masterPersonal[2];
        // recently visited
        masterPersonal[3] = <DBNAVFolder>{
            id: 0,
            name: 'Recently Visited',
            path: '/' + user.userid.replace('.', '/') + '/recently-visited',
            fullPath: '/' + user.userid.replace('.', '/') + '/recently-visited',
            files: [],
            resourceType: 'recentlyVisited',
            type: 'DASHBOARD',
            icon: 'd-time',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[3].fullPath] = masterPersonal[3];
        // trash
        masterPersonal[4] = <DBNAVFolder>{
            id: 0,
            name: 'Trash',
            path: '/' + user.userid.replace('.', '/') + '/trash',
            fullPath: '/' + user.userid.replace('.', '/') + '/trash',
            subfolders: [],
            files: [],
            resourceType: 'trash',
            type: 'DASHBOARD',
            icon: 'd-trash',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[4].fullPath] = masterPersonal[4];

        let createUserTrash = false;

        if (response.personalFolder && response.personalFolder.subfolders) {
            // do trash first so we can pull it up to root level
            // find trash
            // tslint:disable-next-line:max-line-length
            const trashIndex = response.personalFolder.subfolders.findIndex( folder => {
                return folder.fullPath === '/' + user.userid.replace('.', '/') + '/trash';
            });

            if (trashIndex >= 0) {
                // const trashIndex = response.personalFolder.subfolders.indexOf(trashFilter[0]);
                const trashFolder = response.personalFolder.subfolders.splice(trashIndex, 1)[0];
                masterPersonal[4] = trashFolder;
                masterPersonal[4] = {...masterPersonal[4],
                    subfolders: trashFolder.subfolders || [],
                    files: trashFolder.files || [],
                    icon: 'd-trash',
                    loaded: false,
                    // synthetic: false,
                    resourceType: 'trash'
                };
                // delete masterPersonal[4].synthetic;

                resourceData.personal[masterPersonal[4].fullPath] = masterPersonal[4];
            } else {
                // flag to create trash folder
                createUserTrash = true;
            }

            // adjust my dashboards
            // tslint:disable-next-line:max-line-length
            masterPersonal[0].id = response.personalFolder.id;
            masterPersonal[0].path = response.personalFolder.path;
            masterPersonal[0].subfolders = (response.personalFolder.subfolders) ? response.personalFolder.subfolders : [];
            masterPersonal[0].subfolders.sort(this.sortByName);
            masterPersonal[0].files = (response.personalFolder.files) ? response.personalFolder.files : [];
            masterPersonal[0].loaded = true;
            delete masterPersonal[0].synthetic;

            // adjust personal root
            resourceData.personal[masterPersonal[0].fullPath] = masterPersonal[0];

            // adjust folders
            // tslint:disable-next-line:forin
            for (const i in masterPersonal[0].subfolders) {
                const folder: DBNAVFolder = masterPersonal[0].subfolders[i];
                if (!folder.subfolders) { folder.subfolders = []; }
                if (!folder.files) { folder.files = []; }
                folder.loaded = false;
                folder.resourceType = 'personal';
                folder.icon = 'd-folder';
                resourceData.personal[folder.fullPath] = folder;
            }
        }

        // format namespaces
        if (response.memberNamespaces && response.memberNamespaces.length > 0) {
            for (const ns of response.memberNamespaces) {

                const folder = (ns.folder) ? ns.folder : {};
                user.memberNamespaces.push(ns.namespace);
                const namespace: DBNAVFolder = {...ns.folder,
                    name: ns.namespace.name,
                    alias: ns.namespace.alias,
                    namespaceId: ns.namespace.id,
                    subfolders: (folder.subfolders) ? folder.subfolders : [],
                    files: (folder.files) ? folder.files : [],
                    path: (folder.path) ? folder.path : '/namespace/' + ns.namespace.name.toLowerCase().replace(' ', '-'),
                    fullPath: (folder.fullPath) ? folder.fullPath : '/namespace/' + ns.namespace.name.toLowerCase().replace(' ', '-'),
                    type: (folder.type) ? folder.type : 'DASHBOARD',
                    topLevel: { type: 'namespace', value: ns.namespace.alias },
                    icon: 'd-dashboard-tile',
                    resourceType: 'namespace'
                };
                resourceData.namespaces[namespace.fullPath] = namespace;
                namespaces.push(resourceData.namespaces[namespace.fullPath]);
            }
        }

        // create first panel, AKA the MasterPanel
        const masterPanel: DBNAVPanelModel = {
            id: 0,
            name: 'masterPanel',
            path: '/',
            fullPath: '/',
            resourceType: 'master',
            personal: masterPersonal,
            namespaces: namespaces
        };

        const panels = [...state.panels];
        panels.push(masterPanel);

        // update state
        ctx.setState({...state,
            user,
            resourceData,
            panels,
            loaded: true,
            loading: false
        });

        // create user trash folder if needed
        if (createUserTrash) {
            // ctx.dispatch(new DBNAVcreateFolder('Trash', '/' + user.userid.replace('.', '/'), 0));
            ctx.dispatch(new DBNAVcreateFolder('Trash', response.personalFolder.id, 0));
        }
    }

    @Action(DBNAVloadNavResourcesFail)
    loadNavResourcesFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVloadNavResourcesFail) {
        this.logger.error('State :: Load Navigation Resource List', error);
        ctx.dispatch({
            loading: false,
            loaded: false,
            error: error,
            loadedDB: {}
        });
    }

    // add a panel
    // take folder resource and add to panels
    @Action(DBNAVaddPanel)
    addPanel(ctx: StateContext<DBNAVStateModel>, { payload }: DBNAVaddPanel) {

        this.logger.action('State :: Add Folder Panel', { payload });

        const state = ctx.getState();
        const panels = [...state.panels];
        const resources = {...state.resourceData};
        const currentPanelIndex = state.currentPanelIndex;

        const specialType = (payload.type !== 'namespace' || payload.type !== 'personal') ? payload.type : false;

        // need to infer the resourceType from path
        const path = payload.fullPath.split('/');
        const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';

        if (!resources[resourceType][payload.fullPath] || (resourceType === 'namespaces' && specialType === 'trash')) {
            // ruh roh... need to fetch it
            let parentPath = payload.fullPath.split('/');
            parentPath.pop();

            parentPath = parentPath.join('/');
            // console.log('parent', resourceType, parentPath);

            const parent = resources[resourceType][parentPath];
            // console.log('parent', parent);

            if (!specialType) {
                const child = parent.subfolders.filter( item => {
                    return item.fullPath = payload.fullPath;
                })[0];

                const folder = {...child,
                    subfolders: (child.subfolders && child.subfolders !== undefined) ? <DBNAVFolder[]>child.subfolders : <DBNAVFolder[]>[],
                    files: (child.files) ? <DBNAVFile[]>child.files : <DBNAVFile[]>[],
                    type: (child.type) ? child.type : 'DASHBOARD',
                    icon: 'd-folder',
                    resourceType: resourceType
                };

                folder.subfolders.sort(this.sortByName);
                resources[resourceType][folder.fullPath] = folder;

            } else {
                const folder = resources[resourceType][payload.fullPath];

                this.logger.log('FOLDER', {resourceType, fullPath: payload.fullPath, folder});

                folder.subfolders.sort(this.sortByName);
                // now what? its special... do we need to load anything?
            }

            ctx.patchState({...state,
                resourceData: resources
            });

        }

        const newPanel = <DBNAVPanelModel>resources[resourceType][payload.fullPath];
        newPanel.loaded = false;

        newPanel.subfolders.sort(this.sortByName);
        // console.log('>>> NEW PANEL <<<', newPanel);

        // check if one exists
        // console.log('%cCHECK', 'color: black; background-color: pink; padding: 4px 8px;', panels.indexOf(newPanel));

        if (panels.indexOf(newPanel) < 0) {
            panels.push(newPanel);

            ctx.patchState({...state,
                panels,
                currentPanelIndex: (panels.length - 1),
                panelAction: {
                    method: payload.panelAction
                }
            });

        }

        // does the panel need to be loaded? (AKA fetch subfolders/dashboards)
        if (!newPanel.loaded) {
            ctx.dispatch(new DBNAVloadSubfolder(newPanel));
        }

        // console.log('*** RESOURCES ***', resources);

    }

    // update the panels
    @Action(DBNAVupdatePanels)
    updatePanels(ctx: StateContext<DBNAVStateModel>, { payload }: DBNAVupdatePanels) {
        const state = ctx.getState();
        const idx = (payload.panels.length - 1);
        ctx.patchState({...state,
            panels: payload.panels,
            currentPanelIndex: (idx < 0) ? 0 : idx,
            panelAction: (payload.panelAction) ? payload.panelAction : {}
        });
    }

    /**************************
     * FOLDERS
     **************************/
    @Action(DBNAVcreateFolder)
    createFolder(ctx: StateContext<DBNAVStateModel>, { name, parentId, panelIndex }: DBNAVcreateFolder) {
        this.logger.action('State :: Create Folder', { name, parentId, panelIndex});

        const folder: any = {
            'name': name,
            'parentId': parentId
        };

        // ?? Do we need permission check?
        return this.navService.createFolder(folder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVcreateFolderSuccess(payload, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVcreateFolderFail(error)))
        );
    }

    @Action(DBNAVcreateFolderSuccess)
    createFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, panelIndex }: DBNAVcreateFolderSuccess) {
        this.logger.success('State :: Create Folder Success', response);
        const state = ctx.getState();

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        const folder = {...response,
            resourceType: type,
            subfolders: <DBNAVFolder[]>[],
            files: <DBNAVFile[]>[],
            icon: 'd-folder',
            loaded: false
        };

        const panels = [...state.panels];

        if (type === 'namespace' && folder.path.includes('/trash')) {
            folder.resourceType = 'trash';
            folder.icon = 'd-trash';
        }

        if (panelIndex === 0 && folder.path.includes('/trash')) {
            // if panelIndex = 0, that is master panel... slightly different
            // only case for this is if we are trying to create trash folder
            const tFolder = {...folder,
                icon: 'd-trash',
                loaded: false,
                synthetic: false,
                resourceType: 'trash'
            };
            panels[panelIndex].personal[4] = tFolder;
        } else {
            // console.log('!!! panel !!!', panels[panelIndex]);
            if (panels[panelIndex].subfolders === undefined) {
                panels[panelIndex].subfolders = [folder];
            } else {
                panels[panelIndex].subfolders.unshift(folder);
            }
        }

        const resourceData = {...state.resourceData};
        resourceData[resourceType][folder.fullPath] = folder;

        ctx.patchState({...state,
            panels,
            resourceData,
            panelAction: {
                method: 'createFolderSuccess',
                folder: folder
            }
        });

        // return folder;

    }

    @Action(DBNAVcreateFolderFail)
    createFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVcreateFolderFail) {
        this.logger.error('State :: Create Folder Failure', error);
    }

    @Action(DBNAVupdateFolder)
    updateFolder(ctx: StateContext<DBNAVStateModel>, { id, currentPath, updates, panelIndex }: DBNAVupdateFolder) {
        this.logger.action('State :: Update Folder', { id, currentPath, updates });

        // ?? Do we need permission check?
        return this.navService.updateFolder(id, updates).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVupdateFolderSuccess(payload, currentPath, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVupdateFolderFail(error)) )
        );
    }

    @Action(DBNAVupdateFolderSuccess)
    updateFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVupdateFolderSuccess) {
        this.logger.success('State :: Update Folder Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const path = response.fullPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';
        // const updateName = path.

        // is this a path change? This happens if they change the name of the folder
        if (response.fullPath !== originalPath) {
            let pathKeys = Object.keys(resourceData[resourceType]);
            pathKeys = pathKeys.filter( item => item.includes(originalPath));
            for ( const pathKey of pathKeys) {
                delete resourceData[resourceType][pathKey];
            }
        }

        const updatedFolder = {...response,
            resourceType: type,
            subfolders: response.subfolders || [],
            files: response.files || [],
            icon: 'd-folder',
            loaded: false
        };

        resourceData[resourceType][response.fullPath] = updatedFolder;

        // now need to update panel item
        const panels = [...state.panels];

        const targetIndex = panels[panelIndex].subfolders.findIndex( item => item.fullPath === originalPath);
        panels[panelIndex].subfolders[targetIndex] = updatedFolder;
        panels[panelIndex].subfolders.sort(this.sortByName);

        ctx.patchState({...state,
            panels,
            resourceData
        });

    }

    @Action(DBNAVupdateFolderFail)
    updateFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVupdateFolderFail) {
        this.logger.error('State :: Update Folder Error', error);
        ctx.dispatch({
            error: error
        });
    }

    /**
     *
     * @param ctx
     * @param param1
     *
     * payload is object
     * {
     *      sourcePath: string,
     *      destinationPath: string
     * }
     */
    @Action(DBNAVmoveFolder)
    moveFolder(ctx: StateContext<DBNAVStateModel>, { payloadBody, panelIndex }: DBNAVmoveFolder) {
        this.logger.action('State :: Move Folder', { payloadBody });

        const originalPath = payloadBody.source.fullPath;
        let destinationPath;
        const sourceId = payloadBody.source.id;
        let destinationId;

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const payload: any = { sourceId };

        // if moving to trash, find out ID of WHICH trash folder we are going to
        if (payloadBody.trashFolder === true) {

            const path = payloadBody.source.fullPath.split('/');
            const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';
            const trashPath = path.slice(0, 3).join('/') + '/trash';
            destinationId = resourceData[resourceType][trashPath].id;
            destinationPath = resourceData[resourceType][trashPath].fullPath;

            payload.destinationId = destinationId;
            payload.trashFolder = true;

        // else there should be a destination object
        } else {
            destinationId = payloadBody.destination.id;
            destinationPath = payloadBody.destination.fullPath;
            payload.destinationId = destinationId;
        }

        // TODO: simple permission check
        if ( this.simplePermissionCheck(ctx, originalPath) && this.simplePermissionCheck(ctx, destinationPath) ) {
            return this.navService.moveFolder(payload).pipe(
                map( (response: any) => {
                    ctx.dispatch(new DBNAVmoveFolderSuccess(response, originalPath, panelIndex));
                }),
                catchError( error => ctx.dispatch(new DBNAVmoveFolderFail(error)) )
            );
        }

        // TODO: Better error message
        return ctx.dispatch(new DBNAVmoveFolderFail({message: 'Do not have permission to move file'}));
    }

    @Action(DBNAVmoveFolderSuccess)
    moveFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVmoveFolderSuccess) {
        this.logger.success('State :: Move Folder Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];

        const path = response.fullPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        // TODO
        // ?? Do we need to do something special if it was trashed?

        // delete original from resourceData
        delete resourceData[resourceType][originalPath];

        // delete children who have original path
        let pathKeys = Object.keys(resourceData[resourceType]);
        pathKeys = pathKeys.filter( item => item.includes(originalPath));
        for ( const pathKey of pathKeys) {
            delete resourceData[resourceType][pathKey];
        }

        // delete from the panel
        const subFolderIndex = panels[panelIndex].subfolders.findIndex( item => item.fullPath === originalPath);
        panels[panelIndex].subfolders.splice(subFolderIndex, 1);

        // add new item to resource data
        const newFolder: DBNAVFolder = {...response,
            resourceType: type,
            files: response.files || [],
            subfolders: response.subfolders || [],
            icon: 'd-folder',
            loaded: false
        };
        newFolder.subfolders.sort(this.sortByName);

        resourceData[resourceType][newFolder.fullPath] = newFolder;

        // TODO
        // ?? if new destination is already a panel, should we move it? YES!!!
        // !! might need to add it to the resourceData folder for new destination?
        let parentPath = response.fullPath.split('/');
        parentPath.pop();
        parentPath = parentPath.join('/');

        const panelCheckIndex = panels.findIndex(item => item.fullPath === parentPath);
        if (panelCheckIndex >= 0) {
            panels[panelCheckIndex].subfolders.push(resourceData[resourceType][newFolder.fullPath]);
            panels[panelCheckIndex].subfolders.sort(this.sortByName);
        }

        ctx.patchState({...state,
            resourceData,
            panels
        });
    }

    @Action(DBNAVmoveFolderFail)
    moveFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVmoveFolderFail) {
        this.logger.error('State :: Move Folder Error', error);
        ctx.dispatch({
            error: error
        });
    }


    /**
     * Get a subfolder
     * @param ctx
     * @param path
     *
     * returns Observable
     */
    @Action(DBNAVloadSubfolder)
    loadSubfolder(ctx: StateContext<DBNAVStateModel>, { folderObj }: DBNAVloadSubfolder) {
        this.logger.action('State :: Load Sub Folder', { folderObj });

        const fullPath = folderObj.fullPath;
        const path = folderObj.path;

        ctx.patchState({ loading: true});

        const pathParts = fullPath.split('/');
        let topFolder: any = false;

        if (pathParts.length === 3) {
            const value = (pathParts[1].toLowerCase() === 'namespace') ? folderObj.alias : 'user.' + pathParts[2];
            topFolder = {
                type: (pathParts[1].toLowerCase() === 'namespace') ? 'namespace' : 'user',
                value: value
            };
        }

        return this.navService.getFolderByPath(path, topFolder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVloadSubfolderSuccess(payload, topFolder));
            }),
            catchError( error => ctx.dispatch(new DBNAVloadSubfolderFail(error)))
        );

    }

    @Action(DBNAVloadSubfolderSuccess)
    loadSubfolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, topFolder }: DBNAVloadSubfolderSuccess) {
        this.logger.success('State :: Load Sub Folder Success', { response });
        // success... do something

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];
        const panelIdx = state.currentPanelIndex;

        if (topFolder && topFolder.type === 'user') {
            // user topfolder is wierd, so we have to normalize it to what we expect it to look like;
            const refactorResponse: any = {
                ...response.personalFolder,
                type: 'DASHBOARD',
                subfolders: response.personalFolder.subfolders || [],
                files: response.personalFolder.files || []
            };
            response = refactorResponse;
        }

        // need to infer the resourceType from path
        const path = response.fullPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';
        const topPath = path.splice(0, 3).join('/');

        const subFolder = {...resourceData[resourceType][response.fullPath],
            files: response.files || [],
            subfolders: response.subfolders || [],
            loaded: true
        };
        subFolder.subfolders.sort(this.sortByName);

        // update the resource data for item
        resourceData[resourceType][response.fullPath] = subFolder;

        // tslint:disable-next-line:forin
        for (const i in subFolder.subfolders) {
            const folder = subFolder.subfolders[i];
            if (resourceType === 'personal' && folder.fullPath === topPath + '/trash') {
                subFolder.subfolders.splice(i, 1);
            } else {
                if (!folder.subfolders || folder.subfolders === undefined) { folder.subfolders = []; }
                if (!folder.files || folder.files === undefined) { folder.files = []; }
                folder.loaded = false;
                folder.resourceType = (resourceType === 'namespaces') ? 'namespace' : 'personal';
                folder.icon = 'd-folder';
                resourceData[resourceType][folder.fullPath] = folder;
            }
        }

        let createNamespaceTrashFolder = false;

        // is this a namespace folder? and does it need a trash folder?
        if (type === 'namespace' && topPath === response.fullPath) {
            // check for trash folder
            const trashIndex = subFolder.subfolders.findIndex(item => item.fullPath === topPath + '/trash');
            if (trashIndex === -1) {
                createNamespaceTrashFolder = true;
            } else {
                subFolder.subfolders[trashIndex].resourceType = 'trash';
                subFolder.subfolders[trashIndex].icon = 'd-trash';
            }
        }

        panels[panelIdx].files = subFolder.files;
        panels[panelIdx].subfolders = subFolder.subfolders;
        panels[panelIdx].subfolders.sort(this.sortByName);

        // if panel is second, that means it is just under master panel. We need to update master panel items
        if (panelIdx === 1) {

            if (type === 'personal' && subFolder.resourceType === 'trash') {
                panels[0].personal[4].files = resourceData[resourceType][response.fullPath].files;
                panels[0].personal[4].subfolders = resourceData[resourceType][response.fullPath].subfolders;
                panels[0].personal[4].subfolders.sort(this.sortByName);
            }

            if (type === 'personal' && subFolder.fullPath === topPath) {
                panels[0].personal[0].files = resourceData[resourceType][response.fullPath].files;
                panels[0].personal[0].subfolders = resourceData[resourceType][response.fullPath].subfolders;
                panels[0].personal[0].subfolders.sort(this.sortByName);
            }

            if (type === 'namespace') {
                const nsIndex = panels[0].namespaces.findIndex(item => item.fullPath === topPath);

                if (nsIndex >= 0) {
                    panels[0].namespaces[nsIndex].files = resourceData[resourceType][response.fullPath].files;
                    panels[0].namespaces[nsIndex].subfolders = resourceData[resourceType][response.fullPath].subfolders;
                    panels[0].namespaces[nsIndex].subfolders.sort(this.sortByName);
                }
            }
        }

        ctx.patchState({...state,
            panels,
            resourceData,
            loading: false
        });

        if (createNamespaceTrashFolder && this.simplePermissionCheck(ctx, topPath)) {
            const nsFolderId = resourceData.namespaces[topPath].id;
            ctx.dispatch(new DBNAVcreateFolder('Trash', nsFolderId, panelIdx));
        }

    }

    @Action(DBNAVloadSubfolderFail)
    loadSubfolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVloadSubfolderFail) {
        this.logger.error('State :: Load Subfolder Folder Error', error);
        ctx.dispatch({
            error: error
        });
    }

    /**************************
     * FILES
     **************************/

     /**
     *
     * @param ctx
     * @param param1
     *
     * payload is object
     * {
     *      sourcePath: string,
     *      destinationPath: string,
     *      trashFolder?: boolean <optional>
     * }
     */
    @Action(DBNAVmoveFile)
    moveFile(ctx: StateContext<DBNAVStateModel>, { payloadBody, panelIndex }: DBNAVmoveFile) {
        this.logger.action('State :: Move File', { payloadBody });

        const originalPath = payloadBody.source.fullPath;
        let destinationPath;
        const sourceId = payloadBody.source.id;
        let destinationId;

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const payload: any = { sourceId };

        if (payloadBody.trashFolder === true) {

            const path = payloadBody.source.fullPath.split('/');
            const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';
            const trashPath = path.slice(0, 3).join('/') + '/trash';
            destinationId = resourceData[resourceType][trashPath].id;
            destinationPath = resourceData[resourceType][trashPath].fullPath;

            payload.destinationId = destinationId;
            payload.trashFolder = true;

        // else there should be a destination object
        } else {
            destinationId = payloadBody.destination.id;
            destinationPath = payloadBody.destination.fullPath;
            payload.destinationId = destinationId;
        }

        // TODO: simple permission check
        if (this.simplePermissionCheck(ctx, originalPath) && this.simplePermissionCheck(ctx, destinationPath)) {
            return this.navService.moveFile(payload).pipe(
                map( (response: any) => {
                    ctx.dispatch(new DBNAVmoveFileSuccess(response, originalPath, panelIndex));
                }),
                catchError( error => ctx.dispatch(new DBNAVmoveFileFail(error)) )
            );
        }

        // TODO: better error message?
        return ctx.dispatch(new DBNAVmoveFileFail({message: 'Do not have permission to move file'}));
    }

    @Action(DBNAVmoveFileSuccess)
    moveFileSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVmoveFileSuccess) {
        this.logger.success('State :: Move File Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];

        const path = response.fullPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        // now fix old parent item in resourceData
        let parentPath: any = originalPath.split('/');
        const parentType = (parentPath[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const parentResourceType = (parentType === 'namespace') ? 'namespaces' : 'personal';
        parentPath.pop();
        parentPath = parentPath.join('/');

        // console.log('PANELS BEFORE', panels);
        const parentFileIndex = resourceData[parentResourceType][parentPath].files.findIndex( item => item.fullPath === originalPath);
        resourceData[parentResourceType][parentPath].files.splice(parentFileIndex, 1);

        // console.log('PANELS AFTER RESOURCES UPDATE', panels);
        // now fix the panel data
        panels[panelIndex].files = resourceData[parentResourceType][parentPath].files;

        // get new parent path
        let newParentPath: any = response.path.split('/');
        newParentPath.pop();
        const parentIsTopLevel = newParentPath.length === 3;
        newParentPath = newParentPath.join('/');

        // if new parent path is in resourceData, update it
        if (resourceData[resourceType][newParentPath]) {
            resourceData[resourceType][newParentPath].files.push(response);
            resourceData[resourceType][newParentPath].files.sort(this.sortByName);
        }

        // if parent path is in a current panel, update it
        const newPanelIndex = panels.findIndex( item => item.path === newParentPath);

        if (newPanelIndex >= 0) {
            panels[newPanelIndex].files = resourceData[resourceType][newParentPath].files;
        }

        // might be a top level personal item, then it needs to be updated in the master panel
        // most likely happens if it is personal trash, or top level user folder
        if (parentIsTopLevel && type === 'personal') {
            if (resourceData[resourceType][newParentPath].resourceType === 'trash') {
                // if trash
                panels[0].personal[4].files = resourceData[resourceType][newParentPath].files;
                panels[0].personal[4].files.sort(this.sortByName);
            } else {
                // else, must be top level user folder
                panels[0].personal[0].files = resourceData[resourceType][newParentPath].files;
                panels[0].personal[0].files.sort(this.sortByName);
            }
        }

        // might be a top level item of a namespace
        if (parentIsTopLevel && type === 'namespace') {
            const namespaceIndex = panels[0].namespaces.findIndex(item => item.fullPath === newParentPath);
            if (resourceData[resourceType][newParentPath]) {
                panels[0].namespaces[namespaceIndex].files = resourceData[resourceType][newParentPath].files;
                panels[0].namespaces[namespaceIndex].files.sort(this.sortByName);
            }
        }

        // console.log('PANELS', panels);

        ctx.patchState({...state,
            panels,
            resourceData
        });

    }

    @Action(DBNAVmoveFileFail)
    moveFileFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVmoveFileFail) {
        this.logger.error('State :: Move File Error', error);
        ctx.dispatch({
            error: error
        });
    }

    /**************************
     * RESOURCES ONLY
     * Just Loads Data
     **************************/

    @Action(DBNAVloadFolderResource)
    loadFolderResource(ctx: StateContext<DBNAVStateModel>, { targetPath }: DBNAVloadFolderResource) {
        this.logger.action('State :: Load Folder Resource', { targetPath });

        ctx.patchState({ loading: true});

        const pathParts = targetPath.split('/');
        let topFolder: any = false;

        if (pathParts.length === 3) {
            const value = (pathParts[1].toLowerCase() === 'namespace') ? pathParts[2] : 'user.' + pathParts[2];
            topFolder = {
                type: (pathParts[1].toLowerCase() === 'namespace') ? 'namespace' : 'user',
                value: value
            };
        }

        return this.navService.getFolderByPath(targetPath, topFolder).pipe(
            map( (payload: any) => {
                return ctx.dispatch(new DBNAVloadFolderResourceSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DBNAVloadFolderResourceFail(error)))
        );
    }

    @Action(DBNAVloadFolderResourceSuccess)
    loadFolderResourceSucess(ctx: StateContext<DBNAVStateModel>, { response }: DBNAVloadFolderResourceSuccess) {
        this.logger.success('State :: Load Folder Resource Success', response);

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const path = response.fullPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';

        const topPath = path.splice(0, 3).join('/');

        const pathFolder = {...resourceData[resourceType][response.fullPath],
            files: response.files || [],
            subfolders: response.subfolders || [],
            loaded: true
        };

        // subfolders
        // tslint:disable-next-line:forin
        for (const i in pathFolder.subfolders) {
            const folder = pathFolder.subfolders[i];
            if (resourceType === 'personal' && folder.fullPath === topPath + '/trash') {
                pathFolder.subfolders.splice(i, 1);
            } else {
                if (!folder.subfolders || folder.subfolders === undefined) { folder.subfolders = []; }
                if (!folder.files || folder.files === undefined) { folder.files = []; }
                folder.loaded = false;
                folder.resourceType = (resourceType === 'namespaces') ? 'namespace' : 'personal';
                folder.icon = 'd-folder';
                resourceData[resourceType][folder.fullPath] = folder;
            }
        }

        // update the resource data for item
        resourceData[resourceType][response.fullPath] = pathFolder;

        ctx.patchState({
            ...state,
            resourceData
        });

    }

    @Action(DBNAVloadFolderResourceFail)
    loadFolderResourceFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVloadFolderResourceFail) {
        this.logger.error('State :: Load Folder Resource Error', error);
        ctx.dispatch({
            error: error
        });
    }

    /**************************
     * MINI NAVIGATOR
     **************************/

    @Action(MiniNavOpenNavigator)
    MiniNavOpenNavigator(ctx: StateContext<DBNAVStateModel>, { targetPath, targetType, actionMode }: MiniNavOpenNavigator) {
        this.logger.action('State :: MINI NAV OPEN', { targetPath, targetType, actionMode });
        const state = ctx.getState();

        // NOTE: upon opening the miniNavigator, it generates the paths/panels for the full targetPath based on existing resourceData.
        // NOTE: It does not cache panels like the main navigator does, but it uses the same resourceData

        if (!state.loaded) {
            // navigator data hasn't been loaded yet... go get it
            return ctx.dispatch(
                new DBNAVloadNavResources()
            ).pipe(
                map( (payload: any) => {
                    // console.log('miniNav state loaded... opening miniNav');
                    ctx.dispatch(new MiniNavOpenNavigator(targetPath, targetType, actionMode));
                }),
                catchError( error => ctx.dispatch(new MiniNavOpenNavigatorFail(error)) )
            );
        } else {

            // NOTE: if actionMode is 'select', might need to do a deep resource retrieval
            // TODO: check for this case once starting to work on 'select' case

            // console.log('state loaded');

            const miniNavigator = {...state.miniNavigator};
            let panels = [...miniNavigator.panels];
            const selected = {...miniNavigator.selected};

            selected.panel = false;
            selected.folder = false;

            panels = [];

            const user = {...state.user};
            const userPath = '/' + user.userid.replace('.', '/');

            const resourceData = {...state.resourceData};

            const path = targetPath.split('/');
            const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
            const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

            const topPath = targetPath.split('/').splice(0, 3).join('/');

            // CREATE MASTER PANEL FIRST
            const masterSubFolders = [];

            masterSubFolders[0] = {
                id: resourceData.personal[userPath].id,
                name: 'My Dashboards',
                path: resourceData.personal[userPath].path,
                fullPath: userPath,
                resourceType: 'personal',
                type: 'DASHBOARD',
                icon: 'd-dashboard-tile',
                synthetic: true,
                loaded: false,
                moveEnabled: true,
                selectEnabled: true
            };

            masterSubFolders[1] = {
                id: 0,
                name: 'Namespaces',
                path: '/namespace',
                fullPath: '/namespace',
                resourceType: 'namespaces',
                type: 'DASHBOARD',
                icon: 'd-dashboard-tile',
                synthetic: true,
                loaded: false,
                moveEnabled: false,
                selectEnabled: false
            };

            const masterPanel: MiniNavPanelModel = {
                id: 0,
                name: 'Dashboards',
                path: '/',
                fullPath: '/',
                resourceType: 'master',
                icon: 'd-dashboard-tile',
                subfolders: [...masterSubFolders],
                moveEnabled: false,
                selectEnabled: false
            };

            panels[0] = masterPanel;

            // NOW drill down into the URL
            // if path is a namespace, build that path out
            if (type === 'namespace') {
                // console.log('namespace path [' + actionMode + ']');
                const namespaceListPanel: MiniNavPanelModel = {
                    id: 0,
                    name: 'Namespaces',
                    path: '/namespace',
                    fullPath: '/namespace',
                    resourceType: 'master',
                    icon: 'd-dashboard-tile',
                    moveEnabled: false,
                    selectEnabled: false,
                    subfolders: []
                };

                for (const ns of user.memberNamespaces) {
                    const nsFolder = {...ns,
                        path: '/namespace/' + ns.alias,
                        fullPath: '/namespace/' + ns.alias,
                        resourceType: 'namespace',
                        type: 'DASHBOARD',
                        icon: 'd-dashboard-tile',
                        synthetic: true,
                        loaded: false,
                        moveEnabled: true,
                        selectEnabled: true
                    };
                    namespaceListPanel.subfolders.push(nsFolder);
                }
                namespaceListPanel.subfolders.sort(this.sortByName);

                panels.push(namespaceListPanel);
            }

            // if path is personal, build that path out
            if (type === 'personal') {

                // need a unique clone, in order to not taint the resourceData
                const personalClone = JSON.parse(JSON.stringify(state.resourceData.personal[userPath]));
                // console.log('personal path [' + actionMode + ']', personalClone);

                const personalListPanel: MiniNavPanelModel = {...personalClone,
                    icon: 'd-dashboard-tile',
                    loaded: false,
                    moveEnabled: true,
                    selectEnabled: true
                };
                personalListPanel.subfolders.sort(this.sortByName);

                for (const i in personalListPanel.subfolders) {
                    if (personalListPanel.subfolders[i]) {
                        const sub = personalListPanel.subfolders[i];
                        if (sub.fullPath.split('/').length >= 3) {
                            sub.moveEnabled = true;
                            sub.selectEnabled = true;
                        }
                        // if move mode, check if target is in subfolders. if yes, flag it to not display
                        if (actionMode === 'move' && sub.fullPath === targetPath) {
                            sub.noDisplay = true;
                        }
                    }
                }

                panels.push(personalListPanel);
            }

            // if in MOVE mode
            // remove the tail of the path
            // because if it is folder/dashboard
            // it will be listed in its parents folder
            if (actionMode === 'move') {
                path.pop();
            }

            const parentPath = path.join('/');

            if (path.length > 3) {
                // console.log('Deeper path than top level personal or namespace... probing');
                // remove first 3
                let pathPart = path.splice(0, 3).join('/');

                for (const part of path) {
                    pathPart = pathPart + '/' + part;

                    // console.log('[[[ PATH PART ]]]', pathPart, resourceData[resourceType][pathPart]);

                    // need a unique clone, in order to not taint the resourceData
                    const pathClone = JSON.parse(JSON.stringify(resourceData[resourceType][pathPart]));

                    const pathPanel: MiniNavPanelModel = {
                        ...pathClone,
                        icon: 'd-folder',
                        loaded: false,
                        moveEnabled: (pathPart !== parentPath),
                        selectEnabled: (pathPart !== parentPath)
                    };
                    pathPanel.subfolders.sort(this.sortByName);
                    // console.log('+ path panel [' + actionMode + ']', pathPanel);

                    for (const i in pathPanel.subfolders) {
                        if (pathPanel.subfolders[i]) {
                            const sub = pathPanel.subfolders[i];
                            if (sub.fullPath.split('/').length >= 3) {
                                sub.moveEnabled = true;
                                sub.selectEnabled = true;
                            }
                            // if move mode, check if target is in subfolders. If yes, flag it to not display
                            if (actionMode === 'move' && sub.fullPath === targetPath) {
                                sub.noDisplay = true;
                            }
                        }
                    }

                    panels.push(pathPanel);
                }

            }

            miniNavigator.panels = panels;
            miniNavigator.panelIndex = (panels.length - 1);
            miniNavigator.selected = selected;
            miniNavigator.moveTargetPath = targetPath;

            // console.log('updated miniNavigator...', miniNavigator);

            ctx.patchState({...state,
                miniNavigator
            });

        }
    }

    @Action(MiniNavMarkFolderSelected)
    MiniNavMarkFolderSelected(ctx: StateContext<DBNAVStateModel>, { panel, folder }: MiniNavMarkFolderSelected) {
        this.logger.action('State :: MINI NAV MARK FOLDER SELECTED', { panel, folder });
        const state = ctx.getState();

        const miniNavigator = {...state.miniNavigator};
        const selected = {...miniNavigator.selected};

        const panels = [...miniNavigator.panels];

        // reset old selected
        if (selected.panel && selected.folder && panels[selected.panel]) {
            const folderIndex = panels[selected.panel].subfolders.indexOf(selected.folder);
            panels[selected.panel].subfolders[folderIndex].selected = false;
        }

        // update to new selected folder
        const newFolderIndex = panels[panel].subfolders.indexOf(folder);
        panels[panel].subfolders[newFolderIndex].selected = true;

        selected.panel = panel;
        selected.folder = panels[panel].subfolders[newFolderIndex];

        miniNavigator.selected = selected;

        ctx.patchState({
            ...state,
            miniNavigator
        });
    }

    @Action(MiniNavResetFolderSelected)
    MiniNavResetFolderSelected(ctx: StateContext<DBNAVStateModel>, { }: MiniNavResetFolderSelected) {
        this.logger.action('State :: MINI NAV RESET FOLDER SELECTED', {});
        const state = ctx.getState();

        const miniNavigator = {...state.miniNavigator};
        const selected = {...miniNavigator.selected};

        const panels = [...miniNavigator.panels];

        if (selected.panel && selected.folder && panels[selected.panel]) {
            const folderIndex = panels[selected.panel].subfolders.indexOf(selected.folder);
            panels[selected.panel].subfolders[folderIndex].selected = false;
        }

        // reset selected folder

        selected.panel = false;
        selected.folder = false;

        miniNavigator.selected = selected;

        ctx.patchState({
            ...state,
            miniNavigator
        });
    }

    @Action(MiniNavCloseNavigator)
    MiniNavCloseNavigator(ctx: StateContext<DBNAVStateModel>, { }: MiniNavCloseNavigator) {
        this.logger.action('State :: MINI NAV CLOSE NAVIGATOR', {});
        const state = ctx.getState();

        const miniNavigator = {...state.miniNavigator};
        const selected = {...miniNavigator.selected};

        // Reset MiniNavigator
        miniNavigator.panelIndex = 0;
        miniNavigator.panels = [];

        miniNavigator.selected = selected;
        miniNavigator.moveTargetPath = false;

        ctx.patchState({
            ...state,
            miniNavigator
        });

        ctx.dispatch(new MiniNavResetFolderSelected());
    }

    @Action(MiniNavLoadPanel)
    MiniNavLoadPanel(ctx: StateContext<DBNAVStateModel>, { panelPath, actionMode, guid }: MiniNavLoadPanel) {
        this.logger.action('State :: MINI NAV LOAD PANEL', { panelPath });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const path = panelPath.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        if (
            (!resourceData[resourceType][panelPath] && panelPath !== '/namespace') ||
            (resourceData[resourceType][panelPath] && !resourceData[resourceType][panelPath].loaded)
        ) {
            return ctx.dispatch(
                new DBNAVloadFolderResource(panelPath)
            ).pipe(
                map( (payload: any) => {
                    return ctx.dispatch(new MiniNavLoadPanel(panelPath, actionMode, guid));
                }),
                catchError( error => ctx.dispatch(new MiniNavOpenNavigatorFail(error)) )
            );

        } else {

            const miniNavigator = {...state.miniNavigator};
            const panels = [...miniNavigator.panels];
            let panelIndex = miniNavigator.panelIndex;
            const moveTargetPath = miniNavigator.moveTargetPath;

            let pathPanel: MiniNavPanelModel;

            if (panelPath === '/namespace') {
                const user = {...state.user};

                pathPanel = <MiniNavPanelModel>{
                    id: 0,
                    name: 'Namespaces',
                    path: '/namespace',
                    resourceType: 'master',
                    icon: 'd-dashboard-tile',
                    moveEnabled: false,
                    selectEnabled: false,
                    subfolders: []
                };

                for (const ns of user.memberNamespaces) {
                    const nsFolder = {...ns,
                        path: '/namespace/' + ns.alias,
                        fullPath: '/namespace/' + ns.alias,
                        resourceType: 'namespace',
                        type: 'DASHBOARD',
                        icon: 'd-dashboard-tile',
                        synthetic: true,
                        loaded: false,
                        moveEnabled: true,
                        selectEnabled: true,
                        topLevel: { type: 'namespace', value: ns.alias}
                    };
                    pathPanel.subfolders.push(nsFolder);
                }
            } else {
                const pathClone = JSON.parse(JSON.stringify(resourceData[resourceType][panelPath]));
                pathPanel = <MiniNavPanelModel>{
                    ...pathClone,
                    icon: 'd-folder',
                    loaded: false,
                    moveEnabled: (path.length >= 3),
                    selectEnabled: (path.length >= 3)
                };

                // subfolders
                for (const i in pathPanel.subfolders) {
                    if (pathPanel.subfolders[i]) {
                        const sub = pathPanel.subfolders[i];
                        if (actionMode === 'move' && sub.fullPath === moveTargetPath) {
                            sub.noDisplay = true;
                        }
                        sub.moveEnabled = true;
                        sub.selectEnabled = true;
                    }
                }
            }

            pathPanel.subfolders.sort(this.sortByName);

            panels.push(pathPanel);
            panelIndex = panels.length - 1;

            miniNavigator.panels = panels;
            miniNavigator.panelIndex = panelIndex;

            ctx.patchState({
                ...state,
                miniNavigator,
                panelAction: {
                    guid: guid,
                    method: 'loadPanelComplete',
                    data: pathPanel
                }
            });

            ctx.dispatch(new MiniNavResetFolderSelected());
        }
    }

    @Action(MiniNavRemovePanel)
    MiniNavRemovePanel(ctx: StateContext<DBNAVStateModel>, { panelIndex, guid }: MiniNavRemovePanel) {
        this.logger.action('State :: MINI NAV REMOVE PANEL', { panelIndex });
        const state = ctx.getState();
        const miniNavigator = {...state.miniNavigator};
        const panels = [...miniNavigator.panels];
        let pIndex = miniNavigator.panelIndex;

        panels.splice(panelIndex, 1);
        pIndex = panels.length - 1;

        miniNavigator.panels = panels;
        miniNavigator.panelIndex = pIndex;

        ctx.patchState({
            ...state,
            miniNavigator,
            panelAction: {
                guid: guid,
                method: 'removePanelComplete'
            }
        });

        ctx.dispatch(new MiniNavResetFolderSelected());

    }
}

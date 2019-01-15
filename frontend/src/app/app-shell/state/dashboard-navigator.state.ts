import {
    State,
    StateContext,
    Action,
    Selector,
    createSelector
} from '@ngxs/store';

import {
    map,
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
    DBNAVStateModel
} from './dashboard-navigator.interfaces';

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
    DBNAVupdatePanels
} from './dashboard-navigator.actions';

/** Action Definitions */

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
        panelAction: {}
    }
})

export class DashboardNavigatorState {

    constructor (
        private navService: DashboardNavigatorService,
    ) {}

    /**************************
     * SELECTORS
     **************************/

    @Selector() static getResourceData(state: DBNAVStateModel) {
        return state.resourceData;
    }

    public static getFolderResource(path: string, type: string) {
        return createSelector([DashboardNavigatorState], (state: DBNAVStateModel) => {
            return state.resourceData[type][path];
        });
    }

    @Selector() static getDBNavError(state: DBNAVStateModel) {
        return state.error;
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

    @Selector() static getDBNavPanels(state: DBNAVStateModel) {
        return state.panels;
    }

    @Selector() static getDBNavStatus(state: DBNAVStateModel) {
        return state.status;
    }

    @Selector() static getDBNavPanelAction(state: DBNAVStateModel) {
        return state.panelAction;
    }

    /**************************
     * UTILS
     **************************/

    stateLog(title: string, params?: any) {
        if (params) {
            console.group(
                '%cDashboardNavigatorState%c' + title,
                'color: white; background-color: DarkTurquoise ; padding: 4px 8px; font-weight: bold;',
                'color: DarkTurquoise ; padding: 4px 8px; border: 1px solid DarkTurquoise ;'
            );
            console.log('%cParams', 'font-weight: bold;', params);
            console.groupEnd();
        } else {
            console.log(
                '%cDashboardNavigatorState%c' + title,
                'color: white; background-color: DarkTurquoise ; padding: 4px 8px; font-weight: bold;',
                'color: DarkTurquoise ; padding: 4px 8px; border: 1px solid DarkTurquoise ;'
            );
        }
    }

    stateError(title: string, error: any) {
        console.group(
            '%cDashboardNavigatorState [ERROR]%c' + title,
            'color: white; background-color: red; padding: 4px 8px; font-weight: bold;',
            'color: red; padding: 4px 8px; border: 1px solid red;'
        );
        console.log('%cErrorMsg', 'font-weight: bold;', error);
        console.groupEnd();
    }

    stateSuccess(title: string, response: any) {
        console.group(
            '%cDashboardNavigatorState [SUCCESS]%c' + title,
            'color: white; background-color: green; padding: 4px 8px; font-weight: bold;',
            'color: green; padding: 4px 8px; border: 1px solid green;',
            response
        );
        console.log('%cResponse', 'font-weight: bold;', response);
        console.groupEnd();
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
        this.stateLog('Get Folder Resource');
        const state = ctx.getState();
        const resources = {...state.resourceData};
        return resources[type][path];
    }

    // Load the default resources
    // Top level personal folders
    // Top level Namespaces you are members of
    @Action(DBNAVloadNavResources)
    loadNavResources(ctx: StateContext<DBNAVStateModel>, {}: DBNAVloadNavResources) {
        this.stateLog('Load Navigation Resource List');
        const state = ctx.getState();
        if (!state.loaded) {
            ctx.patchState({ loading: true});
            return this.navService.getDashboardResourceList().pipe(
                map( (payload: any) => {
                    console.log('resourceList', payload);
                    ctx.dispatch(new DBNAVloadNavResourcesSuccess(payload));
                }),
                catchError( error => ctx.dispatch(new DBNAVloadNavResourcesFail(error)))
            );
        }

    }

    @Action(DBNAVloadNavResourcesSuccess)
    loadNavResourcesSuccess(ctx: StateContext<DBNAVStateModel>, { response }: DBNAVloadNavResourcesSuccess) {
        const state = ctx.getState();

        this.stateSuccess('Load Navigation Resource List', response);

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
        masterPersonal[0] = {
            id: 0,
            name: 'My Dashboards',
            path: '/' + user.userid.replace('.', '/'),
            subfolders: [],
            files: [],
            resourceType: 'personal',
            type: 'DASHBOARD',
            icon: 'd-dashboard-tile',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[0].path] = masterPersonal[0];
        // favorites
        masterPersonal[1] = {
            id: 0,
            name: 'My Favorites',
            path: '/' + user.userid.replace('.', '/') + '/favorites',
            files: [],
            resourceType: 'favorites',
            icon: 'd-star',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[1].path] = masterPersonal[1];
        // frequently visited
        masterPersonal[2] = {
            id: 0,
            name: 'Frequently Visited',
            path: '/' + user.userid.replace('.', '/') + '/frequently-visited',
            files: [],
            resourceType: 'frequentlyVisited',
            type: 'DASHBOARD',
            icon: 'd-duplicate',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[2].path] = masterPersonal[2];
        // recently visited
        masterPersonal[3] = {
            id: 0,
            name: 'Recently Visited',
            path: '/' + user.userid.replace('.', '/') + '/recently-visited',
            files: [],
            resourceType: 'recentlyVisited',
            type: 'DASHBOARD',
            icon: 'd-time',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[3].path] = masterPersonal[3];
        // trash
        masterPersonal[4] = {
            id: 0,
            name: 'Trash',
            path: '/' + user.userid.replace('.', '/') + '/trash',
            subfolders: [],
            files: [],
            resourceType: 'trash',
            type: 'DASHBOARD',
            icon: 'd-trash',
            synthetic: true,
            loaded: false
        };
        resourceData.personal[masterPersonal[4].path] = masterPersonal[4];

        let createUserTrash = false;

        if (response.personalFolder && response.personalFolder.subfolders) {
            // do trash first so we can pull it up to root level
            // find trash
            const trashFilter = response.personalFolder.subfolders.filter( folder => {
                return folder.path === '/' + user.userid.replace('.', '/') + '/trash';
            });

            if (trashFilter.length > 0) {
                const trashIndex = response.personalFolder.subfolders.indexOf(trashFilter[0]);
                const trashFolder = response.personalFolder.subfolders.splice(trashIndex, 1)[0];
                masterPersonal[4] = trashFolder;
                masterPersonal[4] = {...masterPersonal[4],
                    icon: 'd-trash',
                    loaded: false,
                    // synthetic: false,
                    resourceType: 'trash'
                };
                // delete masterPersonal[4].synthetic;
            } else {
                // flag to create trash folder
                createUserTrash = true;
            }

            // adjust my dashboards
            masterPersonal[0].subfolders = (response.personalFolder.subfolders) ? response.personalFolder.subfolders : [];
            masterPersonal[0].files = (response.personalFolder.files) ? response.personalFolder.files : [];
            masterPersonal[0].loaded = true;
            delete masterPersonal[0].synthetic;

            // adjust personal root
            resourceData.personal[masterPersonal[0].path] = masterPersonal[0];

            // adjust folders
            // tslint:disable-next-line:forin
            for (const i in masterPersonal[0].subfolders) {
                const folder = masterPersonal[0].subfolders[i];
                if (!folder.subfolders) { folder.subfolders = []; }
                if (!folder.files) { folder.files = []; }
                folder.loaded = false;
                folder.resourceType = 'personal';
                folder.icon = 'd-folder';
                resourceData.personal[folder.path] = folder;
            }
        }

        /*if (response.personalFolder && response.personalFolder.subfolders && response.personalFolder.subfolders.length > 0) {
            personal = response.personalFolder.subfolders;
            masterPersonal = new Array();

            // format personal
            // tslint:disable-next-line:forin
            for (const i in personal) {
                const folder = personal[i];
                if (!folder.subfolders) { folder.subfolders = []; }
                if (!folder.files) { folder.files = []; }
                folder.resourceType = 'personal';
                switch (folder.name) {
                    case 'My Dashboards':
                        folder.icon = 'd-dashboard-tile';
                        masterPersonal[0].subfolders = (folder.subfolders) ? folder.subfolders : [];
                        masterPersonal[0].files = (folder.files) ? folder.files : [];
                        break;
                    case 'My Favorites':
                        folder.icon = 'd-star';
                        masterPersonal[1] = folder;
                        break;
                    case 'Frequently Visited':
                        folder.icon = 'd-duplicate';
                        masterPersonal[2] = folder;
                        break;
                    case 'Recently Visited':
                        folder.icon = 'd-time';
                        masterPersonal[3] = folder;
                        break;
                    case 'Trash':
                        folder.icon = 'd-trash';
                        masterPersonal[4] = folder;
                        break;
                    default:
                        break;
                }
                resourceData.personal[folder.path] = folder;
            }
        } else {
            masterPersonal = personal;
        }*/

        // format namespaces
        if (response.memberNamespaces && response.memberNamespaces.length > 0) {
            for (const ns of response.memberNamespaces) {

                const folder = (ns.folder) ? ns.folder : {};
                user.memberNamespaces.push(ns.namespace);
                const namespace = {...ns.namespace,
                    subfolders: (folder.subfolders) ? folder.subfolders : [],
                    files: (folder.files) ? folder.files : [],
                    path: (folder.path) ? folder.path : '/namespace/' + ns.namespace.name.toLowerCase().replace(' ', '-'),
                    type: (folder.type) ? folder.type : 'DASHBOARD',
                    icon: 'd-dashboard-tile',
                    resourceType: 'namespace'
                };
                resourceData.namespaces[namespace.path] = namespace;
                namespaces.push(resourceData.namespaces[namespace.path]);
            }
        }

        // create first panel, AKA the MasterPanel
        const masterPanel: DBNAVPanelModel = {
            id: 0,
            name: 'masterPanel',
            path: '/',
            resourceType: 'master',
            personal: <DBNAVFolder[]>masterPersonal,
            namespaces: <DBNAVFolder[]>namespaces
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
            ctx.dispatch(new DBNAVcreateFolder('Trash', '/' + user.userid.replace('.', '/'), 0));
        }
    }

    @Action(DBNAVloadNavResourcesFail)
    loadNavResourcesFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVloadNavResourcesFail) {
        this.stateError('Load Navigation Resource List', error);
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

        this.stateLog('Add Folder Panel', { payload });
        const state = ctx.getState();
        const panels = [...state.panels];
        const resources = {...state.resourceData};
        const currentPanelIndex = state.currentPanelIndex;

        const specialType = (payload.type !== 'namespace' || payload.type !== 'personal') ? payload.type : false;

        // need to infer the resourceType from path
        const path = payload.path.split('/');
        const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';

        if (!resources[resourceType][payload.path] || (resourceType === 'namespaces' && specialType === 'trash')) {
            // ruh roh... need to fetch it
            let parentPath = payload.path.split('/');
            parentPath.pop();

            parentPath = parentPath.join('/');
            // console.log('parent', resourceType, parentPath);

            const parent = resources[resourceType][parentPath];
            // console.log('parent', parent);

            if (!specialType) {
                const child = parent.subfolders.filter( item => {
                    return item.path = payload.path;
                })[0];

                const folder = {...child,
                    subfolders: (child.subfolders && child.subfolders !== undefined) ? child.subfolders : [],
                    files: (child.files) ? child.files : [],
                    type: (child.type) ? child.type : 'DASHBOARD',
                    icon: 'd-folder',
                    resourceType: resourceType
                };

                resources[resourceType][folder.path] = folder;

            } else {
                const folder = resources[resourceType][payload.path];
                // now what? its special... do we need to load anything?
            }

            ctx.patchState({...state,
                resourceData: resources
            });

        }

        const newPanel = <DBNAVPanelModel>resources[resourceType][payload.path];
        newPanel.loaded = false;

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
            ctx.dispatch(new DBNAVloadSubfolder(newPanel.path));
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
    createFolder(ctx: StateContext<DBNAVStateModel>, { name: name, parentPath: parentPath, panelIndex: panelIndex }: DBNAVcreateFolder) {
        this.stateLog('Create Folder', { name, parentPath, panelIndex});

        const folder = {
            name: name,
            parentPath: parentPath
        };

        return this.navService.createFolder(folder).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVcreateFolderSuccess(payload, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVcreateFolderFail(error)))
        );
    }

    @Action(DBNAVcreateFolderSuccess)
    createFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, panelIndex }: DBNAVcreateFolderSuccess) {
        this.stateSuccess('Create Folder Success', response);
        const state = ctx.getState();

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        const folder = {...response,
            resourceType: type,
            subfolders: [],
            files: [],
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
        resourceData[resourceType][folder.path] = folder;

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
        this.stateError('Create Folder Failure', error);
    }

    @Action(DBNAVupdateFolder)
    updateFolder(ctx: StateContext<DBNAVStateModel>, { id, currentPath, updates, panelIndex }: DBNAVupdateFolder) {
        this.stateLog('Update Folder', { id, currentPath, updates });

        return this.navService.updateFolder(id, updates).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVupdateFolderSuccess(payload, currentPath, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVupdateFolderFail(error)) )
        );
    }

    @Action(DBNAVupdateFolderSuccess)
    updateFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVupdateFolderSuccess) {
        this.stateSuccess('Update Folder Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';
        // const updateName = path.

        // is this a path change? This happens if they change the name of the folder
        if (response.path !== originalPath) {
            let pathKeys = Object.keys(resourceData[resourceType]);
            pathKeys = pathKeys.filter( item => item.includes(originalPath));
            for ( const pathKey of pathKeys) {
                delete resourceData[resourceType][pathKey];
            }
        }

        const updatedFolder = {...response,
            resourceType: type,
            subfolders: [],
            files: [],
            icon: 'd-folder',
            loaded: false
        };

        resourceData[resourceType][response.path] = updatedFolder;

        // now need to update panel item
        const panels = [...state.panels];

        const targetIndex = panels[panelIndex].subfolders.findIndex( item => item.path === originalPath);
        panels[panelIndex].subfolders[targetIndex] = updatedFolder;

        ctx.patchState({...state,
            panels,
            resourceData
        });

    }

    @Action(DBNAVupdateFolderFail)
    updateFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVupdateFolderFail) {
        this.stateError('Update Folder Error', error);
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
     *      destinationPath: string,
     *      trashFolder?: boolean <optional>
     * }
     */
    @Action(DBNAVmoveFolder)
    moveFolder(ctx: StateContext<DBNAVStateModel>, { payloadBody, panelIndex }: DBNAVmoveFolder) {
        this.stateLog('Move Folder', { payloadBody });

        const originalPath = payloadBody.sourcePath;

        if (this.simplePermissionCheck(ctx, originalPath)) {
            return this.navService.moveFolder(payloadBody).pipe(
                map( (payload: any) => {
                    ctx.dispatch(new DBNAVmoveFolderSuccess(payload, originalPath, panelIndex));
                }),
                catchError( error => ctx.dispatch(new DBNAVmoveFolderFail(error)) )
            );
        }

        return ctx.dispatch(new DBNAVmoveFolderFail({message: 'Do not have permission'}));
    }

    @Action(DBNAVmoveFolderSuccess)
    moveFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVmoveFolderSuccess) {
        this.stateSuccess('Move Folder Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];

        const path = response.path.split('/');
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
        const subFolderIndex = panels[panelIndex].subfolders.findIndex( item => item.path === originalPath);
        panels[panelIndex].subfolders.splice(subFolderIndex, 1);

        // add new item to resource data
        const newFolder: DBNAVFolder = {...response,
            resourceType: type,
            files: response.files || [],
            subfolders: response.subfolders || [],
            icon: 'd-folder',
            loaded: false
        };

        resourceData[resourceType][newFolder.path] = newFolder;

        // TODO
        // ?? if new destination is already a panel, should we move it?
        // !! might need to add it to the resourceData folder for new destination?

        ctx.patchState({...state,
            resourceData,
            panels
        });
    }

    @Action(DBNAVmoveFolderFail)
    moveFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVmoveFolderFail) {
        this.stateError('Move Folder Error', error);
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
    loadSubfolder(ctx: StateContext<DBNAVStateModel>, { path }: DBNAVloadSubfolder) {
        this.stateLog('Load Sub Folder', { path });

        ctx.patchState({ loading: true});

        return this.navService.getFolderByPath(path).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVloadSubfolderSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DBNAVloadSubfolderFail(error)))
        );

    }

    @Action(DBNAVloadSubfolderSuccess)
    loadSubfolderSuccess(ctx: StateContext<DBNAVStateModel>, { response }: DBNAVloadSubfolderSuccess) {
        this.stateSuccess('Load Sub Folder Success', { response });
        // success... do something

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];
        const panelIdx = state.currentPanelIndex;

        // need to infer the resourceType from path
        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';
        const topPath = path.splice(0, 3).join('/');

        const subFolder = {...resourceData[resourceType][response.path],
            files: response.files || [],
            subfolders: response.subfolders || [],
            loaded: false
        };

        // update the resource data for item
        resourceData[resourceType][response.path] = subFolder;

        // tslint:disable-next-line:forin
        for (const i in subFolder.subfolders) {
            const folder = subFolder.subfolders[i];
            if (resourceType === 'personal' && folder.path === topPath + '/trash') {
                subFolder.subfolders.splice(i, 1);
            } else {
                if (!folder.subfolders || folder.subfolders === undefined) { folder.subfolders = []; }
                if (!folder.files || folder.files === undefined) { folder.files = []; }
                folder.loaded = false;
                folder.resourceType = (resourceType === 'namespaces') ? 'namespace' : 'personal';
                folder.icon = 'd-folder';
                resourceData[resourceType][folder.path] = folder;
            }
        }

        let createNamespaceTrashFolder = false;

        // is this a namespace folder? and does it need a trash folder?
        if (type === 'namespace' && topPath === response.path) {
            // check for trash folder
            const trashIndex = subFolder.subfolders.findIndex(item => item.path === topPath + '/trash');
            if (trashIndex === -1) {
                createNamespaceTrashFolder = true;
            } else {
                subFolder.subfolders[trashIndex].resourceType = 'trash';
                subFolder.subfolders[trashIndex].icon = 'd-trash';
            }
        }

        panels[panelIdx].files = subFolder.files;
        panels[panelIdx].subfolders = subFolder.subfolders;

        ctx.patchState({...state,
            panels,
            resourceData,
            loading: false
        });

        if (createNamespaceTrashFolder && this.simplePermissionCheck(ctx, topPath)) {
            ctx.dispatch(new DBNAVcreateFolder('Trash', topPath, panelIdx));
        }

    }

    @Action(DBNAVloadSubfolderFail)
    loadSubfolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVloadSubfolderFail) {
        this.stateError('Load Subfolder Folder Error', error);
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
        this.stateLog('Move File', { payloadBody });

        const originalPath = payloadBody.sourcePath;

        return this.navService.moveFile(payloadBody).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVmoveFileSuccess(payload, originalPath, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVmoveFileFail(error)) )
        );
    }

    @Action(DBNAVmoveFileSuccess)
    moveFileSuccess(ctx: StateContext<DBNAVStateModel>, { response, originalPath, panelIndex }: DBNAVmoveFileSuccess) {
        this.stateSuccess('Move File Success', { response, originalPath, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};
        const panels = [...state.panels];

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        // now fix old parent item in resourceData
        let parentPath: any = originalPath.split('/');
        const parentType = (parentPath[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const parentResourceType = (parentType === 'namespace') ? 'namespaces' : 'personal';
        parentPath.pop();
        parentPath = parentPath.join('/');

        const parentFileIndex = resourceData[parentResourceType][parentPath].files.findIndex( item => item.path === originalPath);
        resourceData[parentResourceType][parentPath].files.splice(parentFileIndex, 1);

        // now fix the panel data
        panels[panelIndex].files.splice(parentFileIndex, 1);

        // get new parent path
        let newParentPath: any = response.path.split('/');
        newParentPath.pop();
        const parentIsTopLevel = newParentPath.length === 3;
        newParentPath = newParentPath.join('/');

        // if parent path is in resourceData, update it
        if (resourceData[resourceType][newParentPath]) {
            resourceData[resourceType][newParentPath].files.push(response);

            // ?? should we sort after push?
        }

        // if parent path is in a current panel, update it
        const newPanelIndex = panels.findIndex( item => item.path === newParentPath);
        if (newPanelIndex >= 0) {
            panels[newPanelIndex].files.push(response);
        }

        // might be a top level personal item, then it needs to be updated in the master panel
        // most likely happens if it is personal trash, or top level user folder
        if (parentIsTopLevel && type === 'personal') {
            if (resourceData[resourceType][newParentPath].resourceType === 'trash') {
                // if trash
                panels[0].personal[4].files = resourceData[resourceType][newParentPath].files;
            } else {
                // else, must be top level user folder
                panels[0].personal[0].files = resourceData[resourceType][newParentPath].files;
            }
        }

        // might be a top level item of a namespace
        if (parentIsTopLevel && type === 'namespace') {
            const namespaceIndex = panels[0].namespaces.findIndex(item => item.path === newParentPath);
            if (resourceData[resourceType][newParentPath]) {
                panels[0].namespaces[namespaceIndex].files = resourceData[resourceType][newParentPath].files;
            }
        }

        ctx.patchState({...state,
            panels,
            resourceData
        });

    }

    @Action(DBNAVmoveFileFail)
    moveFileFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVmoveFileFail) {
        this.stateError('Move File Error', error);
        ctx.dispatch({
            error: error
        });
    }

    /**************************
     * NAMESPACES
     **************************/

}

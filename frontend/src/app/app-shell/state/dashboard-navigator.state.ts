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
            name: ''
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

        const user = response.user;

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

        if (response.personalFolder && response.personalFolder.subfolders) {
            // do trash first so we can pull it up to root level
            // find trash
            const trashFilter = response.personalFolder.subfolders.filter( folder => {
                return folder.path === '/' + user.userid.replace('.', '/') + '/trash';
            });

            if (trashFilter.length > 0) {
                const trashIndex = response.personalFolder.subfolders.indexOf(trashFilter[0]);
                const trashFolder = response.personalFolder.subfolders.splice(trashIndex, 1);
                masterPersonal[4] = trashFolder;
                masterPersonal[4] = {...masterPersonal[4],
                    icon: 'd-trash',
                    loaded: true,
                    resourceType: 'trash'
                };
                delete masterPersonal[4].synthetic;
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
                    subfolders: (child.subfolders) ? child.subfolders : [],
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
    createFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response: response, panelIndex: panelIndex }: DBNAVcreateFolderSuccess) {
        this.stateSuccess('Create Folder Success', response);
        const state = ctx.getState();

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';

        const folder: DBNAVFolder = {...response,
            responseType: type,
            subfolders: [],
            files: [],
            icon: 'd-folder'
        };

        const panels = [...state.panels];
        panels[panelIndex].subfolders.unshift(folder);

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
    updateFolder(ctx: StateContext<DBNAVStateModel>, { id: id, updates: updates, panelIndex: panelIndex }: DBNAVupdateFolder) {
        this.stateLog('Update Folder', { id, updates });

        return this.navService.updateFolder(id, updates).pipe(
            map( (payload: any) => {
                ctx.dispatch(new DBNAVupdateFolderSuccess(payload, panelIndex));
            }),
            catchError( error => ctx.dispatch(new DBNAVupdateFolderFail(error)) )
        );
    }

    @Action(DBNAVupdateFolder)
    updateFolderSuccess(ctx: StateContext<DBNAVStateModel>, { response: response, panelIndex: panelIndex }: DBNAVupdateFolderSuccess) {
        this.stateSuccess('Update Folder Success', { response, panelIndex });

        const state = ctx.getState();
        const resourceData = {...state.resourceData};

        const path = response.path.split('/');
        const type = (path[1].toLowerCase() === 'namespace') ? 'namespace' : 'personal';
        const resourceType = (type === 'namespace') ? 'namespaces' : 'personal';
        // const updateName = path.




    }

    @Action(DBNAVupdateFolder)
    updateFolderFail(ctx: StateContext<DBNAVStateModel>, { error }: DBNAVupdateFolderFail) {
        this.stateError('Update Folder Error', error);
        ctx.dispatch({
            error: error
        });
    }


    /**
     * Get a subfolder
     * @param ctx
     * @param param1
     *
     * returns Observable
     */
    @Action(DBNAVloadSubfolder)
    loadSubfolder(ctx: StateContext<DBNAVStateModel>, { path }: DBNAVloadSubfolder) {
        console.log(
            '%cSTATE REQUEST%cNavigation Resource List',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold;',
            'color: blue; padding: 4px 8px; border: 1px solid blue;'
        );
        ctx.patchState({ loading: true});
        return this.navService.getDashboardResourceList().pipe(
            map( (payload: any) => {
                console.log('resourceList', payload);
                ctx.dispatch(new DBNAVloadNavResourcesSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new DBNAVloadNavResourcesFail(error)))
        );

    }

    /**************************
     * FILES
     **************************/

    /**************************
     * NAMESPACES
     **************************/

}

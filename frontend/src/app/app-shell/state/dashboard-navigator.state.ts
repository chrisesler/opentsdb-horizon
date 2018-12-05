import {
    State,
    StateContext,
    Action,
    Selector,
    createSelector
} from '@ngxs/store';

import {
    map,
    catchError
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

    /** Selectors */
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

    /** Actions */

    @Action(DBNAVgetFolderResource)
    getFolderResource(ctx: StateContext<DBNAVStateModel>, { path: path, type: type }: DBNAVgetFolderResource) {
        const state = ctx.getState();
        const resources = {...state.resourceData};
        return resources[type][path];
    }

    // Load the default resources
    // Top level personal folders
    // Top level Namespaces you are members of
    @Action(DBNAVloadNavResources)
    loadNavResources(ctx: StateContext<DBNAVStateModel>, {}: DBNAVloadNavResources) {
        console.log(
            '%cSTATE REQUEST%cNavigation Resource List',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold;',
            'color: blue; padding: 4px 8px; border: 1px solid blue;'
        );
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
        console.log(
            '%cSUCCESS%cNavigation Resource List',
            'color: white; background-color: green; padding: 4px 8px; font-weight: bold;',
            'color: green; padding: 4px 8px; border: 1px solid green;',
            response
        );

        const user = response.user;

        // save the raw
        const resourceData = {...state.resourceData};
        const personal = response.personalFolder.subfolders;
        const namespaces = [];

        const masterPersonal = new Array(5);

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
                    masterPersonal[0] = folder;
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
        console.log(
            '%cERROR%cNavigation Resource List',
            'color: white; background-color: red; padding: 4px 8px; font-weight: bold;',
            'color: red; padding: 4px 8px; border: 1px solid red;',
            error
        );
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
        console.log(
            '%cSTATE REQUEST%cAdd folder panel',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold;',
            'color: blue; padding: 4px 8px; border: 1px solid blue;',
            payload
        );
        const state = ctx.getState();
        const panels = [...state.panels];
        const resources = {...state.resourceData};
        const currentPanelIndex = state.currentPanelIndex;

        // if type is 'namespace' we need to pluralize it for our lookup
        let resourceType = (payload.type === 'namespace') ? 'namespaces' : payload.type;

        // uhm... resource type somehow is empty. Need to infer resourceType from path
        if (!resourceType) {
            const path = payload.path.split('/');
            resourceType = (path[1].toLowerCase() === 'namespace') ? 'namespaces' : 'personal';
        }

        if (!resources[resourceType][payload.path]) {
            // ruh roh... need to fetch it
            let parentPath = payload.path.split('/');
            parentPath.pop();

            parentPath = parentPath.join('/');
            console.log('parent', resourceType, parentPath);

            const parent = resources[resourceType][parentPath];
            console.log('parent', parent);

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

            ctx.patchState({...state,
                resourceData: resources
            });

            console.log('CHILD', child);

        }

        const newPanel = <DBNAVPanelModel>resources[resourceType][payload.path];

        // check if one exists
        console.log('%cCHECK', 'color: black; background-color: pink; padding: 4px 8px;', panels.indexOf(newPanel));

        if (panels.indexOf(newPanel) < 0) {
            panels.push(newPanel);

            ctx.patchState({...state,
                panels,
                currentPanelIndex: currentPanelIndex + 1,
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
        ctx.patchState({...state,
            panels: payload.panels,
            currentPanelIndex: payload.currentPanelIndex,
            panelAction: (payload.panelAction) ? payload.panelAction : {}
        });
    }


    /** Get a subfolder */
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

}

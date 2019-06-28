import {
    State,
    StateContext,
    Action,
    Selector
} from '@ngxs/store';


import { HttpService } from '../../core/http/http.service';
import { AlertsService } from '../services/alerts.service';
import { forkJoin } from 'rxjs';

import { LoggerService } from '../../core/services/logger.service';
import { UtilsService } from '../../core/services/utils.service';


export interface AlertModel {
    id: number;
    counts: {
        bad: number;
        warn: number;
        good: number;
        snoozed: number;
    };
    name: string;
    namespace: string;
    groupLabels: any[];
    contacts: any[];
    created: any;
    modified: any;
    snoozed: boolean;
    disabled: boolean;
    alerting: boolean;
}

export interface AlertsStateModel {
    userNamespaces: [];
    allNamespaces: [];
    selectedNamespace: any;
    loading: boolean;
    loaded: any;
    error: any;
    saveError: any;
    actionResponse: any;
    actionStatus: string;
    alerts: AlertModel[];
    alertTypeFilter: string;
    editItem: any;
    readOnly: boolean;
}

/* actions */
export class LoadNamespaces {
    static readonly type = '[Alerts] Load namespaces';
    constructor(
        public readonly options?: any
    ) { }
}

export class SetNamespace {
    static readonly type = '[Alerts] Set Namespace';
    constructor(public namespace: string) {}
}

export class LoadAlerts {
    static readonly type = '[Alerts] Load Alerts';
    constructor(public options: any) {}
}

export class SaveAlerts {
    static readonly type = '[Alerts] Save Alerts';
    constructor(public namespace: string, public payload: any) {}
}

export class DeleteAlerts {
    static readonly type = '[Alerts] Delete Alerts';
    constructor(public namespace: string, public payload: any) {}
}

export class ToggleAlerts {
    static readonly type = '[Alerts] Toggle Alerts';
    constructor(public namespace: string, public payload: any) {}
}

export class CheckWriteAccess {
    static readonly type = "[Alerts] Check write Access";
    constructor(public payload: any) {}
}

/* state define */
@State<AlertsStateModel>({
    name: 'Alerts',
    defaults: {
        userNamespaces: [],
        allNamespaces: [],
        selectedNamespace: '',
        loading: false,
        loaded: {
            userNamespaces: false,
            allNamespaces: false
        },
        error: {},
        saveError: {}, // handles dialog create/update error
        actionResponse: {},
        alerts: [],
        actionStatus: '',
        alertTypeFilter: 'all', // all, alerting, snoozed, disabled
        editItem: {},
        readOnly: false
    }
})

export class AlertsState {
    constructor(
        private logger: LoggerService,
        private httpService: HttpService,
        private alertsService: AlertsService,
        private utils: UtilsService
    ) { }

    /* SELECTORS */
    @Selector()
    static getUserNamespaces(state: AlertsStateModel) {
        return state.userNamespaces;
    }

    @Selector()
    static getAllNamespaces(state: AlertsStateModel) {
        return state.allNamespaces;
    }

    @Selector()
    static getSelectedNamespace(state: AlertsStateModel) {
        return state.selectedNamespace;
    }

    @Selector()
    static getLoading(state: AlertsStateModel) {
        return state.loading;
    }

    @Selector()
    static getLoaded(state: AlertsStateModel) {
        return state.loaded;
    }

    @Selector()
    static getEditItem(state: AlertsStateModel) {
        return state.editItem;
    }

    @Selector()
    static getReadOnly(state: AlertsStateModel) {
        return state.readOnly;
    }

    @Selector()
    static getError(state: AlertsStateModel) {
        return state.error;
    }

    @Selector()
    static getSaveError(state: AlertsStateModel) {
        return state.saveError;
    }

    @Selector()
    static getActionResponse(state: AlertsStateModel) {
        return state.actionResponse;
    }

    @Selector()
    static getAlerts(state: AlertsStateModel) {
        return state.alerts;
    }

    @Selector()
    static getActionStatus(state: AlertsStateModel) {
        return state.actionStatus;
    }

    /* ACTIONS */

    @Action(LoadNamespaces)
    loadNamespaces(ctx: StateContext<AlertsStateModel>, { options }: LoadNamespaces) {
        this.logger.state('AlertsState :: Load namespaces', { options });
        const state = ctx.getState();
       if (!state.loaded.userNamespaces) {
        ctx.patchState({ loading: true, error: {} });
            const req1 = this.alertsService.getUserNamespaces();
            const req2 = this.alertsService.getNamespaces();

            return forkJoin([req1,  req2]).subscribe((res: any[]) => {
                const req1sort = res[0].sort((a: any, b: any) => {
                    return this.utils.sortAlphaNum(a.name, b.name);
                });
                const req2sort = res[1].sort((a: any, b: any) => {
                    return this.utils.sortAlphaNum(a.name, b.name);
                });
                ctx.patchState({
                    userNamespaces: req1sort,
                    allNamespaces: req2sort,
                    loading: false,
                    loaded: { userNamespaces: true, allNamespaces: true}
                });
                },
                error => {
                    ctx.patchState({ error: error });
                }
            );
        }
    }

    @Action(SetNamespace)
    SetNamespace(ctx: StateContext<AlertsStateModel>, { namespace }: SetNamespace) {
        ctx.patchState({ selectedNamespace: namespace});
    }

    @Action(CheckWriteAccess)
    checkWriteAccess(ctx: StateContext<AlertsStateModel>, { payload }: CheckWriteAccess) {
        const state = ctx.getState();
        const userNamespaces = state.userNamespaces;
        // ctx.patchState( { editItem: {}, error: {} } );
        if ( userNamespaces.find( (d: any) => d.name === payload.namespace )) {
            ctx.patchState( { editItem: payload, readOnly: false } );
        } else {
            if (payload.id === '_new_' ) {
                ctx.patchState( { error: { message: "You don't have permission to create new alert." } } );
            } else {
                ctx.patchState( { editItem: payload, readOnly: true } );
            }
            //ctx.patchState( { error: { message: "You don't have permission to " + ( payload.id === '_new_' ? 'create new' : 'edit the' )+ ' alert.' } } ); 
        }
    }

    @Action(LoadAlerts)
    loadAlerts(ctx: StateContext<AlertsStateModel>, { options }: LoadAlerts) {
        ctx.patchState({ actionStatus: 'save-progress', error: {}});
        return this.httpService.getAlerts(options).subscribe(
            alerts => {
                ctx.patchState({ alerts: alerts});
            },
            error => {
                ctx.patchState({ error: error });
            }
        );

    }

    @Action(SaveAlerts)
    saveAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload }: SaveAlerts) {
        ctx.patchState({ actionStatus: 'save-progress', saveError: {}});
        return this.httpService.saveAlert(namespace, payload).subscribe(
            res => {
                ctx.patchState({ actionStatus: payload.data[0].id ? 'update-success' : 'add-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
                ctx.patchState({ actionStatus: payload.data[0].id ? 'update-failed' : 'add-failed', saveError: error });
            }
        );

    }


    @Action(DeleteAlerts)
    deleteAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload:payload }: DeleteAlerts) {
        ctx.patchState({ actionStatus: 'delete-progress', error: {}});
        return this.httpService.deleteAlerts(namespace, payload).subscribe(
            res => {
                ctx.patchState({ actionStatus: 'delete-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
                ctx.patchState({ error: error });
            }
        );

    }

    @Action(ToggleAlerts)
    toggleAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload:payload }: DeleteAlerts) {
        ctx.patchState({ actionStatus: 'toggle-progress', error: {}});
        return this.httpService.saveAlert(namespace, payload).subscribe(
            res => {
                ctx.patchState({ actionStatus: payload.data[0].enabled ? 'enable-success' : 'disable-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
                ctx.patchState({ error: error });
            }
        );

    }

}

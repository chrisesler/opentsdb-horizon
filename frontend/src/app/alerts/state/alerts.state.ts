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

import { HttpService } from '../../core/http/http.service';
import { AlertsService } from '../services/alerts.service';

import { LoggerService } from '../../core/services/logger.service';

import * as moment from 'moment';

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
    userNamespaces: any[];
    selectedNamespace: any;
    loading: boolean;
    loaded: any;
    error: any;
    actionResponse: any;
    actionStatus: string;
    alerts: AlertModel[];
    alertTypeFilter: string;
}

/* actions */
export class LoadUserNamespaces {
    static readonly type = '[Alerts] Load User namespaces';
    constructor(
        public readonly options?: any
    ) { }
}

export class LoadUserNamespacesSuccess {
    static readonly type = '[Alerts] Load User namespaces [SUCCESS]';
    constructor(
        public readonly response: any,
        public readonly options?: any
    ) { }
}

export class LoadUserNamespacesFail {
    static readonly type = '[Alerts] Load User namespaces [FAIL]';
    constructor(
        public readonly error: any,
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

/* state define */
@State<AlertsStateModel>({
    name: 'Alerts',
    defaults: {
        userNamespaces: [],
        selectedNamespace: '',
        loading: false,
        loaded: {
            userNamespaces: false,
            allNamespaces: false
        },
        error: {},
        actionResponse: {},
        alerts: [],
        actionStatus: '',
        alertTypeFilter: 'all' // all, alerting, snoozed, disabled
    }
})

export class AlertsState {
    constructor(
        private logger: LoggerService,
        private httpService: HttpService,
        private alertsService: AlertsService
    ) { }

    /* SELECTORS */
    @Selector()
    static getUserNamespaces(state: AlertsStateModel) {
        return state.userNamespaces;
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
    static getError(state: AlertsStateModel) {
        return state.error;
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

    @Action(LoadUserNamespaces)
    getUserNamspaces(ctx: StateContext<AlertsStateModel>, { options }: LoadUserNamespaces) {
        this.logger.state('AlertsState :: Load user namespaces', { options });
        const state = ctx.getState();
        if (!state.loaded.userNamespaces) {
            ctx.patchState({ loading: true });
            return this.alertsService.getUserNamespaces().pipe(
                map((payload: any) => {
                    // console.log('resourceList', payload);
                    ctx.dispatch(new LoadUserNamespacesSuccess(payload, options));
                }),
                catchError(error => ctx.dispatch(new LoadUserNamespacesFail(error, options)))
            );
        }
    }

    @Action(LoadUserNamespacesSuccess)
    loadUserNamspacesSuccess(ctx: StateContext<AlertsStateModel>, { response, options }: LoadUserNamespacesSuccess) {
        this.logger.success('AlertsState :: Load user namespaces success', { response, options });
        const state = ctx.getState();
        const loaded = { ...state.loaded };
        const actionResponse: any = {};
        loaded.userNamespaces = true;


        if (options && options.responseRequested && options.guid) {
            actionResponse.action = 'loadUserNamespacesSuccess';
            actionResponse.guid = options.guid;
        }

        ctx.setState({
            ...state,
            actionResponse,
            userNamespaces: response,
            loading: false,
            loaded
        });
    }

    @Action(LoadUserNamespacesFail)
    loadUserNamspacesFail(ctx: StateContext<AlertsStateModel>, { error, options }: LoadUserNamespacesFail) {
        this.logger.error('AlertsState :: Load user namespaces errors', { error, options });
        const state = ctx.getState();

        ctx.setState({
            ...state,
            loading: false,
            error
        });
    }

    @Action(SetNamespace)
    SetNamespace(ctx: StateContext<AlertsStateModel>, { namespace }: SetNamespace) {
        ctx.patchState({ selectedNamespace: namespace});
    }

    @Action(LoadAlerts)
    loadAlerts(ctx: StateContext<AlertsStateModel>, { options }: LoadAlerts) {
        //ctx.patchState({ loading: true});
        return this.httpService.getAlerts(options).subscribe(
            alerts => {
                ctx.patchState({ alerts: alerts});
            },
            error => {
            }
        );

    }

    @Action(SaveAlerts)
    saveAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload }: SaveAlerts) {
        ctx.patchState({ actionStatus: 'save-progress'});
        return this.httpService.saveAlert(namespace, payload).subscribe(
            alerts => {
                ctx.patchState({ actionStatus: payload.data[0].id ? 'update-success' : 'add-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
            }
        );

    }


    @Action(DeleteAlerts)
    deleteAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload:payload }: DeleteAlerts) {
        ctx.patchState({ actionStatus: 'delete-progress'});
        return this.httpService.deleteAlerts(namespace, payload).subscribe(
            res => {
                ctx.patchState({ actionStatus: 'delete-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
            }
        );

    }

    @Action(ToggleAlerts)
    toggleAlerts(ctx: StateContext<AlertsStateModel>, { namespace, payload:payload }: DeleteAlerts) {
        ctx.patchState({ actionStatus: 'toggle-progress'});
        return this.httpService.saveAlert(namespace, payload).subscribe(
            res => {
                ctx.patchState({ actionStatus: payload.data[0].enabled ? 'enable-success' : 'disable-success'});
                ctx.dispatch(new LoadAlerts({namespace: namespace}));
            },
            error => {
            }
        );

    }

}

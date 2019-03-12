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
    alerts: AlertModel[];
    alertTypeFilter: string;
}

/* actions */
export class ASloadUserNamespaces {
    static readonly type = '[Alerts] Load User namespaces';
    constructor(
        public readonly options?: any
    ) { }
}

export class ASloadUserNamespacesSuccess {
    static readonly type = '[Alerts] Load User namespaces [SUCCESS]';
    constructor(
        public readonly response: any,
        public readonly options?: any
    ) { }
}

export class ASloadUserNamespacesFail {
    static readonly type = '[Alerts] Load User namespaces [FAIL]';
    constructor(
        public readonly error: any,
        public readonly options?: any
    ) { }
}

export class ASgenerateFakeAlerts {
    static readonly type = '[Alerts] generate fake alerts';
    constructor(
        public readonly options?: any
    ) { }
}

export class ASsetAlertTypeFilter {
    static readonly type = '[Alerts] set alert type filter';
    constructor(
        public readonly alertTypeFilter: any,
        public readonly options?: any
    ) { }
}

export class ASsetSelectedNamespace {
    static readonly type = '[Alerts] set selected namespace';
    constructor(
        public readonly selectedNamespace: any,
        public readonly options?: any
    ) { }
}


/* state define */
@State<AlertsStateModel>({
    name: 'Alerts',
    defaults: {
        userNamespaces: [],
        selectedNamespace: false,
        loading: false,
        loaded: {
            userNamespaces: false,
            allNamespaces: false
        },
        error: {},
        actionResponse: {},
        alerts: [],
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
    static getAlertTypeFilter(state: AlertsStateModel) {
        return state.alertTypeFilter;
    }

    @Selector()
    static getAlertTypeCounts(state: AlertsStateModel): any {
        const counts: any = {};
        counts.all = state.alerts.length;
        counts.alerting = state.alerts.filter(s => s.alerting === true).length;
        counts.snoozed = state.alerts.filter(s => s.snoozed === true).length;
        counts.disabled = state.alerts.filter(s => s.disabled === true).length;
        return counts;
    }

    // dynamic selector
    static getAlerts(type: string) {
        return createSelector([AlertsState], (state: AlertsStateModel) => {
            if (type === 'all') {
                return state.alerts;
            } else {
                return state.alerts.filter(s => s[type] === true);
            }
        });
    }

    /* STATICS (IF ANY) */

    /* PRIVATES (IF ANY) */

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

    /* ACTIONS */

    @Action(ASloadUserNamespaces)
    getUserNamspaces(ctx: StateContext<AlertsStateModel>, { options }: ASloadUserNamespaces) {
        this.logger.state('AlertsState :: Load user namespaces', { options });
        const state = ctx.getState();
        if (!state.loaded.userNamespaces) {
            ctx.patchState({ loading: true });
            return this.alertsService.getUserNamespaces().pipe(
                map((payload: any) => {
                    // console.log('resourceList', payload);
                    ctx.dispatch(new ASloadUserNamespacesSuccess(payload, options));
                }),
                catchError(error => ctx.dispatch(new ASloadUserNamespacesFail(error, options)))
            );
        }
    }

    @Action(ASloadUserNamespacesSuccess)
    loadUserNamspacesSuccess(ctx: StateContext<AlertsStateModel>, { response, options }: ASloadUserNamespacesSuccess) {
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
            selectedNamespace: response[0] || false,
            loading: false,
            loaded
        });
    }

    @Action(ASloadUserNamespacesFail)
    loadUserNamspacesFail(ctx: StateContext<AlertsStateModel>, { error, options }: ASloadUserNamespacesFail) {
        this.logger.error('AlertsState :: Load user namespaces errors', { error, options });
        const state = ctx.getState();

        ctx.setState({
            ...state,
            loading: false,
            error
        });
    }

    @Action(ASsetSelectedNamespace)
    setSelectedNamespace(ctx: StateContext<AlertsStateModel>, { selectedNamespace, options }: ASsetSelectedNamespace) {
        this.logger.error('AlertsState :: Load user namespaces errors', { selectedNamespace, options });
        const state = ctx.getState();

        ctx.setState({
            ...state,
            selectedNamespace
        });

        // get new alert data
        ctx.dispatch(new ASgenerateFakeAlerts(options)); // change this to real data fetcher
    }

    @Action(ASsetAlertTypeFilter)
    setAlertTypeFilter(ctx: StateContext<AlertsStateModel>, { alertTypeFilter, options }: ASsetAlertTypeFilter) {
        this.logger.state('AlertsState :: set alert type filter', { alertTypeFilter, options });
        const state = ctx.getState();
        const actionResponse: any = {};

        if (options && options.responseRequested && options.guid) {
            actionResponse.action = 'setAlertTypeFilterSuccess';
            actionResponse.guid = options.guid;
        }

        ctx.setState({
            ...state,
            actionResponse,
            alertTypeFilter
        });
    }

    // FAKE DATA
    @Action(ASgenerateFakeAlerts)
    generateFakeAlerts(ctx: StateContext<AlertsStateModel>, { options }: ASgenerateFakeAlerts) {
        this.logger.state('AlertsState :: Generate Fake Alerts', { options });
        const state = ctx.getState();
        const alerts = [];
        const selectedNamespace = state.selectedNamespace || 'TestNamespace';

        const fakeNames = [
            'CPU 24 hours past day',
            'CPU Monitor',
            'HOURLY window on raw data past 4 hours',
            '[Auto] Clock in sync with NTP',
            'system CPU idle 1 second',
            'my first alert',
            'bad server check',
            'is it alive',
            'Horizon Will Alert Me',
            'Wake everyone up'
        ];

        let i = 0;
        while ( i < 10) {
            for (const name of fakeNames) {
                const alert = this.createFakeAlertEntry(name, selectedNamespace);
                alerts.push(alert);
            }
            i++;
        }

        ctx.setState({
            ...state,
            alerts
        });
    }

    /** PRIVATES */

    private createFakeAlertEntry(name: string, namespace: string): AlertModel {
        const date = moment();
        const dateFormat = 'YYYY-MM-DD HH:ss';

        const alertEntry = <AlertModel>{
            id: this.getRandomInt(0, 100),
            counts: {
                bad: this.getRandomInt(10, 20),
                warn: this.getRandomInt(10, 50),
                good: this.getRandomInt(100, 300),
                snoozed: this.getRandomInt(0, 20)
            },
            name: name,
            namespace: namespace,
            groupLabels: this.generateGroupLabels(),
            contacts: this.generateContacts(),
            created: date.format(dateFormat),
            modified: date.format(dateFormat),
            snoozed: false,
            disabled: false,
            alerting: false
        };

        // set some random type
        const alertTypes = ['snoozed', 'disabled', 'alerting'];
        const randomAlertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        alertEntry[randomAlertType] = true;

        return alertEntry;
    }

    private generateGroupLabels(): any[] {
        const max = this.getRandomInt(2, 6);
        const labels = [];
        let num = max;
        while (num >= 0) {
            const label = {
                id: this.getRandomInt(0, 200),
                name: 'label-' + num
            };
            labels.push(label);
            num--;
        }
        return labels;
    }

    private generateContacts(): any[] {
        const max = this.getRandomInt(2, 6);
        const contacts = [];
        let num = max;
        while (num >= 0) {
            const contact = {
                id: this.getRandomInt(0, 200),
                name: 'label-' + num,
                email: 'email' + num + '@oath.com'
            };
            contacts.push(contact);
            num--;
        }
        return contacts;

    }

    private getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
}

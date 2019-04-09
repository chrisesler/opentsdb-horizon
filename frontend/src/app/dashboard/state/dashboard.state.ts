import { State , Action, Selector, StateContext, createSelector } from '@ngxs/store';
import { UserSettingsState } from './user.settings.state';
import { DBSettingsState } from './settings.state';
import { WidgetsState } from './widgets.state';
import { WidgetsRawdataState } from './widgets-data.state';
import { ClientSizeState } from './clientsize.state';
import { HttpService } from '../../core/http/http.service';
import { DashboardService } from '../services/dashboard.service';
import { map, catchError } from 'rxjs/operators';


export interface DBStateModel {
    id: string;
    loading: boolean;
    loaded: boolean;
    status: string;
    error: any;
    path: string;
    loadedDB: any;
}

/* action */
export class LoadDashboard {
    static readonly type = '[Dashboard] Load Dashboard';
    constructor(public id: string) {}
}

export class MigrateAndLoadDashboard {
    static readonly type = '[Dashboard] Migrate and Load Dashboard';
    constructor(public id: string, public payload: any) {}
}

export class LoadDashboardSuccess {
    static readonly type = '[Dashboard] Load Dashboard Success';
    constructor(public readonly payload: any) {}
}

export class LoadDashboardFail {
    static readonly type = '[Dashboard] Load Dashboard Fail';
    constructor(public readonly error: any) { }
}

export class SaveDashboard {
    static readonly type = '[Dashboard] Save Dashboard';
    constructor(public id: string, public payload: any) {}
}

export class SaveDashboardSuccess {
    static readonly type = '[Dashboard] Save Dashboard Success';
    constructor(public readonly payload: any) {}
}

export class SaveDashboardFail {
    static readonly type = '[Dashboard] Save Dashboard Fail';
    constructor(public readonly error: any) { }
}

export class DeleteDashboard {
    static readonly type = '[Dashboard] Delete Dashboard';
    constructor(public id: string) {}
}

export class DeleteDashboardSuccess {
    static readonly type = '[Dashboard] Delete Dashboard Success';
    constructor(public readonly payload: any) {}
}

export class DeleteDashboardFail {
    static readonly type = '[Dashboard] Delete Dashboard Fail';
    constructor(public readonly error: any) { }
}

/* state define */

@State<DBStateModel>({
    name: 'Dashboard',
    defaults: {
        id: '',
        loading: false,
        loaded: false,
        error: {},
        status: '',
        path: '_new_',
        loadedDB: {}
    },
    children: [ UserSettingsState, DBSettingsState, WidgetsState, ClientSizeState, WidgetsRawdataState ]
})

export class DBState {
    constructor( private httpService: HttpService, private dbService: DashboardService ) {}

    @Selector() static getDashboardId(state: DBStateModel) {
        return state.id;
    }

    @Selector() static getDashboardPath(state: DBStateModel) {
        return state.path;
    }

    @Selector() static getLoadedDB(state: DBStateModel) {
        return state.loadedDB;
    }

    @Selector() static getDashboardStatus(state: DBStateModel) {
        return state.status;
    }

    @Selector() static getDashboardError(state: DBStateModel) {
        return state.error;
    }

    @Selector()
    static getDashboardFriendlyPath(state: DBStateModel) {
        // return createSelector([DBState], (state: DBStateModel) => {
            const friendlyPath = state.id + (state.loadedDB.fullPath ? state.loadedDB.fullPath : '');
            if (friendlyPath && friendlyPath !== 'undefined') {
                return '/' + friendlyPath;
            } else {
                return undefined;
            }
        // });
    }

    @Action(LoadDashboard)
    loadDashboard(ctx: StateContext<DBStateModel>, { id }: LoadDashboard) {
        // id is the path
        if ( id !== '_new_' ) {
            ctx.patchState({ loading: true});
            // return this.httpService.getDashboardByPath(id).pipe(
            return this.httpService.getDashboardById(id).pipe(
                map(res => {
                    const dashboard:any = res.body;
                    dashboard.content = {"settings":{"time":{"start":"6h","end":"now","zone":"local"},"meta":{"title":"Yamas KPIs","description":"","labels":[],"namespace":"","isPersonal":false},"variables":{"enabled":false,"tplVariables":[{"tagk":"namespace","alias":"Namespace","allowedValues":[],"filter":[],"enabled":true,"type":"literalor"}]},"tags":["_aggregate","hostgroup","minutebucket","namespace","notify","severity"],"mode":true,"lastQueriedTagValues":["Psryamastestfour","Psryamastestthree","Rajatpsryamastest","UAD2_YAMAS","VDP-YamasMonitoring-Prod","Yamas","Yamas2-Selfmon","Yamas_Test","Yamas_Test_123","yamas","yamas2","yamas_test_sambokar"]},"widgets":[{"gridPos":{"x":4,"y":8,"h":4,"w":4,"xMd":4,"yMd":8,"dragAndDrop":true,"resizable":true},"settings":{"title":"Top Namespaces by Alerts Generated (per minute)","component_type":"TopnWidgetComponent","data_source":"yamas","visual":{},"axes":{},"legend":{},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"dataSummary":true,"sorting":{"limit":10,"order":"top"},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"c99zjx","name":"yamas.alerts.consumer.NotificationsGenerated.c.sum","filters":[],"settings":{"visual":{"visible":true,"color":"auto","aggregator":["avg"],"label":"{{namespace}} {{notify}}"}},"tagAggregator":"sum","groupByTags":["namespace","notify"]}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":true},{"tagk":"notify","filter":["regexp(.*)"],"groupBy":true},{"tagk":"severity","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":false},"id":"5ce"}],"id":"km4qj9"},{"gridPos":{"x":8,"y":4,"h":4,"w":2,"xMd":8,"yMd":4,"dragAndDrop":true,"resizable":true},"settings":{"title":"Top Namespaces by Data Stored (per second)","component_type":"TopnWidgetComponent","data_source":"yamas","visual":{},"axes":{},"legend":{},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"dataSummary":true,"sorting":{"order":"top","limit":20},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"6zhh90","name":"Total Writes","expression":"({{null}} + {{null}} + {{null}})/60","originalExpression":"(m1 + m2 + m3)/60","metrics":[{"name":"Yamas.yamas.storm.agg.dhrRawDataKafka.c.sum","refId":"m1","metric":"yamas.storm.agg.dhrRawDataKafka.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbAggWrites.c.sum","refId":"m2","metric":"yamas.storm.agg.tsdbAggWrites.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbWrites.c.sum","refId":"m3","metric":"yamas.storm.agg.tsdbWrites.c.sum","newId":null}],"settings":{"visual":{"label":"{{namespace}}","visible":true,"aggregator":["avg"],"color":"auto"}}}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"hostgroup","filter":["storm.supervisor-all.gq1"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":true}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"8eu"}],"id":"odfo49"},{"gridPos":{"x":0,"y":4,"h":4,"w":8,"xMd":0,"yMd":4,"dragAndDrop":true,"resizable":true},"settings":{"title":"Timeseries stored per minute","component_type":"LinechartWidgetComponent","data_source":"yamas","visual":{},"axes":{"y1":{"enabled":true,"unit":"auto","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":"Timeseries / minute"},"y2":{"enabled":false,"unit":"","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":""}},"legend":{"columns":[]},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"3pku5e","name":"Total Writes","expression":"{{null}} + {{null}} + {{null}}","originalExpression":"m1 + m2 + m3","metrics":[{"name":"Yamas.yamas.storm.agg.dhrRawDataKafka.c.sum","refId":"m1","metric":"yamas.storm.agg.dhrRawDataKafka.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbWrites.c.sum","refId":"m2","metric":"yamas.storm.agg.tsdbWrites.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbAggWrites.c.sum","refId":"m3","metric":"yamas.storm.agg.tsdbAggWrites.c.sum","newId":null}],"settings":{"visual":{"label":"Total Writes - GQ1","visible":true,"aggregator":[],"color":"#0B5ED2","axis":"y1","type":"line","lineWeight":"1px","lineType":"solid"}}}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"hostgroup","filter":["storm.supervisor-all.gq1"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"s1z"},{"namespace":"Yamas","metrics":[{"id":"6ubk2n","name":"Total Writes","expression":"{{null}} + {{null}} + {{null}}","originalExpression":"m1 + m2 + m3","metrics":[{"name":"Yamas.yamas.storm.agg.dhrRawDataKafka.c.sum","refId":"m1","metric":"yamas.storm.agg.dhrRawDataKafka.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbAggWrites.c.sum","refId":"m2","metric":"yamas.storm.agg.tsdbAggWrites.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbWrites.c.sum","refId":"m3","metric":"yamas.storm.agg.tsdbWrites.c.sum","newId":null}],"settings":{"visual":{"label":"Total Writes - BF1","visible":true,"aggregator":[],"color":"#DA001B","axis":"y1","type":"line","lineWeight":"1px","lineType":"solid"}}}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"hostgroup","filter":["storm.supervisor-all.bf1"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"ip7"}],"id":"e94q3i"},{"gridPos":{"x":0,"y":8,"h":4,"w":4,"xMd":0,"yMd":8,"dragAndDrop":true,"resizable":true},"settings":{"title":"Alerts Generated","component_type":"LinechartWidgetComponent","data_source":"yamas","visual":{},"axes":{"y1":{"enabled":true,"unit":"","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":"per minute"},"y2":{"enabled":false,"unit":"","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":""}},"legend":{"columns":[]},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"jvxenc","name":"yamas.alerts.consumer.NotificationsGenerated.c.sum","filters":[],"settings":{"visual":{"visible":true,"color":"auto","aggregator":[],"label":"","axis":"y1"}},"tagAggregator":"sum","groupByTags":["_aggregate","notify"]}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":true},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false},{"tagk":"severity","filter":["regexp(.*)"],"groupBy":false},{"tagk":"notify","filter":["regexp(.*)"],"groupBy":true}],"settings":{"visual":{"visible":true},"explicitTagMatch":false},"id":"fqt"}],"id":"ymw37g"},{"gridPos":{"x":8,"y":0,"h":4,"w":2,"xMd":8,"yMd":0,"dragAndDrop":true,"resizable":true},"settings":{"title":"Top Namespaces by Data Received (per second)","component_type":"TopnWidgetComponent","data_source":"yamas","visual":{},"axes":{},"legend":{},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"dataSummary":true,"sorting":{"order":"top","limit":20},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"ywkgxn","name":"yamas.storm.agg.yamasMetrics.c.sum","filters":[],"settings":{"visual":{"visible":false,"color":"auto","aggregator":["avg"],"label":"{{namespace}}"}},"tagAggregator":"sum","groupByTags":["_aggregate","hostgroup","namespace"]},{"id":"9mfcog","name":"per-sec","expression":"{{ywkgxn}}/60","originalExpression":"m1/60","metrics":[{"name":"Yamas.yamas.storm.agg.yamasMetrics.c.sum","refId":"m1","metric":"yamas.storm.agg.yamasMetrics.c.sum","newId":"ywkgxn"}],"settings":{"visual":{"label":"{{namespace}}","visible":true,"aggregator":["avg"],"color":"auto"}}}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":true},{"tagk":"hostgroup","filter":["storm.supervisor-all.gq1"],"groupBy":true},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":true}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"5rr"}],"id":"zktjdr"},{"gridPos":{"x":0,"y":0,"h":4,"w":8,"xMd":0,"yMd":0,"dragAndDrop":true,"resizable":true},"settings":{"title":"Timeseries Received per minute","component_type":"LinechartWidgetComponent","data_source":"yamas","visual":{},"axes":{"y1":{"enabled":true,"unit":"auto","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":"Timeseries / minute"},"y2":{"enabled":false,"unit":"","scale":"linear","min":"auto","max":"auto","decimals":"auto","label":""}},"legend":{"display":false,"position":"right","columns":["min","max","avg"],"tags":[]},"time":{"shiftTime":null,"overrideRelativeTime":null,"downsample":{"value":"1m","aggregators":["avg"],"customValue":"","customUnit":""}},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"gevw20","name":"yamas.storm.agg.yamasMetrics.c.sum","filters":[],"settings":{"visual":{"visible":true,"color":"#0B5ED2","aggregator":[],"label":"GQ1","axis":"y1","type":"line","lineWeight":"2px","lineType":"solid"}},"tagAggregator":"sum","groupByTags":["hostgroup","_aggregate"]}],"filters":[{"tagk":"hostgroup","filter":["storm.supervisor-all.gq1"],"groupBy":true},{"tagk":"_aggregate","filter":["SUM"],"groupBy":true},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"82h"},{"namespace":"Yamas","metrics":[{"id":"s6k5m9","name":"yamas.storm.agg.yamasMetrics.c.sum","filters":[],"settings":{"visual":{"visible":true,"color":"#DA001B","aggregator":[],"label":"BF1","axis":"y1","type":"line","lineWeight":"2px","lineType":"solid"}},"tagAggregator":"sum","groupByTags":["_aggregate","hostgroup"]}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":true},{"tagk":"hostgroup","filter":["storm.supervisor-all.bf1"],"groupBy":true},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"ppe"}],"id":"767zw0"},{"gridPos":{"x":8,"y":8,"h":4,"w":4,"xMd":8,"yMd":8,"dragAndDrop":true,"resizable":true},"settings":{"title":"Alerts Generated by Endpoint (per minute)","component_type":"TopnWidgetComponent","data_source":"yamas","visual":{},"axes":{},"legend":{},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"dataSummary":true,"sorting":{"limit":10,"order":"top"},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"c99zjx","name":"yamas.alerts.consumer.NotificationsGenerated.c.sum","filters":[],"settings":{"visual":{"visible":true,"color":"auto","aggregator":["avg"],"label":"{{notify}}"}},"tagAggregator":"sum","groupByTags":["notify"]}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":false},{"tagk":"notify","filter":["regexp(.*)"],"groupBy":true},{"tagk":"severity","filter":["regexp(.*)"],"groupBy":false}],"settings":{"visual":{"visible":true},"explicitTagMatch":false},"id":"5ce"}],"id":"v1ckh6"},{"gridPos":{"x":10,"y":0,"h":8,"w":2,"xMd":10,"yMd":0,"dragAndDrop":true,"resizable":true},"settings":{"title":"Top Abusers (per sec)","component_type":"TopnWidgetComponent","data_source":"yamas","visual":{},"axes":{},"legend":{},"time":{"downsample":{"value":"auto","aggregator":"avg","customValue":"","customUnit":""}},"dataSummary":true,"sorting":{"order":"top","limit":50},"description":null},"queries":[{"namespace":"Yamas","metrics":[{"id":"6zhh90","name":"Store/Ingest ratio","expression":"(({{null}} + {{null}} + {{null}})-{{null}})/60","originalExpression":"((m1 + m2 + m3)-m4)/60","metrics":[{"name":"Yamas.yamas.storm.agg.dhrRawDataKafka.c.sum","refId":"m1","metric":"yamas.storm.agg.dhrRawDataKafka.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbAggWrites.c.sum","refId":"m2","metric":"yamas.storm.agg.tsdbAggWrites.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.tsdbWrites.c.sum","refId":"m3","metric":"yamas.storm.agg.tsdbWrites.c.sum","newId":null},{"name":"Yamas.yamas.storm.agg.yamasMetrics.c.sum","refId":"m4","metric":"yamas.storm.agg.yamasMetrics.c.sum","newId":null}],"settings":{"visual":{"label":"{{namespace}}","visible":true,"aggregator":["avg"],"color":"auto"}}}],"filters":[{"tagk":"_aggregate","filter":["SUM"],"groupBy":false},{"tagk":"hostgroup","filter":["storm.supervisor-all.gq1"],"groupBy":false},{"tagk":"namespace","filter":["regexp(.*)"],"groupBy":true}],"settings":{"visual":{"visible":true},"explicitTagMatch":true},"id":"8eu"}],"id":"qg582a"}]};

                    if ( dashboard.content.version && dashboard.content.version === this.dbService.version ) {
                        ctx.dispatch(new LoadDashboardSuccess(dashboard));
                    } else {
                        ctx.dispatch(new MigrateAndLoadDashboard(id, dashboard));
                    }
                }),
                catchError( error => ctx.dispatch(new LoadDashboardFail(error)))
            );
        } else {
            const payload = {
                content: this.dbService.getDashboardPrototype(),
                id: '_new_',
                name: 'Untitled Dashboard',
                path: ''
            };
            ctx.dispatch(new LoadDashboardSuccess(payload));
        }
    }

    @Action(MigrateAndLoadDashboard)
    migrateAndLoadDashboard(ctx: StateContext<DBStateModel>, { id: id, payload: payload }: MigrateAndLoadDashboard) {
            payload = this.dbService.convert(payload);
            return this.httpService.saveDashboard(id, payload).pipe(
                map( (res: any) => {
                    ctx.dispatch(new LoadDashboardSuccess(payload));
                }),
                catchError( error => ctx.dispatch(new LoadDashboardFail(error)))
            );
    }

    @Action(LoadDashboardSuccess)
    loadDashboardSuccess(ctx: StateContext<DBStateModel>, { payload }: LoadDashboardSuccess) {
        const state = ctx.getState();
        ctx.setState({...state,
            id: payload.id,
            loaded: true,
            loading: false,
            loadedDB: payload
        });
    }

    @Action(LoadDashboardFail)
    loadDashboardFail(ctx: StateContext<DBStateModel>, { error }: LoadDashboardFail) {
        ctx.dispatch({ loading: false, loaded: false, error: error, loadedDB: {} });
    }

    @Action(SaveDashboard)
    saveDashboard(ctx: StateContext<DBStateModel>, { id: id, payload: payload }: SaveDashboard) {
            ctx.patchState({ status: 'save-progress', error: {} });
            return this.httpService.saveDashboard(id, payload).pipe(
                map( (res: any) => {
                    // console.log('DASHBOARD after saved:', res);
                    ctx.dispatch(new SaveDashboardSuccess(res.body));
                }),
                catchError( error => ctx.dispatch(new SaveDashboardFail(error)))
            );
    }

    @Action(SaveDashboardSuccess)
    saveDashboardSuccess(ctx: StateContext<DBStateModel>, { payload }: SaveDashboardSuccess) {
        const state = ctx.getState();
        // console.log('save dashboard success', payload);
        ctx.patchState({...state, id: payload.id, path: payload.path, loadedDB: payload, status: 'save-success' });
    }

    @Action(SaveDashboardFail)
    saveDashboardFail(ctx: StateContext<DBStateModel>, { error }: LoadDashboardFail) {
        const state = ctx.getState();
        ctx.patchState({...state, status: 'save-failed', error: error });
    }

    @Action(DeleteDashboard)
    deleteDashboard(ctx: StateContext<DBStateModel>, { id: id }: SaveDashboard) {
            ctx.patchState({ status: 'delete-progress', error: {} });
            return this.httpService.deleteDashboard(id).pipe(
                map( (dashboard: any) => {
                    ctx.dispatch(new DeleteDashboardSuccess(dashboard));
                }),
                catchError( error => ctx.dispatch(new DeleteDashboardFail(error)))
            );
    }

    @Action(DeleteDashboardSuccess)
    deleteDashboardSuccess(ctx: StateContext<DBStateModel>, { payload }: SaveDashboardSuccess) {
        const state = ctx.getState();
        // console.log('delete dashboard success', payload);
        ctx.patchState({...state, status: 'delete-success'  });
    }

    @Action(DeleteDashboardFail)
    deleteDashboardFail(ctx: StateContext<DBStateModel>, { error }: LoadDashboardFail) {
        const state = ctx.getState();
        ctx.patchState({...state, status: 'delete-failed', error: error });
    }
}

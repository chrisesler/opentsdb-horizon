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

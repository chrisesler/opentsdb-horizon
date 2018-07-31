import { State , Action, Selector, StateContext} from '@ngxs/store';
import { DBSettingsState } from './settings.state';
import { WidgetsState } from './widgets.state';
import { WidgetsRawdataState } from './widgets-data.state';
import { ClientSizeState } from './clientsize.state';
import { HttpService } from '../../core/http/http.service';
import { map, catchError } from 'rxjs/operators'; 


export interface DBStateModel {
    id: string;
    loading: boolean;
    loaded: boolean;
    error: any;
    loadedDB: any;  
}

/* action */
export class LoadDashboard {
    static readonly type = '[Dashboard] Load Dashboard';
    constructor(public id: string) {}
}

export class LoadDashboardSuccess {
    static readonly type = '[Dashboard] Load Dashboard Success';
    constructor(public readonly payload: any) {}
}

export class LoadDashboardFail {
    static readonly type = '[Dashboard] Load Dashboard Fail';
    constructor(public readonly error: any) { }
}

/* state define */

@State<DBStateModel>({
    name: 'Dashboard',
    defaults: {
        id: 'abcdef',
        loading: false,
        loaded: false,
        error: {},
        loadedDB: {}
    },
    children: [DBSettingsState, WidgetsState, ClientSizeState, WidgetsRawdataState]
})

export class DBState {
    constructor(private httpService: HttpService) {}


    @Selector() static getLoadedDB(state: DBStateModel) {           
        return state.loadedDB; 
    }

    @Action(LoadDashboard)
    loadDashboard(ctx: StateContext<DBStateModel>, { id }: LoadDashboard) {
        ctx.patchState({ loading: true});
        return this.httpService.getDashoard(id).pipe(
            map( (dashboard: any) => {
                ctx.dispatch(new LoadDashboardSuccess(dashboard));
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

}
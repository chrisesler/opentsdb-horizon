import { State, Selector, Action, StateContext } from '@ngxs/store';
import * as dashboardAction from './dashboard.actions';
import { HttpService } from '../../core/http/http.service';
import { DashboardService } from '../services/dashboard.service';
import { tap, map, catchError } from 'rxjs/operators';

export interface WidgetModel {
    id: string;
    clientSize?: {
        width: number;
        height: number;
    }
    settings: {

    }
    config: any;
}

export interface DashboardStateModel {
    id: string;
    loading: boolean;
    loaded: boolean;
    settings: any;
    widgets: WidgetModel[];
}

@State<DashboardStateModel>({
    name: 'dashboardState',
    defaults: {
      id: 'abc',
      loading: false,
      loaded: false,
      settings: {},
      widgets: []
    }
})

export class DashboardState {
    constructor(private httpService: HttpService, private dashboardService: DashboardService) {}

    // return a clone copy of state, keet global state immutable
    @Selector()
    static getWidgets(state: DashboardStateModel) {
        return JSON.parse(JSON.stringify(state.widgets));
    }

    @Selector()
    static getDashboard(state: DashboardStateModel) {
        return JSON.parse(JSON.stringify(state));
    }

    @Action(dashboardAction.LoadDashboard)
    loadDashboard(ctx: StateContext<DashboardStateModel>, { id }: dashboardAction.LoadDashboard) {
        ctx.patchState({loading: true});
        return this.httpService.getDashoard('1').pipe(
            map((dashboard: DashboardStateModel) => {
                ctx.dispatch(new dashboardAction.LoadDashboardSuccess(dashboard))
            }),
            catchError(error => ctx.dispatch(new dashboardAction.LoadDashboardFail(error)))
        );
    }

    @Action(dashboardAction.LoadDashboardSuccess)
    loadDashboardSuccess(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.LoadDashboardSuccess) {
        const state = ctx.getState();
        // tranform dashboard information by adding some other properties
        // to enable rezise, drag and drop and responsive size
        this.dashboardService.modifyWidgets(payload); 
       ctx.setState({...state, ...payload, loading: false, loaded: true});
    }

    @Action(dashboardAction.LoadDashboardFail)
    loadDashboardFail(ctx: StateContext<DashboardStateModel>, { error }: dashboardAction.LoadDashboardFail) {
        
    }

    @Action(dashboardAction.UpdateWidgetsLayout)
    updateWidgetsLayout(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.UpdateWidgetsLayout){
        const state = ctx.getState();
        ctx.patchState({...state, ...payload});
    }
 }

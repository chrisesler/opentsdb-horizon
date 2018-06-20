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
    settings: {}
    gridPos: {
        x: number;
        y: number;
        w: number;
        h: number;
        xMd?: number;
        yMd?: number;
    }
    config: {
        title: string;
        component_type: string;
        data_source?: string;
        rawdata?: any;
    }
}

export interface DashboardStateModel {
    id: string;
    loading: boolean;
    loaded: boolean;
    viewEditMode: boolean;
    editWidgetId: string;
    updatedWidgetId: string;
    settings: any;
    widgets: WidgetModel[];
}

@State<DashboardStateModel>({
    name: 'dashboardState',
    defaults: {
      id: 'abc',
      loading: false,
      loaded: false,
      viewEditMode: false,
      editWidgetId: '',
      updatedWidgetId: '',
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

    @Selector()
    static setViewEditMode(state: DashboardStateModel) {
        return { editMode: state.viewEditMode, widgetId: state.editWidgetId };
    }

    @Selector()
    static getUpdatedWidgetId(state: DashboardStateModel) {
        return state.updatedWidgetId;
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
        ctx.setState({...state, ...payload});
    }

    @Action(dashboardAction.SetViewEditMode)
    setViewEditMode(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.SetViewEditMode) {
        const state = ctx.getState();
        ctx.setState({...state, viewEditMode: payload.editMode, editWidgetId: payload.widgetId});
    }

    /* GetQueryData will make the call to API to get data.
        More on settings up data source and other later
    */
   @Action(dashboardAction.GetQueryData)
   GetQueryData(ctx: StateContext<DashboardStateModel>, action: dashboardAction.GetQueryData) {
        this.httpService.getDataByPost(action.query).subscribe(
            data => { 
                const state = ctx.getState();
                for (let w of state.widgets) {
                    if (w.id === action.widgetid) {
                        // or transformation for data needed to be done here.
                        w.config.rawdata = data;
                        state.updatedWidgetId = w.id;
                        break;
                    }
                }
                ctx.setState(state);
            }           
        );
   }
 }

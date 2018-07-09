import { State, Selector, Action, StateContext } from '@ngxs/store';
import * as dashboardAction from './dashboard.actions';
import { HttpService } from '../../core/http/http.service';
import { DashboardService } from '../services/dashboard.service';
import { UtilsService } from '../../core/services/utils.service';
import { tap, map, catchError } from 'rxjs/operators';

export interface WidgetModel {
    id: string;
    clientSize?: {
        width: number;
        height: number;
    };
    settings: {
        title: string;
        component_type: string;
        data_source?: string;
    };
    gridPos: {
        x: number;
        y: number;
        w: number;
        h: number;
        xMd?: number;
        yMd?: number;
    };
    query: {
        start: string;
        end?: string;
        downsample: string;
        groups: any[];
    },
    data?: {
        rawdata?: any;
    },
    rawdata?: any;
}

export interface DashboardStateModel {
    id: string;
    loading: boolean;
    loaded: boolean;
    viewEditMode: boolean;
    editWidgetId: string;
    updatedWidgetId: string;
    updatedGroupId: string;
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
      updatedGroupId: '',
      settings: {},
      widgets: []
    }
})

export class DashboardState {

    constructor(private httpService: HttpService, 
                private dashboardService: DashboardService,
                private utilsService: UtilsService) {}

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

   @Selector() 
   static getWidgetGroupUpdate(state: DashboardStateModel) {
       return {
            widgetId: state.updatedWidgetId,
            groupId: state.updatedGroupId
       }
   }

    @Action(dashboardAction.LoadDashboard)
    loadDashboard(ctx: StateContext<DashboardStateModel>, { id }: dashboardAction.LoadDashboard) {
        ctx.patchState({loading: true});
        return this.httpService.getDashoard('1').pipe(
            map((dashboard: DashboardStateModel) => {
                ctx.dispatch(new dashboardAction.LoadDashboardSuccess(dashboard));
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
        // passing state for dashboard loading error here
    }

    @Action(dashboardAction.CreateNewDashboard)
    createNewDashboard(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.CreateNewDashboard) {
        // set state to new empty dashboard
        ctx.setState(payload);
    }

    @Action(dashboardAction.UpdateWidgetsLayout)
    updateWidgetsLayout(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.UpdateWidgetsLayout) {
        const state = ctx.getState();
        ctx.setState({...state, ...payload});
    }

    @Action(dashboardAction.SetViewEditMode)
    setViewEditMode(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.SetViewEditMode) {
        const state = ctx.getState();
        ctx.setState({...state, viewEditMode: payload.editMode, editWidgetId: payload.widgetId});
    }

    @Action(dashboardAction.RemoveWidget)
    removeWidget(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.RemoveWidget) {
        const state = ctx.getState();
        for (let i = 0; i < state.widgets.length; i++) {
            if (state.widgets[i].id === payload.widgetId) {
                state.widgets.splice(i, 1);
                break;
            }
        }
        ctx.setState(state);
    }  
    
    @Action(dashboardAction.AddWidget)
    addWidget(ctx: StateContext<DashboardStateModel>, { payload }: dashboardAction.AddWidget) {
        const state = ctx.getState();
        // some reposition need to apply
        state.widgets = this.dashboardService.positionWidget(state.widgets);
        state.widgets.unshift(payload.widget);
        ctx.setState(state);
    }
    /* GetQueryData will make the call to API to get data.
        More on settings up data source and other later
    */
   @Action(dashboardAction.GetQueryData)
   GetQueryData(ctx: StateContext<DashboardStateModel>, action: dashboardAction.GetQueryData) {
        this.httpService.getYamasData(action.query).subscribe(
            data => {
                const state = ctx.getState();
                // tslint:disable-next-line:prefer-const
                for (let w of state.widgets) {
                    if (w.id === action.widgetid) {
                        // or transformation for data needed to be done here.
                        if (!w.data) {
                            // first time may not have this properties data yet
                            // then create it.
                            w.data = {};
                        }
                        w.data.rawdata = data;
                        state.updatedWidgetId = w.id;
                        break;
                    }
                }
                ctx.setState(state);
            }
        );
   }

   // with multiple groups support in a widget, passing groupid along to break query into groups
   @Action(dashboardAction.GetQueryDataByGroup)
   getQueryDataByGroup(ctx: StateContext<DashboardStateModel>, action: dashboardAction.GetQueryDataByGroup) {
        this.httpService.getYamasData(action.query).subscribe(
            data => {
                const state = ctx.getState();
                for (let w of state.widgets) {
                    if (w.id === action.widgetid) {
                        //if(!w.rawdata) w.rawdata = [];
                        //w.rawdata.push({
                        //    id: action.groupid,
                        //    data: data
                        //});
                        if (!w.rawdata) w.rawdata = {};
                        w.rawdata[action.groupid] = data;
                        state.updatedWidgetId = w.id;
                        state.updatedGroupId = action.groupid;
                        break;
                    }
                }
                ctx.setState(state);       
            },
            err => {
                // todo: handle error case
                console.log('error', err);     
            }
        );
   }
 }

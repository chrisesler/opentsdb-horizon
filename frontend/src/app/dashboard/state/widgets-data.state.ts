import { State, Action, StateContext, Selector, createSelector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import {  takeUntil } from 'rxjs/operators';
import { Actions, ofActionDispatched } from '@ngxs/store';

export interface RawDataModel {
    lastModifiedWidget: {
        wid: string,
        gid: string
    };
    data: any;
}

// action
// payload includes widgetid, groupid and query obj
export class GetQueryDataByGroup {
    public static type = '[Rawdata] Get Query Data By Group';
    constructor(public readonly payload: any) {}
}

export class SetQueryDataByGroup {
    public static type = '[Rawdata] Set Query Data By Group';
    constructor(public readonly payload: any) {}
}

export class ClearQueryData {
    public static type = '[Rawdata] Clear Query Data';
    constructor(public readonly payload: any) {}
}



@State<RawDataModel>({
    name: 'Rawdata',
    defaults: {
        lastModifiedWidget: {
            wid: '',
            gid: ''
        },
        data: {}
    }
})

export class WidgetsRawdataState {
    queryObserver: Observable<any>;
    
    constructor(private httpService: HttpService, private actions$: Actions ) {}

    static getWidgetRawdataByID(id: string) {
        return createSelector([WidgetsRawdataState], (state: RawDataModel) => {
            return state.data[id];
        });
      }

    @Selector() static getLastModifiedWidgetRawdata(state: RawDataModel) {
        return {...state.data[state.lastModifiedWidget.wid], ...state.lastModifiedWidget};
    }

    @Selector() static getLastModifiedWidgetRawdataByGroup (state: RawDataModel) {
        return {rawdata: state.data[state.lastModifiedWidget.wid][state.lastModifiedWidget.gid], ...state.lastModifiedWidget};
    }

    @Action(GetQueryDataByGroup)
    getQueryDataByGroup(ctx: StateContext<RawDataModel>, { payload }: GetQueryDataByGroup) {
        if ( payload.isEditMode ) {
             this.queryObserver = this.httpService.getYamasData( { query: payload.query} )
                            .pipe(
                                takeUntil(this.actions$.pipe(ofActionDispatched(GetQueryDataByGroup)))
                            );

        } else {
            this.queryObserver = this.httpService.getYamasData({query: payload.query});
        }

        this.queryObserver.subscribe(
            data => {
                payload.data = data;
                ctx.dispatch(new SetQueryDataByGroup(payload));
            },
            err => {
                payload.error = err;
                ctx.dispatch(new SetQueryDataByGroup(payload));
            }
        );
    }

    @Action(SetQueryDataByGroup)
    setQueryDataByGroup(ctx: StateContext<RawDataModel>, { payload }: SetQueryDataByGroup) {
        const state = ctx.getState();
        if (!state.data[payload.wid]) {
            state.data[payload.wid] = {};
        }
        state.data[payload.wid][payload.gid] = payload.data !== undefined ? payload.data : { error: payload.error };
        state.lastModifiedWidget = { wid: payload.wid, gid: payload.gid};
        ctx.setState({...state});
        this.queryObserver = null;
    }

    @Action(ClearQueryData)
    clearQueryData(ctx: StateContext<RawDataModel>, { payload }: ClearQueryData) {
        const state = ctx.getState();
        state.data[payload.wid] = {};
        state.lastModifiedWidget = { wid: payload.wid, gid: null};
        ctx.setState({...state});
    }
}
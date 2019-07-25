import { State, Action, StateContext, Selector, createSelector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { UtilsService } from '../../core/services/utils.service';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import {  takeUntil } from 'rxjs/operators';
import { Actions, ofActionDispatched } from '@ngxs/store';

export interface RawDataModel {
    lastModifiedWidget: {
        wid: string
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

export class CopyWidgetData {
    static readonly type = '[Dashboard] Copy Widget Data';
    constructor(public wid: string, public cpid: string) {}
}

export class ClearQueryData {
    public static type = '[Rawdata] Clear Query Data';
    constructor(public readonly payload: any) {}
}

export class ClearWidgetsData {
    public static type = '[Rawdata] Clear Widgets Data';
    constructor() {}
}



@State<RawDataModel>({
    name: 'Rawdata',
    defaults: {
        lastModifiedWidget: {
            wid: ''
        },
        data: {}
    }
})

export class WidgetsRawdataState {
    queryObserver: Observable<any>;
    subs: any = {};

    constructor(private httpService: HttpService, private actions$: Actions, private utils: UtilsService) {}

    static getWidgetRawdataByID(id: string) {
        return createSelector([WidgetsRawdataState], (state: RawDataModel) => {
            return state.data[id];
        });
      }

    @Selector() static getLastModifiedWidgetRawdataByGroup (state: RawDataModel) {
        return {rawdata: state.data[state.lastModifiedWidget.wid], ...state.lastModifiedWidget};
    }

    @Action(GetQueryDataByGroup)
    getQueryDataByGroup(ctx: StateContext<RawDataModel>, { payload }: GetQueryDataByGroup) {

        const qid = payload.wid;
        // cancels the previous call
        if (  this.subs[qid] ) {
            this.subs[qid].unsubscribe();
        }
        this.queryObserver = this.httpService.getYamasData(payload);

        this.subs[qid] = this.queryObserver.subscribe(
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
        const curState = ctx.getState();
        const state = this.utils.deepClone(curState);
        const qid = payload.wid;
        if (!state.data[payload.wid]) {
            state.data[payload.wid] = {};
        }
        state.data[payload.wid] = payload.data !== undefined ? payload.data : { error: payload.error };
        state.lastModifiedWidget = { wid: payload.wid};
        ctx.setState(state);
        if ( this.subs[qid]) {
            this.subs[qid].unsubscribe();
        }
        this.queryObserver = null;
    }

    @Action(CopyWidgetData)
    copyWidgetData(ctx: StateContext<RawDataModel>, { wid: wid, cpid: cpid }: CopyWidgetData) {
        const curState = ctx.getState();
        const state = this.utils.deepClone(curState);
        const data = state.data;
        if ( state.data[wid] ) {
            data[cpid] = JSON.parse(JSON.stringify(state.data[wid]));
        }
        ctx.patchState({ data: data, lastModifiedWidget: { wid: null} });
    }

    @Action(ClearQueryData)
    clearQueryData(ctx: StateContext<RawDataModel>, { payload }: ClearQueryData) {
        const curState = ctx.getState();
        const state = this.utils.deepClone(curState);
        state.data[payload.wid] = {};
        state.lastModifiedWidget = { wid: payload.wid};
        ctx.setState({...state});
    }

    @Action(ClearWidgetsData)
    clearWidgetsData(ctx: StateContext<RawDataModel>) {
        for ( const k in this.subs ) {
            if (typeof this.subs[k].unsubscribe === 'function' ) {
                this.subs[k].unsubscribe();
            }
        }
        ctx.setState({data: {}, lastModifiedWidget: { wid: null } });
    }
}

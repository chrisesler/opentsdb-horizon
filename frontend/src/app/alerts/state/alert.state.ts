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

export interface AlertStateModel {
    id: number;
    namespace: string;
    name: string;
    type: string;
    enabled: boolean;
    alertGroupingRules: string[];
    labels: string[];
    threshold: any;
    notification: any;
    status: string;
    error: any;
}


/* state define */
@State<AlertStateModel>({
    name: 'Alert',
    defaults: {
        id: null,
        namespace: '',
        name: '',
        type: 'SIMPLE',
        enabled: true,
        alertGroupingRules: [],
        labels: [],
        threshold: {},
        notification: {},
        status: '',
        error: {}
    }
})

export class GetAlertDetailsById {
    static readonly type = '[Alert] Get Alert Details By Id';
    constructor(public id: number) {}
}

export class SaveAlert {
    static readonly type = '[Alert] Save Alert';
    constructor(public namespace:string, public payload: any) {}
}

export class SaveAlertSuccess {
    static readonly type = '[Alert] Save Alert Success';
    constructor(public readonly payload: any) {}
}

export class SaveAlertFail {
    static readonly type = '[Alert] Save Alert Fail';
    constructor(public readonly error: any) { }
}

export class AlertState {
    constructor(
        private httpService: HttpService
    ) { }

    @Selector() static getAlertDetails(state: AlertStateModel) {
        return state;
    }

    @Action(SaveAlert)
    saveDashboard(ctx: StateContext<AlertStateModel>, { namespace:namespace, payload: payload }: SaveAlert) {
            ctx.patchState({ status: 'save-progress', error: {} });
            return this.httpService.saveAlert(namespace, payload).pipe(
                map( (res: any) => {
                    ctx.dispatch(new SaveAlertSuccess(res.body));
                }),
                catchError( error => ctx.dispatch(new SaveAlertFail(error)))
            );
    }

    @Action(SaveAlertSuccess)
    saveAlertSuccess(ctx: StateContext<AlertStateModel>, { payload }: SaveAlertSuccess) {
        const state = ctx.getState();
        ctx.patchState({...state, id: payload.id, status: 'save-sucess'});
    }

    @Action(SaveAlertFail)
    saveDashboardFail(ctx: StateContext<AlertStateModel>, { error }: SaveAlertFail) {
        const state = ctx.getState();
        ctx.patchState({...state, status: 'save-failed', error: error });
    }

    @Action(GetAlertDetailsById)
    getAlertDetailsById(ctx: StateContext<AlertStateModel>, { id: id }: GetAlertDetailsById) {
        const state = ctx.getState();
        this.httpService.getAlertDetailsById(id).subscribe(
            data => {
                ctx.setState(data);
            },
            err => {
                ctx.patchState({...state, status: 'get-failed', error: err });
            }
        );
    }
}

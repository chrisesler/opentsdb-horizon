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

export interface AlertStateModel {
    status: string;
    error: any;
    loaded: boolean;
    data: any;
}


/* state define */
@State<AlertStateModel>({
    name: 'Alert',
    defaults: {
        status: '',
        error: {},
        loaded: false,
        data: {
            id: null,
            namespace: '',
            name: '',
            type: 'SIMPLE',
            enabled: true,
            alertGroupingRules: [],
            labels: [],
            threshold: {},
            notification: {}
        }
    }
})

export class GetAlertDetailsById {
    static readonly type = '[Alert] Get Alert Details By Id';
    constructor(public id: number) {}
}

export class AlertState {
    constructor(
        private httpService: HttpService
    ) { }

    @Selector() static getAlertDetails(state: AlertStateModel) {
        return state.data;
    }

    @Action(GetAlertDetailsById)
    getAlertDetailsById(ctx: StateContext<AlertStateModel>, { id: id }: GetAlertDetailsById) {
        const state = ctx.getState();
        ctx.patchState({ status: 'loading', loaded: false, error: {} });
        this.httpService.getAlertDetailsById(id).subscribe(
            data => {
                ctx.patchState({data: data, status:'success', loaded: true, error: {}});
            },
            err => {
                ctx.patchState({ data: {}, status: 'failed', loaded: false, error: err });
            }
        );
    }
}

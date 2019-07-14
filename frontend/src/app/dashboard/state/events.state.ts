import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { map, catchError } from 'rxjs/operators';

export interface EventsModel {
    query: string;
    events: Array<any>;
}

export interface EventsStateModel {
    loading: boolean;
    error: any;
    events: EventsModel;
    lastUpdated: any;
}

/* GET *********************/
export class GetEvents {
    public static type = '[Events] Load';
    constructor(
        public readonly query: string
    ) { }
}

// export class LoadEventsSuccess {
//     public static type = '[Events] Load [SUCCESS]';
//     constructor(
//         public readonly query: string,
//         public readonly events: Array<any>
//     ) { }
// }

// export class LoadEventsFail {
//     public static type = '[Events] Load [FAIL]';
//     constructor(
//         public readonly query: string,
//         public readonly options?: any
//     ) { }
// }


@State<EventsStateModel>({
    name: 'Events',
    defaults: {
        events: {
            query: '',
            events: []
        },
        error: {},
        loading: false,
        lastUpdated: {}
    }
})

export class EventsState {
    constructor(private httpService: HttpService) { }

    @Selector() static GetEvents(state: EventsStateModel) {
        return state.events;
    }

    // @Selector() static GetErrors(state: EventsStateModel) {
    //     console.log('getEvents error');
    //     return state.error;
    // }

    // @Selector() static GetLastUpdated(state: EventsStateModel) {
    //     console.log('getEvents last updated');
    //     return state.lastUpdated;
    // }

    @Action(GetEvents)
    getEvents(ctx: StateContext<EventsStateModel>, { query }: GetEvents) {
        // ctx.patchState({ loading: true });
        // return this.httpService.getEvents(query).pipe(
        //     map((payload: any) => {
        //         ctx.dispatch(new LoadEventsSuccess(query, payload.body));
        //     }),
        //     catchError(error => ctx.dispatch(new LoadEventsFail(error)))
        // );
        // TODO: REMOVE
        const state = ctx.getState();
        ctx.setState({ ...state, events: this.httpService.getEvents(query), loading: false });

        // TODO: convert to format we like
        // response to look like this:

        // {
        //     "results": [
        //       {
        //         "source": "q1_m1:q1_m1",
        //         "data": [
        //           {
        //             "Event": {
        //               "eventId": "123445",
        //               "timestamp": "1561071600",
        //               "title": "Disk is busy",
        //               "message": "Disk is busy",
        //               "priority": "low",
        //               "namespace": "yamas",
        //               "tags": {
        //                 "host": "tsdbr-1.yms.gq1.yahoo.com",
        //                 "_application": "tsdb"
        //               }
        //             }
        //           },
        //           {
        //             "Event": {
        //               "eventId": "123445",
        //               "timestamp": "1561071600",
        //               "title": "CPU is busy",
        //               "message": "FOO BAR is busy",
        //               "priority": "high",
        //               "namespace": "yamas",
        //               "tags": {
        //                 "host": "tsdbr-2.yms.gq1.yahoo.com",
        //                 "_application": "tsdb"
        //               }
        //             }
        //           }
        //         ]
        //       }
        //     ]
        //   }
    }

    // @Action(LoadEventsSuccess)
    // loadEventsSuccess(ctx: StateContext<EventsStateModel>, events) {
    //     console.log('#### EVENTS SUCCESS ####', events);
    //     const state = ctx.getState();
    //     ctx.setState({ ...state, events: events, loading: false, });
    // }

    // @Action(LoadEventsFail)
    // loadEventsFail(ctx: StateContext<EventsStateModel>, error) {
    //     console.log('#### EVENTS FAIL ####', error);
    //     const state = ctx.getState();
    //     ctx.setState({ ...state, loading: false, error });
    // }

}

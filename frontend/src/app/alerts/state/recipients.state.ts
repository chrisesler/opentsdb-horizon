import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { map } from 'rxjs/operators';

export interface RecipientsModel {
    namespace: string;
    recipients: Array<any>;
}

export class LoadRecipients {
    public static type = '[Recipients] Load for Namespace';
    constructor(
        public readonly namespace: string
    ) {}
}

// export class UpdateRecipients {
//     public static type = '[Recipients] Update for Namespace';
//     constructor(public readonly namespace: any) { }
// }

@State<RecipientsModel>({
    name: 'Recipients',
    defaults: {
        namespace: '',
        recipients: []
    }
})

export class RecipientsState {
    constructor(private httpService: HttpService) { }

    @Selector() static GetRecipients(state: RecipientsModel) {
        return state;
    }

    @Action(LoadRecipients)
    loadRecipients(ctx: StateContext<RecipientsModel>, { namespace }: LoadRecipients) {

        const state = ctx.getState();
        console.log(namespace);
        return this.httpService.getRecipients(namespace).pipe(
            map((response: any) => {
                console.log(response.body);
                // ctx.dispatch(new UpdateRecipients(response.body));
            })
        );
    }

    // @Action(UpdateRecipients)
    // UpdateRecipients(ctx: StateContext<RecipientsModel>, namespace) {
    //     // console.log('#### NAMESPACES ####', namespaces);
    //     const state = ctx.getState();
    //     ctx.patchState({ ...state, namespace: namespace });
    // }
}

import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { map } from 'rxjs/operators';

export interface RecipientsModel {
    namespace: string;
    recipients: Array<any>;
}

export interface RecipientsStateModel {
    loaded: boolean;
    loading: boolean;
    error: any;
    recipients: RecipientsModel;
}

export class GetRecipients {
    public static type = '[Recipients] Load for Namespace';
    constructor(
        public readonly namespace: string
    ) {}
}

export class LoadRecipients {
    public static type = '[Recipients] Update for Namespace';
    constructor(
        public readonly namespace: string,
        public readonly recipients: Array<any>
    ) { }
}

@State<RecipientsStateModel>({
    name: 'Recipients',
    defaults: {
        recipients: {
            namespace: '',
            recipients: []
        },
        error: {},
        loaded: false,
        loading: false
    }
})

export class RecipientsState {
    constructor(private httpService: HttpService) { }

    @Selector() static GetRecipients(state: RecipientsStateModel) {
        return state.recipients;
    }

    @Action(GetRecipients)
    getRecipients(ctx: StateContext<RecipientsStateModel>, { namespace }: GetRecipients) {
        // this.logger.state('AlertsState :: Load user namespaces', { options });
        const state = ctx.getState();
        console.log(namespace);
        if (!state.loaded) {

            ctx.patchState({ loading: true });
            return this.httpService.getRecipients(namespace).pipe(
                map((payload: any) => {
                    // console.log('resourceList', payload);
                    ctx.dispatch(new LoadRecipients(namespace, payload.body));
                }),
                // catchError(error => ctx.dispatch(new ASloadUserNamespacesFail(error, options)))
            );

        }
        // return this.httpService.getRecipients(namespace).pipe(
        //     map((response: any) => {
        //         console.log(response.body);
        //         ctx.dispatch(new UpdateRecipients(namespace, response.body));
        //     })
        // );
    }

    @Action(LoadRecipients)
    loadRecipients(ctx: StateContext<RecipientsStateModel>, recipients) {
        console.log('#### NAMESPACE RECIPIENTS ####', recipients);
        const state = ctx.getState();
        // const loaded = true;

        ctx.setState({ ...state, recipients: recipients, loading: false, loaded: true });
    }
}

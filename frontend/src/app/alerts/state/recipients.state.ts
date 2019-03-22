import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { map, catchError } from 'rxjs/operators';

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


/* GET *********************/
export class GetRecipients {
    public static type = '[Recipients] Load for Namespace';
    constructor(
        public readonly namespace: string
    ) {}
}

export class LoadRecipientsSuccess {
    public static type = '[Recipients] Load for Namespace [SUCCESS]';
    constructor(
        public readonly namespace: string,
        public readonly recipients: Array<any>
    ) { }
}

export class LoadRecipientsFail {
    public static type = '[Recipients] Load for Namespace [FAIL]';
    constructor(
        public readonly namespace: string,
        public readonly options?: any
    ) { }
}

/* POST *********************/
export class PostRecipient {
    public static type = '[Recipients] Post for Namespace';
    constructor(
        public readonly data: any
    ) {}
}

export class PostRecipientSuccess {
    public static type = '[Recipients] Post for Namespace [SUCCESS]';
    constructor(
        public readonly data: any
    ) { }
}

/* PUT *********************/

export class UpdateRecipient {
    public static type = '[Recipients] PUT for Namespace';
    constructor(
        public readonly data: any
    ) {}
}

export class UpdateRecipientSuccess {
    public static type = '[Recipients] PUT for Namespace [SUCCESS]';
    constructor(
        public readonly data: any
    ) { }
}

/* DELETE *********************/
export class DeleteRecipient {
    public static type = '[Recipients] Delete for Namespace';
    constructor(
        public readonly data: any
    ) {}
}

export class DeleteRecipientSuccess {
    public static type = '[Recipients] Delete for Namespace [SUCCESS]';
    constructor(
        public readonly data: any
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

    // GET
    @Action(GetRecipients)
    getRecipients(ctx: StateContext<RecipientsStateModel>, { namespace }: GetRecipients) {
        const state = ctx.getState();
        if (!state.loaded) {
            ctx.patchState({ loading: true });
            return this.httpService.getRecipients(namespace).pipe(
                map((payload: any) => {
                    ctx.dispatch(new LoadRecipientsSuccess(namespace, payload.body));
                }),
                catchError(error => ctx.dispatch(new LoadRecipientsFail(error)))
            );
        }
    }

    @Action(LoadRecipientsSuccess)
    loadRecipientsSuccess(ctx: StateContext<RecipientsStateModel>, recipients) {
        console.log('#### NAMESPACE RECIPIENTS SUCCESS ####', recipients);
        const state = ctx.getState();
        ctx.setState({ ...state, recipients: recipients, loading: false, loaded: true });
    }

    @Action(LoadRecipientsFail)
    loadRecipientsFail(ctx: StateContext<RecipientsStateModel>, error) {
        console.log('#### NAMESPACE RECIPIENTS FAIL ####', error);
        const state = ctx.getState();
        ctx.setState({ ...state, loading: false, error });
    }

    // POST
    @Action(PostRecipient)
    postRecipient(ctx: StateContext<RecipientsStateModel>, { data }: PostRecipient) {
        return this.httpService.postRecipient(data).pipe(
            map((payload: any) => {
                ctx.dispatch(new PostRecipientSuccess(payload.body));
            }),
            // TODO: catchError(error => ctx.dispatch(new LoadRecipientsFail(error)))
        );
    }

    @Action(PostRecipientSuccess)
    postRecipientSuccess(ctx: StateContext<RecipientsStateModel>, recipient) {
        console.log('#### RECIPIENT POST SUCCESS ####', recipient);
        const state = ctx.getState();
        let recipients = { ...state.recipients };
        recipients = this.appendRecipientToRecipients(recipient.data, recipients);

        ctx.setState({ ...state, recipients: recipients, loading: false, loaded: true });
    }

    // PUT
    @Action(UpdateRecipient)
    updateRecipient(ctx: StateContext<RecipientsStateModel>, { data }: UpdateRecipient) {
        return this.httpService.updateRecipient(data).pipe(
            map((payload: any) => {
                ctx.dispatch(new UpdateRecipientSuccess(payload.body));
            }),
            // TODO: catchError(error => ctx.dispatch(new LoadRecipientsFail(error)))
        );
    }

    @Action(UpdateRecipientSuccess)
    updateRecipientSuccess(ctx: StateContext<RecipientsStateModel>, recipient) {
        console.log('#### RECIPIENT UPDATE SUCCESS ####', recipient);
        const state = ctx.getState();
        let recipients = { ...state.recipients };
        ctx.setState({ ...state, recipients: recipients, loading: false, loaded: true });
    }

    // DELETE
    @Action(DeleteRecipient)
    deleteRecipient(ctx: StateContext<RecipientsStateModel>, data) {
        return this.httpService.deleteRecipient(data.data).pipe(
            map((payload: any) => {
                ctx.dispatch(new DeleteRecipientSuccess(payload.body));
            }),
            // TODO: catchError(error => ctx.dispatch(new LoadRecipientsFail(error)))
        );
    }

    @Action(DeleteRecipientSuccess)
    deleteRecipientSuccess(ctx: StateContext<RecipientsStateModel>, recipient) {
        console.log('#### RECIPIENT DELETE SUCCESS ####', recipient);
        const state = ctx.getState();
        let recipients = { ...state.recipients };
        recipients = this.removeRecipientFromRecipients(recipient.data, recipients);
        ctx.setState({ ...state, recipients: recipients, loading: false, loaded: true });
    }

    // HELPERS
    appendRecipientToRecipients(recipient, namespaceAndRecipients): any {
        const type = Object.keys(recipient)[0];
        if (!namespaceAndRecipients.recipients[type])  {
            namespaceAndRecipients.recipients[type] = [];
        }
        namespaceAndRecipients.recipients[type].push(recipient[type][0]);
        return namespaceAndRecipients;
    }

    removeRecipientFromRecipients(recipient, namespaceAndRecipients): any {
        const type = Object.keys(recipient)[0];
        let index = 0;
        // tslint:disable-next-line:forin
        for (let i = 0; i < namespaceAndRecipients.recipients[type].length; i++) {
            if (namespaceAndRecipients.recipients[type][i].name === recipient[type][0].name) {
                index = i;
                break;
            }
        }
        namespaceAndRecipients.recipients[type].splice(index, 1);
        return namespaceAndRecipients;
    }
}

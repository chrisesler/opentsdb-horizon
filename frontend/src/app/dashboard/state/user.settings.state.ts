import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { map, catchError } from 'rxjs/operators';

export interface UserSettingsModel {
    userid: string;
    namespaces: Array<string>;
}

export class LoadUserNamespaces {
    public static type = '[Dashboard] Load User Namespaces';
    constructor() {}
}

export class UpdateUserNamespaces {
    public static type = '[Dashboard] Update User Namespaces';
    constructor(public readonly namespaces: any) {}
}


@State<UserSettingsModel>({
    name: 'UserSettings',
    defaults: {
        userid: '',
        namespaces: [],
    }
})

export class UserSettingsState {
    constructor( private httpService: HttpService ) {}

    @Selector() static GetUserSettings(state: UserSettingsModel) {
        return state;
    }

    @Selector() static GetUserNamespaces(state: UserSettingsModel) {
        return state.namespaces;
    }


    @Action(LoadUserNamespaces)
    loadUserNamespaces(ctx: StateContext<UserSettingsModel>) {
        return this.httpService.userNamespaces().pipe(
            map( (namespaces: any) => {
                ctx.dispatch(new UpdateUserNamespaces(namespaces.body));
            })
        );
    }

    @Action(UpdateUserNamespaces)
    updateUserNamespaces(ctx: StateContext<UserSettingsModel>, { namespaces }: UpdateUserNamespaces) {
        const state = ctx.getState();
        ctx.patchState({...state, namespaces: namespaces });
    }
}

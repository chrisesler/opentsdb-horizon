import { State , Action, Selector, StateContext, Store} from '@ngxs/store';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

import {
    AppShellService
} from '../services/app-shell.service';

import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { Subscription } from 'rxjs';

/** Model interface */
export interface AppShellStateModel {
    currentTheme: string;
    currentMediaQuery: string;
    userProfile: any;
    error: any;
}

/** Action Definitions */
export class SetTheme {
    static readonly type = '[AppShell] Set Theme';
    constructor(public theme: string) {}
}

export class SetCurrentMediaQuery {
    static readonly type = '[AppShell] Set current media query';
    constructor(public currentMediaQuery: string) {}
}

 export class SSGetUserProfile {
    public static type = '[DashboardNavigator] get user profile';
    constructor() {}
}

export class SSGetUserProfileSuccess {
    static readonly type = '[DashboardNavigator] Get User profile [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}

export class SSGetUserProfileFail {
    static readonly type = '[DashboardNavigator] Get User profile [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

export class SSCreateUserProfile {
    public static type = '[DashboardNavigator] create user profile';
    constructor() {} // no data needed, it reads okta cookie
}

export class SSCreateUserProfileSuccess {
    static readonly type = '[DashboardNavigator] Create User profile [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}

export class SSCreateUserProfileFail {
    static readonly type = '[DashboardNavigator] Create User profile [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}


/** Define State */
@State<AppShellStateModel>({
    name: 'AppShell',
    defaults: {
        currentTheme: 'developing',
        currentMediaQuery: '',
        userProfile: {
            loaded: false
        },
        error: false
    }
})

export class AppShellState {

    // subscription to media query change
    mediaWatcher$: Subscription;

    constructor (
        private service: AppShellService,
        private store: Store,
        private mediaObserver: MediaObserver
    ) {
        this.mediaWatcher$ = mediaObserver.media$.subscribe((change: MediaChange) => {
            const currentMediaQuery = change ? change.mqAlias : '';
            this.store.dispatch(new SetCurrentMediaQuery(currentMediaQuery));
        });
    }

    /** Selectors */

    @Selector()
    static getError(state: AppShellStateModel) {
        return state.error;
    }

    @Selector()
    static getUserProfile(state: AppShellStateModel) {
        return state.userProfile;
    }

    @Selector()
    static getCurrentTheme(state: AppShellStateModel) {
        return state.currentTheme;
    }

    @Selector()
    static getCurrentMediaQuery(state: AppShellStateModel) {
        return state.currentMediaQuery;
    }

    /**************************
     * UTILS
     **************************/

    stateLog(title: string, params?: any) {
        if (environment.production) { return; }
        if (params) {
            console.group(
                '%cAppShellState%c' + title,
                'color: white; background-color: DarkTurquoise ; padding: 4px 8px; font-weight: bold;',
                'color: DarkTurquoise ; padding: 4px 8px; border: 1px solid DarkTurquoise ;'
            );
            console.log('%cParams', 'font-weight: bold;', params);
            console.groupEnd();
        } else {
            console.log(
                '%cAppShellState%c' + title,
                'color: white; background-color: DarkTurquoise ; padding: 4px 8px; font-weight: bold;',
                'color: DarkTurquoise ; padding: 4px 8px; border: 1px solid DarkTurquoise ;'
            );
        }
    }

    stateError(title: string, error: any) {
        if (environment.production) { return; }
        console.group(
            '%cAppShellState [ERROR]%c' + title,
            'color: white; background-color: red; padding: 4px 8px; font-weight: bold;',
            'color: red; padding: 4px 8px; border: 1px solid red;'
        );
        console.log('%cErrorMsg', 'font-weight: bold;', error);
        console.groupEnd();
    }

    stateSuccess(title: string, response: any) {
        if (environment.production) { return; }
        console.group(
            '%cAppShellState [SUCCESS]%c' + title,
            'color: white; background-color: green; padding: 4px 8px; font-weight: bold;',
            'color: green; padding: 4px 8px; border: 1px solid green;',
            response
        );
        console.log('%cResponse', 'font-weight: bold;', response);
        console.groupEnd();
    }

    /** Actions */
    @Action(SetTheme)
    setTheme(ctx: StateContext<AppShellStateModel>, { theme }: SetTheme) {
        const state = ctx.getState();
        ctx.patchState({...state, currentTheme: theme });
    }

    @Action(SetCurrentMediaQuery)
    setCurrentMediaQuery(ctx: StateContext<AppShellStateModel>, { currentMediaQuery }: SetCurrentMediaQuery) {
        const state = ctx.getState();
        ctx.setState({...state, currentMediaQuery });
    }

    @Action(SSGetUserProfile)
    GetUserProfile(ctx: StateContext<AppShellStateModel>, { }: SSGetUserProfile) {
        this.stateLog('Get user profile');
        const state = ctx.getState();
        return this.service.getUserProfile().pipe(
            map( (payload: any) => {
                // console.log('resourceList', payload);
                ctx.dispatch(new SSGetUserProfileSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new SSGetUserProfileFail(error)))
        );
    }

    @Action(SSGetUserProfileSuccess)
    GetUserProfileSuccess(ctx: StateContext<AppShellStateModel>, { response }: SSGetUserProfileSuccess) {
        const state = ctx.getState();
        const userProfile = response.body;
        userProfile.loaded = true;

        this.stateSuccess('Get user profile', response);

        ctx.setState({
            ...state,
            userProfile
        });

    }

    @Action(SSGetUserProfileFail)
    GetUserProfileFail(ctx: StateContext<AppShellStateModel>, { error }: SSGetUserProfileFail) {
        this.stateError('Get user profile', error);
        if ( error.status === 404 ) {
            ctx.dispatch(new SSCreateUserProfile()); // 404 means the profile does not exist
        }
        ctx.dispatch({error: error});
    }

    @Action(SSCreateUserProfile)
    CreateUserProfile(ctx: StateContext<AppShellStateModel>, { }: SSCreateUserProfile) {
        this.stateLog('Create user profile');
        const state = ctx.getState();
        return this.service.createUser().pipe(
            map( (payload: any) => {
                // console.log('resourceList', payload);
                ctx.dispatch(new SSCreateUserProfileSuccess(payload));
            }),
            catchError( error => ctx.dispatch(new SSCreateUserProfileFail(error)))
        );
    }

    @Action(SSCreateUserProfileSuccess)
    CreateUserProfileSuccess(ctx: StateContext<AppShellStateModel>, { response }: SSCreateUserProfileSuccess) {
        const state = ctx.getState();
        const userProfile = response.body;
        userProfile.loaded = true;

        this.stateSuccess('Create user profile', response);

        ctx.setState({
            ...state,
            userProfile
        });
    }

    @Action(SSCreateUserProfileFail)
    CreateUserProfileFail(ctx: StateContext<AppShellStateModel>, { error }: SSCreateUserProfileFail) {
        this.stateError('Create user profile', error);
        ctx.dispatch({error: error});
    }

}

import { State , Action, Selector, StateContext, Store} from '@ngxs/store';
import { map, catchError } from 'rxjs/operators';

import { NavigatorState } from './navigator.state';

import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { Subscription } from 'rxjs/Subscription';

/** Model interface */
export interface AppShellStateModel {
    currentTheme: string;
    currentMediaQuery: string;
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


/** Define State */
@State<AppShellStateModel>({
    name: 'AppShell',
    defaults: {
        currentTheme: 'developing',
        currentMediaQuery: ''
    }
})

export class AppShellState {

    // subscription to media query change
    mediaWatcher$: Subscription;

    constructor (
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
    static getCurrentTheme(state: AppShellStateModel) {
        return state.currentTheme;
    }

    @Selector()
    static getCurrentMediaQuery(state: AppShellStateModel) {
        return state.currentMediaQuery;
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

}

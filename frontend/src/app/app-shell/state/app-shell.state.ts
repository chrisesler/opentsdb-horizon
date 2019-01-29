import { State , Action, Selector, StateContext} from '@ngxs/store';
import { map, catchError } from 'rxjs/operators';

import { NavigatorState } from './navigator.state';

/** Model interface */
export interface AppShellStateModel {
    currentTheme: string;
}

/** Action Definitions */
export class SetTheme {
    static readonly type = '[AppShell] Set Theme';
    constructor(public theme: string) {}
}


/** Define State */
@State<AppShellStateModel>({
    name: 'AppShell',
    defaults: {
        currentTheme: 'developing'
    }
})

export class AppShellState {

    constructor () {}

    /** Selectors */
    @Selector()
    static getCurrentTheme(state: AppShellStateModel) {
        return state.currentTheme;
    }

    /** Actions */
    @Action(SetTheme)
    setTheme(ctx: StateContext<AppShellStateModel>, { theme }: SetTheme) {
        const state = ctx.getState();
        ctx.patchState({...state, currentTheme: theme });
    }

}

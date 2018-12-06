import {
    State,
    Action,
    Selector,
    StateContext
} from '@ngxs/store';

import {
    DashboardNavigatorState
} from './dashboard-navigator.state';

/** Model interface */
export interface NavigatorStateModel {
    currentApp: string;
}

/** Action Definitions */

export class ChangeNavigatorApp {
    static readonly type = '[Navigator] Change Navigator App';
    constructor(public app: string) {}
}

/** Define State
 *
 * Navigator Children
 * - DashboardNavigatorState
 *
 * Possible New Navigator Children
 * - metric explorer
 * - alerts
 * - status
 * - annotations
 * - admin
 * - favorites
 * - namespaces
 * - resources
*/

@State<NavigatorStateModel>({
    name: 'Navigator',
    defaults: {
        currentApp: 'dashboards',
    },
    children: [
        DashboardNavigatorState
    ]
})

export class NavigatorState {
    constructor () {}

    /** Selectors */
    @Selector() static getCurrentApp(state: NavigatorStateModel) {
        return state.currentApp;
    }

    /** Action */

    @Action(ChangeNavigatorApp)
    changeNavigatorApp(ctx: StateContext<NavigatorStateModel>, { app }: ChangeNavigatorApp) {
        const state = ctx.getState();
        ctx.patchState({...state, currentApp: app });
    }

}

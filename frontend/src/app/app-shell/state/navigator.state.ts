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
    sideNav: {
        opened: boolean;
    };
}

/** Action Definitions */

export class ChangeNavigatorApp {
    static readonly type = '[Navigator] Change Navigator App';
    constructor(public app: string) {}
}

export class UpdateNavigatorSideNav {
    static readonly type = '[Navigator] Update Navigator SideNav Options';
    constructor(public payload: any) {}
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
        sideNav: {
            opened: false
        }
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

    /** Selectors */
    @Selector() static getNavigatorSideNav(state: NavigatorStateModel) {
        return state.sideNav;
    }

    /** Action */

    @Action(ChangeNavigatorApp)
    changeNavigatorApp(ctx: StateContext<NavigatorStateModel>, { app }: ChangeNavigatorApp) {
        const state = ctx.getState();
        ctx.patchState({...state, currentApp: app });
    }

    @Action(UpdateNavigatorSideNav)
    updateNavigatorSide(ctx: StateContext<NavigatorStateModel>, {payload}: UpdateNavigatorSideNav) {
        const state = ctx.getState();
        const sideNavOpened = payload.mode === 'side' && payload.activeNav !== '';
        ctx.patchState({...state, sideNav: { opened: sideNavOpened }});
    }

}

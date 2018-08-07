import  { State, Action, StateContext, Selector } from '@ngxs/store';
export interface DBSettingsModel {
    title: string;
    mode: string;
}

export class UpdateMode {
    public static type = '[Dashboard] Update Mode';
    constructor(public readonly mode: string) {}
}

@State<DBSettingsModel>({
    name: 'Settings',
    defaults: {
        title: 'untitle-default dashboard',
        mode: 'dashboard'
    }
})

export class DBSettingsState {

    @Selector() static GetDashboardMode(state: DBSettingsModel) {
        return state.mode;
    }

    @Action(UpdateMode)
    updateMode(ctx: StateContext<DBSettingsModel>, { mode }: UpdateMode) {
        const state = ctx.getState();
        ctx.patchState({...state, mode: mode});
    }

}
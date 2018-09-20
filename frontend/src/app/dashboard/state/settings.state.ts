import  { State, Action, StateContext, Selector } from '@ngxs/store';
export interface DBSettingsModel {
    title: string;
    mode: string;
    time: {
        start: string;
        end: string;
    };
}

export class UpdateMode {
    public static type = '[Dashboard] Update Mode';
    constructor(public readonly mode: string) {}
}

export class UpdateDashboardTime {
    public static type = '[Dashboard] Update DashboardTime';
    constructor(public readonly time: any) {}
}

export class LoadDashboardSettings {
    public static type = '[Dashboard] Load Dashboard Settings';
    constructor(public readonly settings: any) {}
}

@State<DBSettingsModel>({
    name: 'Settings',
    defaults: {
        title: 'untitle-default dashboard',
        mode: 'dashboard',
        time: {
            start: '',
            end: ''
        }
    }
})

export class DBSettingsState {

    @Selector() static GetDashboardMode(state: DBSettingsModel) {
        return state.mode;
    }

    @Selector() static getDashboardTime(state: DBSettingsModel) {
        return state.time;
    }

    @Action(UpdateMode)
    updateMode(ctx: StateContext<DBSettingsModel>, { mode }: UpdateMode) {
        const state = ctx.getState();
        ctx.patchState({...state, mode: mode});
    }

    @Action(UpdateDashboardTime)
    updateDashboardTime(ctx: StateContext<DBSettingsModel>, { time }: UpdateDashboardTime) {
        const state = ctx.getState();
        ctx.patchState({...state, time: time});
    }

    @Action(LoadDashboardSettings)
    loadDashboardSettings(ctx: StateContext<DBSettingsModel>, { settings }: LoadDashboardSettings) {
        const state = ctx.getState();
        ctx.setState(settings);
    }
}
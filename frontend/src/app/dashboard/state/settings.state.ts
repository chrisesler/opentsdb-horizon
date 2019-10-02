import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { DashboardService } from '../services/dashboard.service';
import { DateUtilsService } from '../../core/services/dateutils.service';
import * as deepEqual from 'fast-deep-equal';

export interface DBSettingsModel {
    mode: string;
    time: {
        start: string;
        end: string;
        zone: string;
    };
    initialZoomTime: {
        start: string;
        end: string;
        zone: string;
    };
    refresh: {
        auto: number;
        duration: number;
    };
    meta: {
        title: string;
        description: string;
        labels: Array<any>; // [{label: ''}]
    };
    tplVariables: Array<object>;
}

const defaultInitialZoomTime = {start: '', end: '', zone: ''};

export class UpdateMode {
    public static type = '[Dashboard] Update Mode';
    constructor(public readonly mode: string) {}
}

export class UpdateDashboardTime {
    public static type = '[Dashboard] Update DashboardTime';
    constructor(public readonly time: any) {}
}

export class UpdateDashboardTimeOnZoom {
    public static type = '[Dashboard] Update Dashboard Zoom Time';
    constructor(public readonly zoomTime: any) {}
}

export class UpdateDashboardTimeZone {
    public static type = '[Dashboard] Update Dashboard Timezone';
    constructor(public readonly zone: string) {}
}

export class UpdateDashboardAutoRefresh {
    public static type = '[Dashboard] Set Auto Refresh';
    constructor(public readonly refresh: any) {}
}

export class LoadDashboardSettings {
    public static type = '[Dashboard] Load Dashboard Settings';
    constructor(public readonly settings: any) {}
}

export class UpdateDashboardTitle {
    public static type = '[Dashboard] Update Title';
    constructor(public readonly title: string) {}
}

export class UpdateVariables {
    public static type = '[Dashboard] Update Variables';
    constructor(public readonly variables: any) {}
}

export class UpdateMeta {
    public static type = '[Dashboard] Update Meta';
    constructor(public readonly meta: any) {}
}

@State<DBSettingsModel>({
    name: 'Settings',
    defaults: {
        mode: 'dashboard',
        time: {
            start: '1h',
            end: 'now',
            zone: 'local'
        },
        initialZoomTime: defaultInitialZoomTime,
        refresh: {
            auto: 0,
            duration: 0
        },
        meta: {
            title: '',
            description: '',
            labels: []
        },
        tplVariables: []
    }
})

export class DBSettingsState {
    constructor( private httpService: HttpService, private dbService: DashboardService, private dateUtilsService: DateUtilsService ) {}

    @Selector() static getDashboardSettings(state: DBSettingsModel ) {
        return state;
    }

    @Selector() static GetDashboardMode(state: DBSettingsModel) {
        return state.mode;
    }

    @Selector() static getDashboardTime(state: DBSettingsModel) {
        return state.time;
    }

    @Selector() static getDashboardAutoRefresh(state: DBSettingsModel) {
        return state.refresh;
    }

    @Selector() static getMeta(state: DBSettingsModel) {
        return state.meta;
    }

    @Selector() static getTplVariables(state: DBSettingsModel) {
        return state.tplVariables;
    }

    @Selector() static getInitialZoomTime(state: DBSettingsModel) {
        return state.initialZoomTime;
    }

    @Action(UpdateMode)
    updateMode(ctx: StateContext<DBSettingsModel>, { mode }: UpdateMode) {
        const state = ctx.getState();
        ctx.patchState({...state, mode: mode});
    }

    @Action(UpdateDashboardTime)
    updateDashboardTime(ctx: StateContext<DBSettingsModel>, { time }: UpdateDashboardTime) {
        const state = ctx.getState();
        time.zone = state.time.zone;
        if (deepEqual(time, state.initialZoomTime)) {
            ctx.patchState({...state, time: time, initialZoomTime: defaultInitialZoomTime });
        } else {
            ctx.patchState({time: time});
        }
        // console.log('** SETTING DASHBOARD TIME', ctx.getState());
    }

    @Action(UpdateDashboardTimeZone)
    updateDashboardTimeZone(ctx: StateContext<DBSettingsModel>, { zone }: UpdateDashboardTimeZone) {
        const state = ctx.getState();
        const time = {...state.time};
        const startUnix = this.dateUtilsService.timeToMoment(time.start, time.zone).unix();
        const endUnix = this.dateUtilsService.timeToMoment(time.end, time.zone).unix();
        time.zone = zone;

        // if not relative time, use timestamps to generate full time
        if (!this.dateUtilsService.relativeTimeToMoment(time.start) && time.start.toLowerCase() !== 'now') {
            time.start = this.dateUtilsService.timestampToTime(startUnix.toString(), time.zone);
        }
        if (!this.dateUtilsService.relativeTimeToMoment(time.end) && time.end.toLowerCase() !== 'now') {
            time.end = this.dateUtilsService.timestampToTime(endUnix.toString(), time.zone);
        }
        ctx.patchState({...state, time: time });
        // console.log('** SETTING DASHBOARD TIME ZONE', ctx.getState());
    }

    @Action(UpdateDashboardTimeOnZoom)
    updateDashboardTimeOnZoom(ctx: StateContext<DBSettingsModel>, { zoomTime }: UpdateDashboardTimeOnZoom) {
        const state = ctx.getState();
        let t;
        let zTime;

        if (!state.initialZoomTime || state.initialZoomTime.start === '') {
            zTime = {...state.time};
        } else {
            zTime = {...state.initialZoomTime};
        }

        t = {...zoomTime};
        t.zone = state.time.zone;
        ctx.setState({...state, time: {...t}, initialZoomTime: {...zTime} });
        // console.log('** SETTING DASHBOARD TIME ON ZOOM', ctx.getState());
    }

    @Action(UpdateDashboardAutoRefresh)
    UpdateDashboardAutoRefresh(ctx: StateContext<DBSettingsModel>, { refresh }: UpdateDashboardAutoRefresh) {
        ctx.patchState({refresh: refresh});
    }

    @Action(UpdateDashboardTitle)
    updateDashboardTitle(ctx: StateContext<DBSettingsModel>, { title }: UpdateDashboardTitle) {
        const state = ctx.getState();
        const meta = {...state.meta};
        meta.title = title;
        ctx.patchState({...state, meta: meta});
    }

    @Action(UpdateVariables)
    updateVariables(ctx: StateContext<DBSettingsModel>, { variables }: UpdateVariables) {
        const state = ctx.getState();
        ctx.patchState({...state, tplVariables: [...variables]});
    }

    @Action(UpdateMeta)
    updateMeta(ctx: StateContext<DBSettingsModel>, { meta }: UpdateMeta) {
        const state = ctx.getState();
        ctx.patchState({...state, meta: meta});
    }
    @Action(LoadDashboardSettings)
    loadDashboardSettings(ctx: StateContext<DBSettingsModel>, { settings }: LoadDashboardSettings) {
        // just load the settings, not as new object
        // to avoid other settings listeners to fire off.
        ctx.setState(settings);
    }
}

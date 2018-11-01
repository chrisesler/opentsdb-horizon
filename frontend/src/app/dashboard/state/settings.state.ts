import { State, Action, StateContext, Selector } from '@ngxs/store';
import { HttpService } from '../../core/http/http.service';
import { DashboardService } from '../services/dashboard.service';
import { map, catchError } from 'rxjs/operators';

export interface DBSettingsModel {
    mode: string;
    time: {
        start: string;
        end: string;
        zone: string;
    };
    tags: Array<string>;
    lastQueriedTagValues: Array<string>;
    meta: {
        title: string;
        description: string;
        labels: Array<any>; // [{label: ''}]
        namespace: string;
        isPersonal: boolean;
    };
    variables: {
        enabled: boolean, // if all variables are enabled
        tplVariables: Array<object>; // [{ tagk: '', alias: '', allowedValues: [], filter: [], enabled: true, type: ''}]
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

export class UpdateDashboardTimeZone {
    public static type = '[Dashboard] Update Dashboard Timezone';
    constructor(public readonly zone: string) {}
}

export class LoadDashboardSettings {
    public static type = '[Dashboard] Load Dashboard Settings';
    constructor(public readonly settings: any) {}
}

export class LoadDashboardTags {
    public static type = '[Dashboard] Load Dashboard Tags';
    constructor(public readonly metrics: any) {}
}

export class LoadDashboardTagValues {
    public static type = '[Dashboard] Load Dashboard Tag Values';
    constructor(public readonly metrics: any, public readonly tag: any, public readonly filters: any ) {}
}

export class UpdateDashboardTags {
    public static type = '[Dashboard] Update Dashboard Tags';
    constructor(public readonly tags: any) {}
}

export class UpdateDashboardTagValues {
    public static type = '[Dashboard] Update Dashboard Tag Values';
    constructor(public readonly tagValues: any) {}
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
        tags: [],
        lastQueriedTagValues: [],
        meta: {
            title: 'Untitled Dashboard',
            description: '',
            labels: [],
            namespace: '',
            isPersonal: false,
        },
        variables: {
            enabled: false,
            tplVariables: []
        }
    }
})

export class DBSettingsState {
    constructor( private httpService: HttpService, private dbService: DashboardService ) {}

    @Selector() static GetDashboardMode(state: DBSettingsModel) {
        return state.mode;
    }

    @Selector() static getDashboardTime(state: DBSettingsModel) {
        return state.time;
    }

    @Selector() static getMeta(state: DBSettingsModel) {
        return state.meta;
    }

    @Selector() static getVariables(state: DBSettingsModel) {
        return state.variables;
    }

    @Selector() static getDashboardTags(state: DBSettingsModel) {
        return state.tags;
    }

    @Selector() static getDashboardTagValues(state: DBSettingsModel) {
        return state.lastQueriedTagValues;
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
        ctx.patchState({...state, time: time});
    }

    @Action(UpdateDashboardTimeZone)
    updateDashboardTimeZone(ctx: StateContext<DBSettingsModel>, { zone }: UpdateDashboardTimeZone) {
        const state = ctx.getState();
        const time = {...state.time};
        time.zone = zone;
        ctx.patchState({...state, time: time });
    }

    @Action(LoadDashboardTags)
    loadDashboardTags(ctx: StateContext<DBSettingsModel>, { metrics }: LoadDashboardTags) {
        const query = { metrics: metrics }; // unique metric
        return this.httpService.getTagKeys(query).pipe(
            map( (tags: any) => {
                ctx.dispatch(new UpdateDashboardTags(tags));
            })
        );
    }

    @Action(LoadDashboardTagValues)
    LoadDashboardTagValues(ctx: StateContext<DBSettingsModel>, { metrics: metrics, tag: tag, filters: filters }: LoadDashboardTagValues) {
        const query = { metrics: metrics , tag: tag, filters: filters }; // unique metric
        return this.httpService.getTagValues(query).pipe(
            map( (values: any) => {
                ctx.dispatch(new UpdateDashboardTagValues(values));
            })
        );
    }

    @Action(UpdateDashboardTags)
    updateDashboardTags(ctx: StateContext<DBSettingsModel>, { tags }: UpdateDashboardTags) {
        const state = ctx.getState();
        ctx.patchState({...state, tags: tags });
    }

    @Action(UpdateDashboardTagValues)
    updateDashboardTagValues(ctx: StateContext<DBSettingsModel>, { tagValues }: UpdateDashboardTagValues) {
        const state = ctx.getState();
        ctx.patchState({...state, lastQueriedTagValues: tagValues });
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
        ctx.patchState({...state, variables: variables});
    }

    @Action(UpdateMeta)
    updateMeta(ctx: StateContext<DBSettingsModel>, { meta }: UpdateMeta) {
        const state = ctx.getState();
        ctx.patchState({...state, meta: meta});
    }

    @Action(LoadDashboardSettings)
    loadDashboardSettings(ctx: StateContext<DBSettingsModel>, { settings }: LoadDashboardSettings) {
        const state = ctx.getState();
        ctx.setState(settings);
    }
}

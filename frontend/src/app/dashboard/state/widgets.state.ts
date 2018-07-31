import { State, StateContext, Action, Selector } from '@ngxs/store';
import { WidgetsConfigState } from './widgets-config.state';
import { WidgetsRawdataState } from './widgets-data.state';

export interface WidgetModel {
    id: string;
    settings: {
        title: string;
        component_type: string;
        data_source?: string;
    };
    gridPos: {
        x: number;
        y: number;
        w: number;
        h: number;
        xMd?: number;
        yMd?: number;
    };
    query: {
        start: string;
        end?: string;
        downsample: string;
        groups: any[];
    }
}

// actions
export class LoadWidgets {
    public static type = '[Widget] Load Widgets';
    constructor(public readonly payload: WidgetModel[]) {}
}

export class UpdateGridPos {
    public static type = '[Widget] Update GridPos';
    constructor(public readonly gridpos: any) {}
}

@State<WidgetModel[]>({
    name: 'Widgets',
    defaults: []
})

export class WidgetsState {

    @Selector() static getWigets(state: WidgetModel[]) {
        return [...state];
    }

    @Action(LoadWidgets)
    loadWidgets(ctx: StateContext<WidgetModel[]>, { payload }: LoadWidgets) {
        ctx.setState(payload);
    }

    @Action(UpdateGridPos)
    updateGridPos(ctx: StateContext<WidgetModel[]>, { gridpos }: UpdateGridPos) {
        const state = ctx.getState();
        for (let i = 0; i < state.length; i++) {
            state[i].gridPos = {...state[i].gridPos, ...gridpos[state[i].id]}
        }
        ctx.setState(state);
    }
}

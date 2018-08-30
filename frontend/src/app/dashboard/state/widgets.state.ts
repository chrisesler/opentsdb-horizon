import { State, StateContext, Action, Selector } from '@ngxs/store';
import { WidgetsConfigState } from './widgets-config.state';
import { WidgetsRawdataState } from './widgets-data.state';

// we might need to define data model for each group and inner metric obj
// to put strict on object

export interface Axis {
    type: string;
    min: number;
    max: number;
    label: string;
    unit: string;
    scale: string;
    decimals: number;
}

export interface ThresholdConfig {
    value: number;
    lineColor: string;
    lineWeight: string;
    linePattern: string;
}

export interface StackConfig {
    label: string;
    color: string;
}

export interface WidgetModel {
    id: string;
    settings: {
        title: string;
        component_type: string;
        data_source?: string;
        description?: string;
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
        settings?: {
            time?: {};
            visualization?: {
                direction?: string;
                stacks?: StackConfig[];
            };
            axes?: {
                x?: Axis;
                y1?: Axis;
                y2?: Axis;
            };
            thresholds?: ThresholdConfig[];
        };
    };
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

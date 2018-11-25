import { State, StateContext, Action, Selector, createSelector } from '@ngxs/store';
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
    enabled: boolean;
}

export interface ThresholdConfig {
    value: number;
    lineColor: string;
    lineWeight: string;
    linePattern: string;
}

export interface StackConfig {
    id: string;
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
        time?: {};
            visual?: {
                type?: string;
                stacks?: StackConfig[];
                [x: string]: any;
            };
            axes?: {
                x?: Axis;
                y1?: Axis;
                y2?: Axis;
            };
            legend?: {
                display: boolean;
                position: string;
            };
            thresholds?: ThresholdConfig[];
    };
    gridPos: {
        x: number;
        y: number;
        w: number;
        h: number;
        xMd?: number;
        yMd?: number;
    };
    queries: any[];
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

export class UpdateWidget {
    public static type = '[Widget] Update Widget';
    constructor(public readonly widget: any) {}
}

export class DeleteWidget {
    public static type = '[Widget] Delete Widget';
    constructor(public readonly wid: string) {}
}

@State<WidgetModel[]>({
    name: 'Widgets',
    defaults: []
})

export class WidgetsState {

    @Selector() static getWigets(state: WidgetModel[]) {
        return [...state];
    }

    // a dynamic selector to return a selected widget by id
    static getUpdatedWidget(wid: string) {
        return createSelector([WidgetsState], (state: WidgetModel[]) => {
            return state.filter(w => w.id === wid);
        });
    }

    // update statte with the loading dashboard
    @Action(LoadWidgets)
    loadWidgets(ctx: StateContext<WidgetModel[]>, { payload }: LoadWidgets) {
        ctx.setState(payload);
    }

    @Action(UpdateGridPos)
    updateGridPos(ctx: StateContext<WidgetModel[]>, { gridpos }: UpdateGridPos) {
        const state = ctx.getState();
        for (let i = 0; i < state.length; i++) {
            state[i].gridPos = {...state[i].gridPos, ...gridpos[state[i].id]};
        }
        ctx.setState(state);
    }

    // updating a widget config after editing it
    @Action(UpdateWidget)
    updateWidget(ctx: StateContext<WidgetModel[]>, { widget }: UpdateWidget) {
        const state = ctx.getState();
        for (let i = 0; i < state.length; i++) {
            if (state[i].id === widget.id) {
                state[i] = widget;
                break;
            }
        }
        ctx.setState([...state]);
    }

    @Action(DeleteWidget)
    deleteWidget(ctx: StateContext<WidgetModel[]>, { wid }: DeleteWidget) {
        const state = ctx.getState();
        const index = state.findIndex( d => d.id === wid );
        if ( index !== -1 ) {
            state.splice(index, 1);
            ctx.setState([...state]);
        }
    }
}

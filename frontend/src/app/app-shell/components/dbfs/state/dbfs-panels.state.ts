import { State, StateContext, Action, Store, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { map, tap, catchError, reduce } from 'rxjs/operators';
import { DbfsUtilsService } from '../services/dbfs-utils.service';

import { DbfsResourcesState, DbfsResourcesModel } from './dbfs-resources.state';

/** INTERFACES */

export interface DbfsPanelModel {
    index: number; // not sure if needed
    folderResource: string; // key to look up folder in resources
    root?: boolean;
    synthetic?: boolean;
    dynamic?: boolean;
    trashFolder?: true;
    // items needed for miniNav
    moveEnabled?: boolean;
    selectEnabled?: boolean;
    locked?: boolean;
}

export interface DbfsPanelsModel {
    panels: DbfsPanelModel[]; // panels for primary list
    curPanel: number; // current panel index
    miniPanels: DbfsPanelModel[]; // panels for mini navigator
    curMiniPanel: number; // current mini panel index
    panelAction: {};
    initialized: boolean;
}

/** ACTIONS */

export class DbfsPanelsInitialize {
    static readonly type = '[DBFS Panels] Initialize Panels';
    constructor() {}
}

export class DbfsAddPanel {
    static readonly type = '[DBFS Panels] Add Panel';
    constructor(public readonly payload: any) {}
}

export class DbfsUpdatePanels {
    static readonly type = '[DBFS Panels] update panels';
    constructor(public readonly payload: any) {}
}

export class DbfsResetPanelAction {
    static readonly type = '[DBFS Panels] reset panel action';
    constructor() {}
}

/** STATE */
@State<DbfsPanelsModel>({
    name: 'Panels',
    defaults: {
        panels: [],
        curPanel: 0,
        miniPanels: [],
        curMiniPanel: 0,
        panelAction: {},
        initialized: false
    }
})

export class DbfsPanelsState {
    constructor(
        private utils: UtilsService,
        private dbfsUtils: DbfsUtilsService,
        private logger: LoggerService,
        private store: Store,
    ) {}

    /** Selectors */

    @Selector() static getPanels(state: DbfsPanelsModel) {
        return state.panels;
    }

    @Selector() static getCurPanel(state: DbfsPanelsModel) {
        return state.curPanel;
    }

    @Selector() static getMiniPanels(state: DbfsPanelsModel) {
        return state.miniPanels;
    }

    @Selector() static getCurMiniPanel(state: DbfsPanelsModel) {
        return state.curMiniPanel;
    }

    @Selector() static getPanelAction(state: DbfsPanelsModel) {
        return state.panelAction;
    }

    /*&static getPanelResources(path: string) {
        return createSelector([DbfsResourcesState], (state: DbfsResourcesModel) => {
            let panel = JSON.parse(JSON.stringify(state.folders[path]));
            if (panel.personal) {
                panel.personal = panel.personal.map(spath => JSON.parse(JSON.))
            }
            Store.
            return panel;
        });
    }*/

    /** Actions */

    @Action(DbfsResetPanelAction)
    resetPanelAction(ctx: StateContext<DbfsPanelsModel>, { }: DbfsResetPanelAction) {
        this.logger.action('State :: Reset Resource Action');
        ctx.patchState({
            panelAction: {}
        });
    }

    @Action(DbfsPanelsInitialize)
    panelsInitialize(ctx: StateContext<DbfsPanelsModel>, {}: DbfsPanelsInitialize) {
        this.logger.success('State :: Panels Initialize');
        const state = ctx.getState();

        ctx.setState({...state,
            panels: [
                {
                    index: 0,
                    folderResource: ':panel-root:',
                    root: true,
                    synthetic: true,
                    locked: true
                }
            ],
            miniPanels: [
                {
                    index: 0,
                    folderResource: ':mini-root:',
                    root: true,
                    synthetic: true,
                    moveEnabled: false,
                    selectEnabled: false,
                    locked: true
                }
            ],
            initialized: true
        });
    }

    @Action(DbfsAddPanel)
    dbfsAddPanel(ctx: StateContext<DbfsPanelsModel>, { payload }: DbfsAddPanel) {
        this.logger.action('State :: Add Panels', payload);
        const state = ctx.getState();
        const panels = this.utils.deepClone(state.panels);

        // check if panel with that path already exists
        // i.e. people click way too fast, too many times
        const index = panels.findIndex(p => p.folderResource === payload.panel.folderResource);
        if (index === -1) {
            const newPanel = {...payload.panel,
                index: panels.length
            };

            panels.push(newPanel);

            ctx.patchState({...state,
                panels,
                curPanel: (panels.length - 1),
                panelAction: payload.panelAction
            });
        }
    }

    @Action(DbfsUpdatePanels)
    updatePanels(ctx: StateContext<DbfsPanelsModel>, { payload }: DbfsUpdatePanels) {
        this.logger.action('State :: Update Panels', payload);
        const state = ctx.getState();
        const idx = (payload.panels.length - 1);
        ctx.patchState({...state,
            panels: payload.panels,
            curPanel: (idx < 0) ? 0 : idx,
            panelAction: (payload.panelAction) ? payload.panelAction : {}
        });
    }
}


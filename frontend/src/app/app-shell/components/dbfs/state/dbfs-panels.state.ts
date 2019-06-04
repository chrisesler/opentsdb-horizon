import { State, StateContext, Action, Store, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { map, tap, catchError, reduce } from 'rxjs/operators';
import { DbfsUtilsService } from '../services/dbfs-utils.service';

import { DbfsResourcesState } from './dbfs-resources.state';

/** INTERFACES */

export interface DbfsPanelModel {
    index: number; // not sure if needed
    folderResource: string; // key to look up folder in resources
    root?: boolean;
    synthetic?: boolean;
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

    /** Actions */

    @Action(DbfsPanelsInitialize)
    DbfsPanelsInitialize(ctx: StateContext<DbfsPanelsModel>, {}: DbfsPanelsInitialize) {
        this.logger.success('State :: Panels Initialize');
        const state = ctx.getState();

        ctx.setState({...state,
            panels: [
                {
                    index: 0,
                    folderResource: '/',
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
}


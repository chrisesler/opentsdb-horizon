import { State, StateContext, Action, Store, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { map, tap, catchError, reduce } from 'rxjs/operators';
import { DbfsUtilsService } from '../services/dbfs-utils.service';

import { DbfsResourcesState, DbfsLoadTopFolder, DbfsLoadTopFolderSuccess, DbfsLoadSubfolderSuccess, DbfsLoadSubfolder } from './dbfs-resources.state';
import { DbfsService } from '../services/dbfs.service';

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
    loaded?: boolean;
}

export interface DbfsPanelsModel {
    panels: DbfsPanelModel[]; // panels for primary list
    curPanel: number; // current panel index
    miniPanels: DbfsPanelModel[]; // panels for mini navigator
    curMiniPanel: number; // current mini panel index
    miniPanelMode: string; // mode is 'move' or 'select'
    panelAction: {};
    initialized: boolean;
}

/** ACTIONS */

export class DbfsPanelsInitialize {
    static readonly type = '[DBFS Panels] Initialize Panels';
    constructor() {}
}

export class DbfsPanelsError {
    static readonly type = '[DBFS Panels] Error happened';
    constructor(public readonly error: any) {}
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

export class DbfsAddMiniPanel {
    static readonly type = '[DBFS Panels] Add Mini Panel';
    constructor(
        public readonly path: any,
        public readonly panelAction: any
    ) {}
}

export class DbfsUpdateMiniPanels {
    static readonly type = '[DBFS Panels] update mini panels';
    constructor(public readonly payload: any) {}
}

export class DbfsOpenMiniNav {
    static readonly type = '[DBFS Panels] Open Mini Nav';
    constructor(
        public readonly path: string,
        public readonly type: string,
        public readonly mode: string
    ) {}
}

export class DbfsCloseMiniNav {
    static readonly type = '[DBFS Panels] Close Mini Nav';
    constructor(
        public readonly panelAction: any
    ) {}
}

export class DbfsRemoveMiniNavPanel {
    static readonly type = '[DBFS Panels] Remove Mini Panel';
    constructor(
        public readonly index: number,
        public readonly panelAction: any
    ) {}
}

export class DbfsMiniNavLoadPanel {
    static readonly type = '[DBFS Panels] Mini Nav Load Panel';
    constructor(
        public readonly path: string,
        public readonly panelAction: any
    ) {}
}

/** STATE */
@State<DbfsPanelsModel>({
    name: 'Panels',
    defaults: {
        panels: [],
        curPanel: 0,
        miniPanels: [],
        curMiniPanel: 0,
        miniPanelMode: '',
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
        private service: DbfsService
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

    @Selector() static getMiniPanelMode(state: DbfsPanelsModel) {
        return state.miniPanelMode;
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

    /** Utils */

    private normalizeMiniPanel(path: string, index: number): DbfsPanelModel {
        const folder = this.store.selectSnapshot<any>(DbfsResourcesState.getFolderResource(path));

        const panel = <DbfsPanelModel>{
            moveEnabled: true,
            selectEnabled: true,
            folderResource: folder.fullPath,
            loaded: folder.loaded,
            index
        };

        if (folder.synthetic) {
            panel.synthetic = folder.synthetic;
            panel.moveEnabled = false;
            panel.selectEnabled = false;
        }

        if (folder.root) {
            panel.root = folder.root;
            panel.moveEnabled = false;
            panel.selectEnabled = false;
        }

        if (folder.trashFolder) {
            panel.trashFolder = true;
        }

        if (folder.locked) {
            panel.locked = true;
            panel.moveEnabled = false;
            panel.selectEnabled = false;
        }

        return panel;
    }

    /** Actions */

    @Action(DbfsResetPanelAction)
    resetPanelAction(ctx: StateContext<DbfsPanelsModel>, { }: DbfsResetPanelAction) {
        this.logger.action('State :: Reset Resource Action');
        ctx.patchState({
            panelAction: {}
        });
    }

    @Action(DbfsPanelsError)
    panelsError(ctx: StateContext<DbfsPanelsModel>, {error}: DbfsPanelsError) {
        this.logger.error('State :: Panels Error', error);
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
    addPanel(ctx: StateContext<DbfsPanelsModel>, { payload }: DbfsAddPanel) {
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

            ctx.patchState({
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
        ctx.patchState({
            panels: payload.panels,
            curPanel: (idx < 0) ? 0 : idx,
            panelAction: (payload.panelAction) ? payload.panelAction : {}
        });
    }

    @Action(DbfsOpenMiniNav)
    openMiniNav(ctx: StateContext<DbfsPanelsModel>, { path, type, mode }: DbfsOpenMiniNav) {
        this.logger.action('State :: Open Mini Nav', { path, type, mode});

        const state = ctx.getState();
        let miniPanels = JSON.parse(JSON.stringify(state.miniPanels));

        const pathParts = path.split('/');
        const pathDetails = this.dbfsUtils.detailsByFullPath(path);
        console.log ('details', pathDetails);

        // check length. Since we are opening. there should only be one panel
        if (miniPanels.length > 1) {
            miniPanels = miniPanels.slice(0, 1);
        }

        if (mode === 'move') {
            pathParts.pop();
        }

        const pathPrefix = pathParts.splice(0, 3).join('/');

        if (pathDetails.type === 'namespace') {
            // add member namespaces as second panel
            const mbrNamespaces = this.normalizeMiniPanel(':member-namespaces:', miniPanels.length);
            miniPanels.push(mbrNamespaces);
        }

        const topFolder = this.normalizeMiniPanel(pathPrefix, miniPanels.length);
        miniPanels.push(topFolder);

        if (pathParts.length > 0) {
            for (const part of pathParts) {
                const folder = this.normalizeMiniPanel(pathPrefix + '/' + part, miniPanels.length);
                miniPanels.push(folder);
            }
        }

        ctx.patchState({...state,
            miniPanels,
            curMiniPanel: miniPanels.length - 1,
            panelAction: {
                method: 'mnavOpenComplete'
            }
        });

    }

    @Action(DbfsCloseMiniNav)
    closeMiniNav(ctx: StateContext<DbfsPanelsModel>, { panelAction}: DbfsCloseMiniNav) {
        this.logger.action('State :: Close Mini Panel', {panelAction});
        const state = ctx.getState();
        let miniPanels = JSON.parse(JSON.stringify(state.miniPanels));
        miniPanels = miniPanels.splice(0, 1);
        const curMiniPanel = 0;
        ctx.patchState({
            miniPanels,
            curMiniPanel,
            miniPanelMode: ''
        });
    }

    @Action(DbfsAddMiniPanel)
    addMiniPanel(ctx: StateContext<DbfsPanelsModel>, { path, panelAction }: DbfsAddMiniPanel) {
        this.logger.action('State :: Add Mini Panel', {path, panelAction});

        const state = ctx.getState();
        const miniPanels = JSON.parse(JSON.stringify(state.miniPanels));

        const panel = this.normalizeMiniPanel(path, miniPanels.length);

        miniPanels.push(panel);

        ctx.patchState({
            miniPanels,
            curMiniPanel: miniPanels.length - 1,
            panelAction
        });

    }

    @Action(DbfsUpdateMiniPanels)
    updateMiniPanels(ctx: StateContext<DbfsPanelsModel>, { payload }: DbfsUpdateMiniPanels) {
        this.logger.action('State :: Update Mini Panels', payload);

        const state = ctx.getState();
        const idx = (payload.panels.length - 1);

        ctx.patchState({
            miniPanels: payload.panels,
            curMiniPanel: (idx < 0) ? 0 : idx,
            panelAction: (payload.panelAction) ? payload.panelAction : {}
        });
    }

    @Action(DbfsRemoveMiniNavPanel)
    removeMiniPanel(ctx: StateContext<DbfsPanelsModel>, { index, panelAction }: DbfsRemoveMiniNavPanel) {
        this.logger.action('State :: Remove Mini Panel', {index, panelAction});

        const state = ctx.getState();
        const miniPanels = JSON.parse(JSON.stringify(state.miniPanels));

        miniPanels.splice(index, 1);

        ctx.patchState({
            miniPanels,
            curMiniPanel: miniPanels.length - 1,
            panelAction
        });

    }

    @Action(DbfsMiniNavLoadPanel)
    miniNavLoadPanel(ctx: StateContext<DbfsPanelsModel>, { path, panelAction }: DbfsMiniNavLoadPanel) {
        this.logger.action('State :: Mini Nav Load Panel', {path, panelAction});

        const folder = this.store.selectSnapshot<any>(DbfsResourcesState.getFolderResource(path));
        const state = ctx.getState();

        if (!folder.loaded && !folder.synthetic) {
            console.log('NOT LOADEDED', path, panelAction);
            /*this.store.dispatch(
                new DbfsLoadSubfolder(path)
            );*/
        }
        ctx.dispatch(
            new DbfsAddMiniPanel(path, panelAction)
        );
    }
}


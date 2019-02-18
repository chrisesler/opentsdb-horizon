import {
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';

import { Observable, Subscription } from 'rxjs';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';

import { NavigatorPanelComponent } from '../navigator-panel/navigator-panel.component';

import {
    DashboardNavigatorState,
    DBNAVloadNavResources,
    MiniNavOpenNavigator,
    MiniNavCloseNavigator,
    MiniNavCreateFolder,
    // MiniNavMoveFolder,
    MiniNavLoadPanel,
    MiniNavRemovePanel,
    MiniNavMarkFolderSelected,
    MiniNavResetFolderSelected
} from '../../state';

import {
    Select,
    Store
} from '@ngxs/store';

// ?? this is generally useful... maybe put it in a shared util?
class MiniNavGuid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            // tslint:disable-next-line:no-bitwise
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
            return v.toString(16);
        });
    }
}

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'mini-navigator',
    templateUrl: './mini-navigator.component.html',
    styleUrls: []
})
export class MiniNavigatorComponent implements OnInit, OnDestroy {

    @HostBinding('class.mini-navigator-component') private _hostClass = true;

    // tslint:disable-next-line:no-inferrable-types
    @Input() mode: string = 'move'; // options: move, select
    // tslint:disable-next-line:no-inferrable-types
    @Input() path: string = '';
    // tslint:disable-next-line:no-inferrable-types
    @Input() type: string = 'folder'; // 'folder' or 'dashboard'

    @Output() directorySelected: any = new EventEmitter<any>();
    @Output() navigationCancel: any = new EventEmitter<any>();

    private _menuOpen = false;
    @Input()
    set menuOpen(value: boolean) {
        // this._menuOpen = value;
        if (!this._menuOpen && value === true) {
            this._subscribeStates();
            this.store.dispatch(new MiniNavOpenNavigator(this.path, this.type, this.mode));
            this._menuOpen = value;
        }
        if (this._menuOpen && value === false ) {
            this._unsubscribeStates();
            this.store.dispatch(new MiniNavCloseNavigator());
            this._menuOpen = false;
        }
    }

    get menuOpen(): boolean {
        return this._menuOpen;
    }

    get currentPanelName(): string {
        if (this.panelIndex > 0) {
            return this.panels[this.panelIndex].name;
        } else {
            return 'Dashboards';
        }
    }

    get moveEnabled(): boolean {
        /*return this.mode === 'move'
                && this.panels[this.panelIndex].moveEnabled
                && this.panelIndex === this.selected.panel;*/

        if (this.mode === 'move') {
            if (!this.panels[this.panelIndex].moveEnabled) {
                if (this.selected && this.selected.folder.moveEnabled) {
                    return true;
                }
            }
            return this.panels[this.panelIndex].moveEnabled;
        }
        return false;
    }

    get selectEnabled(): boolean {
        /*return this.mode === 'select'
                && this.panels[this.panelIndex].selectEnabled
                && this.panelIndex === this.selected.panel;*/
        if (this.mode === 'select') {
            if (!this.panels[this.panelIndex].selectEnabled) {
                if (this.selected && this.selected.folder.selectEnabled) {
                    return true;
                }
            }
            return this.panels[this.panelIndex].selectEnabled;
        }
        return false;
    }

    // VIEW CHILDREN
    // @ViewChild(MiniNavigatorPanelComponent) private navPanel: MiniNavigatorPanelComponent;
    @ViewChild(NavigatorPanelComponent) private navPanel: NavigatorPanelComponent;

    stateSubs: any = {};

    // STORE
    @Select(DashboardNavigatorState.getMiniNavigator) miniNav$: Observable<any>;
    // mini nav panels
    panels: any[] = [{}];

    // mini nav panel index
    // tslint:disable-next-line:no-inferrable-types
    panelIndex: number = 0; // 0 = top level
    moveTargetPath: any = false;

    @Select(DashboardNavigatorState.getDBNAVLoaded) navResourcesLoaded$: Observable<boolean>;
    // tslint:disable-next-line:no-inferrable-types
    navResourcesLoaded: boolean = false;

    @Select(DashboardNavigatorState.getDBNavPanelAction) panelAction$: Observable<any>;

    selected: any = {};

    private _guid: any = false;
    get guid(): any {
        if (!this._guid) {
            this._guid = MiniNavGuid.newGuid();
        }
        return this._guid;
    }

    constructor(
        private store: Store,
        private interCom: IntercomService
    ) { }

    ngOnInit() {}

    ngOnDestroy() {
        this._unsubscribeStates();
    }

    private _subscribeStates() {
        const self = this;
        this.stateSubs['navResourcesLoaded'] = this.navResourcesLoaded$.subscribe(status => {
            self.navResourcesLoaded = status;
            if (!self.navResourcesLoaded) {
                // console.log('NAV RESOURCES NOT LOADED ... Loading');
                self.store.dispatch(new DBNAVloadNavResources());
            }
        });

        this.stateSubs['miniNav'] = this.miniNav$.subscribe(data => {
            // console.log('MINI NAV CHANGE', data);
            this.panels = data.panels;
            this.panelIndex = data.panelIndex;
            this.selected = data.selected;
            if (this.mode === 'move') {
                this.moveTargetPath = data.moveTargetPath;
            }
        });

        this.stateSubs['panelActions'] = this.panelAction$.subscribe(action => {
            if (action.guid === this.guid) {
                switch (action.method) {
                    case 'loadPanelComplete':
                        // console.log('LOAD PANEL COMPLETE', action);
                        setTimeout(function() {
                            self.navPanel.goNext();
                        }, 200);
                        break;
                    case 'removePanelComplete':
                        // console.log('LOAD PANEL COMPLETE', action);
                        setTimeout(function() {
                            self.navPanel.goBack();
                        }, 200);
                        break;
                    default:
                        break;
                }
            }
        });



    }

    private _unsubscribeStates() {
        if (this.stateSubs['navResourcesLoaded']) {
            this.stateSubs['navResourcesLoaded'].unsubscribe();
        }
        if (this.stateSubs['miniNav']) {
            this.stateSubs['miniNav'].unsubscribe();
        }
        if (this.stateSubs['panelActions']) {
            this.stateSubs['panelActions'].unsubscribe();
        }
    }

    navigatorAction(type: string) {
        // console.log('NAVIGATOR ACTION', type);
        switch (type) {
            case 'move':
                this.directorySelected.emit({
                    action: 'move',
                    payload: (this.selected.folder) ? this.selected.folder : this.panels[this.panelIndex]
                });
                break;
            case 'select':
                this.directorySelected.emit({
                    action: 'select',
                    payload: (this.selected.folder) ? this.selected.folder : this.panels[this.panelIndex]
                });
                break;
            case 'cancel':
                this.navigationCancel.emit({
                    action: 'cancel'
                });
                break;
            default:
                break;
        }
    }

    folderAction(panel: any, event: any) {
        // console.log('FOLDER ACTION [TOP]', panel, event);

        switch (event.action) {
            case 'gotoFolder':
                this.store.dispatch(new MiniNavLoadPanel(event.payload.path, this.mode, this.guid));
                break;
            case 'selectFolder':
                if ((this.mode === 'move' && !event.payload.moveEnabled || (this.mode === 'select' && !event.payload.selectEnabled))) {
                    // can't select the folder, so just load it as a panel
                    // example is if they are viewing path '/namespace'
                    this.store.dispatch(new MiniNavLoadPanel(event.payload.path, this.mode, this.guid));
                } else if (event.payload.selected) {
                    // its already selected, act like a double-click and load the panel
                    this.store.dispatch(new MiniNavLoadPanel(event.payload.path, this.mode, this.guid));
                    // this.store.dispatch(new MiniNavResetFolderSelected());
                } else {
                    const panelIndex = this.panels.indexOf(panel);
                    this.store.dispatch(new MiniNavMarkFolderSelected(panelIndex, event.payload));
                }
                break;
            default:
                break;
        }
    }

    goUpDirectory() {
        if (this.panelIndex > 0) {
            this.store.dispatch(new MiniNavRemovePanel(this.panelIndex, this.guid));
        }
    }

}

import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Inject,
    OnInit,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { NavigatorPanelComponent } from '../navigator-panel/navigator-panel.component';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';

import {
    DashboardNavigatorState,
    DBNAVloadNavResources,
    DBNAVaddPanel,
    DBNAVupdatePanels,
    DBNAVcreateFolder,
    DBNAVupdateFolder,
    DBNAVmoveFolder,
    DBNAVcreateFile,
    DBNAVmoveFile,
    DBNAVupdateFile
} from '../../state';

import {
    Select,
    Store,
    StateContext
} from '@ngxs/store';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-navigator',
    templateUrl: './dashboard-navigator.component.html',
    styleUrls: []
})
export class DashboardNavigatorComponent implements OnInit, OnDestroy {

    @HostBinding('class.dashboard-navigator') private _hostClass = true;

    // STATE
    private stateSubs = {};

    @Select(DashboardNavigatorState.getDBNavStatus) navStatus$: Observable<string>;
    // tslint:disable-next-line:no-inferrable-types
    navStatus: string = '';

    @Select(DashboardNavigatorState.getDBNavPanelAction) navAction$: Observable<any>;

    @Select(DashboardNavigatorState.getDBNavPanels) panels$: Observable<any[]>;
    panels: any[] = [];

    @Select(DashboardNavigatorState.getDBNavCurrentPanelIndex) currentPanelIndex$: Observable<number>;
    // tslint:disable-next-line:no-inferrable-types
    currentPanelIndex: number = 0;

    // VIEW CHILDREN
    @ViewChild(NavigatorPanelComponent) private navPanel: NavigatorPanelComponent;

    // tslint:disable-next-line:no-inferrable-types
    @Input() activeNavSection: string = '';
    @Input() drawerMode: any = 'over';

    @Output() toggleDrawer: EventEmitter<any> = new EventEmitter();

    intercomSub: Subscription;

    // tslint:disable-next-line:no-inferrable-types
    @Input() activeMediaQuery: string = '';

    constructor(
        private store: Store,
        private interCom: IntercomService,
        private router: Router,
        @Inject('WINDOW') private window: any
    ) { }

    ngOnInit() {

        const self = this;

        this.store.dispatch(new DBNAVloadNavResources());

        this.stateSubs['navStatus'] = this.navStatus$.subscribe( status => {
            self.navStatus = status;
        });

        this.stateSubs['panels'] = this.panels$.subscribe( data => {
            // console.log('NAVIGATION PANELS UPDATED', data);
            self.panels = data;
        });

        this.stateSubs['currentPaneIndex'] = this.currentPanelIndex$.subscribe( idx => {
            // console.log('CURRENT PANEL INDEX UPDATED', idx);
            self.currentPanelIndex = idx;
        });

        this.stateSubs['panelAction'] = this.navAction$.subscribe( action => {
            // console.log('PANEL ACTION', action);
            switch (action.method) {
                case 'goNextPanel':
                    setTimeout(function() {
                        self.navPanel.goNext();
                    }, 200);
                    break;
                default:
                    break;
            }
        });

        // Intercom Manager
        this.intercomSub = this.interCom.requestListen().subscribe((message: IMessage) => {
            switch (message.action) {
                case 'dnav_CreateFolder':

                    break;
                default:
                    break;
            }
        });

        // console.log('NAVIGATOR', this.navPanel);
    }

    ngOnDestroy() {
        const subKeys = Object.keys(this.stateSubs);
        for (const sub of subKeys) {
            this.stateSubs[sub].unsubscribe();
        }
    }

    /**
     * ACTIONS
     * from child sections -- folders and dashboards
     */
    folderAction(panel, event) {
        const self = this;

        /*console.group(
            '%cEVENT%cfolderAction [' + event.action + ']',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold; ',
            'color: blue; padding: 4px 8px; border: 1px solid blue;'
        );
        console.log('EVENT', event);
        console.log('ORIGINATING PANEL', panel);*/

        switch (event.action) {
            case 'navtoPanelFolder':

                const newPanel = this.store.dispatch(
                    new DBNAVaddPanel({
                        path: event.path,
                        fullPath: event.fullPath,
                        type: event.resourceType,
                        panelAction: 'goNextPanel'
                    })
                );

                break;
            case 'createFolder':
                /*const panelId = this.panels[this.currentPaneIndex].id;
                const namespaceId = this.currentNamespaceId;
                this.createFolder_action(event.data, panelId, namespaceId);*/
                this.store.dispatch(
                    new DBNAVcreateFolder(
                        event.data.name,
                        this.panels[this.currentPanelIndex].id,
                        this.currentPanelIndex
                    )
                );
                break;
            case 'editFolder':
                this.store.dispatch(
                    new DBNAVupdateFolder(
                        event.data.id,
                        event.data.fullPath,
                        event.data,
                        this.currentPanelIndex
                    )
                );
                break;
            case 'deleteFolder':
                // see if it is userpath, or namespace path
                // console.log('DELETE FOLDER [TOP]', panel, event);
                // const path = event.data.path.split('/');
                // const trashPath = path.slice(0, 3).join('/') + '/trash';
                this.store.dispatch(
                    new DBNAVmoveFolder(
                        {
                            source: event.data.source,
                            trashFolder: true
                        },
                        this.currentPanelIndex
                    )
                );
                break;
            case 'moveFolder':
                console.log('MOVE FOLDER EVENT', event);
                this.store.dispatch(
                    new DBNAVmoveFolder(
                        event.data,
                        this.currentPanelIndex
                    )
                );
                break;
            default:
                break;
        }
        console.groupEnd();
    }

    dashboardAction(panel, event) {
        switch (event.action) {
            case 'createDashboard':
                this.createDashboard();
                break;
            case 'openDashboardNewTab':
                this.window.open('/d' + event.data.path, '_blank');
                break;
            case 'deleteDashboard':
                // console.log('DELETE DASHBOARD[TOP]', panel, event);
                // const path = event.data.path.split('/');
                // const trashPath = path.slice(0, 3).join('/') + '/trash';
                this.store.dispatch(
                    new DBNAVmoveFile(
                        {
                            source: event.data.source,
                            trashFolder: true
                        },
                        this.currentPanelIndex
                    )
                );
                break;
            case 'moveDashboard':
                console.log('MOVE DASHBOARD [TOP]', panel, event);
                this.store.dispatch(
                    new DBNAVmoveFile(
                        event.data,
                        this.currentPanelIndex
                    )
                );
                break;
            case 'navigateTo':
                // console.log('NAVIGATE TO [TOP]', panel, event);
                if (this.activeMediaQuery === 'xs') {
                    this.toggleDrawer.emit({
                        closeNavigator: true,
                        resetForMobile: true
                    });
                }
                break;
            default:
                break;
        }
    }

    createFolder_action(data: any, parentId?: number, namespaceId?: number) {
        // create a folder in the index item
        /*console.log(
            '%cACTION%cCreate Folder',
            'color: black; background: skyblue; padding: 4px 8px; font-weight: bold;',
            'color: black; border: 1px solid skyblue; padding: 4px 8px;',
            parentId, data, this.panels[this.currentPanelIndex]
            );*/

        this.store.dispatch(
            new DBNAVcreateFolder(
                data.name,
                this.panels[this.currentPanelIndex].path,
                this.currentPanelIndex
            )
        );

    }

    editFolder_action(data: any, parentId: number) {
        // edit folder(s) in the index item
    }

    deleteFolder_action(data: any, parentId: number) {

    }

    createDashboard_action(parentId: number) {
        // create a dashboard in the indicated folder
    }

    editDashboard_action(data: any, parentId: number) {
        // edit dashboard(s) in the indicated folder
    }

    deleteDashboard_action(data: any, parentId: number) {

    }

    /** EVENTS */

    createDashboard(folderId?: number) {
        this.router.navigate(['d', '_new_']);
        this.closeDrawer();
    }

    /**
     * toggleDrawerMode
     * notifies the app-shell to trigger side drawer to lock to 'side'
     * instead of 'over'
     */
    toggleDrawerMode() {
        // console.log('TOGGLE 1');
        this.toggleDrawer.emit({
            drawerMode: 'side'
        });
    }

    closeDrawer() {
        const data: any = {
            closeNavigator: true
        };
        if (this.activeMediaQuery === 'xs') {
            data.resetForMobile = true;
        }
        this.toggleDrawer.emit(data);
    }

    /**
     * navtoPanelFolder
     * pushes folder object to panels,
     * the tells panel to navigate FORWARD to the new panel
     *
     * @param folder: any
     *          object of the folder
     *
     */
    navtoPanelFolder(folder: any) {
        // console.log('NAV TO PANEL [GO FORWARD]', folder);
        /*if (this.currentResourceType === 'master' && folder.namespaceid) {
            this.currentNamespaceId = folder.namespaceid;
            this.currentResourceType = 'namespace';
        } else if (this.currentResourceType === 'master' && folder.id) {
            this.currentNamespaceId = 0;
            this.currentResourceType = 'personal';
        }

        this.panels.push(folder);
        this.currentPaneIndex = this.currentPaneIndex + 1;

        setTimeout(function() {
            this.navPanel.goNext();
        }.bind(this), 200);*/

    }

    /**
     * navfromPanelFolder
     * tells panel to navigate BACK one folder,
     * then removes the previous panel folder from panels
     *
     * @param folder: any
     *          object of the folder
     *
     */
    navfromPanelFolder(folder: any) {
        // console.log('NAV FROM PANEL [GO BACK]', folder);

        const idx = this.panels.indexOf(folder);
        this.currentPanelIndex = this.currentPanelIndex - 1;
        this.navPanel.goBack( () => {
            this.panels.splice(idx, 1);
        });
        // if (this.currentPanelIndex === 0) {
        //    this.currentResourceType = 'master';
        //    this.currentNamespaceId = 0;
        // }
    }

    /**
     * navtoSpecificPanel
     * Utility to nav  to a specific index
     *
     * @param idx: number
     *          the index of the folder to go TO
     * @param fromIdx: number
     *          the index of the folder coming FROM
     */

    navtoSpecificPanel(idx: number, fromIdx: number) {
        // console.log('NAV TO SPECIFIC FOLDER [GO BACK X]');
        // const idx = this.panels.indexOf(folder);
        /*if (idx === 0 && this.panels.length === 2) {
            this.navPanel.goBack( () => {
                this.panels.splice(idx, 1);
            });
        } else {*/
            this.currentPanelIndex = idx;
            this.panels.splice((idx + 1), (fromIdx - idx) - 1);
            this.navPanel.shiftTo(idx, idx + 1, () => {
                this.panels.splice(idx + 1);
                this.store.dispatch(
                    new DBNAVupdatePanels({
                        panels: this.panels,
                        currentPanelIndex: this.currentPanelIndex
                    })
                );
            });
        // }
    }

    // go all the way back to master panel
    navtoMasterPanel() {
        // console.log('NAV TO MASTER [GO ALL THE WAY BACK]');
        if (this.currentPanelIndex > 0) {
            this.navtoSpecificPanel(0, this.currentPanelIndex);
        }
    }

    /**
     * clickDashboardLink
     * utility to load dashboard from panel
     *
     * @param dbId: any
     *          id of the dashboard to open
     * @param event: Event
     *          click event
     */
    clickDashboardLink(dbId: any, event: Event) {
        event.stopPropagation();
        event.preventDefault();
        this.toggleDrawerMode();
        this.router.navigate(['/d/' + dbId]);
    }


}

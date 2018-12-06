import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpService } from '../../../core/http/http.service';

import { NavigatorPanelComponent } from '../navigator-panel/navigator-panel.component';

import { AppShellService } from '../../services/app-shell.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';

import {
    DashboardNavigatorState,
    DBNAVloadNavResources,
    DBNAVaddPanel,
    DBNAVupdatePanels,
    DBNAVcreateFolder
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

    constructor(
        private store: Store,
        private http: HttpService,
        private ass: AppShellService,
        private interCom: IntercomService,
        private router: Router
    ) { }

    ngOnInit() {

        const self = this;

        this.store.dispatch(new DBNAVloadNavResources());

        this.stateSubs['navStatus'] = this.navStatus$.subscribe( status => {
            self.navStatus = status;
        });

        this.stateSubs['panels'] = this.panels$.subscribe( data => {
            console.log('NAVIGATION PANELS UPDATED', data);
            self.panels = data;
        });

        this.stateSubs['currentPaneIndex'] = this.currentPanelIndex$.subscribe( idx => {
            console.log('CURRENT PANEL INDEX UPDATED', idx);
            self.currentPanelIndex = idx;
        });

        this.stateSubs['panelAction'] = this.navAction$.subscribe( action => {
            console.log('PANEL ACTION', action);
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

    /** PRIVATE */
    /*private normalizeResourceData(data: any) {
        const personal = [];
        const namespaces = [];
        for (const f of data.personal) {
            const folder = this.normalizeResourceFolder(f, 'personal');
            personal.push(folder);
        }
        for (const f of data.namespaces) {
            const folder = this.normalizeResourceFolder(f, 'namespace');
            namespaces.push(folder);
        }
        data.personal = personal;
        data.namespaces = namespaces;

        this.resourceData = <Observable<any[]>>data;
    }*/

    /*private normalizeResourceFolder(folder: any, topLevel?: string) {

        if (topLevel === 'namespace') {
            folder.icon = 'd-dashboard-tile';
        } else if (topLevel === 'personal') {
            switch (folder.name) {
                case 'My Dashboard':
                    folder.icon = 'd-dashboard-tile';
                    break;
                case 'Trash':
                    folder.icon = 'd-trash';
                    break;
                case 'Favorites':
                    folder.icon = 'd-star';
                    break;
                case 'Frequently Visited':
                    folder.icon = 'd-duplicate';
                    break;
                case 'Recently Visited':
                    folder.icon = 'd-time';
                    break;
                default:
                    break;
            }
        } else {
            folder.icon = 'd-folder';
        }

        if (!folder.files) {
            folder.files = [];
        }

        if (!folder.subfolder) {
            folder.subfolder = [];
        } else {
            // tslint:disable-next-line:forin
            for (const i in folder.subfolder) {
                folder.subfolder[i] = this.normalizeResourceFolder(folder.subfolder[i]);
            }
        }

        return folder;

    }*

    /*private generateResourceNavigation() {
        const masterPanel = {
            name: 'masterPanel',
            icon: '',
            subfolder: [],
            namespaces: []
        };

        console.log(
            '%cGENERATE RESOURCE NAVIGATION',
            'color: white; background: blue; padding: 4px 8px;',
            this.resourceData
        );

        masterPanel.subfolder = this.resourceData['personal'];
        masterPanel.namespaces = this.resourceData['namespaces'];

        this.panels.push(masterPanel);
    }*/

    private findTrashId() {
        console.log('FIND TRASH ID');
        /*
        if (this.currentResourceType === 'namespace') {
            const nsPanel = this.panels[1];
            const nsTrash = nsPanel.subfolder.filter(item => item.name.toLowerCase() === 'trash');
            return nsTrash[0].id;
        } else if (this.currentResourceType === 'personal') {
            const nsPanel = this.panels[0];
            const nsTrash = nsPanel.subfolder.filter(item => item.name.toLowerCase() === 'trash');
            return nsTrash[0].id;
        }
        return false;*/
    }

    /**
     * ACTIONS
     * from child sections -- folders and dashboards
     */
    folderAction(panel, event) {
        const self = this;

        console.group(
            '%cEVENT%cfolderAction [' + event.action + ']',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold; ',
            'color: blue; padding: 4px 8px; border: 1px solid blue;'
        );
        console.log('EVENT', event);
        console.log('ORIGINATING PANEL', panel);

        switch (event.action) {
            case 'navtoPanelFolder':

                const newPanel = this.store.dispatch(
                    new DBNAVaddPanel({
                        path: event.path,
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
                        this.panels[this.currentPanelIndex].path,
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
            default:
                break;
        }
    }

    createFolder_action(data: any, parentId?: number, namespaceId?: number) {
        // create a folder in the index item
        console.log(
            '%cACTION%cCreate Folder',
            'color: black; background: skyblue; padding: 4px 8px; font-weight: bold;',
            'color: black; border: 1px solid skyblue; padding: 4px 8px;',
            parentId, data, this.panels[this.currentPanelIndex]
            );

        this.store.dispatch(
            new DBNAVcreateFolder(
                data.name,
                this.panels[this.currentPanelIndex].path,
                this.currentPanelIndex
            )
        );
        /*
        const payload: any = {
            'name': data.name
        };
        if (parentId) {
            payload.parentid = parentId;
        }
        if (namespaceId && namespaceId > 0) {
            payload.namespaceid = namespaceId;
        }

        this.ass.createFolder(payload).subscribe( folder => {
            folder = this.normalizeResourceFolder(folder);
            console.log(
                '%cAPI%cCreate Folder Response',
                'color: white; font-weight: bold; backround: purple; padding: 4px 8px;',
                'color: purple; border: 1px solid purple; padding: 4px 8px;',
                folder
            );

            this.panels[this.currentPaneIndex].subfolder.unshift(folder);
        });*/
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
        this.toggleDrawer.emit({
            closeNavigator: true
        });
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
        console.log('NAV TO PANEL [GO FORWARD]', folder);
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
        console.log('NAV FROM PANEL [GO BACK]', folder);

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
        console.log('NAV TO SPECIFIC FOLDER [GO BACK X]');
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
        console.log('NAV TO MASTER [GO ALL THE WAY BACK]');
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

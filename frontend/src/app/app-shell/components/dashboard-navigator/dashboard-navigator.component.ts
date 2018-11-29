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

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-navigator',
    templateUrl: './dashboard-navigator.component.html',
    styleUrls: []
})
export class DashboardNavigatorComponent implements OnInit, OnDestroy {

    @HostBinding('class.dashboard-navigator') private _hostClass = true;
    @ViewChild(NavigatorPanelComponent) private navPanel: NavigatorPanelComponent;

    // tslint:disable-next-line:no-inferrable-types
    @Input() activeNavSection: string = '';
    @Input() drawerMode: any = 'over';

    @Output() toggleDrawer: EventEmitter<any> = new EventEmitter();

    intercomSub: Subscription;

    resourceData: Observable<any[]>;
    resourceDataSub: Subscription;


    navigateFolders: any[] = [];

    panels: any[] = [];

    pathTree: any[];

    // tslint:disable-next-line:no-inferrable-types
    currentPaneIndex: number = 0;
    // tslint:disable-next-line:no-inferrable-types
    currentResourceType: string = 'master';
    // tslint:disable-next-line:no-inferrable-types
    currentNamespaceId: number = 0;

    constructor(
        private http: HttpService,
        private ass: AppShellService,
        private interCom: IntercomService,
        private router: Router
    ) { }

    ngOnInit() {

        this.resourceDataSub = this.ass.getFolderList()
                .subscribe( (list: any) => {
                    console.log(
                        '%cAPI%cFOLDER LIST',
                        'color: white; background: purple; padding: 4px 8px; font-weight: bold;',
                        'color: purple; border: 1px solid purple; padding: 4px 8px;',
                        list
                    );

                    // this.resourceData = <Observable<any[]>>list;
                    this.normalizeResourceData(list);
                    this.generateResourceNavigation();

                    console.log('%cMASTER PANEL', 'color: white; background: green; padding: 4px 8px;', this.panels[0]);
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

    }

    /** PRIVATE */
    private normalizeResourceData(data: any) {
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
    }

    private normalizeResourceFolder(folder: any, topLevel?: string) {

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

    }

    private generateResourceNavigation() {
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
    }

    private findTrashId() {
        if (this.currentResourceType === 'namespace') {
            const nsPanel = this.panels[1];
            const nsTrash = nsPanel.subfolder.filter(item => item.name.toLowerCase() === 'trash');
            return nsTrash[0].id;
        } else if (this.currentResourceType === 'personal') {
            const nsPanel = this.panels[0];
            const nsTrash = nsPanel.subfolder.filter(item => item.name.toLowerCase() === 'trash');
            return nsTrash[0].id;
        }
        return false;
    }

    /**
     * ACTIONS
     * from child sections -- folders and dashboards
     */
    folderAction(panel, event) {

        console.group(
            '%cEVENT%cfolderAction',
            'color: white; background-color: blue; padding: 4px 8px; font-weight: bold; ',
            'color: blue; padding: 4px 8px; border: 1px solid blue;'
        );
        console.log('EVENT', event);
        console.log('ORIGINATING PANEL', panel);

        switch (event.action) {
            case 'navtoPanelFolder':
                let newPanel;
                if (panel.name === 'masterPanel' && event.resourceType === 'namespaces') {
                    newPanel = panel.namespaces[event.idx];
                } else {
                    newPanel = panel.subfolder[event.idx];
                }
                newPanel.resourceType = event.resourceType;
                console.log('NEW PANEL', newPanel);
                this.navtoPanelFolder(newPanel);
                break;
            case 'createFolder':
                const panelId = this.panels[this.currentPaneIndex].id;
                const namespaceId = this.currentNamespaceId;
                this.createFolder_action(event.data, panelId, namespaceId);
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
            parentId, data
            );

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
        });
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
        if (this.currentResourceType === 'master' && folder.namespaceid) {
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
        }.bind(this), 200);

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
        const idx = this.panels.indexOf(folder);
        this.currentPaneIndex = this.currentPaneIndex - 1;
        this.navPanel.goBack( () => {
            this.panels.splice(idx, 1);
        });
        if (this.currentPaneIndex === 0) {
            this.currentResourceType = 'master';
            this.currentNamespaceId = 0;
        }
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
        // const idx = this.panels.indexOf(folder);
        /*if (idx === 0 && this.panels.length === 2) {
            this.navPanel.goBack( () => {
                this.panels.splice(idx, 1);
            });
        } else {*/
            this.currentPaneIndex = idx;
            this.panels.splice((idx + 1), (fromIdx - idx) - 1);
            this.navPanel.shiftTo(idx, idx + 1, () => {
                this.panels.splice(idx + 1);
            });
        // }
    }

    // go all the way back to master panel
    navtoMasterPanel() {
        if (this.currentPaneIndex > 0) {
            this.navtoSpecificPanel(0, this.currentPaneIndex);
            this.currentResourceType = 'master';
            this.currentNamespaceId = 0;
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

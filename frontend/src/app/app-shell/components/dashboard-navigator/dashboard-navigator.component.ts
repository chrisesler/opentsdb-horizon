import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpService } from '../../../core/http/http.service';

import { NavigatorPanelComponent } from '../navigator-panel/navigator-panel.component';

import { AppShellService } from '../../services/app-shell.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-navigator',
    templateUrl: './dashboard-navigator.component.html',
    styleUrls: []
})
export class DashboardNavigatorComponent implements OnInit {

    @HostBinding('class.dashboard-navigator') private _hostClass = true;
    @ViewChild(NavigatorPanelComponent) private navPanel: NavigatorPanelComponent;

    // tslint:disable-next-line:no-inferrable-types
    @Input() activeNavSection: string = '';
    @Input() drawerMode: any = 'over';

    @Output() toggleDrawer: EventEmitter<any> = new EventEmitter();

    resourceData: Observable<any[]>;
    resourceDataSub: Subscription;

    navigateFolders: any[] = [];

    panels: any[] = [];

    pathTree: any[];

    // tslint:disable-next-line:no-inferrable-types
    currentPaneIndex: number = 0;

    constructor(
        private http: HttpService,
        private ass: AppShellService,
        private router: Router
    ) { }

    ngOnInit() {
        /*this.dashboardsSub = this.http.getDashboards()
            .subscribe( data => {
                this.dashboards = <Observable<object[]>>data;
                this.generateFakeFolderData();
            });*/

        /*const uid = this.ass.getUid().subscribe( (data: any) => {
            console.log('data', data);
            const folders = this.ass.getFolderList(data.uid)
                .subscribe( list => {
                    console.log('LIST', list);
                });
        });*/

        this.resourceDataSub = this.ass.getFolderList()
                .subscribe( (list: any) => {
                    console.log('%cFOLDER LIST', 'color: white; background: purple; padding: 4px 8px;', list);

                    // this.resourceData = <Observable<any[]>>list;
                    this.normalizeResourceData(list);
                    this.generateResourceNavigation();

                    console.log('%cMASTER PANEL', 'color: white; background: green; padding: 4px 8px;', this.panels[0]);
                });

        // console.log('NAVIGATOR', this.navPanel);
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

    /*private generateFakeFolderData() {

        this.dashboardFolders.push(
            this.generateFolder('My Dashboards', 'd-dashboard-tile', 5),
            this.generateFolder('Favorites', 'd-star', 5),
            // this.generateFolder('Frequently Visited', 'd-duplicate', 2),
            this.generateFolder('Recently Visited', 'd-time', 3)
        );

        const masterPanel = {
            name: 'masterPanel',
            icon: '',
            folders: this.dashboardFolders
        };

        this.panels.push(masterPanel);

        // console.log('DASHBOARD FOLDERS', this.dashboardFolders);
    }

    private generateFolder(name: string, icon: string, folders: number) {
        const folder = {
            name: name,
            icon: icon,
            dashboards: this.dashboards,
            folders: []
        };

        if (folders > 0) {
            let i = 0;
            while ( i < folders) {
                folder.folders.push(this.generateFolder('sub folder ' + (i + 1), 'd-folder', ((folders - 2) > 0) ? folders - 2 : 0));
                i++;
            }
        }
        return folder;
    }*/

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

    createFolderIn(idx: number) {
        // create a folder in the index item
    }

    editFoldersIn(idx: number) {
        // edit folder(s) in the index item
    }

    createDashboardIn(idx: number) {
        // create a dashboard in the indicated folder
    }

    editDashboardsIn(idx: number) {
        // edit dashboard(s) in the indicated folder
    }

    // NOTE: may not need this anymore
    updatePathTree() {
        const newTree = [];
        for ( const i in this.panels ) {
            if (this.panels[i] && this.panels[i].name !== 'masterPanel') {
                newTree.push({
                    idx: i,
                    name: this.panels[i].name,
                    icon: this.panels[i].icon
                });
            }
        }

        this.pathTree = newTree;
    }

    /** actions from child sections -- folders and dashboards */
    folderAction(panel, event) {

        console.group(
            '%cEVENT%c[folderAction]',
            'color: white; background-color: blue; padding: 4px 8px;',
            'color: blue; padding: 4px 8px; font-weight: bold;'
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

}

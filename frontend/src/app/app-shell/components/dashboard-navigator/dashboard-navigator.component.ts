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

    dashboards: Observable<object[]>;
    dashboardsSub: Subscription;

    dashboardFolders: object[] = [];

    panels: any[] = [];

    pathTree: any[];

    constructor(
        private http: HttpService,
        private router: Router
    ) { }

    ngOnInit() {
        this.dashboardsSub = this.http.getDashboards()
            .subscribe( data => {
                this.dashboards = <Observable<object[]>>data;
                this.generateFakeFolderData();
            });

        // console.log('NAVIGATOR', this.navPanel);
    }

    /** PRIVATE */
    private generateFakeFolderData() {

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
    }

    /** EVENTS */

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
            this.panels.splice((idx + 1), (fromIdx - idx) - 1);
            this.navPanel.shiftTo(idx, idx + 1, () => {
                this.panels.splice(idx + 1);
            });
        // }
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

}

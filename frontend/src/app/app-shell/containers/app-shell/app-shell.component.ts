import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';

import {
    Routes,
    RouterModule,
    Router,
    ActivatedRoute
} from '@angular/router';

import { MatDrawer } from '@angular/material';


@Component({
    selector: 'app-shell',
    templateUrl: './app-shell.component.html',
    styleUrls: []
})
export class AppShellComponent implements OnInit, OnDestroy {

    @HostBinding('class.app-shell') private _hostClass = true;

    @ViewChild('drawer', { read: MatDrawer }) private drawer: MatDrawer;

    // tslint:disable-next-line:no-inferrable-types
    activeNav: any = {};

    // tslint:disable-next-line:no-inferrable-types
    drawerMode: string = 'over'; // over | side;

    navItems: object[] = [
        { section: 'dashboard',         label: 'Dashboards',        icon: 'd-dashboard-tile' },
        { section: 'metric-explorer',   label: 'Metric Explorer',   icon: 'd-chart-line' },
        { section: 'alerts',            label: 'Alerts',            icon: 'd-notification' },
        { section: 'status',            label: 'Status',            icon: 'd-heart-health' },
        { section: 'annotations',       label: 'Annotations',       icon: 'd-flag' },
        { section: 'admin',             label: 'Admin',             icon: 'd-user-secure', requiresUserAdmin: true },
        { section: 'favorites',         label: 'Favorites',         icon: 'd-star' },
        { section: 'namespaces',        label: 'Namespaces',        icon: 'd-briefcase' },
        { section: 'resources',         label: 'Resources',         icon: 'd-information-circle', spacerAfter: true },
        { section: 'test',              label: 'Toggle Test',       icon: 'd-setting' }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {
        console.log(this.router, this.route);
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    /** PRIVATE */


    /** BEHAVIORS */
    drawerClosedStart() {
        // console.log('DRAWER IS CLOSING');
    }

    /** EVENTS */

    navigationAction(obj: any) {
        if (this.drawer.opened && this.activeNav.section === obj.section) {
            this.closeNavigator();
        } else {
            this.activeNav = obj;

            switch (obj.section) {
                case 'test':
                case 'dashboard':
                    this.drawer.open();
                    break;
                case 'metric-explorer':
                case 'alerts':
                case 'status':
                case 'annotations':
                case 'favorites':
                case 'namespaces':
                case 'resources':
                case 'admin':
                default:
                    if (this.drawer.opened) {
                        this.closeNavigator();
                    }
                    break;
            }
        }
    }

    closeNavigator() {
        this.drawer.close();
        this.drawerMode = 'over';
    }

    toggleDrawerMode(event?: any) {
        // console.log('TOGGLE 2');
        if (event && event.drawerMode) {
            this.drawerMode = event.drawerMode;
        } else {
            this.drawerMode = (this.drawerMode === 'side') ? 'over' : 'side';
        }
    }

}

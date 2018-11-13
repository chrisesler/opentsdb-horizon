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

import { NavigatorSidenavComponent } from '../../components/navigator-sidenav/navigator-sidenav.component';

@Component({
    selector: 'app-shell',
    templateUrl: './app-shell.component.html',
    styleUrls: []
})
export class AppShellComponent implements OnInit, OnDestroy {

    @HostBinding('class.app-shell') private _hostClass = true;

    @ViewChild('drawer', { read: MatDrawer }) private drawer: MatDrawer;

    @ViewChild(NavigatorSidenavComponent) private sideNav: NavigatorSidenavComponent;

    // tslint:disable-next-line:no-inferrable-types
    activeNavSection: string = '';

    // tslint:disable-next-line:no-inferrable-types
    drawerMode: string = 'push'; // over | side;


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

    navigationAction(event: any) {
        if (event.reset) {
            this.closeNavigator();
            this.activeNavSection = '';
            this.sideNav.resetActiveNav();
        } else {
            this.activeNavSection = event.section;

            switch (this.activeNavSection) {
                case 'test':
                case 'dashboard':
                    this.drawer.open();
                    break;
                // can add more cases if needed
                default:
                    if (this.drawer.opened) {
                        this.closeNavigator();
                    }
                    break;
            }
        }

        /*
        if (this.drawer.opened && this.activeNavSection === obj.section) {
            this.closeNavigator();
            this.activeNavSection = '';
            this.sideNav.resetActiveNav();
        } else {
            this.activeNavSection = obj.section;

            switch (this.activeNavSection) {
                case 'test':
                case 'dashboard':
                    this.drawer.open();
                    break;
                // can add more cases if needed
                default:
                    if (this.drawer.opened) {
                        this.closeNavigator();
                        this.activeNavSection = '';
                        this.sideNav.resetActiveNav();
                    }
                    break;
            }
        }*/
    }

    closeNavigator() {
        this.drawer.close();
        this.drawerMode = 'push';
    }

    toggleDrawerMode(event?: any) {
        if (event && event.drawerMode) {
            this.drawerMode = event.drawerMode;
        } else if (event && event.closeNavigator) {
            this.closeNavigator();
            this.activeNavSection = '';
            this.sideNav.resetActiveNav();
        } else {
            // this.drawerMode = (this.drawerMode === 'side') ? 'over' : 'side';
            this.drawerMode = 'push';
        }
    }

}

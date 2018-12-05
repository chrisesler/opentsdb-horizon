import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';

import {
    Router,
    ActivatedRoute
} from '@angular/router';

import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';

import { MatDrawer } from '@angular/material';

import { NavigatorSidenavComponent } from '../../components/navigator-sidenav/navigator-sidenav.component';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { NavigatorState } from '../../state';

@Component({
    selector: 'app-shell',
    templateUrl: './app-shell.component.html',
    styleUrls: []
})
export class AppShellComponent implements OnInit, OnDestroy {

    @HostBinding('class.app-shell') private _hostClass = true;

    // new state
    @Select(NavigatorState.getCurrentApp) currentApp$: Observable<string>;


    // View Children
    @ViewChild('drawer', { read: MatDrawer }) private drawer: MatDrawer;

    @ViewChild(NavigatorSidenavComponent) private sideNav: NavigatorSidenavComponent;

    // tslint:disable-next-line:no-inferrable-types
    activeNavSection: string = '';

    // tslint:disable-next-line:no-inferrable-types
    drawerMode: string = 'side'; // over | side;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private interCom: IntercomService,
        private store: Store
    ) {
        console.log(this.router, this.route);
    }

    ngOnInit() {
        this.currentApp$.subscribe( app => {
            this.activeNavSection = app;
        });
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
    }

    closeNavigator() {
        this.drawer.close();
        this.drawerMode = 'side';
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
            this.drawerMode = 'side';
        }
    }

}

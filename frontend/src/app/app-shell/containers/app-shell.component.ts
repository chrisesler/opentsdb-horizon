import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';

import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';

import { MatDrawer } from '@angular/material';

import { NavigatorSidenavComponent } from '../components/navigator-sidenav/navigator-sidenav.component';

import { IntercomService, IMessage } from '../../core/services/intercom.service';
import {
    AppShellState,
    NavigatorState,
    SetSideNavOpen
} from '../state';
import {
    UpdateNavigatorSideNav,
    ResetNavigator
} from '../state/navigator.state';

import { Subscription } from 'rxjs';
import { select } from 'd3';

@Component({
    selector: 'app-shell',
    templateUrl: './app-shell.component.html',
    styleUrls: []
})
export class AppShellComponent implements OnInit, OnChanges, OnDestroy {

    @HostBinding('class.app-shell') private _hostClass = true;

    @Input() fullUrlPath: string;

    // new state

    private stateSubs: any = {};

    @Select(NavigatorState.getCurrentApp) currentApp$: Observable<string>;
    @Select(NavigatorState.getSideNavOpen) sideNavOpen$: Observable<boolean>;
    @Select(NavigatorState.getSideNavMode) sidenavMode$: Observable<string>;
    @Select(NavigatorState.getDrawerOpen) drawerOpen$: Observable<boolean>;

    @Select(AppShellState.getCurrentMediaQuery) mediaQuery$: Observable<string>;


    // View Children
    @ViewChild('drawer', { read: MatDrawer }) private drawer: MatDrawer;

    @ViewChild(NavigatorSidenavComponent) private sideNav: NavigatorSidenavComponent;

    // tslint:disable-next-line:no-inferrable-types
    activeNavSection: string = '';

    // tslint:disable-next-line:no-inferrable-types
    drawerMode: string = 'side'; // over | side;

    // tslint:disable-next-line:no-inferrable-types
    sideNavOpen: boolean = true; // the skinny icon bar

    // tslint:disable-next-line:no-inferrable-types
    activeMediaQuery: string = '';

    constructor(
        private interCom: IntercomService,
        private store: Store
    ) {}

    ngOnInit() {
        this.stateSubs.currentMediaQuery = this.mediaQuery$.subscribe( currentMediaQuery => {
            console.log('[SUB] currentMediaQuery', currentMediaQuery);
            this.activeMediaQuery = currentMediaQuery;
            this.store.dispatch(new SetSideNavOpen(( currentMediaQuery !== 'xs')));
        });

        this.stateSubs.currentApp = this.currentApp$.subscribe( app => {
            console.log('[SUB] currentApp', app);
            this.activeNavSection = app;
        });

        this.stateSubs.sideNavOpen = this.sideNavOpen$.subscribe( isOpen => {
            console.log('[SUB] sidenavopen', isOpen);
            this.sideNavOpen = isOpen;
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        // when then path is changes
        if (changes.fullUrlPath && changes.fullUrlPath.currentValue) {
            // now do whatever with this full path
            console.log('new url path', changes.fullUrlPath.currentValue);
        }
    }

    ngOnDestroy() {
        this.stateSubs.currentEmediaQuery.unsubscribe();
        this.stateSubs.currentApp.unsubscribe();
        this.stateSubs.sideNavOpen.unsubscribe();
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
                case 'dashboard':
                case 'metric-explorer':
                case 'alerts':
                case 'status':
                case 'annotations':
                case 'admin':
                case 'favorites':
                case 'namespaces':
                case 'resources':
                case 'test':
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
        this.store.dispatch(new UpdateNavigatorSideNav({mode: this.drawerMode, currentApp: this.activeNavSection}));
    }

    closeNavigator() {
        this.drawer.close();
        this.drawerMode = 'side';
        if (this.activeMediaQuery === 'xs') {
            // this.store.dispatch(new SetSideNavOpen(!this.sideNavOpen));
            // this.sideNavOpen = !this.sideNavOpen;
        }
    }

    toggleDrawerMode(event?: any) {
        // console.log('%c******** TOGGLE DRAWER MODE **********', 'color: white; background: red; padding: 20px;', event);
        if (event && event.resetForMobile) {
            this.sidenavToggle();
            this.sideNavOpen = false;
        } else {

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
            this.store.dispatch(new UpdateNavigatorSideNav({mode: this.drawerMode, currentApp: this.activeNavSection}));
        }
    }

    sidenavToggle() {
        // console.log('%cSIDENAV TOGGLE [TOP]', 'color: white; background: red; padding: 20px;');
        if (this.activeMediaQuery === 'xs') {
            if (this.drawer.opened) {
                // console.log('%cOPENED', 'color: white; background: red; padding: 20px;');
                this.store.dispatch(new UpdateNavigatorSideNav({mode: this.drawerMode, currentApp: ''}));
                this.closeNavigator();
                this.sideNav.resetActiveNav();
            } else {
                // console.log('%cNOT OPENED', ' color: white; background: red; padding: 20px;');
                this.sideNavOpen = !this.sideNavOpen;
            }
        }
    }

}

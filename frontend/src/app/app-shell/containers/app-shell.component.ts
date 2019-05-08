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
import { Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';

import { MatDrawer } from '@angular/material';

import { NavigatorSidenavComponent } from '../components/navigator-sidenav/navigator-sidenav.component';

import { IntercomService, IMessage } from '../../core/services/intercom.service';
import {
    AppShellState,
    NavigatorState,
    SetSideNavOpen,
    SSGetUserProfile
} from '../state';
import {
    UpdateNavigatorSideNav,
    ResetNavigator
} from '../state/navigator.state';

@Component({
    selector: 'app-shell',
    templateUrl: './app-shell.component.html',
    styleUrls: []
})
export class AppShellComponent implements OnInit, OnChanges, OnDestroy {

    @HostBinding('class.app-shell') private _hostClass = true;

    @Input() fullUrlPath: string;

    // new state
    private subscription: Subscription = new Subscription();

    @Select(NavigatorState.getCurrentApp) currentApp$: Observable<string>;
    @Select(NavigatorState.getSideNavOpen) sideNavOpen$: Observable<boolean>;
    @Select(NavigatorState.getSideNavMode) sidenavMode$: Observable<string>;
    @Select(NavigatorState.getDrawerOpen) drawerOpen$: Observable<boolean>;

    @Select(AppShellState.getCurrentMediaQuery) mediaQuery$: Observable<string>;
    @Select(AppShellState.getUserProfile) userProfile$: Observable<any>;
    userProfile: any = {};

    // View Children
    @ViewChild('drawer', { read: MatDrawer }) private drawer: MatDrawer;
    @ViewChild(NavigatorSidenavComponent) private sideNav: NavigatorSidenavComponent;

    activeNavSection = '';
    drawerMode = 'side'; // over | side;
    sideNavOpen = true; // the skinny icon bar
    activeMediaQuery = '';

    // global error Message bar
    messageBarVisible = false;
    messageBarData: any = {
        type: 'error',
        message: 'Info'
    };

    messageBarIconMap: any = {
        info: 'd-information-circle',
        error: 'd-stop-warning-solid',
        success: 'd-check-circle',
        warning: 'd-warning-solid'
    }


    constructor(
        private interCom: IntercomService,
        private store: Store,
        private router: Router
    ) {}

    ngOnInit() {
        this.subscription.add(this.mediaQuery$.subscribe( currentMediaQuery => {
            // console.log('[SUB] currentMediaQuery', currentMediaQuery);
            this.activeMediaQuery = currentMediaQuery;
            this.store.dispatch(new SetSideNavOpen(( currentMediaQuery !== 'xs')));
        }));

        this.subscription.add(this.userProfile$.subscribe( data => {
            // console.log('[SUB] User Profile', data);
            this.userProfile = data;

            if (!data.loaded) {
                this.store.dispatch(new SSGetUserProfile());
            }
        }));

        this.subscription.add(this.currentApp$.subscribe( app => {
            // console.log('[SUB] currentApp', app);
            this.activeNavSection = app;
        }));

        this.subscription.add(this.sideNavOpen$.subscribe( isOpen => {
            // console.log('[SUB] sidenavopen', isOpen);
            this.sideNavOpen = isOpen;
        }));

        this.subscription.add(this.interCom.requestListen().subscribe((message: IMessage) => {
            console.log('**** INTERCOM ****', message);
            switch (message.action) {
                case 'systemMessage':
                    this.messageBarData = message.payload;
                    this.messageBarVisible = true;
                    break;
                case 'systemMessageReset':
                    if (this.messageBarVisible) {
                        this.messageBarData = {};
                        this.messageBarVisible = false;
                    }
                    break;
                default:
                    break;
            }
        }));
    }

    ngOnChanges(changes: SimpleChanges) {
        // when then path is changes
        // if (changes.fullUrlPath && changes.fullUrlPath.currentValue) {
            // now do whatever with this full path
            // console.log('new url path', changes.fullUrlPath.currentValue);
        // }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    /** PRIVATE */


    /** BEHAVIORS */

    closeMessageBar() {
        this.messageBarVisible = false;
    }

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
                case 'alerts':
                    if (this.drawer.opened) {
                        this.closeNavigator();
                    }
                    this.router.navigate(['a']);
                    break;
                case 'dashboard':
                case 'metric-explorer':
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

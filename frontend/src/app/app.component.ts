import { Component, OnInit, Input, HostBinding, ViewChild } from '@angular/core';
import { AuthState } from './shared/state/auth.state';
import { Observable } from 'rxjs';
import { MatDialog, MatSidenav } from '@angular/material';
import { LoginExpireDialogComponent } from './core/components/login-expire-dialog/login-expire-dialog.component';
import { Select } from '@ngxs/store';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [
        './app.component.scss'
    ]
})
export class AppComponent implements OnInit {
    @HostBinding('class.app-root') hostClass = true;
    @Select(AuthState.getAuth) auth$: Observable<string>;

    /** View Childs */
    @ViewChild(MatSidenav) sideNav: MatSidenav;

    /** Local variables */
    title = 'app';

    // sidenav variables
    // tslint:disable-next-line:no-inferrable-types
    sidenavOpen: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    sidenavExpanded: boolean = false;
    private _sidenavExpandTimer: any;
    private _sidenavCloseTimer: any;

    constructor(private dialog: MatDialog) { }

    ngOnInit() {
        this.auth$.subscribe(auth => {
            if (auth === 'invalid') {
                console.log('open auth dialog');
                this.dialog.open(LoginExpireDialogComponent);
            } else if (auth === 'valid') {
                this.dialog.closeAll();
            }
        });
    }

    /**
     * SIDE NAV ITEMS
     */

    toggleSidenav() {
        this.sidenavOpen = !this.sidenavOpen;

        // if it is open
        if (this.sidenavOpen) {
            this.sideNav.open();

            // timer setup?

            this._sidenavCloseTimer = setTimeout(this.closeSidenavTimeout.bind(this), 3000);

        } else {
            this.sideNav.close();

            if (this._sidenavCloseTimer) {
                clearTimeout(this._sidenavCloseTimer);
            }

            if (this._sidenavExpandTimer) {
                clearTimeout(this._sidenavExpandTimer);
            }

            if (this.sidenavExpanded) {
                this.sidenavExpanded = false;
            }
        }
    }

    closeSidenavTimeout() {
        this.sidenavOpen = false;
        this.sideNav.close();

        if (this._sidenavCloseTimer) {
            clearTimeout(this._sidenavCloseTimer);
        }

        if (this._sidenavExpandTimer) {
            clearTimeout(this._sidenavExpandTimer);
        }

        if (this.sidenavExpanded) {
            this.sidenavExpanded = false;
        }
    }

    expandSidenavTimeout() {
        this.sidenavExpanded = true;

        this._sidenavCloseTimer = setTimeout(this.closeSidenavTimeout.bind(this), 10000);
    }

    sidenavMouseover(e: any) {
        console.log('%cEVENT: Mouse Over', 'color: #ffffff, background-color: #ea0000; font-weight: bold;', e);
        clearTimeout(this._sidenavCloseTimer);
    }

    sidenavMouseout(e: any) {
        console.log('%cEVENT: Mouse Out', 'color: #ffffff, background-color: #ea0000; font-weight: bold;', e);
        this._sidenavCloseTimer = setTimeout(this.closeSidenavTimeout.bind(this), 2000);
    }

    sidenavMousemove(e: any) {
        console.log('%cEVENT: Mouse Move', 'color: #ffffff, background-color: #ea0000; font-weight: bold;', e);
        if (this._sidenavExpandTimer) {
            clearTimeout(this._sidenavExpandTimer);
        }
        if (this._sidenavCloseTimer) {
            clearTimeout(this._sidenavCloseTimer);
        }

        this._sidenavExpandTimer = setTimeout(this.expandSidenavTimeout.bind(this), 1000);
    }
}

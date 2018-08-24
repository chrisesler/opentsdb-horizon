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
    private _sidenavOpen: boolean;

    set sidenavOpen(open: boolean) {
        this._sidenavOpen = open;
    }

    get sidenavOpen(): boolean {
        return this._sidenavOpen;
    }

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

            // timer setup

        } else {
            this.sideNav.close();
        }
    }

    sidenavMouseover(e: any) {
        console.log('%cEVENT: Mouse Over', 'color: #fff, background: red; font-weight: bold;', e);
    }

    sidenavMouseout(e: any) {
        console.log('%cEVENT: Mouse Out', 'color: #fff, background: red; font-weight: bold;', e);
    }

    sidenavMousemove(e: any) {
        console.log('%cEVENT: Mouse Over', 'color: #fff, background: red; font-weight: bold;', e);
    }
}

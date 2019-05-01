import { Component, OnInit, HostBinding} from '@angular/core';
import { AuthState } from './shared/state/auth.state';
import { Observable } from 'rxjs';
import { MatDialog} from '@angular/material';
import { LoginExpireDialogComponent } from './core/components/login-expire-dialog/login-expire-dialog.component';
import { Select } from '@ngxs/store';
import { Router,  NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
    @HostBinding('class.app-root') hostClass = true;
    @Select(AuthState.getAuth) auth$: Observable<string>;

    /** Local variables */
    title = 'app';

    fullUrlPath: string;

    constructor(
        private dialog: MatDialog,
        private router: Router
    ) { 
        // register this router events to capture url changes
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            // after resolve path, this is the url the app uses
            this.fullUrlPath = event.urlAfterRedirects;
          }
        });
    }

    ngOnInit() {
        this.auth$.subscribe(auth => {
            if (auth === 'invalid') {
                // console.log('open auth dialog');
                this.dialog.open(LoginExpireDialogComponent, {
                    disableClose: true
                });
            } else if (auth === 'valid') {
                this.dialog.closeAll();
            }
        });
    }
}

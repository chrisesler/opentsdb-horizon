import { Component, OnInit, HostBinding} from '@angular/core';
import { AuthState } from './shared/state/auth.state';
import { Observable } from 'rxjs';
import { MatDialog} from '@angular/material';
import { LoginExpireDialogComponent } from './core/components/login-expire-dialog/login-expire-dialog.component';
import { Select } from '@ngxs/store';

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

    constructor(
        private dialog: MatDialog
    ) { }

    ngOnInit() {
        this.auth$.subscribe(auth => {
            if (auth === 'invalid') {
                console.log('open auth dialog');
                this.dialog.open(LoginExpireDialogComponent, {
                    disableClose: true
                });
            } else if (auth === 'valid') {
                this.dialog.closeAll();
            }
        });
    }
}

import { Component, OnInit, HostBinding} from '@angular/core';
import { AuthState } from './shared/state/auth.state';
import { Observable } from 'rxjs';
import { MatDialog} from '@angular/material';
import { LoginExpireDialogComponent } from './core/components/login-expire-dialog/login-expire-dialog.component';
import { Select } from '@ngxs/store';
import { Router,  NavigationEnd } from '@angular/router';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';
import {Location} from '@angular/common';

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
        private router: Router,
        private location: Location
    ) { 
        // register this router events to capture url changes
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            // after resolve path, this is the url the app uses
            this.fullUrlPath = event.urlAfterRedirects;
            const queryParams = this.router.routerState.root.queryParamMap;
            queryParams.pipe(map(params => params.get('__tsdb_host'))).subscribe(
                val => {
                    if (val) {
                        environment.tsdb_host = val;
                        environment.tsdb_hosts = [ val ];
                        this.appendQueryParam('__tsdb_host', val);
                        console.info("Overriding TSDB host with " + val);
                    }
            });

            queryParams.pipe(map(params => params.get('__config_host'))).subscribe(
                val => {
                    if (val) {
                        environment.configdb = val;
                        this.appendQueryParam('__config_host', val);
                        console.info("Overriding ConfigDB host with " + val);
                    }
            });

            queryParams.pipe(map(params => params.get('__meta_host'))).subscribe(
                val => {
                    if (val) {
                        environment.metaApi = val;
                        this.appendQueryParam('__meta_host', val);
                        console.info("Overriding Meta host with " + val);
                    }
            });

            queryParams.pipe(map(params => params.get('__debug_level'))).subscribe(
                val => {
                    if (val) {
                        environment.debugLevel = val;
                        this.appendQueryParam('__debug_level', val);
                        console.info("Overriding debug level with " + environment.debugLevel);
                    }
            });
          }
        });
    }

    /**
     * Simple method to append the query params back in the environment query params so
     * that we can rebuild the URI when the dashboard and path is added.
     */
    appendQueryParam(key: string, val: string) {
        if (environment.queryParams) {
            environment.queryParams += '&' + key + '=' + val;
        } else {
            environment.queryParams = key + '=' + val;
        }
    }

    ngOnInit() {
        console.log("location: ", location);
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

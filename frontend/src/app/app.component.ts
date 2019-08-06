import { Component, OnInit, HostBinding} from '@angular/core';
import { AuthState } from './shared/state/auth.state';
import { Subscription, Observable } from 'rxjs';
import { MatDialog} from '@angular/material';
import { LoginExpireDialogComponent } from './core/components/login-expire-dialog/login-expire-dialog.component';
import { Select } from '@ngxs/store';
import { Router,  NavigationEnd } from '@angular/router';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';
import {Location} from '@angular/common';
import { IntercomService, IMessage } from './core/services/intercom.service';
import { keys } from 'd3';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit {
    @HostBinding('class.app-root') hostClass = true;
    @Select(AuthState.getAuth) auth$: Observable<string>;

    private subscription: Subscription = new Subscription();

    /** Local variables */
    title = 'app';

    fullUrlPath: string;

    constructor(
        private dialog: MatDialog,
        private router: Router,
        private location: Location,
        private interCom: IntercomService
    ) { 
        // register this router events to capture url changes
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            // after resolve path, this is the url the app uses
            this.fullUrlPath = event.urlAfterRedirects;
            const queryParams = this.router.routerState.root.queryParamMap;

            queryParams.subscribe(
                p => {
                    var urlParams = p.keys;
                    var time = {};
                    var tags = {};
                    for (var u in urlParams) {
                        var k = urlParams[u];
                        var v = p.get(k);
                        if (!v) continue;
                        switch(k) {
                            case '__start':
                                time['start'] = v; break;
                            case '__end':
                                time['end'] = v; break;
                            case '__tz':
                                time['zone'] = v; break;
                            default:
                                if (k.startsWith('__'))
                                    break;
                                // key doesn't start with '__' 
                                // treat it like tag key
                                tags[k] = v;
                                break;
                        }
                    }
                    if (Object.keys(time).length)
                        environment.url['time'] = time;
                    if (Object.keys(tags).length)
                        environment.url['tags'] = tags;
                }
            );

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

            this.interCom.requestSend({
                id: 'global',
                action: 'tagFilterChanged',
                payload: {}
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

    getLocationURLandQueryParams() {
        var currentFullUrl = this.location.path();
        var urlParts = currentFullUrl.split('?');
        var queryParams = {};
        var urlObj = {};
        urlObj['path'] = urlParts[0];
        urlObj['queryParams'] = queryParams;
        if (urlParts.length > 1) {
            // split query params
            var qp = urlParts[1].split('&');
            for(var p in qp) {
                var s = qp[p].split('=');
                if (s.length > 1) {
                    queryParams[s[0]]  = s[1];
                }
            }
        }
        return urlObj;
    }

    updateLocationURL(url) {
        if (url.path) {
            if (url.queryParams) {
                // create param string
                var params: string[] = [];
                for (var q in url['queryParams']) {
                    params.push(q + "=" + url['queryParams'][q]);
                }
                var paramString = params.join('&');
                this.location.replaceState(url.path, paramString);
            }
        }
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
        

        this.subscription.add(this.interCom.requestListen().subscribe((message: IMessage) => {
            if ('updateURLTags' === message.action) {
                var paramsChanged = false;
                var url = this.getLocationURLandQueryParams();
                if (Array.isArray(message.payload)) {
                    for (var i in message.payload) {
                        var tk = message.payload[i].alias;
                        var tv = message.payload[i].filter;
                        if (tk && tv) {
                            url['queryParams'][tk] = tv;
                            paramsChanged = true;
                        }
                    }
                }
                if (paramsChanged) this.updateLocationURL(url);
            }
        }));

        this.subscription.add(this.interCom.responseGet().subscribe((message: IMessage) => {
            var changedVars;
            switch (message.action) {
                case 'ZoomDateRange':
                    changedVars = message.payload.date;
                    break;
                case 'TimeChanged':
                    changedVars = message.payload;
                    break;
                case 'TimezoneChanged':
                    changedVars = message.payload;  
                    break;
                case 'TplVariables':
                    break;
            }
            if (changedVars) {
                var url = this.getLocationURLandQueryParams();
                if (changedVars.start) {
                    url['queryParams']['__start'] = changedVars.start;
                }
                if (changedVars.end) {
                    url['queryParams']['__end'] = changedVars.end;
                }
                if (changedVars.zone) {
                    url['queryParams']['__tz'] = changedVars.zone;
                }
                this.updateLocationURL(url);
            }
        }));
    }
}

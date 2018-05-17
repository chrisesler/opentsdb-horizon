import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { Store } from '@ngxs/store';
import { SetAuth } from '../../shared/state/auth.state';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';



@Injectable()
export class AuthService {
    constructor(private http: HttpClient, private store: Store) {
        console.log('auth service store=>', this.store);
    }

    /*
        renews the cookie.
        image.src follows the browser redirects and renews the auth cookies
    */
    canCookieRenewed() {
        const self = this;
        return new Observable((observer) => {
            const image = new Image();
            image.onload = function() {
                observer.next('cookie-renewed');
                self.store.dispatch(new SetAuth('valid'));
            };
            image.onerror = function(e) {
                observer.next('cookie-invalid');
                observer.complete();
                self.store.dispatch(new SetAuth('invalid'));
            };
            image.src = '/heartbeatimg?t=' + new Date().getTime();
        });
    }

    /*
        checks the login cookie. It will try to renew the cookie when the cookie is expired.
        returns Observable<string> cookie-valid | cookie-invalid | cookie-renewed | cookie-check-error
    */
    getCookieStatus() {
        console.log('comes in isCookieValid');
        this.store.dispatch(new SetAuth('unknown'));
        return this.http.get('/heartbeat')
            .map(
                (res) => {
                    return Observable.of('cookie-valid');
                })
            .catch(
                error => {
                    if ( error.status === 401 ) {
                        return this.canCookieRenewed();
                    }
                    return Observable.of('cookie-check-error');
                }
            );
    }
}

import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { IntercomService, IMessage } from '../../core/services/intercom.service';
import { Subscription, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class URLOverrideService {
    version = 1;

    private subscription: Subscription = new Subscription();
    private overrides: any = {};

    getTimeOverrides() {
        if (this.overrides['time']) {
            return this.overrides['time'];
        }
    }

    getTagOverrides() {
        if (this.overrides['tags']) {
            return this.overrides['tags'];
        }
    }

    clearOverrides() {
        this.overrides = {};
        var url = this.getLocationURLandQueryParams();
        if (url['queryParams']) {
            url['queryParams'] = {};
        }
        this.updateLocationURL(url);
    }

    applyURLParamsToDB(p) {
        var urlParams = p.keys;
        var time = {};
        var tags = {};
        for (var u in urlParams) {
            var k = urlParams[u];
            var v = p.get(k);
            if (!v) continue;
            switch (k) {
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
            this.overrides['time'] = time;
        if (Object.keys(tags).length)
            this.overrides['tags'] = tags;
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

    constructor(
        private location: Location,
        private interCom: IntercomService
    ) {
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
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription, Observable } from 'rxjs';
import { Router,  NavigationEnd } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UtilsService} from '../../core/services/utils.service';

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
        var time = {};
        var tags = {};
        for (var k in p) {
            var v = p[k];
            if (!v) continue;
            switch (k) {
                case '__start':
                    time['start'] = v.toLowerCase(); break;
                case '__end':
                    time['end'] = v.toLowerCase(); break;
                case '__tz':
                    time['zone'] = v.toLowerCase(); break;
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
            var qp = this.utils.decodeHTML(decodeURIComponent(urlParts[1])).split('&');
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
        private router: Router,
        private utils: UtilsService
    ) {
        var url = this.getLocationURLandQueryParams();
        var otherParams = {};
        for (var k in url['queryParams']) {
            var v = url['queryParams'][k];
            switch (k.toLowerCase()) {
                case '__tsdb_host':
                    environment.tsdb_host = v;
                    environment.tsdb_hosts = [v];
                    break;
                case '__config_host':
                    environment.configdb = v;
                    break;
                case '__meta_host':
                    environment.metaApi = v;
                    break;
                case '__debug_level':
                    environment.debugLevel = v;
                    break;
                case '__tsdb_cache':
                    environment.tsdbCacheMode = v;
                    break;
                default:
                    otherParams[k] = v;
            }
        }
        if (Object.keys(otherParams).length > 0) {
            this.applyURLParamsToDB(otherParams);
        }
    }

    applyParamstoURL(params) {
        var url = this.getLocationURLandQueryParams();
        if (params.start) {
            url['queryParams']['__start'] = params.start;
        }
        if (params.end) {
            url['queryParams']['__end'] = params.end;
        }
        if (params.zone) {
            url['queryParams']['__tz'] = params.zone;
        }
        if (params.tags) {
            for (var i in params.tags) {
                var tk = params.tags[i].alias;
                var tv = params.tags[i].filter;
                if (tk && tv) {
                    url['queryParams'][tk] = tv;
                }
            }
        }
        this.updateLocationURL(url);
    }
}
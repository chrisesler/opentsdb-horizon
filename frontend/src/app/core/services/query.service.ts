import { Injectable } from '@angular/core';
import { YamasService } from './yamas.service';

@Injectable({
  providedIn: 'root'
})
export class QueryService {


    constructor(private yamas: YamasService) { }

    buildQuery(widget, time, queries, dashboardTags?) {
        const source = widget.settings.data_source;
        const summary = widget.settings.component_type === 'LinechartWidgetComponent' ? false : true;
        const downsample = widget.query && widget.query.settings && widget.query.settings.time ? widget.query.settings.time.downsample : {};
        return this[source].buildQuery(time, queries, downsample, summary, dashboardTags);
    }
}

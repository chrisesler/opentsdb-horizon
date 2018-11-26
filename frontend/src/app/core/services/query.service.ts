import { Injectable } from '@angular/core';
import { YamasService } from './yamas.service';

@Injectable({
  providedIn: 'root'
})
export class QueryService {


    constructor(private yamas: YamasService) { }

    buildQuery(widget, time, query) {
        const source = widget.settings.data_source;
        const summary = widget.settings.component_type === 'LinechartWidgetComponent' ? false : true;
        const downsample = widget.queries.settings && widget.queries.settings.time ? widget.queries.settings.time.downsample : {};
        return this[source].buildQuery(time, query, downsample, summary);
    }
}

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
        const downsample = widget.settings && widget.settings.time ? widget.settings.time.downsample : { aggregator: 'avg'};
        const sorting = widget.settings && widget.settings.sorting ? widget.settings.sorting : {};
        return this[source].buildQuery(time, query, downsample, summary, sorting);
    }
}

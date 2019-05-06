import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardConverterService {

  currentVersion = 3;

  constructor(private utils: UtilsService) { }

  // call to convert dashboad to currentVersion
  convert(dashboard: any) {
    for (let i = dashboard.content.version + 1; i <= this.currentVersion; i++) {
      if (this['toDBVersion' + i] instanceof Function) {
        this['toDBVersion' + i](dashboard);
      }
    }
    return dashboard;
  }
  // to return current max version of dashboard
  getDBCurrentVersion() {
    return this.currentVersion;
  }

  // update dashboard to version 2
  toDBVersion2(dashboard: any) {
    dashboard.content.version = 2;
    const widgets = dashboard.content.widgets;
    for (let i = 0; i < widgets.length; i++) {
      const queries = widgets[i].queries;
      for (let j = 0; j < queries.length; j++) {
        const metrics = queries[j].metrics;
        const filters = queries[j].filters;
        const groupByTags = [];
        for (let k = 0; k < filters.length; k++) {
          if (filters[k].groupBy === true) {
            groupByTags.push(filters[k].tagk);
          }
        }
        for (let k = 0; k < metrics.length; k++) {
          // metrics
          if (metrics[k].expression === undefined && !metrics[k].groupByTags) {
            metrics[k].tagAggregator = metrics[k].tagAggregator || 'sum';
            metrics[k].groupByTags = groupByTags;
          }
          if (metrics[k].expression && metrics[k].metrics) {
            metrics[k].expression = metrics[k].originalExpression;
            const emetrics = metrics[k].metrics;
            // add missing metric to the metric list
            for (let m = 0; m < emetrics.length; m++) {
              const pos = emetrics[m].name.indexOf('.') + 1;
              emetrics[m].metric = emetrics[m].name.substr(pos);
              const metric = metrics.find(d => d.expression === undefined && d.name === emetrics[m].metric);
              if (!metric) {
                const oMetric = {
                  id: this.utils.generateId(3),
                  name: emetrics[m].metric,
                  settings: {
                    visual: {
                      visible: false,
                      color: 'auto',
                      label: ''
                    }
                  },
                  tagAggregator: 'sum',
                  functions: []
                };
                metrics.push(oMetric);
              }
            }
            for (let m = 0; m < emetrics.length; m++) {
              const pos = emetrics[m].name.indexOf('.') + 1;
              emetrics[m].metric = emetrics[m].name.substr(pos);
              const metric = metrics.find(d => d.expression === undefined && d.name === emetrics[m].metric);
              emetrics[m].newId = metric ? metric.id : null;
              const reg = new RegExp(emetrics[m].refId, 'g');
              metrics[k].expression = metrics[k].expression.replace(reg, '{{' + emetrics[m].newId + '}}');
            }
          }
        }
      }
    }
    return dashboard;
  }
  // update dashboard to version 3
  toDBVersion3(dashboard: any) {

    return dashboard;
  }


}

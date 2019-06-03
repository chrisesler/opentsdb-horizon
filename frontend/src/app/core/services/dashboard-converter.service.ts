import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material';

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
        dashboard = this['toDBVersion' + i](dashboard);
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
  // update dashboard to version 3, we move tplVariables to top and remove
  // enable things
  toDBVersion3(dashboard: any) {
    dashboard.content.version = 3;
    const tplVariables = [...dashboard.content.settings.variables.tplVariables];
    for (let i = 0; i < tplVariables.length; i++) {
        const varObj: any = tplVariables[i];
        // remove this property
        if (varObj.hasOwnProperty('enabled')) {
          delete varObj.enabled;
        }
        if (varObj.hasOwnProperty('allowedValues')) {
          delete varObj.allowedValues;
        }
        if (varObj.hasOwnProperty('type')) {
          delete varObj.type;
        }
        // take first value only if many
        if (varObj.filter.length > 0) {
          varObj.filter = varObj.filter[0];
        }
    }
    // dashboard mode was set wrong to true in some dashboards
    dashboard.content.settings.mode = 'dashboard';
    // clean up tags and lastQueriedTagValues
    if (dashboard.content.settings.tags) {
      delete dashboard.content.settings.tags;
    }
    if (dashboard.content.settings.lastQueriedTagValues) {
      delete dashboard.content.settings.lastQueriedTagValues;
    }
    // delete the old one
    delete dashboard.content.settings.variables;
    dashboard.content.settings.tplVariables = tplVariables;

    // we also need to convert topN chart to make sure only 1 series is enable
    const widgets = [...dashboard.content.widgets];
    for (let i = 0; i < widgets.length; i++) {
      const widget = widgets[i];
      if (widget.settings.component_type === 'TopnWidgetComponent') {
        const idx = [];
        for (let j = 0; j < widget.queries[0].metrics.length; j++) {
          if (widget.queries[0].metrics[j].settings.visual.visible) {
            idx.push(j);
          }
        }
        if (idx.length > 1) {
          for (let k = 1; i < idx.length; k++) {
            widget.queries[0].metrics[idx[k]].settings.visual.visible = false;
          }
        }
      }
    }
    dashboard.content.widgets = widgets;
    return dashboard;
  }
}

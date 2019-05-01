import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';

@Injectable()
export class DashboardService {

  version = 2;

  private dashboardProto: any = {
    settings: {
        time: {
          start: '1h',
          end: 'now',
          zone: 'local'
        },
        meta: {
            title: 'My Dashboard',
            description: '',
            labels: [],
            namespace: '',
            isPersonal: false,
        },
        variables: {
            enabled: true,
            tplVariables: []
        }
    },
    widgets: [
    ]
  };

  private widgetPrototype = {
    gridPos: {
      x: 0, y: 0,
      h: 5, w: 12,
      xMd: 0, yMd: 0,
      wMd: 12, hMd: 5,
      xSm: 0, ySm: 0,
      wSm: 1, hSm: 1
    },
    settings: {
      title: 'my widget',
      component_type: 'PlaceholderWidgetComponent',
      data_source: 'yamas',
      visual: {},
        axes: {},
        legend: {},
        time: {
            downsample: {
                value: 'auto',
                aggregator: 'avg',
                customValue: '',
                customUnit: ''
            }
        }
    },
    queries: []
  };

  private widgetsConfig = {};

  constructor(private utils: UtilsService) { }


  setWigetsConfig(conf) {
    this.widgetsConfig = {...conf};
  }

  getWidgetPrototype(type= ''): any {
    const widget: any = JSON.parse(JSON.stringify(this.widgetPrototype));
    widget.id = this.utils.generateId();
    widget.settings.component_type = type;
    switch ( type ) {
        case 'LinechartWidgetComponent':
        case 'BarchartWidgetComponent':
        case 'StackedBarchartWidgetComponent':
        case 'DonutWidgetComponent':
        case 'TopnWidgetComponent':
        case 'DeveloperWidgetComponent':
        case 'BignumberWidgetComponent':
        case 'MarkdownWidgetComponent':
            break;
        default:
            widget.settings.component_type = 'PlaceholderWidgetComponent';
    }
    return widget;
  }

  getDashboardPrototype(): any {
    const dashboard: any = this.utils.deepClone(this.dashboardProto);
    const widget: any = this.utils.deepClone(this.getWidgetPrototype());
    dashboard.widgets.push(widget);
    return dashboard;
  }

  // help to put new widget on top.
  // set new position of first position down
  positionWidgetY(widgets: any, y) {
    const modWidgets = widgets;
    for (let i = 0; i < modWidgets.length; i++) {
      modWidgets[i].gridPos.y = modWidgets[i].gridPos.y + y;
      modWidgets[i].gridPos.yMd = modWidgets[i].gridPos.yMd + y;
    }
    return modWidgets;
  }

  getMetricsFromWidgets( widgets ) {
    const metrics = [];
    for ( let i = 0; i < widgets.length; i++ ) {
        const queries = widgets[i].queries;
        for ( let j = 0; j < queries.length; j++ ) {
            for ( let k = 0; k < queries[j].metrics.length; k++ ) {
                if ( !queries[j].metrics[k].expression ) {
                    metrics.push(queries[j].namespace + '.' + queries[j].metrics[k].name);
                }
            }
        }
    }
    return metrics;
  }

  filterMetrics(query) {
    query.metrics = query.metrics.filter(item => item.settings.visual.visible === true);
    return query;
  }
  overrideQueryFilters(query, filters, tags=[]) {
    for (let i = 0; i < filters.length; i++) {
      let tagExists = false;
      for (let j = 0; query.filters && j < query.filters.length; j++) {
        if (filters[i].tagk === query.filters[j].tagk && filters[i].filter && filters[i].filter.length) {
          query.filters[j].filter = filters[i].filter;
          tagExists = true;
        }
      }
      if ( !tagExists && tags.indexOf(filters[i].tagk)!== -1 ) {
        query.filters.push( { tagk: filters[i].tagk ,  filter: filters[i].filter} );
      }
    }
    return query;
  }

  addGridterInfo(widgets: any[]) {
    for (let i = 0; i < widgets.length; i++) {
      const w = widgets[i];
      const gpos = widgets[i].gridPos;
      const gridResp = {
        xMd: gpos.x,
        yMd: gpos.y,
        wMd: gpos.w,
        hMd: gpos.h,
        xSm: gpos.x,
        ySm: gpos.y,
        wSm: 1,
        hSm: 1
      };
      widgets[i].gridPos = {...widgets[i].gridPos, ...gridResp};
    }
  }

  getStorableFormatFromDBState(dbstate) {
    const widgets = this.utils.deepClone(dbstate.Widgets.widgets);
    for (let i = 0; i < widgets.length; i++) {
      delete widgets[i].gridPos.xMd;
      delete widgets[i].gridPos.yMd;
      delete widgets[i].gridPos.wMd;
      delete widgets[i].gridPos.hMd;
      delete widgets[i].gridPos.xSm;
      delete widgets[i].gridPos.ySm;
      delete widgets[i].gridPos.wSm;
      delete widgets[i].gridPos.hSm;
    }
    const dashboard = {
      version: this.version,
      settings: dbstate.Settings,
      widgets: widgets
    };
    return dashboard;
  }

  convert(dashboard) {
    if ( !dashboard.content.version || dashboard.content.version < this.version ) {
      dashboard.version = 2;
      const widgets = dashboard.content.widgets;
      for ( let i = 0; i < widgets.length; i++ ) {
        const queries = widgets[i].queries;
        for ( let j = 0; j < queries.length; j++ ) {
          const metrics = queries[j].metrics;
          const filters = queries[j].filters;
          const groupByTags = [];
          for ( let k = 0; k < filters.length; k++ ) {
            if (filters[k].groupBy === true ) {
              groupByTags.push(filters[k].tagk);
            }
          }
          for ( let k = 0; k < metrics.length; k++ ) {
            // metrics
            if ( metrics[k].expression === undefined && !metrics[k].groupByTags ) {
              metrics[k].tagAggregator = metrics[k].tagAggregator || 'sum';
              metrics[k].groupByTags = groupByTags;
            }
            if ( metrics[k].expression && metrics[k].metrics) {
              metrics[k].expression = metrics[k].originalExpression;
              const emetrics = metrics[k].metrics;
              // add missing metric to the metric list
              for ( let m = 0; m < emetrics.length; m++ ) {
                const pos = emetrics[m].name.indexOf('.') + 1;
                emetrics[m].metric = emetrics[m].name.substr(pos);
                const metric = metrics.find(d => d.expression === undefined && d.name === emetrics[m].metric);
                if ( !metric ) {
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
              for ( let m = 0; m < emetrics.length; m++ ) {
                const pos = emetrics[m].name.indexOf('.') + 1;
                emetrics[m].metric = emetrics[m].name.substr(pos);
                const metric = metrics.find(d => d.expression === undefined && d.name === emetrics[m].metric);
                emetrics[m].newId = metric ? metric.id : null;
                const reg = new RegExp(emetrics[m].refId, 'g');
                metrics[k].expression = metrics[k].expression.replace(reg, '{{' + emetrics[m].newId + '}}' );
              }
            }
          }
        }
      }
    }
    return dashboard;
  }
}


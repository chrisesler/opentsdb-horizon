import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';

@Injectable()
export class DashboardService {

  private dashboardProto: any = {
    settings: {
        time: {
          start: '1h',
          end: 'now',
          zone: 'local'
        },
        meta: {
            title: 'Untitled Dashboard',
            description: '',
            labels: [],
            namespace: '',
            isPersonal: false,
        },
        variables: {
            enabled: false,
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
      dragAndDrop: true,
      resizable: true
    },
    settings: {
      title: 'untitled',
      component_type: 'PlaceholderWidgetComponent',
      data_source: 'yamas'
    },
    query: {
        settings: {
            visual: {},
            axes: {},
            legend: {},
            time: {
                downsample: {
                    value: '1m',
                    aggregator: 'sum',
                    customValue: '',
                    customUnit: ''
                }
            }
        },
        groups: [
                    {
                        id: '',
                        title: 'untitled group',
                        queries: [],
                        settings: {
                            visual: {
                                visible : true
                            }
                        }
                    }
                ]
    }

  };

  private widgetsConfig = {};

  constructor(private utils: UtilsService) { }


  setWigetsConfig(conf) {
    this.widgetsConfig = {...conf};
  }

  getWidgetConfigById(id) {
    return this.updateWidgetsDimension[id];
  }

  getWidgetPrototype(type= ''): any {
    const widget: any = Object.assign({}, this.widgetPrototype);
    widget.id = this.utils.generateId();
    widget.query.groups[0].id = this.utils.generateId();
    widget.settings.component_type = type;
    switch ( type ) {
        case 'LinechartWidgetComponent':
        case 'BarchartWidgetComponent':
        case 'StackedBarchartWidgetComponent':
        case 'DonutWidgetComponent':
        case 'DeveloperWidgetComponent':
        case 'BignumberWidgetComponent':
            break;
        default:
            widget.settings.component_type = 'PlaceholderWidgetComponent';
    }
    return widget;
  }

  getDashboardPrototype(): any {
    const dashboard: any = Object.assign({}, this.dashboardProto);
    const widget = this.getWidgetPrototype();
    widget.gridPos.w = 6;
    dashboard.widgets.push(widget);
    return dashboard;
  }

  // help to put new widget on top.
  // set new position of first position down
  positionWidgetY(widgets: any, y) {
    for (let i = 0; i < widgets.length; i++) {
        const wd: any = widgets[i];
        wd.gridPos.y += y; wd.gridPos.yMd += y;
    }
    return widgets;
  }

  getMetricsFromWidgets( widgets ) {
    const metrics = [];
    for ( let i = 0; i < widgets.length; i++ ) {
        const groups = widgets[i].query.groups;
        for ( let j = 0; j < groups.length; j++ ) {
            const queries = groups[j].queries;
            for ( let k = 0; k < queries.length; k++ ) {
                if ( queries[k].metric ) {
                    metrics.push(queries[k].metric);
                } else {
                    for ( let l = 0; l < queries[k].metrics.length; l++ ) {
                        metrics.push(queries[k].metrics[l].metric);
                    }
                }
            }
        }
    }
    return metrics;
  }

    overrideQueryFilters(queries, filters) {
        for ( let i = 0; i < filters.length; i++ ) {
            for ( let j = 0; j < queries.length; j++ ) {
                for ( let k = 0; queries[j].filters && k < queries[j].filters.length; k++ ) {
                    console.log(k, filters[i].tagk , queries[j].filters[k].tagk, filters[i].tagk === queries[j].filters[k].tagk);
                    if ( filters[i].tagk === queries[j].filters[k].tagk ) {
                        queries[j].filters[k].filter = filters[i].filter;
                        queries[j].filters[k].type = filters[i].type;
                    }
                }
            }
        }
        return queries;
    }

  // we might not need to generate id for widget or group
  // it should be done at the time of adding into dashboard
  // this function only here for testing stuff

/*
  addNewWidget(widgets: any[]) {
    const widget: any = Object.assign({}, this.widgetPrototype);
    widget.id = this.utils.generateId();
    // before adding, we more the first one down
    for (let i = 0; i < widgets.length; i++) {
      const wd: any = widgets[i];
      if (wd.gridPos.x === 0 && wd.gridPos.y === 0) {
        wd.gridPos.y = wd.gridPos.yMd = 5;
        break;
      }
    }
    widgets.unshift(widget);
    return widgets;
  }
*/
  updateWidgetsDimension(width, height, pWidgets) {
    /*
    for (let i = 0; i < pWidgets.length; i++) {
      const clientSize = {
        'width': width * pWidgets[i].gridPos.w,
        'height': height * pWidgets[i].gridPos.h
      };
      pWidgets[i].clientSize = clientSize;
      // also update position from xMd and yMd
      // since x,y not updated when resize, grad
      pWidgets[i].gridPos.x = pWidgets[i].gridPos.xMd;
      pWidgets[i].gridPos.y = pWidgets[i].gridPos.yMd;
    }
    */
  }
}

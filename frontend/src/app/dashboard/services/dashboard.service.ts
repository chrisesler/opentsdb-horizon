import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';

@Injectable()
export class DashboardService {

  private dashboardProto: any = {
    id: '',
    settings: {
      title: 'untitle dashboard'
    },
    widgets:[
      {
        gridPos: {
        x: 0, y: 0,
        w: 6, h: 5
        },
        config: {
          title: 'PlaceholderWidgetComponent',
          component_type: 'PlaceholderWidgetComponent',
          data_source: ''          
        }
      }
    ]
  };
   
  private widgetPrototype = {
    gridPos: {
      x: 0, y: 0,
      h: 5, w: 6,
      xMd: 0, yMd: 0,
      dragAndDrop: true,
      resizable: true
    },
    config: {
      title: 'untitled',
      component_type: 'PlaceholderWidgetComponent'
    }
  };

  constructor(private utils: UtilsService) { }

  getWidgetPrototype(): any {
    const widget: any = Object.assign({}, this.widgetPrototype);
    widget.id = this.utils.generateId();
    return widget;
  }

  getDashboardPrototype(): any {
    const dashboard: any = Object.assign({}, this.dashboardProto);
    dashboard.id = this.utils.generateId(8);
    this.modifyWidgets(dashboard);
    return dashboard;
  }

  // help to put new widget on top.
  // set new position of first position down
  positionWidget(widgets: any) {
    for (let i = 0; i < widgets.length; i++) {
      const wd: any = widgets[i];
      if (wd.gridPos.x === 0 && wd.gridPos.y === 0) {
        wd.gridPos.y = wd.gridPos.yMd = 5;
        break;
      }
    }
    return widgets;
  }

  modifyWidgets(dashboard: any) {
    // add extra info item behaviors
    for (let i = 0; i < dashboard.widgets.length; i++) {
      const wd: any = dashboard.widgets[i];
      wd.id = this.utils.generateId();
      const mod = { 'xMd': wd.gridPos.x, 'yMd': wd.gridPos.y, 'dragAndDrop': true, 'resizable': true };
      wd.gridPos = { ...wd.gridPos, ...mod };
    }
  }
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
  }
}

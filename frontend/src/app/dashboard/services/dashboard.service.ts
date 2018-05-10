import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';

@Injectable()
export class DashboardService {
  private widgetPrototype = {
    gPosition: {
      x: 0, y: 0,
      h: 5, w: 6,
      xMd: 0, yMd: 0,
      dragAndDrop: true,
      resizable: true
    },
    config: {
      title: 'untitle'
    }
  };

  constructor(private utils: UtilsService) {
    
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

  addNewWidget() {
    /*
    const widget: any = Object.assign({}, this.widgetPrototype);
    widget.id = this.utils.generateId();
    // before adding, we more the first one down
    for (let i = 0; i < this.dashboard.widgets.length; i++) {
      const wd: any = this.dashboard.widgets[i];
      if (wd.gPosition.x === 0 && wd.gPosition.y === 0) {
        wd.gPosition.y = wd.gPosition.yMd = 1;
        break;
      }
    }
    this.dashboard.widgets.unshift(widget);
   */
  }

  updateWidgetsDimension(width, height, pWidgets) {
    
    for (let i = 0; i < pWidgets.length; i++) {
      const clientSize = {
        'width': width * pWidgets[i].gridPos.w,
        'height': height * pWidgets[i].gridPos.h
      };
      pWidgets[i].clientSize = clientSize;
    }
    
  }
}

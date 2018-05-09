import { Injectable } from '@angular/core';
import { UtilsService } from '../../core/services/utils.service';
import { IntercomService, IMessage } from './intercom.service';

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

  public dashboard: any  = {
    name: 'My dashboard',
    id: '123456',
    widgets: [
      {
        gPosition: {
          x: 0, y: 0,
          w: 6, h: 5
        },
        config: {
          title: 'One',
          component_type: 'WsampleComponent'
        }
      },
      {
        gPosition: {
          x: 0, y: 5,
          w: 6, h: 5,
        },
        config: {
          title: 'Two',
          component_type: 'WsampleComponent'
        }
      },
      {
        gPosition: {
          x: 6, y: 0,
          w: 6, h: 7
        },
        config: {
          title: 'Three',
          component_type: 'LineChartComponent'
        }
      },
      {
        gPosition: {
          x: 6, y: 5,
          w: 6, h: 5,
        },
        config: {
          title: 'Four',
          component_type: 'StaticImageComponent'
        }
      }
    ]
  };

  constructor(private interCom:IntercomService, private utils: UtilsService) {
    this.initWidgets();
  }

  initWidgets() {
    // add extra info item behaviors
    for (let i = 0; i < this.dashboard.widgets.length; i++) {
      const wd: any = this.dashboard.widgets[i];
      wd.config.id = this.utils.generateId();
      const mod = { 'xMd': wd.gPosition.x, 'yMd': wd.gPosition.y, 'dragAndDrop': true, 'resizable': true };
      wd.gPosition = { ...wd.gPosition, ...mod };
    }
  }

  addNewWidget() {
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
  }

  updateWidgetsDimension(width, height, pWidgets) {
    for (let i = 0; i < pWidgets.length; i++) {
      const clientSize = {
        'width': width * pWidgets[i].gPosition.w,
        'height': height * pWidgets[i].gPosition.h
      };
      pWidgets[i].clientSize = clientSize;
      this.interCom.responsePut({id:pWidgets[i].config.id,action:"resizeWidget",payload:clientSize});
    }

    this.dashboard.widgets = pWidgets;
  }
}

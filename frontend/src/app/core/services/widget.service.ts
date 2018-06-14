import { Injectable } from '@angular/core';
import { WidgetbaseComponent } from '../../dashboard/widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from '../../dashboard/widgets/components/wsample/wsample.component';
import { LineChartComponent } from '../../dashboard/widgets/components/chartjs/line-chart.component'
import { PlaceholderWidgetComponent } from '../../shared/modules/dynamic-widgets/components/placeholder-widget/placeholder-widget.component';
import { LinebarWidgetComponent } from '../../shared/modules/dynamic-widgets/components/linebar-widget/linebar-widget.component';

@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  
  constructor() { }

  getComponentToLoad(name: string) {
      switch (name) {
          case 'WsampleComponent':
              return WsampleComponent;
          case 'LineChartComponent':
              return LineChartComponent;
          case 'LinebarWidgetComponent':
              return LinebarWidgetComponent;
          default:
              return PlaceholderWidgetComponent;
      }
  }
}

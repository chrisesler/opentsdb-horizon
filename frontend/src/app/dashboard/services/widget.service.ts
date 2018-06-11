import { Injectable } from '@angular/core';
import { WidgetbaseComponent } from '../widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from '../widgets/components/wsample/wsample.component';
import { LineChartComponent } from '../widgets/components/chartjs/line-chart.component';


@Injectable()
export class WidgetService {

    constructor() { }

    getComponentToLoad(name: string) {
        switch (name) {
            case 'WsampleComponent':
                return WsampleComponent;
            case 'LineChartComponent':
                return LineChartComponent;
            default:
                return WidgetbaseComponent;
        }
    }
}

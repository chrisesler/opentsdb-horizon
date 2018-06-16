import { Injectable } from '@angular/core';
import { WidgetbaseComponent } from '../../dashboard/widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from '../../dashboard/widgets/components/wsample/wsample.component';
import { LineChartComponent } from '../../dashboard/widgets/components/chartjs/line-chart.component';

import {
    PlaceholderWidgetComponent,
    LinebarWidgetComponent,
    DeveloperWidgetComponent
} from '../../shared/modules/dynamic-widgets';

@Injectable({
    providedIn: 'root'
})
export class WidgetService {
    constructor() { }

    getComponentToLoad(name: string) {
        switch (name) {
            case 'WidgetbaseComponent':
                return WidgetbaseComponent;
            case 'LineChartComponent':
                return LineChartComponent;
            case 'LinebarWidgetComponent':
                return LinebarWidgetComponent;
            case 'DeveloperWidgetComponent':
                return DeveloperWidgetComponent;
            default:
                return PlaceholderWidgetComponent;
        }
    }
}

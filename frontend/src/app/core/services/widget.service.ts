import { Injectable } from '@angular/core';

import {
    PlaceholderWidgetComponent,
    LinechartWidgetComponent,
    BarchartWidgetComponent,
    DonutWidgetComponent,
    DeveloperWidgetComponent
} from '../../shared/modules/dynamic-widgets/components';

@Injectable({
    providedIn: 'root'
})
export class WidgetService {
    constructor() { }

    getComponentToLoad(name: string) {
        switch (name) {
            case 'LinechartWidgetComponent':
                return LinechartWidgetComponent;
            case 'BarchartWidgetComponent':
                return BarchartWidgetComponent;
            case 'DonutWidgetComponent':
                return DonutWidgetComponent;
            case 'DeveloperWidgetComponent':
                return DeveloperWidgetComponent;
            default:
                return PlaceholderWidgetComponent;
        }
    }
}

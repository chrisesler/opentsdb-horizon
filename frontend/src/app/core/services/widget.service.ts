import { Injectable } from '@angular/core';
import {
    PlaceholderWidgetComponent,
    LinechartWidgetComponent,
    BarchartWidgetComponent,
    StackedBarchartWidgetComponent,
    DonutWidgetComponent,
    DeveloperWidgetComponent,
    BignumberWidgetComponent
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
            case 'StackedBarchartWidgetComponent':
                return StackedBarchartWidgetComponent;
            case 'DonutWidgetComponent':
                return DonutWidgetComponent;
            case 'DeveloperWidgetComponent':
                return DeveloperWidgetComponent;
            case 'BignumberWidgetComponent':
                return BignumberWidgetComponent;
            default:
                return PlaceholderWidgetComponent;
        }
    }
}

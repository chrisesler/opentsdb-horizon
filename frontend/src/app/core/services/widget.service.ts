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

    getWidgetDefaultSettings(name: string ) {
        let settings = {};
        switch (name) {
            case 'LinechartWidgetComponent':
                settings =  {
                    axes: {
                        y1: {},
                        y2: {}
                    }
                };
                break;
            case 'DonutWidgetComponent':
                settings = {
                    legend: {
                        display: true,
                        position: 'right'
                    }
                };
                break;
            case 'BignumberWidgetComponent':
                settings = {
                    visual: {
                        queryID: 0
                    }
                };
        }
        return settings;
    }
}

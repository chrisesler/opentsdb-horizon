import { Injectable } from '@angular/core';
import {
    PlaceholderWidgetComponent,
    LinechartWidgetComponent,
    HeatmapWidgetComponent,
    BarchartWidgetComponent,
    StackedBarchartWidgetComponent,
    DonutWidgetComponent,
    TopnWidgetComponent,
    DeveloperWidgetComponent,
    BignumberWidgetComponent,
    MarkdownWidgetComponent,
    EventsWidgetComponent
} from '../../shared/modules/dynamic-widgets/components';

@Injectable({
    providedIn: 'root'
})
export class WidgetService {
    constructor() { }

    getComponentToLoad(name: string) {
        console.log(name);
        switch (name) {
            case 'LinechartWidgetComponent':
                return LinechartWidgetComponent;
            case 'HeatmapWidgetComponent':
                return HeatmapWidgetComponent;
            case 'BarchartWidgetComponent':
                return BarchartWidgetComponent;
            case 'StackedBarchartWidgetComponent':
                return StackedBarchartWidgetComponent;
            case 'DonutWidgetComponent':
                return DonutWidgetComponent;
            case 'TopnWidgetComponent':
                return TopnWidgetComponent;
            case 'DeveloperWidgetComponent':
                return DeveloperWidgetComponent;
            case 'BignumberWidgetComponent':
                return BignumberWidgetComponent;
            case 'MarkdownWidgetComponent':
                return MarkdownWidgetComponent;
            case 'EventsWidgetComponent':
                return EventsWidgetComponent;
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
                    dataSummary: true,
                    legend: {
                        display: true,
                        position: 'right'
                    }
                };
                break;
            case 'BarchartWidgetComponent':
            case 'TopnWidgetComponent':
                settings = {
                    dataSummary: true,
                };
                break;
            case 'BignumberWidgetComponent':
                settings = {
                    dataSummary: true,
                    visual: {
                        queryID: 0
                    }
                };
        }
        return settings;
    }
}

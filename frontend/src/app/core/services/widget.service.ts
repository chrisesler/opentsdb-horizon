import { Injectable } from '@angular/core';

import {
    PlaceholderWidgetComponent,
    LinechartWidgetComponent,
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
            case 'DeveloperWidgetComponent':
                return DeveloperWidgetComponent;
            default:
                return PlaceholderWidgetComponent;
        }
    }
}

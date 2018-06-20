/** Angular items */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Other modules */
import { MaterialModule } from '../../../shared/modules/material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';
import { SharedcomponentsModule } from '../sharedcomponents/sharedcomponents.module';

import { PlaceholderWidgetComponent } from './components/placeholder-widget/placeholder-widget.component';
import { LinebarWidgetComponent } from './components/linebar-widget/linebar-widget.component';
import { DeveloperWidgetComponent } from './components/developer-widget/developer-widget.component';
import { BignumberWidgetComponent } from './components/bignumber-widget/bignumber-widget.component';
import { DonutWidgetComponent } from './components/donut-widget/donut-widget.component';
import { StatusWidgetComponent } from './components/status-widget/status-widget.component';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        DygraphsModule,
        SharedcomponentsModule
    ],
    exports: [
        PlaceholderWidgetComponent,
        LinebarWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        DonutWidgetComponent,
        StatusWidgetComponent
    ],
    declarations: [
        PlaceholderWidgetComponent,
        LinebarWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        DonutWidgetComponent,
        StatusWidgetComponent
    ],
    entryComponents: [
        PlaceholderWidgetComponent,
        LinebarWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        DonutWidgetComponent,
        StatusWidgetComponent
    ]
})
export class DynamicWidgetsModule { }

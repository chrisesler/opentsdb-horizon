/** Angular items */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Other modules */
import { MaterialModule } from '../../../shared/modules/material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';
import { SharedcomponentsModule } from '../sharedcomponents/sharedcomponents.module';

/** public items from DynamicWidgetsModule */
import { PlaceholderWidgetComponent } from './components/placeholder-widget/placeholder-widget.component';
import { LinebarWidgetComponent } from './components/linebar-widget/linebar-widget.component';
import { DeveloperWidgetComponent } from './components/developer-widget/developer-widget.component';

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
        DeveloperWidgetComponent
    ],
    declarations: [
        PlaceholderWidgetComponent,
        LinebarWidgetComponent,
        DeveloperWidgetComponent
    ],
    entryComponents: [
        PlaceholderWidgetComponent,
        LinebarWidgetComponent,
        DeveloperWidgetComponent
    ]
})
export class DynamicWidgetsModule { }

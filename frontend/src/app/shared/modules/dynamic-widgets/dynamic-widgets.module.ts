/** Angular items */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Other modules */
import { MaterialModule } from '../material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';
import { ChartjsModule } from '../chartjs/chartjs.module';
import { SharedcomponentsModule } from '../sharedcomponents/sharedcomponents.module';

import { PlaceholderWidgetComponent } from './components/placeholder-widget/placeholder-widget.component';
import { LinechartWidgetComponent } from './components/linechart-widget/linechart-widget.component';
import { DeveloperWidgetComponent } from './components/developer-widget/developer-widget.component';

import {
    BignumberWidgetComponent,
    BignumberVisualAppearanceComponent,
    BignumberConfigMetricQueriesComponent
} from './components/bignumber-widget';

import {
    DonutWidgetComponent,
    DonutchartLegendComponent,
    DonutchartConfigMetricQueriesComponent
} from './components/donut-widget';

import {
    BarchartWidgetComponent,
    StackedBarchartWidgetComponent,
    StackedBarchartVisualAppearanceComponent,
    BarchartConfigMetricQueriesComponent,
    StackedBarchartConfigMetricQueriesComponent,
    DropdownStacksComponent
} from './components/barchart-widget';

import { StatusWidgetComponent } from './components/status-widget/status-widget.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DygraphsModule,
        ChartjsModule,
        SharedcomponentsModule
    ],
    exports: [
        PlaceholderWidgetComponent,
        LinechartWidgetComponent,
        BarchartWidgetComponent,
        StackedBarchartWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        BignumberVisualAppearanceComponent,
        DonutWidgetComponent,
        StatusWidgetComponent,
        StackedBarchartVisualAppearanceComponent,
        StackedBarchartConfigMetricQueriesComponent,
        DonutchartLegendComponent
    ],
    declarations: [
        PlaceholderWidgetComponent,
        LinechartWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        BignumberVisualAppearanceComponent,
        DonutWidgetComponent,
        StatusWidgetComponent,
        BarchartWidgetComponent,
        StackedBarchartWidgetComponent,
        StackedBarchartVisualAppearanceComponent,
        DonutchartLegendComponent,
        DonutchartConfigMetricQueriesComponent,
        BarchartConfigMetricQueriesComponent,
        BignumberConfigMetricQueriesComponent,
        StackedBarchartConfigMetricQueriesComponent,
        DropdownStacksComponent
    ],
    entryComponents: [
        PlaceholderWidgetComponent,
        LinechartWidgetComponent,
        BarchartWidgetComponent,
        StackedBarchartWidgetComponent,
        DeveloperWidgetComponent,
        BignumberWidgetComponent,
        BignumberVisualAppearanceComponent,
        DonutWidgetComponent,
        StatusWidgetComponent
    ]
})
export class DynamicWidgetsModule { }

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
import { BignumberWidgetComponent } from './components/bignumber-widget/bignumber-widget.component';
// tslint:disable-next-line:max-line-length
import { BignumberVisualAppearanceComponent } from './components/bignumber-widget/children/big-number-visual-appearance/big-number-visual-appearance.component';
import { DonutWidgetComponent } from './components/donut-widget/donut-widget.component';
import { StatusWidgetComponent } from './components/status-widget/status-widget.component';
import { BarchartWidgetComponent, StackedBarchartWidgetComponent } from './components/barchart-widget/barchart-widget.component';
import { StackedBarchartVisualAppearanceComponent } from './components/barchart-widget/children/stacked-barchart-visual-appearance/stacked-barchart-visual-appearance.component';
import { DonutchartLegendComponent } from './components/donut-widget/children/donutchart-legend/donutchart-legend.component';
import { DonutchartConfigMetricQueriesComponent } from './components/donut-widget/children/donutchart-config-metric-queries/donutchart-config-metric-queries.component';


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
        DonutchartConfigMetricQueriesComponent
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

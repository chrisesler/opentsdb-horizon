/** Angular items */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Other modules */
import { MaterialModule } from '../material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';
import { ChartjsModule } from '../chartjs/chartjs.module';
import { DateTimePickerModule } from '../date-time-picker/date-time-picker.module';
import { ColorPickerModule } from '../color-picker/color-picker.module';

/** public items from Sharedcomponents */

 // other components
 // tslint:disable:max-line-length
import { SearchMetricsDialogComponent } from './components/search-metrics-dialog/search-metrics-dialog.component';
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';

 // widget config components
import { WidgetConfigAlertsComponent } from './components/widget-config-alerts/widget-config-alerts.component';
import { WidgetConfigAxesComponent } from './components/widget-config-axes/widget-config-axes.component';
import { WidgetConfigGeneralComponent } from './components/widget-config-general/widget-config-general.component';
import { WidgetConfigMetricQueriesComponent } from './components/widget-config-metric-queries/widget-config-metric-queries.component';
import { WidgetConfigTimeComponent } from './components/widget-config-time/widget-config-time.component';
import { WidgetConfigVisualAppearanceComponent } from './components/widget-config-visual-appearance/widget-config-visual-appearance.component';
import { WidgetConfigQueryInspectorComponent } from './components/widget-config-query-inspector/widget-config-query-inspector.component';
import { WidgetConfigLegendComponent } from './components/widget-config-legend/widget-config-legend.component';
import { WidgetConfigVisualAppearanceBigNumberComponent } from './components/widget-config-visual-appearance-big-number/widget-config-visual-appearance-big-number.component';
import { WidgetConfigLegendBigNumberComponent } from './components/widget-config-legend-big-number/widget-config-legend-big-number.component';
import { InlineEditableComponent } from './components/inline-editable/inline-editable.component';
import { SimpleTimePickerComponent } from './components/simple-time-picker/simple-time-picker.component';
import { ExpressionDialogComponent } from './components/expression-dialog/expression-dialog.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DygraphsModule,
        ChartjsModule,
        DateTimePickerModule,
        ColorPickerModule
    ],
    declarations: [
        SearchMetricsDialogComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent,
        WidgetConfigVisualAppearanceBigNumberComponent,
        WidgetConfigLegendBigNumberComponent,
        InlineEditableComponent,
        SimpleTimePickerComponent,
        ExpressionDialogComponent
    ],
    exports: [
        SearchMetricsDialogComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent,
        WidgetConfigVisualAppearanceBigNumberComponent,
        WidgetConfigLegendBigNumberComponent,
        DateTimePickerModule,
        SimpleTimePickerComponent,
        ColorPickerModule,
        InlineEditableComponent
    ],
    entryComponents: [
        SearchMetricsDialogComponent,
        ExpressionDialogComponent
    ]
})
export class SharedcomponentsModule { }

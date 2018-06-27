/** Angular items */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/** Other modules */
import { MaterialModule } from '../material/material.module';
import { DygraphsModule } from '../dygraphs/dygraphs.module';

/** public items from Sharedcomponents */

 // other components
import { SearchMetricsDialogComponent } from './components/search-metrics-dialog/search-metrics-dialog.component';
import { SimpleTimePickerComponent } from './components/simple-time-picker/simple-time-picker.component';
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';

 // widget config components
import { WidgetConfigAlertsComponent } from './components/widget-config-alerts/widget-config-alerts.component';
import { WidgetConfigAxesComponent } from './components/widget-config-axes/widget-config-axes.component';
import { WidgetConfigGeneralComponent } from './components/widget-config-general/widget-config-general.component';
import { WidgetConfigMetricQueriesComponent } from './components/widget-config-metric-queries/widget-config-metric-queries.component';
import { WidgetConfigTimeComponent } from './components/widget-config-time/widget-config-time.component';
// tslint:disable-next-line:max-line-length
import { WidgetConfigVisualAppearanceComponent } from './components/widget-config-visual-appearance/widget-config-visual-appearance.component';
import { WidgetConfigQueryInspectorComponent } from './components/widget-config-query-inspector/widget-config-query-inspector.component';
import { WidgetConfigLegendComponent } from './components/widget-config-legend/widget-config-legend.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DygraphsModule
    ],
    declarations: [
        SearchMetricsDialogComponent,
        SimpleTimePickerComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent
    ],
    exports: [
        SearchMetricsDialogComponent,
        SimpleTimePickerComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent
    ],
    entryComponents: [
        SearchMetricsDialogComponent
    ]
})
export class SharedcomponentsModule { }

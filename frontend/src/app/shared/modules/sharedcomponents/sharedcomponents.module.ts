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
 import { SearchMetricsDialogComponentV0 } from './components/search-metrics-dialog-v0/search-metrics-dialog.component-v0';
import { SearchMetricsDialogComponent } from './components/search-metrics-dialog/search-metrics-dialog.component';
import { ThemePickerComponent } from './components/theme-picker/theme-picker.component';
import { InlineEditableComponent } from './components/inline-editable/inline-editable.component';
import { SimpleTimePickerComponent } from './components/simple-time-picker/simple-time-picker.component';
import { ExpressionDialogComponent } from './components/expression-dialog/expression-dialog.component';
import { NavbarUserMenuComponent } from './components/navbar-user-menu/navbar-user-menu.component';
import { NavbarInfoMenuComponent } from './components/navbar-info-menu/navbar-info-menu.component';

 // widget config components
import { WidgetConfigAlertsComponent } from './components/widget-config-alerts/widget-config-alerts.component';
import { WidgetConfigAxesComponent } from './components/widget-config-axes/widget-config-axes.component';
import { WidgetConfigGeneralComponent } from './components/widget-config-general/widget-config-general.component';
import { WidgetConfigMetricQueriesComponent } from './components/widget-config-metric-queries/widget-config-metric-queries.component';
import { WidgetConfigTimeComponent } from './components/widget-config-time/widget-config-time.component';
import { WidgetConfigVisualAppearanceComponent } from './components/widget-config-visual-appearance/widget-config-visual-appearance.component';
import { WidgetConfigQueryInspectorComponent } from './components/widget-config-query-inspector/widget-config-query-inspector.component';
import { WidgetConfigLegendComponent } from './components/widget-config-legend/widget-config-legend.component';
import { WidgetConfigLegendBigNumberComponent } from './components/widget-config-legend-big-number/widget-config-legend-big-number.component';
import { DropdownLineWeightComponent } from './components/dropdown-line-weight/dropdown-line-weight.component';
import { DropdownLineTypeComponent } from './components/dropdown-line-type/dropdown-line-type.component';
import { DropdownVisualTypeComponent } from './components/dropdown-visual-type/dropdown-visual-type.component';
import { NavbarTimezoneToggleComponent } from './components/navbar-timezone-toggle/navbar-timezone-toggle.component';
import { NavbarSearchToggleComponent } from './components/navbar-search-toggle/navbar-search-toggle.component';
import { SearchAllDialogComponent } from './components/search-all-dialog/search-all-dialog.component';
import { DropdownAggregatorsComponent } from './components/dropdown-aggregators/dropdown-aggregators.component';
import { DropdownUnitTypeComponent } from './components/dropdown-unit-type/dropdown-unit-type.component';
import { GenericMessageBarComponent } from './components/generic-message-bar/generic-message-bar.component';
import { SimpleDashboardListComponent } from './components/simple-dashboard-list/simple-dashboard-list.component';
import { InlineQueryEditorComponent } from './components/inline-query-editor/inline-query-editor.component';
import { NamespaceAutocompleteComponent } from './components/namespace-autocomplete/namespace-autocomplete.component';
import { NamespaceTagAutocompleteComponent } from './components/namespace-tag-autocomplete/namespace-tag-autocomplete.component';
import { NamespaceTagValuesComponent } from './components/namespace-tag-values/namespace-tag-values.component';
import { TagvEditviewComponent } from './components/tagv-editview/tagv-editview.component';
import { QueryEditorComponent } from './components/query-editor/query-editor.component';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { TagAggregatorComponent } from './components/tag-aggregator/tag-aggregator.component';
import { TagGroupbyComponent } from './components/tag-groupby/tag-groupby.component';

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
        SearchMetricsDialogComponentV0,
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
        WidgetConfigLegendBigNumberComponent,
        InlineEditableComponent,
        SimpleTimePickerComponent,
        ExpressionDialogComponent,
        DropdownLineWeightComponent,
        DropdownLineTypeComponent,
        DropdownVisualTypeComponent,
        NavbarUserMenuComponent,
        NavbarInfoMenuComponent,
        NavbarTimezoneToggleComponent,
        NavbarSearchToggleComponent,
        SearchAllDialogComponent,
        DropdownAggregatorsComponent,
        DropdownUnitTypeComponent,
        GenericMessageBarComponent,
        SimpleDashboardListComponent,
        InlineQueryEditorComponent,
        NamespaceAutocompleteComponent,
        NamespaceTagAutocompleteComponent,
        NamespaceTagValuesComponent,
        TagvEditviewComponent,
        QueryEditorComponent,
        ErrorDialogComponent,
        TagAggregatorComponent,
        TagGroupbyComponent
    ],
    exports: [
        SearchMetricsDialogComponentV0,
        SearchMetricsDialogComponent,
        SearchAllDialogComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent,
        WidgetConfigLegendBigNumberComponent,
        DateTimePickerModule,
        SimpleTimePickerComponent,
        ColorPickerModule,
        InlineEditableComponent,
        DropdownLineWeightComponent,
        NavbarUserMenuComponent,
        NavbarInfoMenuComponent,
        NavbarTimezoneToggleComponent,
        NavbarSearchToggleComponent,
        DropdownAggregatorsComponent,
        GenericMessageBarComponent,
        SimpleDashboardListComponent,
        InlineQueryEditorComponent,
        NamespaceTagValuesComponent
    ],
    entryComponents: [
        SearchMetricsDialogComponentV0,
        SearchMetricsDialogComponent,
        SearchAllDialogComponent,
        ExpressionDialogComponent,
        InlineQueryEditorComponent,
        NamespaceTagValuesComponent,
        ErrorDialogComponent
    ],
})
export class SharedcomponentsModule { }

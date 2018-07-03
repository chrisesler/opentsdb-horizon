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
import { InlineEditableComponent } from './components/inline-editable/inline-editable.component';

//Time picker
import { TimePickerComponent } from './components/time-picker/time-picker/time-picker.component'
import { TimeRangePickerComponent } from './components/time-picker/time-range-picker/time-range-picker.component';
import { DayTimeCalendarComponent } from './components/time-picker/day-time-calendar/day-time-calendar.component';
import { DayCalendarComponent } from './components/time-picker/day-calendar/day-calendar.component';
import { MonthCalendarComponent } from './components/time-picker/month-calendar/month-calendar.component';
import { CalendarNavComponent } from './components/time-picker/calendar-nav/calendar-nav.component';

import { DayTimeCalendarService } from './components/time-picker/day-time-calendar/day-time-calendar.service';
import { DayCalendarService } from './components/time-picker/day-calendar/day-calendar.service';
import { MonthCalendarService } from './components/time-picker/month-calendar/month-calendar.service';
import { TimeSelectService } from './components/time-picker/time-select/time-select.service';
import { UtilsService } from './components/time-picker/common/services/utils.service';
import { DatePickerComponent } from './components/time-picker/date-picker/date-picker.component';
import { DatePickerService } from './components/time-picker/date-picker/date-picker.service';
import { KeypadComponent } from './components/time-picker/keypad/keypad.component';

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
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent,
        InlineEditableComponent
    ],
    exports: [
        SearchMetricsDialogComponent,
        TimePickerComponent,
        ThemePickerComponent,
        WidgetConfigAlertsComponent,
        WidgetConfigAxesComponent,
        WidgetConfigGeneralComponent,
        WidgetConfigLegendComponent,
        WidgetConfigMetricQueriesComponent,
        WidgetConfigQueryInspectorComponent,
        WidgetConfigTimeComponent,
        WidgetConfigVisualAppearanceComponent,
        InlineEditableComponent
    ],
    entryComponents: [
        SearchMetricsDialogComponent
    ],
    providers: [
        DayTimeCalendarService, 
        DayCalendarService, 
        MonthCalendarService, 
        TimeSelectService, 
        UtilsService, 
        DatePickerService
    ]
})
export class SharedcomponentsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FormsModule } from '@angular/forms';

import { TimeRangePickerComponent } from './components/time-range-picker/time-range-picker.component';
import { DayTimeCalendarComponent } from './components/day-time-calendar/day-time-calendar.component';
import { DayCalendarComponent } from './components/day-calendar/day-calendar.component';
import { MonthCalendarComponent } from './components/month-calendar/month-calendar.component';
import { CalendarNavComponent } from './components/calendar-nav/calendar-nav.component';
import { TimePickerComponent } from './components/time-picker/time-picker.component';

import { DayTimeCalendarService } from './components/day-time-calendar/day-time-calendar.service';
import { DayCalendarService } from './components/day-calendar/day-calendar.service';
import { MonthCalendarService } from './components/month-calendar/month-calendar.service';
import { TimeSelectService } from './components/time-select/time-select.service';
import { UtilsService } from './services/utils.service';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { DatePickerService } from './components/date-picker/date-picker.service';
import { KeypadComponent } from './components/keypad/keypad.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  declarations: [
      TimePickerComponent,
      TimeRangePickerComponent,
      DayTimeCalendarComponent,
      DayCalendarComponent,
      MonthCalendarComponent,
      CalendarNavComponent,
      DatePickerComponent,
      KeypadComponent
  ],
  providers: [
      DayTimeCalendarService,
      DayCalendarService,
      MonthCalendarService,
      TimeSelectService,
      UtilsService,
      DatePickerService
  ],
  exports: [
    TimePickerComponent
  ]
})
export class DateTimePickerModule { }

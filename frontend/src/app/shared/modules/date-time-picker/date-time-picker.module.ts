import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FormsModule } from '@angular/forms';

import { TimeRangePickerComponent } from './time-range-picker/time-range-picker.component';
import { DayTimeCalendarComponent } from './day-time-calendar/day-time-calendar.component';
import { DayCalendarComponent } from './day-calendar/day-calendar.component';
import { MonthCalendarComponent } from './month-calendar/month-calendar.component';
import { CalendarNavComponent } from './calendar-nav/calendar-nav.component';
import { TimePickerComponent } from './time-picker/time-picker.component' 

import { DayTimeCalendarService } from './day-time-calendar/day-time-calendar.service';
import { DayCalendarService } from './day-calendar/day-calendar.service';
import { MonthCalendarService } from './month-calendar/month-calendar.service';
import { TimeSelectService } from './time-select/time-select.service';
import { UtilsService } from './common/services/utils.service';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DatePickerService } from './date-picker/date-picker.service';
import { KeypadComponent } from './keypad/keypad.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  declarations: [TimePickerComponent, TimeRangePickerComponent, DayTimeCalendarComponent, DayCalendarComponent, MonthCalendarComponent, CalendarNavComponent, DatePickerComponent, KeypadComponent],
  providers: [DayTimeCalendarService, DayCalendarService, MonthCalendarService, TimeSelectService, UtilsService, DatePickerService],
  exports: [
    TimePickerComponent
  ]
})
export class DateTimePickerModule { }

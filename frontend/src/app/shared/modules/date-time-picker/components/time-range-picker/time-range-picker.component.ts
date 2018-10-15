import {
    Component, OnInit, ViewChild, Input,
    Output, EventEmitter, AfterContentInit,
    HostListener, ElementRef, HostBinding
} from '@angular/core';
import { IDatePickerConfig } from '../date-picker/date-picker-config.model';
import { ECalendarValue } from '../../types/calendar-value-enum';
import { Moment } from 'moment';
import * as momentNs from 'moment';
// import { DatePickerComponent } from '../date-picker/date-picker.component';
import { timeAbbr, abbrToTime } from '../../services/utils.service';
import { TimeRangePickerOptions, ISelectedTime } from '../../models/models';
import { CalendarMode } from '../../types/calendar-mode';
import { } from '../time-picker/time-picker.component';
import { DatepickerComponent } from '../date-picker-2/datepicker.component';
import { UtilsService2 } from '../date-picker-2/datepicker-utils';

const moment = momentNs;

/**
High-level Architecture:

Time-range-picker      - has start and end picker with presets and apply
  Date-picker          - input box
    Day-time-calendar  - formats time
      Day-calendar     - day picker
        Calendar-nav   - switches between days and months picker
        Month-calendar - month picker
*/

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'time-range-picker',
    templateUrl: './time-range-picker.component.html',
    styleUrls: []
})

export class TimeRangePickerComponent implements OnInit {
    @HostBinding('class.dtp-time-range-picker') private _hostClass = true;

    @Input() set startTime(time: string) {
      this.startTimeReference.date = String(time);
    }
    @Input() set endTime(time: string) {
      this.endTimeReference.date = String(time);
    }
    @Input() options: TimeRangePickerOptions;
    @Input() timezone: string;
    @Output() timeSelected = new EventEmitter<ISelectedTime>();
    @Output() cancelSelected = new EventEmitter();

    @ViewChild('daytimePickerStart') startTimeReference: DatepickerComponent;
    @ViewChild('daytimePickerEnd') endTimeReference: DatepickerComponent;
    @ViewChild('presetsDiv') presetsDiv: ElementRef;

    startTimeSelected: Moment;
    endTimeSelected: Moment;

    startTimeDisplay: string; // for ngmodel
    endTimeDisplay: string;   // for ngmodel

    showApply: boolean;
    presetSelected: Preset;
    presets: Preset[] = [ {name: abbrToTime(timeAbbr.year),    buttonName: 'y',   abbr: timeAbbr.year},
                          {name: abbrToTime(timeAbbr.quarter), buttonName: 'qtr', abbr: 'qtr'},
                          {name: abbrToTime(timeAbbr.month),   buttonName: 'mo',  abbr: timeAbbr.month},
                          {name: abbrToTime(timeAbbr.week),    buttonName: 'wk',  abbr: 'wk'},
                          {name: abbrToTime(timeAbbr.day),     buttonName: 'd',   abbr: timeAbbr.day},
                          {name: abbrToTime(timeAbbr.hour),    buttonName: 'h',   abbr: timeAbbr.hour}
                        ];

    constructor(private utilsService: UtilsService2) {}

    ngOnInit() {
      this.showApply = false;
    }

    getTimeSelected(): ISelectedTime {
        const time = new ISelectedTime();

        this.startTimeSelected = this.utilsService.timeToMoment(this.startTimeReference.unixTimestamp.toString(), this.timezone);
        this.endTimeSelected = this.utilsService.timeToMoment(this.endTimeReference.unixTimestamp.toString(), this.timezone);

        // default value for invalid time
        if (!this.startTimeSelected) {
            this.startTimeSelected = moment().subtract(this.options.defaultStartHoursFromNow, 'hour');
            this.startTimeReference.date = this.options.defaultStartText;
        }

        // default value for invalid time
        if (!this.endTimeSelected) {
            this.endTimeSelected = moment().subtract(this.options.defaultEndHoursFromNow, 'hour');
            this.endTimeReference.date = this.options.defaultEndText;
        }

        // duration atleast 2 minutes
        const duration: number = moment.duration(this.endTimeSelected.diff(this.startTimeSelected)).asMinutes();
        const minDuration = this.options.minMinuteDuration;
        if (duration < minDuration && duration > 0) {
            this.startTimeSelected = this.startTimeSelected.subtract(minDuration - duration, 'minutes');
        } else if (duration < 0 && duration > -minDuration) {
            this.endTimeSelected = this.endTimeSelected.subtract(minDuration + duration, 'minutes');
        }

        time.startTimeUnix = this.startTimeSelected.unix().toString();
        time.endTimeUnix = this.endTimeSelected.unix().toString();
        time.startTimeDisplay = this.startTimeReference.date;
        time.endTimeDisplay = this.endTimeReference.date;

        console.log(time);
        return time;
    }

    closeCalendarsAndHideButtons() {
        this.endTimeReference.closeCalendar();
        this.startTimeReference.closeCalendar();
        this.showApply = false;
    }

    applyClicked() {
      if (!this.startTimeReference.formFields.dateInput.errors && !this.endTimeReference.formFields.dateInput.errors) {
        this.closeCalendarsAndHideButtons();

        // sets the relative times to latest values
        this.startTimeReference.onDateChange(this.startTimeReference.date);
        this.endTimeReference.onDateChange(this.endTimeReference.date);

        this.timeSelected.emit(this.getTimeSelected());
      }
    }

    cancelClicked() {
      console.log('cancel clicked');
      this.closeCalendarsAndHideButtons();
      this.cancelSelected.emit();
    }

    presetAmountReceived(amount: string) {
      if (amount === 'this') {
        this.startTime = this.presetSelected.name;
      } else {
        this.startTime = amount + this.presetSelected.abbr;
      }
      this.endTime = this.options.defaultEndText;
      this.togglePreset(this.presetSelected);
      this.applyClicked();
    }

    togglePreset(_preset: Preset) {
      if (_preset === this.presetSelected) {
        this.presetSelected = null;
      } else {
        this.presetSelected = _preset;
      }
    }

    removeSelectedPreset() {
      this.presetSelected = null;
    }

    // startTimeChanged(item: Moment) {
    //   this.startTimeSelected = item;
    // }

    // endTimeChanged(item: Moment) {
    //   this.endTimeSelected = item;
    // }

    log(item) {}

    // User Interactions
    startCalendarOpened() {
      this.showApply = true;
    }

    endCalendarOpened() {
      this.showApply = true;
    }

    startClockSelected() {
      this.startTime = this.options.defaultStartText;
    }

    endClockSelected() {
      this.endTime = this.options.defaultEndText;
    }

    startInputFocused() {
      this.showApply = true;
      this.removeSelectedPreset();
    }

    endInputFocused() {
      this.showApply = true;
      this.removeSelectedPreset();
    }

    enterKeyedOnInputBox() {
      this.applyClicked();
    }

    @HostListener('document:click', ['$event'])
    hidePresetsIfClickOutside(event) {
      if (!this.presetsDiv.nativeElement.contains(event.target)) {
        this.presetSelected = null;
      }
    }

    startCalendarClosed() {}

    endCalendarClosed() {}
}

interface Preset {
    name: string;
    buttonName: string;
    abbr: string;
}

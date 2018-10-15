import {
    Component, OnInit, ViewChild, Input, Output,
    EventEmitter, ElementRef, AfterViewChecked,
    ChangeDetectorRef, HostListener, HostBinding
} from '@angular/core';
import { TimeRangePickerComponent } from '../time-range-picker/time-range-picker.component';
import * as momentNs from 'moment';
import { Moment, unitOfTime, duration } from 'moment';
import { CalendarMode } from '../../types/calendar-mode';
import { TimeRangePickerOptions, ISelectedTime } from '../../models/models';

import { MatMenu, MatMenuTrigger, MenuPositionX } from '@angular/material';
import { UtilsService2 } from '../date-picker-2/datepicker-utils';

const moment = momentNs;

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: []
})

export class TimePickerComponent implements AfterViewChecked, OnInit {
    @HostBinding('class.dtp-time-picker') private _hostClass = true;

    /** View childs */
    @ViewChild(TimeRangePickerComponent) timeRangePicker: TimeRangePickerComponent;

    // trigger for opening the menu
    @ViewChild('timerangePickerMenuTrigger', {read: MatMenuTrigger}) trigger: MatMenuTrigger;

    get timerangePickerMenuIsOpen(): boolean {
        if (this.trigger) {
            return this.trigger.menuOpen;
        }
        return false;
    }

    /** Inputs */
    private _startTime: string;
    private _endTime: string;
    private _timezone: string;

    @Input() xPosition: MenuPositionX = 'before';

    @Input()
    set startTime(value: string) {
        this._startTime = value;
    }
    get startTime(): string {
        return this._startTime;
    }

    @Input()
    set endTime(value: string) {
        this._endTime = value;
    }
    get endTime(): string {
        return this._endTime;
    }

    @Input()
    set timezone(value: string) {
        this._timezone = value;
        this.updateToolTipsAndDisplayTimes();
    }
    get timezone(): string {
        return this._timezone;
    }

    /** Outputs */
    @Output() timeSelected = new EventEmitter<ISelectedTime>();

    /** Variables */

    // Tooltips
    startTimeToolTip: string;
    endTimeToolTip: string;

    get tooltipText(): string {
        return this.startTimeToolTip + ' to ' + this.endTimeToolTip;
    }
    isInitialized = false;

    // start time


    options: TimeRangePickerOptions;
    // tslint:disable-next-line:no-inferrable-types
    // _isOpen: boolean = false;

    constructor(private cdRef: ChangeDetectorRef, private utilsService: UtilsService2) { }

    ngOnInit() {
        if (!this.options) {
            this.setDefaultOptionsValues();
        }
        if (this.startTime === undefined || this.startTime.length === 0) {
            this.startTime = '1h';
        }
        if (this.endTime === undefined || this.endTime.length === 0) {
            this.endTime = 'now';
        }
        this.isInitialized = true;
    }

    setDefaultOptionsValues() {
        this.options = new TimeRangePickerOptions();

        this.options.startFutureTimesDisabled = true;
        this.options.endFutureTimesDisabled = true;

        this.options.defaultStartText = '1h';
        this.options.defaultEndText = 'now';
        this.options.defaultStartHoursFromNow = 1;
        this.options.defaultEndHoursFromNow = 0;

        this.options.startMaxDateError = 'Future not allowed';
        this.options.endMaxDateError = 'Future not allowed';

        this.options.startMinDateError = 'Must be > 1B seconds after unix epoch';
        this.options.endMinDateError = 'Must be > 1B seconds after unix epoch';

        this.options.startDateFormatError =  'Invalid. Try <span class="code">1h</span> (or <span class="code">6min</span>, ';
        this.options.startDateFormatError += '<span class="code">5d</span>, <span class="code">4w</span>, <span class="code">3mo</span>, ';
        this.options.startDateFormatError += '<span class="code">2qtr</span>, <span class="code">1y</span>, ';
        this.options.startDateFormatError += '<span class="code">08/15/2018</span>).';

        this.options.endDateFormatError =  'Invalid. Try <span class="code">now</span> (or <span class="code">1h</span> ';
        this.options.endDateFormatError += 'or <span class="code">2w</span>).';

        this.options.startTimePlaceholder = '1h (or min,d,w,mo,q,y)';
        this.options.endTimePlaceholder = 'now';

        this.options.startTimeInputBoxName = 'Start Date';
        this.options.endTimeInputBoxName = 'End Date';

        this.options.minMinuteDuration = 2;
    }

    ngAfterViewChecked() {
        if (!this.startTimeToolTip && !this.endTimeToolTip) {
          this.updateToolTipsAndDisplayTimes();
        }
        this.cdRef.detectChanges();
    }

    timeReceived(selectedTime: ISelectedTime) {
        this.startTime = selectedTime.startTimeDisplay;
        this.endTime = selectedTime.endTimeDisplay;
        this.startTimeToolTip = this.timeRangePicker.startTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.startTimeSelected);
        this.endTimeToolTip = this.timeRangePicker.endTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.endTimeSelected);
        this.timeSelected.emit(selectedTime);

        // close mat-menu
        this.trigger.closeMenu();
    }

    closeTimeRangePicker() {
        console.log('inside close time range picker');
        this.timeRangePicker.startTimeReference.shouldUpdateTimestamp = false;
        this.timeRangePicker.endTimeReference.shouldUpdateTimestamp = false;
        this.timeRangePicker.startTimeReference.date = this.startTime;
        this.timeRangePicker.endTimeReference.date = this.endTime;

        this.timeRangePicker.startTimeReference.closeCalendar();
        this.timeRangePicker.endTimeReference.closeCalendar();

        // close mat-menu
        this.trigger.closeMenu();
    }

    @HostListener('document:keydown', ['$event'])
    closeIfEscapePressed(event: KeyboardEvent) {
        const x = event.keyCode;
        if (x === 27) {
            this.closeTimeRangePicker();
        }
    }

    updateToolTipsAndDisplayTimes() {
        if (this.isInitialized) {
            // tslint:disable:max-line-length
            this.startTimeToolTip = this.utilsService.timestampToTime(this.timeRangePicker.startTimeReference.unixTimestamp.toString(), this.timezone);
            this.endTimeToolTip = this.utilsService.timestampToTime(this.timeRangePicker.endTimeReference.unixTimestamp.toString(), this.timezone);

            if (!this.utilsService.relativeTimeToMoment(this.startTime) && this.startTime.toLowerCase() !== 'now') {
                this.startTime = this.utilsService.timestampToTime(this.timeRangePicker.startTimeReference.unixTimestamp.toString(), this.timezone);
            }

            if (!this.utilsService.relativeTimeToMoment(this.endTime) && this.endTime.toLowerCase() !== 'now') {
                this.endTime = this.utilsService.timestampToTime(this.timeRangePicker.endTimeReference.unixTimestamp.toString(), this.timezone);
            }
        }
    }
}

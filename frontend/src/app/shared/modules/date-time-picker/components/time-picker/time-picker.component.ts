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

const moment = momentNs;

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: []
})

export class TimePickerComponent implements AfterViewChecked {
    @HostBinding('class.dtp-time-picker') private _hostClass = true;

    /** View childs */
    @ViewChild(TimeRangePickerComponent) timeRangePicker: TimeRangePickerComponent;

    // trigger for opening the menu
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    /** Inputs */
    private _startTime: string;
    private _endTime: string;

    // tslint:disable-next-line:no-inferrable-types
    // @Input() startTime: string;
    // tslint:disable-next-line:no-inferrable-types
    // @Input() endTime: string;

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

    /** Outputs */
    @Output() timeSelected = new EventEmitter<ISelectedTime>();


    /** Variables */

    // Tooltips
    startTimeToolTip: string;
    endTimeToolTip: string;

    get tooltipText(): string {
        return this.startTimeToolTip + ' to ' + this.endTimeToolTip;
    }

    // start time


    options: TimeRangePickerOptions;
    // tslint:disable-next-line:no-inferrable-types
    // _isOpen: boolean = false;

    constructor(private cdRef: ChangeDetectorRef) {
        if (!this.options) {
            this.setDefaultOptionsValues();
        }

        if (this.startTime === undefined || this.startTime.length === 0) {
            this.startTime = '1h';
        }

        if (this.endTime === undefined || this.endTime.length === 0) {
            this.endTime = 'now';
        }
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

        this.options.startDateFormatError =  'Invalid. Try <span class="code">1h</span> (or <span class="code">6min</span>, ';
        this.options.startDateFormatError += '<span class="code">5d</span>, <span class="code">4w</span>, <span class="code">3mo</span>, ';
        this.options.startDateFormatError += '<span class="code">2qtr</span>, <span class="code">1y</span>).';

        this.options.endDateFormatError =  'Invalid. Try <span class="code">now</span> (or <span class="code">1h</span> ';
        this.options.endDateFormatError += 'or <span class="code">2w</span>).';

        this.options.startTimePlaceholder = '1h (or min,d,w,mo,q,y)';
        this.options.endTimePlaceholder = 'now';

        this.options.formatMode = 'daytime'; // "daytime" format = 'MM/DD/YYYY hh:mm A'

        this.options.minMinuteDuration = 2;
    }

    ngAfterViewChecked() {
        if (!this.startTimeToolTip && !this.endTimeToolTip) {
            // tslint:disable-next-line:max-line-length
            this.startTimeToolTip = this.timeRangePicker.startTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.startTimeSelected);
            this.endTimeToolTip = this.timeRangePicker.endTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.endTimeSelected);
        }
        this.cdRef.detectChanges();
    }

    timeReceived(selectedTime: ISelectedTime) {
        // this.isOpen = false;
        this.startTime = selectedTime.startTimeDisplay;
        this.endTime = selectedTime.endTimeDisplay;
        this.startTimeToolTip = this.timeRangePicker.startTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.startTimeSelected);
        this.endTimeToolTip = this.timeRangePicker.endTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.endTimeSelected);
        this.timeSelected.emit(selectedTime);

        // close mat-menu
        this.trigger.closeMenu();
    }

    closeTimeRangePicker() {
        this.timeRangePicker.startTimeReference.setTime(this.startTime);
        this.timeRangePicker.endTimeReference.setTime(this.endTime);

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
}


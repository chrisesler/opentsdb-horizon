import {
    Component, OnInit, OnChanges, OnDestroy, ViewChild, Input, Output,
    EventEmitter, AfterViewChecked,
    ChangeDetectorRef, HostBinding, SimpleChanges, HostListener
} from '@angular/core';
import { TimeRangePickerComponent } from '../time-range-picker/time-range-picker.component';
import { TimeRangePickerOptions, ISelectedTime } from '../../models/models';
import { MatMenuTrigger, MenuPositionX } from '@angular/material';
import { DateUtilsService } from '../../../../../core/services/dateutils.service';
import { Subscription, Observable, interval, BehaviorSubject } from 'rxjs';
import { take, withLatestFrom, filter } from 'rxjs/operators';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: []
})

export class TimePickerComponent implements AfterViewChecked, OnInit, OnChanges, OnDestroy {
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
    private _refresh: number;

    @Input() xPosition: MenuPositionX = 'before';
    @Input() isEditMode = false;

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

    @Input()
    set refreshDuration(value: number) {
        this._refresh = value;
    }
    get refreshDuration(): number {
        return this._refresh;
    }

    /** Outputs */
    @Output() newChange = new EventEmitter();
    @Output() autoRefreshFlagChanged = new EventEmitter();

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
    refreshSubcription: Subscription;
    paused$ = new BehaviorSubject<boolean>(false);
    secondsRemaining: number;

    constructor(private cdRef: ChangeDetectorRef, private utilsService: DateUtilsService) { }

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

    ngOnChanges(changes: SimpleChanges) {
        if ( changes.refreshDuration !== undefined && changes.refreshDuration.currentValue ) {
            const duration = changes.refreshDuration.currentValue;
            if ( duration ) {
                this.subscribeToAutoRefresh(duration);
            }
        }
        if ( changes.isEditMode !== undefined ) {
            this.paused$.next(changes.isEditMode.currentValue);
        }
    }

    subscribeToAutoRefresh(refreshOption) {
        this.secondsRemaining = 60;
        // cancels already running subscription
        if ( this.refreshSubcription ) {
            this.refreshSubcription.unsubscribe();
        }
        this.refreshSubcription = interval(1000)
                                    .pipe(
                                        withLatestFrom(this.paused$),
                                        filter(([v, paused]) => !paused),
                                        take(60)
                                    )
                                    .subscribe(
                                            () => {
                                                this.secondsRemaining--;
                                            },
                                            err => {
                                            },
                                            () => {
                                                this.secondsRemaining = 0;
                                                this.refresh(true);
                                    });
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
        this.newChange.emit( { action: 'SetDateRange', payload: { newTime: selectedTime} } );

        // close mat-menu
        this.trigger.closeMenu();
    }

    closeTimeRangePicker() {
        this.timeRangePicker.startTimeReference.shouldUpdateTimestamp = false;
        this.timeRangePicker.endTimeReference.shouldUpdateTimestamp = false;
        this.timeRangePicker.startTimeReference.date = this.startTime;
        this.timeRangePicker.endTimeReference.date = this.endTime;

        this.timeRangePicker.startTimeReference.closeCalendar();
        this.timeRangePicker.endTimeReference.closeCalendar();
    }

    triggerAndCloseTimeRangePicker() {
        this.closeTimeRangePicker();
        this.trigger.closeMenu();
    }

    refresh(refreshOnRelativeOnly= false) {
        if ( !refreshOnRelativeOnly ||
            this.startTime.toLowerCase() === 'now' ||
            this.endTime.toLowerCase() === 'now' ||
            this.utilsService.relativeTimeToMoment(this.startTime) ||
            this.utilsService.relativeTimeToMoment(this.endTime) ) {
                this.timeRangePicker.applyClicked();
        }
        if ( this.refreshDuration ) {
            this.subscribeToAutoRefresh(this.refreshDuration);
        }
    }

    autoRefresh(duration, event) {
        if (event.target.classList.contains('refresh-text')) {
            event.stopPropagation();
            return;
        }

        if ( !this.isEditMode ) {
            this.newChange.emit( { action: 'SetAutoRefreshFlag', payload: { duration: duration} } );
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

    @HostListener('window:focus', ['$event'])
    onFocus(event: any): void {
        this.paused$.next(this.isEditMode);
    }

    @HostListener('window:blur', ['$event'])
    onBlur(event: any): void {
        this.paused$.next(true);
    }

    ngOnDestroy() {
        this.paused$.complete();
        this.refreshSubcription.unsubscribe();
    }
}

import { Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef, AfterViewChecked, ChangeDetectorRef, HostListener, HostBinding } from '@angular/core';
import { TimeRangePickerComponent } from '../time-range-picker/time-range-picker.component';
import * as momentNs from 'moment';
import { Moment, unitOfTime, duration } from 'moment';
import { CalendarMode } from '../common/types/calendar-mode' 
import { TimeRangePickerOptions, SelectedTime } from '../common/models/models'

const moment = momentNs;

@Component({
    selector: 'time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: []
  })

  export class TimePickerComponent {
    @HostBinding('class.dtp-time-picker') private _hostClass = true;

    @Input() set startTime(value: string){ this._startTime = value; }
    @Input() set endTime(value: string){ this._endTime = value; }
    @Output() timeSelected = new EventEmitter<SelectedTime>();

    @ViewChild(TimeRangePickerComponent) timeRangePicker: TimeRangePickerComponent; 

    options: TimeRangePickerOptions;
    _startTime: string;
    _endTime: string;
    _isOpen: boolean = false;
    startTimeToolTip: string;
    endTimeToolTip: string;
   

    constructor(private cdRef:ChangeDetectorRef){
        if(!this.options){
            this.setDefaultOptionsValues();
        }

        if(!this.startTime){
            this.startTime = "1h";
        }

        if(!this.endTime){
            this.endTime = "now";
        }
    }

    setDefaultOptionsValues(){
        this.options = new TimeRangePickerOptions();

        this.options.startFutureTimesDisabled = true;
        this.options.endFutureTimesDisabled = true;
    
        this.options.defaultStartText = "1h";
        this.options.defaultEndText = "now";
        this.options.defaultStartHoursFromNow = 1;
        this.options.defaultEndHoursFromNow = 0;
        
        this.options.startMaxDateError    = "Future not allowed";
        this.options.endMaxDateError      = "Future not allowed";
        this.options.startDateFormatError = 'Invalid. Try <span class="code">1h</span> (or <span class="code">6min</span>, <span class="code">5d</span>, <span class="code">4w</span>, <span class="code">3mo</span>, <span class="code">2qtr</span>, <span class="code">1y</span>).';
        this.options.endDateFormatError   = 'Invalid. Try <span class="code">now</span> (or <span class="code">1h</span> or <span class="code">2w</span>).';
    
        this.options.startTimePlaceholder = "1h (or min,d,w,mo,q,y)";
        this.options.endTimePlaceholder   = "now";
    
        this.options.formatMode = "daytime"; // "daytime" format = 'MM/DD/YYYY hh:mm A'
        
        this.options.minMinuteDuration = 2;
      }

    ngAfterViewChecked(){
        if(!this.startTimeToolTip && !this.endTimeToolTip){
            this.startTimeToolTip = this.timeRangePicker.startTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.startTimeSelected);
            this.endTimeToolTip = this.timeRangePicker.endTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.endTimeSelected);
        }
        this.cdRef.detectChanges();
    }

    timeReceived(selectedTime: SelectedTime){
        this.isOpen = false;
        this.startTime = selectedTime.startTimeDisplay;
        this.endTime = selectedTime.endTimeDisplay;
        this.startTimeToolTip = this.timeRangePicker.startTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.startTimeSelected);
        this.endTimeToolTip = this.timeRangePicker.endTimeReference.getAbsoluteTimeFromMoment(this.timeRangePicker.endTimeSelected);
        this.timeSelected.emit(selectedTime);
    }

    get startTime(): string {
        return this._startTime;
    }

    get endTime(): string {
        return this._endTime;
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    set isOpen(value: boolean) {
        this._isOpen = value;
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;
    }

    close() {
        this.isOpen = false;
    }

    @HostListener('document:keydown', ['$event'])
    closeIfEscapePressed(event: KeyboardEvent) {
      let x = event.keyCode;
      if (x === 27) {        
        this.timeRangePicker.startTimeReference.setTime(this.startTime);
        this.timeRangePicker.endTimeReference.setTime(this.endTime);
        this.close();
      }
    }
  }


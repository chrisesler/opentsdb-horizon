import { Component, OnInit, ViewChild, Input, Output, EventEmitter, AfterContentInit, HostListener , ElementRef, HostBinding } from '@angular/core';
import { IDatePickerConfig } from '../date-picker/date-picker-config.model';
import { ECalendarValue} from '../common/types/calendar-value-enum';
import { Moment } from 'moment';
import * as momentNs from 'moment';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { timeAbbr, abbrToTime } from '../common/services/utils.service'
import { TimeRangePickerOptions, ISelectedTime } from '../common/models/models'
import { CalendarMode } from '../common/types/calendar-mode' 
import {  } from '../time-picker/time-picker.component'

const moment = momentNs;

/*High-level Architecture:

Time-range-picker      - has start and end picker with presets and apply
  Date-picker          - input box
    Day-time-calendar  - formats time
      Day-calendar     - day picker
        Calendar-nav   - switches between days and months picker
        Month-calendar - month picker
*/

@Component({
  selector: 'time-range-picker',
  templateUrl: './time-range-picker.component.html',
  styleUrls: []
})

export class TimeRangePickerComponent implements OnInit {
  @HostBinding('class.dtp-time-range-picker') private _hostClass = true;

  @Input() set startTime(time: string){ this.startTimeReference.setTime(String(time)); }
  @Input() set endTime(time: string){ this.endTimeReference.setTime(String(time)); }
  @Input() options: TimeRangePickerOptions;ISelectedTime
  @Output() timeSelected = new EventEmitter<ISelectedTime>();
  @Output() cancelSelected = new EventEmitter();

  @ViewChild('daytimePickerStart') startTimeReference: DatePickerComponent;
  @ViewChild('daytimePickerEnd') endTimeReference: DatePickerComponent;
  @ViewChild('presetsDiv') presetsDiv: ElementRef;

  startTimeSelected: Moment;
  endTimeSelected: Moment;
  showApply: boolean;
  presetSelected: Preset;
  presets: Preset[] = [ {name: abbrToTime(timeAbbr.hour),    buttonName: "h",   abbr: timeAbbr.hour}, 
                        {name: abbrToTime(timeAbbr.day),     buttonName: "d",   abbr: timeAbbr.day}, 
                        {name: abbrToTime(timeAbbr.week),    buttonName: "wk",  abbr: "wk"}, 
                        {name: abbrToTime(timeAbbr.month),   buttonName: "mo",  abbr: timeAbbr.month}, 
                        {name: abbrToTime(timeAbbr.quarter), buttonName: "qtr", abbr: "qtr"}, 
                        {name: abbrToTime(timeAbbr.year),    buttonName: "y",   abbr: timeAbbr.year}]; 

  constructor() {}
 
  ngOnInit() {
    this.showApply = false;
  }

  getTimeSelected(): ISelectedTime {
    let time = new ISelectedTime();

    //default value for invalid time
    if(!this.startTimeSelected){
      this.startTimeSelected = moment().subtract(this.options.defaultStartHoursFromNow, "hour");
      this.startTimeReference.setTime(this.options.defaultStartText);
    }
    
    //default value for invalid time
    if(!this.endTimeSelected){
      this.endTimeSelected = moment().subtract(this.options.defaultEndHoursFromNow, "hour");;
      this.endTimeReference.setTime(this.options.defaultEndText);
    }

    //duration atleast 2 minutes
    let duration: number = moment.duration(this.endTimeSelected.diff(this.startTimeSelected)).asMinutes();
    let minDuration = this.options.minMinuteDuration;
    if(duration < minDuration && duration > 0){
      this.startTimeSelected = this.startTimeSelected.subtract(minDuration - duration, "minutes");
    } else if(duration < 0 && duration > -minDuration) {
      this.endTimeSelected = this.endTimeSelected.subtract(minDuration + duration, "minutes");
    }

    time.startTimeUnix = this.startTimeSelected.unix().toString();
    time.endTimeUnix = this.endTimeSelected.unix().toString();
    time.startTimeDisplay = this.startTimeReference.inputElementValue;
    time.endTimeDisplay = this.endTimeReference.inputElementValue;

    return time;
  }

  closeCalendarsAndHideButtons(){
    this.endTimeReference.api.close();
    this.startTimeReference.api.close();
    this.showApply = false;
  }

  applyClicked() {
    if(!this.startTimeReference.errors && !this.endTimeReference.errors){
      this.closeCalendarsAndHideButtons();
      
      //sets the relative times to latest values
      this.startTimeReference.setTime(this.startTimeReference.inputElementValue);
      this.endTimeReference.setTime(this.endTimeReference.inputElementValue);
      this.timeSelected.emit(this.getTimeSelected());
    }
  }

  cancelClicked(){
    this.closeCalendarsAndHideButtons();
    this.cancelSelected.emit();
  }

  presetAmountReceived(amount: string){
    if(amount === "this"){
      this.startTime = this.presetSelected.name;
    } else {
      this.startTime = amount + this.presetSelected.abbr;
    }
    this.endTime = this.options.defaultEndText;
    this.togglePreset(this.presetSelected);
    this.applyClicked();
  }

  togglePreset(_preset: Preset){
    if(_preset == this.presetSelected){
      this.presetSelected = null;
    } else {
      this.presetSelected = _preset;
    }
  }

  removeSelectedPreset(){
    this.presetSelected = null;
  }
  
  startTimeChanged(item: Moment){
    this.startTimeSelected = item;
  }

  endTimeChanged(item: Moment){
    this.endTimeSelected = item;
  }

  log(item) {}

  // User Interactions
  startCalendarOpened(){ 
    this.showApply = true; 
  }
  
  endCalendarOpened(){
    this.showApply = true;
  }

  startClockSelected(){ 
    this.startTime = this.options.defaultStartText;
  }

  endClockSelected(){
    this.endTime = this.options.defaultEndText;
  }
  
  startInputFocused(){
    this.showApply = true;
    this.removeSelectedPreset(); 
  }

  endInputFocused(){
    this.showApply = true; 
    this.removeSelectedPreset(); 
  }

  enterKeyedOnInputBox(){
    this.applyClicked();
  }

  @HostListener('document:click', ['$event'])
  hidePresetsIfClickOutside(event){
    if(!this.presetsDiv.nativeElement.contains(event.target)) {
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
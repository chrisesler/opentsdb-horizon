import {IDate} from '../common/models/models';
import {UtilsService} from '../common/services/utils.service';
import {CalendarMode} from '../common/types/calendar-mode';
import {ECalendarMode} from '../common/types/calendar-mode-enum';
import {CalendarValue} from '../common/types/calendar-value';
import {ECalendarValue} from '../common/types/calendar-value-enum';
import {SingleCalendarValue} from '../common/types/single-calendar-value';
import {IDayCalendarConfig} from '../day-calendar/day-calendar-config.model';
import {DayCalendarComponent} from '../day-calendar/day-calendar.component';
import {DayCalendarService} from '../day-calendar/day-calendar.service';
import {IDayTimeCalendarConfig} from '../day-time-calendar/day-time-calendar-config.model';
import {DayTimeCalendarService} from '../day-time-calendar/day-time-calendar.service';
import {ITimeSelectConfig} from '../time-select/time-select-config.model';
import {TimeSelectService} from '../time-select/time-select.service';
import {IDatePickerConfig, IDatePickerConfigInternal} from './date-picker-config.model';
import {IDpDayPickerApi} from './date-picker.api';
import {DatePickerService} from './date-picker.service';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {Moment, unitOfTime} from 'moment';
import {DateValidator} from '../common/types/validator.type';
import {MonthCalendarComponent} from '../month-calendar/month-calendar.component';
import {DayTimeCalendarComponent} from '../day-time-calendar/day-time-calendar.component';
import {INavEvent} from '../common/models/models';
import * as momentNs from 'moment';

const moment = momentNs;

@Component({
  selector: 'dp-date-picker',
  styleUrls: ['date-picker.component.scss'],
  templateUrl: 'date-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DatePickerService,
    DayTimeCalendarService,
    DayCalendarService,
    TimeSelectService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements OnChanges,
                                            OnInit,
                                            ControlValueAccessor,
                                            Validator,
                                            OnDestroy {

  @Input() disableFutureDates: boolean; //OVERRIDES maxDate
  @Input() config: IDatePickerConfig;
  @Input() mode: CalendarMode;
  @Input() placeholder: string;
  @Input() displayDate: SingleCalendarValue;
  @HostBinding('class') @Input() theme: string;
  @Input() minDate: Moment;
  @Input() maxDate: Moment;
  @Input() minTime: SingleCalendarValue;
  @Input() maxTime: SingleCalendarValue;
  @Input() initialTime: string;
  @Input() minDateError: String;
  @Input() maxDateError: String;
  @Input() formatError: String;

  @Output() open = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() onChange = new EventEmitter<CalendarValue>();
  @Output() onGoToCurrent: EventEmitter<void> = new EventEmitter();
  @Output() onLeftNav: EventEmitter<INavEvent> = new EventEmitter();
  @Output() onRightNav: EventEmitter<INavEvent> = new EventEmitter();
  @Output() onFocus = new EventEmitter<void>();
  @Output() onEnter = new EventEmitter<void>();

  @ViewChild('container') calendarContainer: ElementRef;
  @ViewChild('dayCalendar') dayCalendarRef: DayCalendarComponent;
  @ViewChild('monthCalendar') monthCalendarRef: MonthCalendarComponent;
  @ViewChild('daytimeCalendar') dayTimeCalendarRef: DayTimeCalendarComponent;

  isInitialized: boolean = false;
  disabled: boolean = false;
  componentConfig: IDatePickerConfigInternal;
  dayCalendarConfig: IDayCalendarConfig;
  dayTimeCalendarConfig: IDayTimeCalendarConfig;
  timeSelectConfig: ITimeSelectConfig;
  _areCalendarsShown: boolean = false;
  hideStateHelper: boolean = false;
  _selected: Moment[] = [];
  inputValue: CalendarValue;
  inputValueType: ECalendarValue;
  isFocusedTrigger: boolean = false;
  _currentDateView: Moment;
  inputElementValue: string;
  calendarWrapper: HTMLElement;
  appendToElement: HTMLElement;
  handleInnerElementClickUnlisteners: Function[] = [];
  globalListnersUnlisteners: Function[] = [];
  validateFn: DateValidator;
  api: IDpDayPickerApi = {
    open: this.showCalendars.bind(this),
    close: this.hideCalendar.bind(this),
    moveCalendarTo: this.moveCalendarTo.bind(this)
  };
  errors: ValidationErrors;

  constructor(private readonly dayPickerService: DatePickerService,
    private readonly elemRef: ElementRef,
    private readonly renderer: Renderer,
    private readonly utilsService: UtilsService,
    public readonly cd: ChangeDetectorRef) {
  }

  public setTime(time: string){

    if(this.utilsService.isTimeStampValid(time)){
      this.inputElementValue = this.getAbsoluteTimeFromTimestamp(time);
    } else if(this.utilsService.relativeTimeToMoment(time)){
      this.inputElementValue = this.utilsService.strippedRelativeTime(time);
    }  else{
      this.inputElementValue = time;
    }
    
    this.selected = [];
  }

  ngOnInit() {
    this.isInitialized = true;
    this.init();
    this.initValidators();
  }

  init() {
    if(this.disableFutureDates){
      this.maxDate = moment();
    }
    this.componentConfig = this.dayPickerService.getConfig(this.config, this.mode);
    this.componentConfig.max = this.maxDate;
    this.componentConfig.min = this.minDate;
    this.currentDateView = this.displayDate
      ? this.utilsService.convertToMoment(this.displayDate, this.componentConfig.format).clone()
      : this.utilsService
        .getDefaultDisplayDate(
          this.currentDateView,
          this.selected,
          this.componentConfig.allowMultiSelect,
          this.componentConfig.min
        );
    this.inputValueType = this.utilsService.getInputType(this.inputValue, this.componentConfig.allowMultiSelect);
    this.dayCalendarConfig = this.dayPickerService.getDayConfigService(this.componentConfig);
    this.dayTimeCalendarConfig = this.dayPickerService.getDayTimeConfigService(this.componentConfig);
    this.timeSelectConfig = this.dayPickerService.getTimeConfigService(this.componentConfig);
}

  initValidators() {
    if(this.disableFutureDates){
      this.maxDate = moment();
    }
    this.validateFn = this.utilsService.createValidator(
      {
        minDate: this.minDate,
        maxDate: this.maxDate,
        minTime: this.minTime,
        maxTime: this.maxTime
      }, this.componentConfig.format, this.mode);
    this.onChangeCallback(this.processOnChangeCallback(this.selected), false);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isInitialized) {
      const {minDate, maxDate, minTime, maxTime} = changes;

      this.init();

      if (minDate || maxDate || minTime || maxTime) {
        this.initValidators();
      }
    }
  }


  onViewDateChange(value: string) {
    //valid default format time
    if (this.dayPickerService.isValidInputDateValue(value, this.componentConfig)) {
      this.selected = this.dayPickerService.convertInputValueToMomentArray(value, this.componentConfig);
      this.currentDateView = this.selected.length
        ? this.utilsService.getDefaultDisplayDate(
          null,
          this.selected,
          this.componentConfig.allowMultiSelect,
          this.componentConfig.min
        )
        : this.currentDateView;
    }

    //check if valid non-default format time
    else {

      //display relative or timestamp on calendar
      if(this.utilsService.isStringAValidNonDefaultTime(value)){

        // highlight day on calendar
        this._selected = this.utilsService.getNonDefaultFormatTime(value);
        // shift view of calendar if needed
        this.currentDateView = this.selected.length
        ? this.utilsService.getDefaultDisplayDate(
          null,
          this.selected,
          this.componentConfig.allowMultiSelect,
          this.componentConfig.min
        ): this.currentDateView;
        this.emitDateChange(this._selected);
      } 
      
      //invalid date
      else{
        this._selected = this.utilsService
          .getValidMomentArray(value, this.componentConfig.format);
        this.emitDateChange(this._selected);
      }

      //updates the validators
      this.initValidators();
      this.onChangeCallback(this.processOnChangeCallback(value), true);
      }
  }

  set selected(selected: Moment[]){
  
    //triggered when typing in date
    if(selected.length == 0 && this.inputElementValue && this.componentConfig){
      this.onViewDateChange(this.inputElementValue);
    }
    // triggered when selecting date from calendar
    else if (this.componentConfig){
      this._selected = selected;
      this.inputElementValue = (<string[]>this.utilsService
        .convertFromMomentArray(this.componentConfig.format, selected, ECalendarValue.StringArr))
        .join(' | '); 
      this.emitDateChange(selected);
    }
  }

  emitDateChange(selected: Moment[]){
    const val = this.processOnChangeCallback(selected);
    this.onChangeCallback(val, false);
    this.onChange.emit(val);
  }

  get selected(): Moment[] {
    return this._selected;
  }

  get areCalendarsShown(): boolean {
    return this._areCalendarsShown;
  }

  get openOnFocus(): boolean {
    return this.componentConfig.openOnFocus;
  }

  get openOnClick(): boolean {
    return this.componentConfig.openOnClick;
  }

  set areCalendarsShown(value: boolean) {
    if (value) {
      this.startGlobalListeners();
    } else {
      this.stopGlobalListeners();
      this.dayPickerService.pickerClosed();
    }

    this._areCalendarsShown = value;
  }

  get currentDateView(): Moment {
    return this._currentDateView;
  }

  set currentDateView(date: Moment) {
    this._currentDateView = date;

    if (this.dayCalendarRef) {
      this.dayCalendarRef.moveCalendarTo(date);
    }

    if (this.monthCalendarRef) {
      this.monthCalendarRef.moveCalendarTo(date);
    }

    if (this.dayTimeCalendarRef) {
      this.dayTimeCalendarRef.moveCalendarTo(date);
    }
  }

  @HostListener('click')
  onClick() {
    if (!this.openOnClick) {
      return;
    }

    if (!this.isFocusedTrigger && !this.disabled) {
      this.hideStateHelper = true;
      if (!this.areCalendarsShown) {
      }
    }
  }

  onBodyClick() {
    this.hideStateHelper = false;
  }

  @HostListener('window:resize')
  onScroll() {
    if (this.areCalendarsShown) {
    }
  }

  writeValue(value: CalendarValue): void {
    this.inputValue = value;

    if (value || value === '') {
      this.selected = this.utilsService
        .convertToMomentArray(value, this.componentConfig.format, this.componentConfig.allowMultiSelect);
      this.init();
    } else {
      this.selected = [];
    }

    this.cd.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  onChangeCallback(_: any, changedByInput: boolean) {
  };

  registerOnTouched(fn: any): void {
  }

  validate(formControl: FormControl): ValidationErrors {
    this.errors = this.validateFn(formControl.value);
    return this.validateFn(formControl.value);
  }

  processOnChangeCallback(selected: Moment[] | string): CalendarValue {
    if (typeof selected === 'string') {
      return selected;
    } else {
      return this.utilsService.convertFromMomentArray(
        this.componentConfig.format,
        selected,
        this.componentConfig.returnedValueType || this.inputValueType
      );
    }
  }

  inputFocused() {
    if (!this.openOnFocus) {
      return;
    }

    this.isFocusedTrigger = true;
    setTimeout(() => {
      this.hideStateHelper = false;
      this.isFocusedTrigger = false;
    }, this.componentConfig.onOpenDelay);

    this.onFocus.emit();
  }

  toggleCalendars(){
    if(this.areCalendarsShown){
      this.hideCalendar();
    } else {
      this.showCalendars();
    }
  }
  showCalendars() {
    this.areCalendarsShown = true;
    this.hideStateHelper = true;
    if(this.disableFutureDates){
      var configCopy = Object.assign({}, this.dayTimeCalendarConfig);
      configCopy.max = moment();
      this.dayTimeCalendarConfig = configCopy;
    }
    this.open.emit();
    this.cd.markForCheck();
  }

  hideCalendar() {
    this.areCalendarsShown = false;

    if (this.dayCalendarRef) {
      this.dayCalendarRef.api.toggleCalendarMode(ECalendarMode.Day);
    }

    this.close.emit();
    this.cd.markForCheck();
  }

  getAbsoluteTimeFromTimestamp(timestamp: string): string {
    return (<string[]>this.utilsService.convertFromMomentArray(
      this.dayPickerService.getConfig(this.config, this.mode).format, 
      [moment.unix(Number(timestamp))], ECalendarValue.StringArr)).join(' | ');
  }

  getAbsoluteTimeFromMoment(theMoment: Moment): string{
    return (<string[]>this.utilsService.convertFromMomentArray(
      this.dayPickerService.getConfig(this.config, this.mode).format, 
      [theMoment], ECalendarValue.StringArr)).join(' | ');
  }

  dateSelected(date: IDate, granularity: unitOfTime.Base, ignoreClose?: boolean) {
    this.selected = this.utilsService.updateSelected(this.componentConfig.allowMultiSelect, this.selected, date, granularity);
    if (!ignoreClose) {
      this.onDateClick();
    }
  }

  onDateClick() {
    if (this.componentConfig.closeOnSelect) {
      setTimeout(this.hideCalendar.bind(this), this.componentConfig.closeOnSelectDelay);
    }
  }

  onKeyPress(event: KeyboardEvent) {
    switch (event.keyCode) {
      case (9):
      case (27):
        this.hideCalendar();
        break;
    }
  }

  moveCalendarTo(date: SingleCalendarValue) {
    const momentDate = this.utilsService.convertToMoment(date, this.componentConfig.format);
    this.currentDateView = momentDate;
  }

  onLeftNavClick(change: INavEvent) {
    this.onLeftNav.emit(change);
  }

  onRightNavClick(change: INavEvent) {
    this.onRightNav.emit(change);
  }

  enterKeyed(){
    this.onEnter.emit();
  }
  
  startGlobalListeners() {
    this.globalListnersUnlisteners.push(
      this.renderer.listen(document, 'keydown', (e: KeyboardEvent) => {
        this.onKeyPress(e);
      }),
      this.renderer.listen(document, 'scroll', () => {
        this.onScroll();
      }),
      this.renderer.listen(document, 'click', () => {
        this.onBodyClick();
      })
    );
  }

  stopGlobalListeners() {
    this.globalListnersUnlisteners.forEach((ul) => ul());
    this.globalListnersUnlisteners = [];
  }

  ngOnDestroy() {
    this.handleInnerElementClickUnlisteners.forEach(ul => ul());

    if (this.appendToElement) {
      this.appendToElement.removeChild(this.calendarWrapper);
    }
  }
}
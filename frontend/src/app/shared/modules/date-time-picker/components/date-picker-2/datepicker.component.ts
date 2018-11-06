import { Component, EventEmitter, Input, OnInit, Output, ElementRef, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Moment, isDate } from 'moment';
import { DateUtilsService } from '../../../../../core/services/dateutils.service';
import { FormGroup , FormBuilder, Validators, ValidatorFn, AbstractControl} from '@angular/forms';
import { HostBinding } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'datepicker2',
    templateUrl: 'datepicker.component.html',
    styleUrls: ['datepicker.component.scss'],
})
export class DatepickerComponent implements OnInit {
    // tslint:disable:no-inferrable-types
    // tslint:disable:no-output-on-prefix
    @Input() date: string;
    @Input('timezone')
    set timezone(value: string) {
        this._timezone = value;
        if (this.date && this.isInitialized) {
            this.shouldUpdateTimestamp = false;
            this.onDateChange(this.date);
        }
    }
    get timezone(): string { return this._timezone; }
    @Input() minDateError: String;
    @Input() maxDateError: String;
    @Input() formatError: String;
    @Input() placeholder: string;
    @Input() inputBoxName: string;

    @Output() dateChange = new EventEmitter<string>();
    @Output() open = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();
    @Output() onChange = new EventEmitter<any>();
    @Output() onFocus = new EventEmitter<void>();
    @Output() onEnter = new EventEmitter<void>();

    @HostBinding('class.date-picker-component') private _hostClass = true;

    unixTimestamp: Number;
    tempUnixTimestamp: Number; // for cycling through months
    isDateValid: boolean = true;
    isInitialized: boolean = false;
    showCalendar = false;
    _timezone: string;
    _date: string;
    weeks: any[] = [];
    dayNames: any[];
    monthNames: any[];
    calendarTitle: string;
    monthCalendarTitle: string;
    calendarPosition = 'angular-utc-datepicker_below';
    calendarTitleFormat: string = 'MMMM YYYY';
    dateFormat = 'YYYY-MM-DD';
    displayDayCalendar: boolean = true;
    registerForm: FormGroup;
    submitted = false;
    shouldUpdateTimestamp: boolean = true;
    calendarButtonEntered = false;

    @ViewChild('dateInput') el: ElementRef;

    constructor(private utilsService: DateUtilsService, private formBuilder: FormBuilder) {
        this.dayNames = [];
        this.monthNames = [];
    }

    ngOnInit() {
        this.registerForm = this.formBuilder.group({
            dateInput: ['', [this.formatValidator(), this.maxDateValidator(), this.minDateValidator()]],
        });

        if (!this.date) {
            this.date = '1h';
        }
        if (!this.timezone) {
            this.timezone = 'local';
        }

        this.unixTimestamp = this.utilsService.timeToMoment(this.date, this.timezone).unix();
        this.tempUnixTimestamp = this.unixTimestamp;
        this.monthCalendarTitle = this.utilsService.timeToMoment(this.tempUnixTimestamp.toString(), this.timezone).year().toString();

        if (this.dayNames.length === 0) {
            this.generateDayNames();
        }

        this.isInitialized = true;
    }

    // convenience getter for easy access to form fields
    get formFields() { return this.registerForm.controls; }

    onDateChange = (value: string) => {
        value = value.trim();
        const theMoment: Moment = this.utilsService.timeToMoment(value, this.timezone);

        if (theMoment && theMoment.unix() > this.utilsService.getMinUnixTimestamp()) {
            this.tempUnixTimestamp = this.utilsService.timeToMoment(value, this.timezone).unix();
            if (this.utilsService.isTimeStampValid(value)) { // input is timestamp
                this.date = this.utilsService.timestampToTime(value, this.timezone);
                this.unixTimestamp = this.utilsService.timeToMoment(value, this.timezone).unix();
            } else if (!this.shouldUpdateTimestamp &&
                !this.utilsService.relativeTimeToMoment(value) &&
                value.toLowerCase() !== 'now' &&
                !this.utilsService.timeToTime(value)) { // input is relative time or 'this' time
                this.date = this.utilsService.timestampToTime(this.unixTimestamp.toString(), this.timezone);
            } else if (this.shouldUpdateTimestamp) { // input changed
                this.date = value;
                this.unixTimestamp = this.utilsService.timeToMoment(value, this.timezone).unix();
            }
            this.isDateValid = true;
            this.generateCalendar(theMoment.format(this.dateFormat));
            this.dateChange.emit(this.date);
        } else {
            console.log('date invalid: ' + value);
            this.isDateValid = false;
            this.date = value;
            this.generateCalendar(this.utilsService.timeToMoment(this.unixTimestamp.toString(), this.timezone).format(this.dateFormat));
        }

        this.shouldUpdateTimestamp = true;
    }

    generateDayNames = () => {
        const date = moment('2017-04-02'); // sunday
        for (let i = 0; i < 7; i++) {
            this.dayNames.push(date.format('dd'));
            date.add('1', 'd');
        }
    }

    openCalendar = (event: any) => {
        this.showCalendar = true;
        if (this.utilsService.timeToMoment(this.date, this.timezone)) {
            this.generateCalendar(this.utilsService.timeToMoment(this.date, this.timezone).format(this.dateFormat));
        }
        this.open.emit();
    }

    closeCalendar = () => {
        this.showCalendar = false;
        this.close.emit();
    }

    toggleCalendar() {
        if (this.showCalendar) {
            this.closeCalendar();
        } else {
            this.openCalendar(null);
        }
    }

    toggleDisplay() {
        if (!this.displayDayCalendar) { // toggling to month view
            // tslint:disable-next-line:max-line-length
            const diff: Number = Number(this.monthCalendarTitle) - this.utilsService.timeToMoment(this.tempUnixTimestamp.toString(), this.timezone).year();
            // tslint:disable-next-line:max-line-length
            const tempUnix: Number = this.utilsService.timeToMoment(this.tempUnixTimestamp.toString(), this.timezone).add(Number(diff), 'year').unix();
            const tempMoment: Moment = this.utilsService.timeToMoment(tempUnix.toString(), this.timezone);

            if (tempMoment) {
                this.tempUnixTimestamp = tempMoment.unix();
                this.generateCalendar(tempMoment.format(this.dateFormat));
            }
        } else { // toggling to year calendar
            this.generateYearCalendar( this.utilsService.timeToMoment(this.tempUnixTimestamp.toString(), this.timezone));
        }
        this.displayDayCalendar = !this.displayDayCalendar;
    }

    keydown = (event: any) => {
        if (event.keyCode === 27) { // escape key
            this.closeCalendar();
        }
    }

    enterKeyed() {
        if (this.calendarButtonEntered) {
            this.calendarButtonEntered = false;
        } else {
            this.onEnter.emit();
        }
    }

    enterKeyedOnCalendarButton(event) {
        if (event.keyCode === 13) { // enter
            this.calendarButtonEntered = true;
        }
    }

    inputFocused() {
        this.onFocus.emit();
    }

    /* GENERATE CALENDAR */
    // INPUT: 2018-09-20
    generateCalendar = (dateAsString: string) => {
        const date: Moment = moment(dateAsString, this.dateFormat);
        this.calendarTitle = date.format(this.calendarTitleFormat);
        const now: Number = Number(this.getNow().format('YYYYMMDD'));
        const selected: Number = Number(this.utilsService.timeToMoment(this.unixTimestamp.toString(), this.timezone).format('YYYYMMDD'));
        this.weeks = [];
        for (let i = 0; i < 7; i++ ) {
            this.weeks[i] = [];
        }

        const lastMonth = moment(date).subtract(1, 'M'),
            nextMonth = moment(date).add(1, 'M'),
            month = moment(date).month() + 1,
            year = moment(date).year(),
            firstWeekDay = 1 - moment(date).startOf('M').isoWeekday(),
            totalDays = (42 + firstWeekDay) - 1; // 7 columns X 6 rows

        let week: number = 0;
        let col: number = 0;

        for (let i = firstWeekDay; i <= totalDays; i++) {
            let _moment: Moment;
            if (i > 0 && i <= moment(date).endOf('M').date()) {
                _moment = moment(year.toString() + '-' + month.toString() + '-' + i.toString(), 'YYYY-M-D');
                // current month
                this.weeks[week.toString()].push({
                    day: i,
                    month: month,
                    year: year,
                    isFuture: (Number(_moment.format('YYYYMMDD'))) > now,
                    isToday: (Number(_moment.format('YYYYMMDD'))) === now,
                    enabled:
                        (Number(_moment.format('YYYYMMDD')) <= now && Number(_moment.format('YYYYMMDD')) > 20010909),
                    selected: Number(_moment.format('YYYYMMDD')) === selected && this.isDateValid,
                    currentMonth : true
                });
            } else if (i > moment(date).endOf('M').date()) { // next month
                // tslint:disable-next-line:max-line-length
                _moment = moment(nextMonth.year().toString() + '-' + (nextMonth.month() + 1).toString() + '-' + (i - date.endOf('M').date()).toString(), 'YYYY-M-D');
                this.weeks[week.toString()].push({
                    day: i - date.endOf('M').date(),
                    month: nextMonth.month() + 1,
                    year: nextMonth.year(),
                    isFuture: (Number(_moment.format('YYYYMMDD'))) > now,
                    isToday: (Number(_moment.format('YYYYMMDD'))) === now,
                    enabled: false,
                    selected: false,
                    currentMonth : false
                });
            } else { // last month
                // tslint:disable-next-line:max-line-length
                _moment = moment(lastMonth.year().toString() + '-' + (lastMonth.month() + 1).toString() + '-' + (lastMonth.endOf('M').date() - (0 - i)).toString(), 'YYYY-M-D');
                this.weeks[week.toString()].push({
                    day: lastMonth.endOf('M').date() - (0 - i),
                    month: lastMonth.month() + 1,
                    year: lastMonth.year(),
                    isFuture: (Number(_moment.format('YYYYMMDD'))) > now,
                    isToday: (Number(_moment.format('YYYYMMDD'))) === now,
                    enabled: false,
                    selected: false,
                    currentMonth : false
                });
            }

            // after 7 days, create a new week
            if (col === 6) {
                week++;
                col = 0;
            } else {
                col++;
            }
        }
    }

    generateYearCalendar(_moment: Moment) {
        const startOfYear = moment(_moment.format('YYYY'), 'YYYY');
        const now: Number = Number(this.getNow().format('YYYYMM'));
        this.monthCalendarTitle = _moment.year().toString();

        for (let i = 0; i < 3; i++ ) {
            this.monthNames[i] = [];
        }
        let row: number = 0;

        for (let i = 0; i < 12; i++) {
            this.monthNames[row.toString()].push({
                text: startOfYear.format('MMMM'),
                isCurrentMonth: now === Number(startOfYear.format('YYYYMM')),
                isDisabled: Number(startOfYear.format('YYYYMM')) > now || Number(startOfYear.format('YYYYMM')) < 200110,
                // tslint:disable-next-line:max-line-length
                isSelected: Number(this.utilsService.timeToMoment(this.unixTimestamp.toString(), this.timezone).format('YYYYMM')) ===  Number(startOfYear.format('YYYYMM')),
            });

            startOfYear.add('1', 'M');
            if (this.monthNames[row.toString()].length === 4) {
                row++;
            }
        }
    }

    formatValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            let forbidden: boolean = true;
            if (this.utilsService.timeToMoment(control.value, this.timezone)) {
                forbidden = false;
            }
            return forbidden ? {'format': {value: control.value}} : null;
        };
    }

    maxDateValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            let forbidden: boolean = false;
            const _moment: Moment = this.utilsService.timeToMoment(control.value, this.timezone);
            if (_moment && _moment.unix() > this.getNow().unix()) {
                forbidden = true;
            }
            return forbidden ? {'maxDate': {value: control.value}} : null;
        };
    }

    minDateValidator(): ValidatorFn {
        return (control: AbstractControl): {[key: string]: any} | null => {
            let forbidden: boolean = false;
            const _moment: Moment = this.utilsService.timeToMoment(control.value, this.timezone);
            if (_moment && _moment.unix() < this.utilsService.getMinUnixTimestamp()) {
                forbidden = true;
            }
            return forbidden ? {'minDate': {value: control.value}} : null;
        };
    }

    getNow(): Moment {
        if (this.timezone.toLowerCase() === 'utc') {
            return moment.utc().add(10, 'seconds');
        } else {
            return moment().add(10, 'seconds');
        }
    }

    prev(): void {
        if (this.displayDayCalendar) { // month
            // tslint:disable-next-line:max-line-length
            const tempDate: Moment = this.utilsService.timeToMoment(moment.unix(Number(this.tempUnixTimestamp)).subtract(1, 'M').unix().toString(), this.timezone);
            if (tempDate) {
                this.tempUnixTimestamp = tempDate.unix();
                this.generateCalendar(tempDate.format(this.dateFormat));
            }

        } else { // year
            // tslint:disable-next-line:max-line-length
            const tempDate: Moment = this.utilsService.timeToMoment(moment.unix(Number(this.tempUnixTimestamp)).subtract(1, 'year').unix().toString(), this.timezone);
            if (tempDate) {
                this.generateYearCalendar(tempDate);
                this.tempUnixTimestamp = tempDate.unix();
            }
        }
    }

    next(): void {
        if (this.displayDayCalendar) { // month
            // tslint:disable-next-line:max-line-length
            const tempDate: Moment = this.utilsService.timeToMoment(moment.unix(Number(this.tempUnixTimestamp)).add(1, 'M').unix().toString(), this.timezone);

            if (tempDate) {
                this.tempUnixTimestamp = tempDate.unix();
                this.generateCalendar(tempDate.format(this.dateFormat));
            }

        } else { // year
            // tslint:disable-next-line:max-line-length
            const tempDate: Moment = this.utilsService.timeToMoment(moment.unix(Number(this.tempUnixTimestamp)).add(1, 'year').unix().toString(), this.timezone);
            if (tempDate) {
                this.generateYearCalendar(tempDate);
                this.tempUnixTimestamp = tempDate.unix();
            }
        }
    }

    selectDate = (date: any) => {
        let selectedDate: Moment;
        const currDate = this.utilsService.timeToMoment(this.unixTimestamp.toString(), this.timezone);

        if (this.timezone.toLowerCase() === 'utc') {
            selectedDate = moment.utc(`${date.year}-${date.month}-${date.day} ${currDate.hour()}:${currDate.minute()}:
                ${currDate.second()}`, 'YYYY-M-D HH:mm:ss');
        } else {
            selectedDate = moment(`${date.year}-${date.month}-${date.day} ${currDate.hour()}:${currDate.minute()}:
                ${currDate.second()}`, 'YYYY-M-D HH:mm:ss');
        }

        this.date = this.utilsService.timestampToTime(selectedDate.unix().toString(), this.timezone);
        this.unixTimestamp = selectedDate.unix();
        this.isDateValid = true;
        this.generateCalendar(selectedDate.format(this.dateFormat));
        this.closeCalendar();
    }

    monthSelected(monthIndex: string) { // 0 represents Jan
        // tslint:disable-next-line:max-line-length
        const monthMoment = moment(this.monthCalendarTitle.toString() + '-' + (monthIndex + 1).toString() + '-' + '1'.toString(), 'YYYY-M-D');
        this.toggleDisplay();
        this.tempUnixTimestamp = monthMoment.unix();
        this.generateCalendar(monthMoment.format(this.dateFormat));
    }

    getAbsoluteTimeFromMoment(mom: Moment): string {
        return this.utilsService.timestampToTime(mom.unix().toString(), this.timezone);
    }
}

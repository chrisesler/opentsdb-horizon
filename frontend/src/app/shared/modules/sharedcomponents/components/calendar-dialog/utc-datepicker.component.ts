import { Component, EventEmitter, Input, OnInit, Output, ElementRef, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Moment, isDate } from 'moment';
import { UtilsService } from './datepicker-utils';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'utc-datepicker',
    templateUrl: 'utc-datepicker.component.html',
    styleUrls: ['utc-datepicker.component.scss'],
})
export class UtcDatepickerComponent implements OnInit {
    // tslint:disable:no-inferrable-types
    @Input() date: string;
    @Input() timezone: string = 'utc';
    @Input() button = false;
    @Input() buttonPosition = 'after'; // either before or after
    @Output() dateChange = new EventEmitter<string>();
    @ViewChild('dateInput') el: ElementRef;

    // inputText: string; // keep track of the actual text of the input field
    format = 'YYYY-MM-DD'; // TODO: remove
    isDateValid: boolean = true;
    showCalendar = false;
    days: any[];
    dayNames: any[];
    calendarTitle: string;
    // tempDate: any; // moment object used for keeping track while cycling through months
    calendarPosition = 'angular-utc-datepicker_below';
    calendarTitleFormat: string = 'MMMM YYYY';

    constructor(private utilsService: UtilsService) {
        this.days = [];
        this.dayNames = [];
    }

    ngOnInit() {
        if (typeof this.date === 'object') {
            // date was passed in as a JS Date object
            this.date = moment(this.date).format(this.format);
        }
        this.calendarTitle = this.utilsService.timeToMoment(this.date, this.timezone).format('MMMM YYYY');
        // this.tempDate = this.getMomentDate(this.date);
        if (this.dayNames.length === 0) {
            this.generateDayNames();
        }
    }

    onDateChange = (value: string) => {

        const theMoment: Moment = this.utilsService.timeToMoment(value, this.timezone);

        // TODO: create validator
        if (theMoment) {
            console.log('date valid: ' + theMoment.format(this.format));
            this.date = value;
            this.calendarTitle = theMoment.format(this.calendarTitleFormat);
            this.isDateValid = true;
            this.generateCalendar(theMoment.format(this.format));
            this.dateChange.emit(this.date);
        } else {
            console.log('date invalid: ' + value);
            this.isDateValid = false;
            this.generateCalendar(this.utilsService.timeToMoment(this.date, this.timezone).format(this.format));
        }
    }

    generateDayNames = () => {
        const date = moment('2017-04-02'); // sunday
        for (let i = 0; i < 7; i++) {
            this.dayNames.push(date.format('ddd'));
            date.add('1', 'd');
        }
    }

    openCalendar = (event: any) => {
        const rect = event.target.getBoundingClientRect();
        this.calendarPosition = window.innerHeight - rect.bottom < 250 ? 'angular-utc-datepicker_above' : 'angular-utc-datepicker_below';
        this.showCalendar = true;
        this.generateCalendar(this.utilsService.timeToMoment(this.date, this.timezone).format(this.format));
    }

    closeCalendar = () => {
    //     setTimeout(() => {
    //         this.showCalendar = document.activeElement.className.includes('angular-utc-datepicker_calendar-popup') ||
    //             document.activeElement.className.includes('angular-utc-datepicker_input');
    //         if (!this.showCalendar) {
    //             this.calendarTitle = this.getMomentDate(this.date).format(this.calendarTitleFormat);
    //             this.tempDate = this.getMomentDate(this.date);
    //             // if (this.inputText && this.inputText !== this.date) {
    //             //     this.el.nativeElement.value = this.date;
    //             // }
    //         }
    //     }, 50);
    }

    keydown = (event: any) => {
        // if (event.keyCode === 27) { // escape key
        //     this.showCalendar = false;
        //     this.timezone = 'local';
        // }
    }

    /* GENERATE CALENDAR */
    // INPUT: 2018-09-20
    generateCalendar = (dateAsString: string) => {
        console.log('generating calendar for: ' + dateAsString);
        const date = moment(dateAsString, this.format);

        this.days = [];

        const lastMonth = moment(date).subtract(1, 'M'),
            nextMonth = moment(date).add(1, 'M'),
            month = moment(date).month() + 1,
            year = moment(date).year(),
            firstWeekDay = 1 - moment(date).startOf('M').isoWeekday(),
            totalDays = (42 + firstWeekDay) - 1; // 7 columns X 6 rows

        for (let i = firstWeekDay; i <= totalDays; i++) {
            if (i > 0 && i <= moment(date).endOf('M').date()) {
                // current month
                this.days.push({
                    day: i,
                    month: month,
                    year: year,
                    enabled: 'angular-utc-datepicker_enabled',
                    selected: i === date.date() && this.isDateValid ?
                        'angular-utc-datepicker_selected' :
                        'angular-utc-datepicker_unselected'
                });
            } else if (i > moment(date).endOf('M').date()) {
                // next month
                this.days.push({
                    day: i - date.endOf('M').date(),
                    month: nextMonth.month() + 1,
                    year: nextMonth.year(),
                    enabled: 'angular-utc-datepicker_disabled',
                    selected: 'angular-utc-datepicker_unselected'
                });
            } else {
                // last month
                this.days.push({
                    day: lastMonth.endOf('M').date() - (0 - i),
                    month: lastMonth.month() + 1,
                    year: lastMonth.year(),
                    enabled: 'angular-utc-datepicker_disabled',
                    selected: 'angular-utc-datepicker_unselected'
                });
            }
        }
    }

    prevMonth = () => {
        // this.tempDate.subtract(1, 'M');
        // this.calendarTitle = this.tempDate.format(this.calendarTitleFormat);
        // this.generateCalendar(this.tempDate);
    }

    nextMonth = () => {
        // this.tempDate.add(1, 'M');
        // this.calendarTitle = this.tempDate.format(this.calendarTitleFormat);
        // this.generateCalendar(this.tempDate);
    }

    selectDate = (date: any) => {
        // const currDate = moment(this.date, this.format);
        // const selectedDate = moment(`${date.year}-${date.month}-${date.day} ${currDate.hour()}:${currDate.minute()}:
        //     ${currDate.second()}`, 'YYYY-M-D HH:mm:ss');
        // this.date = selectedDate.format(this.format);
        // this.tempDate = this.getMomentDate(this.date);
        // this.calendarTitle = this.tempDate.format(this.calendarTitleFormat);
        // this.generateCalendar(this.tempDate);
        // this.dateChange.emit(this.date);
        // this.showCalendar = false;
    }

    selectToday = () => {
        // const today = moment();
        // const date = {
        //     day: today.date(),
        //     month: today.month() + 1,
        //     year: today.year(),
        //     enabled: 'angular-utc-datepicker_enabled',
        //     selected: 'angular-utc-datepicker_selected'
        // };
        // this.selectDate(date);
    }
}

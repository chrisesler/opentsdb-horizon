import { Component, EventEmitter, Input, OnInit, Output, ElementRef, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { UtilsService } from './datepicker-utils';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'utc-datepicker',
    templateUrl: 'utc-datepicker.component.html',
    styleUrls: ['utc-datepicker.component.scss'],
})
export class UtcDatepickerComponent implements OnInit {
    @Input() date: string;
    // @Input() time: string;
    // tslint:disable-next-line:no-inferrable-types
    @Input() timezone: string = 'utc';
    @Output() dateChange = new EventEmitter<string>();
    @Input() format = 'YYYY-MM-DD'; // TODO: remove
    @Input() button = false;
    @Input() buttonPosition = 'after'; // either before or after
    @ViewChild('dateInput') el: ElementRef;

    selectedMoment: Moment;
    dateForCalendar: string;

    // inputText: string; // keep track of the actual text of the input field
    showCalendar = false;
    days: any[];
    dayNames: any[];
    calendarTitle: string;
    tempDate: any; // moment object used for keeping track while cycling through months
    calendarPosition = 'angular-utc-datepicker_below';

    constructor(private utilsService: UtilsService) {
        this.days = [];
        this.dayNames = [];
    }

    getMomentDate = (date: any) => {
        // console.log('date is: ');
        // console.log(date);

        if (typeof date === 'string' || date instanceof String) {
            if (!moment.utc(date.toString(), this.format).isValid()) {
                date = moment.utc().format(this.format);
            }
            // console.log('**');
            // console.log(moment.utc(date, this.format));
            // console.log(this.utilsService.timeToMoment(date, this.timezone).utc());
            // return moment.utc(date, this.format);
            return this.utilsService.timeToMoment(date, this.timezone).utc();

        } else { // assumes already a moment
            return date;
        }
    }

    generateCalendar = (date: any) => {
        this.days = [];

        const lastMonth = moment.utc(date).subtract(1, 'M'),
            nextMonth = moment.utc(date).add(1, 'M'),
            month = moment.utc(date).month() + 1,
            year = moment.utc(date).year(),
            firstWeekDay = 1 - moment.utc(date).startOf('M').isoWeekday(),
            totalDays = (42 + firstWeekDay) - 1; // 7 columns X 6 rows

        for (let i = firstWeekDay; i <= totalDays; i++) {
            if (i > 0 && i <= moment.utc(date).endOf('M').date()) {
                // current month
                this.days.push({
                    day: i,
                    month: month,
                    year: year,
                    enabled: 'angular-utc-datepicker_enabled',
                    selected: moment.utc(this.date, this.format).isSame(moment.utc(year + '-' + month + '-' + i, 'YYYY-M-D'), 'day') ?
                        'angular-utc-datepicker_selected' :
                        'angular-utc-datepicker_unselected'
                });
            } else if (i > moment.utc(date).endOf('M').date()) {
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
        this.generateCalendar(this.getMomentDate(this.tempDate));
    }

    closeCalendar = () => {
        setTimeout(() => {
            this.showCalendar = document.activeElement.className.includes('angular-utc-datepicker_calendar-popup') ||
                document.activeElement.className.includes('angular-utc-datepicker_input');
            if (!this.showCalendar) {
                this.calendarTitle = this.getMomentDate(this.date).format('MMMM YYYY');
                this.tempDate = this.getMomentDate(this.date);
                // if (this.inputText && this.inputText !== this.date) {
                //     this.el.nativeElement.value = this.date;
                // }
            }
        }, 50);
    }

    prevMonth = () => {
        this.tempDate.subtract(1, 'M');
        this.calendarTitle = this.tempDate.format('MMMM YYYY');
        this.generateCalendar(this.tempDate);
    }

    nextMonth = () => {
        this.tempDate.add(1, 'M');
        this.calendarTitle = this.tempDate.format('MMMM YYYY');
        this.generateCalendar(this.tempDate);
    }

    selectDate = (date: any) => {
        const currDate = moment.utc(this.date, this.format);
        const selectedDate = moment.utc(`${date.year}-${date.month}-${date.day} ${currDate.hour()}:${currDate.minute()}:
            ${currDate.second()}`, 'YYYY-M-D HH:mm:ss');
        this.date = selectedDate.format(this.format);
        this.tempDate = this.getMomentDate(this.date);
        this.calendarTitle = this.tempDate.format('MMMM YYYY');
        this.generateCalendar(this.tempDate);
        this.dateChange.emit(this.date);
        this.showCalendar = false;
    }

    selectToday = () => {
        const today = moment.utc();
        const date = {
            day: today.date(),
            month: today.month() + 1,
            year: today.year(),
            enabled: 'angular-utc-datepicker_enabled',
            selected: 'angular-utc-datepicker_selected'
        };
        this.selectDate(date);
    }

    keydown = (event: any) => {
        if (event.keyCode === 27) { // escape key
            this.showCalendar = false;
        }
    }

    onDateChange = (value: string) => {
        // this.inputText = value;

        const isValid = moment.utc(value, this.format).format(this.format) === value;

        // TODO: create validator
        if (isValid) {
            this.date = value;
            console.log(moment.utc(value, this.format).format('MMMM YYYY'));
            this.calendarTitle = moment.utc(value, this.format).format('MMMM YYYY');
            this.generateCalendar(this.getMomentDate(value));
            this.dateChange.emit(this.date);
        } else {
            console.log('invalid date: ');
            console.log(value);
        }
    }

    ngOnInit() {
        if (typeof this.date === 'object') {
            // date was passed in as a JS Date object
            this.date = moment.utc(this.date).format(this.format);
        }
        this.calendarTitle = this.getMomentDate(this.date).format('MMMM YYYY');
        this.tempDate = this.getMomentDate(this.date);
        if (this.dayNames.length === 0) {
            this.generateDayNames();
        }
    }

}

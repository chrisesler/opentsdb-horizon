import { Moment } from 'moment';
import { SingleCalendarValue } from '../types/single-calendar-value';
import { CalendarMode } from '../types/calendar-mode';

export interface ICalendar {
    locale?: string;
    min?: SingleCalendarValue;
    max?: Moment | string;
}

export interface ICalendarInternal {
    locale?: string;
    min?: Moment;
    max?: Moment;
}

export interface INavEvent {
    from: Moment;
    to: Moment;
}

export interface IDate {
    date: Moment;
    selected: boolean;
}

export class ISelectedTime {
    startTimeUnix: string;
    endTimeUnix: string;
    startTimeDisplay: string;
    endTimeDisplay: string;
}

export class TimeRangePickerOptions {
    startFutureTimesDisabled: boolean;
    endFutureTimesDisabled: boolean;

    startTimePlaceholder: string;
    endTimePlaceholder: string;
    startTimeInputBoxName: string;
    endTimeInputBoxName: string;

    defaultStartText: string;
    defaultEndText: string;
    defaultStartHoursFromNow: number;
    defaultEndHoursFromNow: number;

    startTime: string;
    endTime: string;

    startDateFormatError: string;
    endDateFormatError: string;
    startMaxDateError: string;
    endMaxDateError: string;

    minMinuteDuration: number;

    // Future Use
    startMinDate: Moment;
    endMinDate: Moment;
    startMaxDate: Moment;
    endMaxDate: Moment;
    startMinDateError: string;
    endMinDateError: string;
}

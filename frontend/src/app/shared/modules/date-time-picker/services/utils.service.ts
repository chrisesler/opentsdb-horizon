import {ECalendarValue} from '../types/calendar-value-enum';
import {SingleCalendarValue} from '../types/single-calendar-value';
import {Injectable} from '@angular/core';
import * as momentNs from 'moment';
import {Moment, unitOfTime, duration} from 'moment';
import {CalendarValue} from '../types/calendar-value';
import {IDate, ICalendarInternal} from '../models/models';
import {CalendarMode} from '../types/calendar-mode';
import {DateValidator} from '../types/validator.type';

const moment = momentNs;
// tslint:disable-next-line:no-inferrable-types
const maxUnixTimestamp: number = 1000000000000; // 11/16/5138
// tslint:disable-next-line:no-inferrable-types
const minUnixTimestamp: number = 1000000000;    // 09/08/2001
// tslint:disable-next-line:no-inferrable-types
const minYear: number = 1970;                   // for relative time

// key is valid 'this' time AND keyword for moment to subtract.
// value is valid abbr for relative-time user-input
export const timeAbbr = {
 day : 'd',     // before year so 'y' in 'day' is not years
 year : 'y',
 quarter : 'q',
 month : 'mo',
 week : 'w',
 hour : 'h',
 minute : 'min',
 second: 'sec'  // not 's' so days or hours is not seconds
};

enum validDateWithoutTimeFormat {
  'M/D/YY',
  'M/D/YYYY',
  'MM/DD/YY',
  'MM/DD/YYYY',
  'M-D-YY',
  'M-D-YYYY',
  'MM-DD-YY',
  'MM-DD-YYYY',
  'YYYY-MM-DD'
}

export function abbrToTime (abbr: string): any {
  for (const index in timeAbbr) {
    if (timeAbbr[index].toString() === abbr.toLowerCase()) {
      return index;
    }
  }
  return;
}

function timeToTime(inputTime: string): any {
  for (let time in timeAbbr) {
      if (timeAbbr[time]) {
        time = time.toString();
        if (time === inputTime) {
        return time;
        }
    }
  }
  return;
}

@Injectable()
export class UtilsService {
  static debounce(func: Function, wait: number) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      timeout = clearTimeout(timeout);
      setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

  createArray(size: number): number[] {
    return new Array(size).fill(1);
  }

  convertToMoment(date: SingleCalendarValue, format: string): Moment {
    if (!date) {
      return null;
    } else if (typeof date === 'string') {
      return moment(date, format);
    } else {
      return date.clone();
    }
  }

  isDateValid(date: string, format: string): boolean {
    if (date === '') {
      return true;
    }
    return moment(date, format, true).isValid();
  }

  isTimeStampValid(time: string): boolean {
    return ( time &&
             !time.startsWith('-') &&
             Number(time) < maxUnixTimestamp &&
             Number(time) >= minUnixTimestamp &&
             moment.unix(Number(time)).isValid()
            );
  }

  isStringAValidNonDefaultTime(time: string): Boolean {
    time = time.toLowerCase().trim();
    // tslint:disable-next-line:no-inferrable-types
    let stringIsValid: boolean = false;

    if (this.relativeTimeToMoment(time)) {
       stringIsValid = true;
    } else if (this.isTimeStampValid(time)) {
      stringIsValid = true;
    } else if (this.dateWithoutTimeToMoment(time)) {
      stringIsValid = true;
    } else if (time === 'now') {
      stringIsValid = true;
    } else if (timeToTime(time)) {
      stringIsValid = true;
    }

    return stringIsValid;
  }

  dateWithoutTimeToMoment(time: string): Moment {
    for (const format in validDateWithoutTimeFormat) {
      if (moment(time, format, true).isValid()) {
        return moment(time, format, true);
      }
    }
    return;
  }

  strippedRelativeTime(relativeTime: string): string {
    const timeAmount: number = this.getTimeAmount(relativeTime);
    let timeUnit: string = this.getTimeUnitAbbr(relativeTime.split(timeAmount.toString()).pop());

    // do not strip qtr and wk
    if (relativeTime.includes('qtr') && timeUnit === 'q') {
      timeUnit = 'qtr';
    }

    if (relativeTime.includes('wk') && timeUnit === 'w') {
      timeUnit = 'wk';
    }

    return timeAmount.toString() + timeUnit;
  }

  relativeTimeToMoment(relativeTime: string): Moment {
    const timeAmount: number = this.getTimeAmount(relativeTime);
    const timeUnit: string = this.getTimeUnitAbbr(relativeTime.split(timeAmount.toString()).pop());

    const now: Moment = moment();
    const numYears = now.year() - minYear;
    let _moment;

    // input has no time or amount
    if (!timeUnit || !timeAmount) {
      return;
    }

    // protect moment from abusive numbers
    if ( (timeUnit === timeAbbr.year && timeAmount < 1 * numYears)             ||
        (timeUnit === timeAbbr.quarter && timeAmount < 4 * numYears)          ||
        (timeUnit === timeAbbr.month && timeAmount < 12 * numYears)           ||
        (timeUnit === timeAbbr.week && timeAmount < 52 * numYears)            ||
        (timeUnit === timeAbbr.day && timeAmount < 365 * numYears)            ||
        (timeUnit === timeAbbr.hour && timeAmount < 8760 * numYears)          ||
        (timeUnit === timeAbbr.minute && timeAmount < 525600 * numYears)      ||
        (timeUnit === timeAbbr.second && timeAmount < 525600 * 60 * numYears)) {

      _moment = now.subtract(timeAmount, abbrToTime(timeUnit));
    }
    return _moment;
  }

  getTimeAmount(relativeTime: string): number {
    const number: number = Number(relativeTime.match(/\d+/));
    return number;
  }

  getTimeUnitAbbr(relativeTime: string): string {
    relativeTime = relativeTime.toLowerCase().trim();
    // tslint:disable-next-line:no-inferrable-types
    let timeUnitAbbr: string = '';

    // check if user input contains a valid time unit abbr
    // in-case some browsers do not keep order of map, first check for 'day'
    if (relativeTime.includes(timeAbbr.day)) {
      timeUnitAbbr = timeAbbr.day;
    } else {
      for (const index in timeAbbr) {
        if (relativeTime.includes(timeAbbr[index])) {
          timeUnitAbbr = timeAbbr[index];
          break;
        }
      }
    }
    return timeUnitAbbr;
  }

  getNonDefaultFormatTime(time: string): Moment[] {
    time = time.toLowerCase().trim();
    const moments = [];

    if (time.toLowerCase() === 'now') {
      moments.push(moment());
    } else if (timeToTime(time)) {  // e.g., this 'quarter'
      moments.push(moment().startOf(timeToTime(time.toLowerCase())));
    } else if (moment.unix(Number(time)).isValid()) {  // e.g., 1234567890
      moments.push(moment.unix(Number(time)));
    } else if (this.relativeTimeToMoment(time)) {  // e.g., 1h
      moments.push(this.relativeTimeToMoment(time));
    } else if (this.dateWithoutTimeToMoment(time)) {  // e.g., 05/05/18
      moments.push(this.dateWithoutTimeToMoment(time));
    }

    return moments;
  }

  // todo:: add unit test
  getDefaultDisplayDate(current: Moment,
                        selected: Moment[],
                        allowMultiSelect: boolean,
                        minDate: Moment): Moment {
    if (current) {
      return current.clone();
    } else if (minDate && minDate.isAfter(moment())) {
      return minDate.clone();
    } else if (allowMultiSelect) {
      if (selected && selected[selected.length]) {
        return selected[selected.length].clone();
      }
    } else if (selected && selected[0]) {
      return selected[0].clone();
    }

    return moment();
  }

  // todo:: add unit test
  getInputType(value: CalendarValue, allowMultiSelect: boolean): ECalendarValue {
    if (Array.isArray(value)) {
      if (!value.length) {
        return ECalendarValue.MomentArr;
      } else if (typeof value[0] === 'string') {
        return ECalendarValue.StringArr;
      } else if (moment.isMoment(value[0])) {
        return ECalendarValue.MomentArr;
      }
    } else {
      if (typeof value === 'string') {
        return ECalendarValue.String;
      } else if (moment.isMoment(value)) {
        return ECalendarValue.Moment;
      }
    }

    return allowMultiSelect ? ECalendarValue.MomentArr : ECalendarValue.Moment;
  }

  // todo:: add unit test
  convertToMomentArray(value: CalendarValue, format: string, allowMultiSelect: boolean): Moment[] {
    switch (this.getInputType(value, allowMultiSelect)) {
      case (ECalendarValue.String):
          return value ? [moment(<string>value, format, true)] : [];
      case (ECalendarValue.StringArr):
        return (<string[]>value).map(v => v ? moment(v, format, true) : null).filter(Boolean);
      case (ECalendarValue.Moment):
        return value ? [(<Moment>value).clone()] : [];
      case (ECalendarValue.MomentArr):
        return (<Moment[]>value || []).map(v => v.clone());
      default:
        return [];
    }
  }

  // todo:: add unit test
  convertFromMomentArray(format: string,
                         value: Moment[],
                         convertTo: ECalendarValue): CalendarValue {
    switch (convertTo) {
      case (ECalendarValue.String):
        return value[0] && value[0].format(format);
      case (ECalendarValue.StringArr):
        return value.filter(Boolean).map(v => v.format(format));
      case (ECalendarValue.Moment):
        return value[0] ? value[0].clone() : value[0];
      case (ECalendarValue.MomentArr):
        return value ? value.map(v => v.clone()) : value;
      default:
        return value;
    }
  }

  convertToString(value: CalendarValue, format: string): string {
    let tmpVal: string[];

    if (typeof value === 'string') {
      tmpVal = [value];
    } else if (Array.isArray(value)) {
      if (value.length) {
        tmpVal = (<SingleCalendarValue[]>value).map((v) => {
          return this.convertToMoment(v, format).format(format);
        });
      } else {
        tmpVal = <string[]>value;
      }
    } else if (moment.isMoment(value)) {
      tmpVal = [value.format(format)];
    } else {
      return '';
    }

    return tmpVal.filter(Boolean).join(' | ');
  }

  // todo:: add unit test
  clearUndefined<T>(obj: T): T {
    if (!obj) {
      return obj;
    }

    Object.keys(obj).forEach((key) => (obj[key] === undefined) && delete obj[key]);
    return obj;
  }

  updateSelected(isMultiple: boolean,
                 currentlySelected: Moment[],
                 date: IDate,
                 granularity: unitOfTime.Base = 'day'): Moment[] {
    const isSelected = !date.selected;
    if (isMultiple) {
      return isSelected
        ? currentlySelected.concat([date.date])
        : currentlySelected.filter(d => !d.isSame(date.date, granularity));
    } else {
      return isSelected ? [date.date] : [];
    }
  }

  closestParent(element: HTMLElement, selector: string): HTMLElement {
    if (!element) {
      return undefined;
    }
    const match = <HTMLElement>element.querySelector(selector);
    return match || this.closestParent(element.parentElement, selector);
  }

  onlyTime(m: Moment): Moment {
    return m && moment.isMoment(m) && moment(m.format('HH:mm:ss'), 'HH:mm:ss');
  }

  granularityFromType(calendarType: CalendarMode): unitOfTime.Base {
    switch (calendarType) {
      case 'time':
        return 'second';
      case 'daytime':
        return 'second';
      default:
        return calendarType;
    }
  }

  createValidator({minDate, maxDate, minTime, maxTime}: DateLimits,
                  format: string,
                  calendarType: CalendarMode): DateValidator {
    let isValid: boolean;
    let value: Moment[];
    const validators = [];
    const granularity = this.granularityFromType(calendarType);

    if (minDate) {
      const md = this.convertToMoment(minDate, format);
      validators.push({
        key: 'minDate',
        isValid: () => {
          const _isValid = value.every(val => val.isSameOrAfter(md, granularity));
          isValid = isValid ? _isValid : false;
          return _isValid;
        }
      });
    }

    if (maxDate) {
      const md = this.convertToMoment(maxDate, format);
      validators.push({
        key: 'maxDate',
        isValid: () => {
          const _isValid = value.every(val => val.isSameOrBefore(md, granularity));
          isValid = isValid ? _isValid : false;
          return _isValid;
        }
      });
    }

    if (minTime) {
      const md = this.onlyTime(this.convertToMoment(minTime, format));
      validators.push({
        key: 'minTime',
        isValid: () => {
          const _isValid = value.every(val => this.onlyTime(val).isSameOrAfter(md));
          isValid = isValid ? _isValid : false;
          return _isValid;
        }
      });
    }

    if (maxTime) {
      const md = this.onlyTime(this.convertToMoment(maxTime, format));
      validators.push({
        key: 'maxTime',
        isValid: () => {
          const _isValid = value.every(val => this.onlyTime(val).isSameOrBefore(md));
          isValid = isValid ? _isValid : false;
          return _isValid;
        }
      });
    }

    return (inputVal: CalendarValue) => {
      isValid = true;

      // validate relative time
      if (typeof inputVal === 'string' && this.isStringAValidNonDefaultTime(inputVal)) {
        value = this.getNonDefaultFormatTime(inputVal).filter(Boolean);
      } else {
        value = this.convertToMomentArray(inputVal, format, true).filter(Boolean);
      }

      if (!value.every(val => val.isValid())) {
        return {
          format: {
            given: inputVal
          }
        };
      }

      const errors = validators.reduce((map, err) => {
        if (!err.isValid()) {
          map[err.key] = {
            given: value
          };
        }

        return map;
      }, {});

      return !isValid ? errors : null;
    };
  }

  datesStringToStringArray(value: string): string[] {
    return (value || '').split('|').map(m => m.trim()).filter(Boolean);
  }

  getValidMomentArray(value: string, format: string): Moment[] {
    return this.datesStringToStringArray(value)
      .filter(d => this.isDateValid(d, format))
      .map(d => moment(d, format));
  }

  shouldShowCurrent(showGoToCurrent: boolean,
                    mode: CalendarMode,
                    min: Moment,
                    max: Moment): boolean {
    return showGoToCurrent &&
      mode !== 'time' &&
      this.isDateInRange(moment(), min, max);
  }

  isDateInRange(date: Moment, from: Moment, to: Moment): boolean {
    return date.isBetween(from, to, 'day', '[]');
  }

  convertPropsToMoment(obj: {[key: string]: any}, format: string, props: string[]) {
    props.forEach((prop) => {
      if (obj.hasOwnProperty(prop)) {
        obj[prop] = this.convertToMoment(obj[prop], format);
      }
    });
  }

  shouldResetCurrentView<T extends ICalendarInternal>(prevConf: T, currentConf: T): boolean {
    if (prevConf && currentConf) {
      if (!prevConf.min && currentConf.min) {
        return true;
      } else if (prevConf.min && currentConf.min && !prevConf.min.isSame(currentConf.min, 'd')) {
        return true;
      } else if (!prevConf.max && currentConf.max) {
        return true;
      } else if (prevConf.max && currentConf.max && !prevConf.max.isSame(currentConf.max, 'd')) {
        return true;
      }

      return false;
    }

    return false;
  }
}

export interface DateLimits {
  minDate?: SingleCalendarValue;
  maxDate?: SingleCalendarValue;
  minTime?: SingleCalendarValue;
  maxTime?: SingleCalendarValue;
}


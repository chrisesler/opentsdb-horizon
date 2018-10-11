// import {ECalendarValue} from '../types/calendar-value-enum';
// import {SingleCalendarValue} from '../types/single-calendar-value';
import {Injectable} from '@angular/core';
import * as momentNs from 'moment';
import {Moment, unitOfTime, duration} from 'moment';
// import {CalendarValue} from '../types/calendar-value';
// import {IDate, ICalendarInternal} from '../models/models';
// import {CalendarMode} from '../types/calendar-mode';
// import {DateValidator} from '../types/validator.type';

const moment = momentNs;
// tslint:disable-next-line:no-inferrable-types
const maxUnixTimestamp: number = 1000000000000; // 11/16/5138
// tslint:disable-next-line:no-inferrable-types
const minUnixTimestamp: number = 1000000000;    // 09/08/2001
// tslint:disable-next-line:no-inferrable-types
const minYear: number = 1970;                   // for relative time

const defaultFormat: string = 'MM/DD/YYYY hh:mm A';

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
//   static debounce(func: Function, wait: number) {
//     let timeout;
//     return function () {
//       const context = this, args = arguments;
//       timeout = clearTimeout(timeout);
//       setTimeout(() => {
//         func.apply(context, args);
//       }, wait);
//     };
//   }



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

//   isStringAValidNonDefaultTime(time: string): Boolean {
//     time = time.toLowerCase().trim();
//     // tslint:disable-next-line:no-inferrable-types
//     let stringIsValid: boolean = false;

//     if (this.relativeTimeToMoment(time)) {
//        stringIsValid = true;
//     } else if (this.isTimeStampValid(time)) {
//       stringIsValid = true;
//     } else if (this.dateWithoutTimeToMoment(time)) {
//       stringIsValid = true;
//     } else if (time === 'now') {
//       stringIsValid = true;
//     } else if (timeToTime(time)) {
//       stringIsValid = true;
//     }

//     return stringIsValid;
//   }

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

  defaultTimeToMoment(time: string): Moment {
    if (moment(time, defaultFormat, true).isValid()) {
        return moment(time, defaultFormat, true);
    }
    return;
  }

  timeToMoment(time: string, timezone: string): Moment {
    // time = time.toLowerCase().trim();
    let _moment: Moment;

    if (this.defaultTimeToMoment(time)) {
      _moment = this.defaultTimeToMoment(time);
    } else if (time.toLowerCase() === 'now') {
      _moment = moment();
    } else if (timeToTime(time)) {  // e.g., this 'quarter'
      _moment = moment().startOf(timeToTime(time.toLowerCase()));
    } else if (this.isTimeStampValid(time)) {  // e.g., 1234567890
      _moment = moment.unix(Number(time));
    } else if (this.relativeTimeToMoment(time)) {  // e.g., 1h
      _moment = this.relativeTimeToMoment(time);
    } else if (this.dateWithoutTimeToMoment(time)) {  // e.g., 05/05/18
      _moment = this.dateWithoutTimeToMoment(time);
    }

    if (timezone.toLowerCase() === 'utc') {
      _moment = _moment.utc();
    }
    return _moment;

    // if (timezone.toLowerCase() === 'utc') {

    //     if (this.defaultTimeToMoment(time)) {
    //         return this.defaultTimeToMoment(time).utc();
    //     } else if (time.toLowerCase() === 'now') {
    //         return moment().utc();
    //     } else if (timeToTime(time)) {  // e.g., this 'quarter'
    //         return moment().utc().startOf(timeToTime(time.toLowerCase()));
    //     } else if (this.isTimeStampValid(time)) {  // e.g., 1234567890
    //         return moment.unix(Number(time)).utc();
    //     } else if (this.relativeTimeToMoment(time)) {  // e.g., 1h
    //         return this.relativeTimeToMoment(time).utc();
    //     } else if (this.dateWithoutTimeToMoment(time)) {  // e.g., 05/05/18
    //         return this.dateWithoutTimeToMoment(time).utc();
    //     }

    // } else { // local time

    //     if (this.defaultTimeToMoment(time)) {
    //         return this.defaultTimeToMoment(time);
    //     } else if (time.toLowerCase() === 'now') {
    //         return moment();
    //     } else if (timeToTime(time)) {  // e.g., this 'quarter'
    //         return moment().startOf(timeToTime(time.toLowerCase()));
    //     } else if (this.isTimeStampValid(time)) {  // e.g., 1234567890
    //         return moment.unix(Number(time));
    //     } else if (this.relativeTimeToMoment(time)) {  // e.g., 1h
    //         return this.relativeTimeToMoment(time);
    //     } else if (this.dateWithoutTimeToMoment(time)) {  // e.g., 05/05/18
    //         return this.dateWithoutTimeToMoment(time);
    //     }
    // }
  }

//   createValidator({minDate, maxDate, minTime, maxTime}: DateLimits,
//                   format: string,
//                   calendarType: CalendarMode): DateValidator {
//     let isValid: boolean;
//     let value: Moment[];
//     const validators = [];
//     const granularity = this.granularityFromType(calendarType);

//     if (minDate) {
//       const md = this.convertToMoment(minDate, format);
//       validators.push({
//         key: 'minDate',
//         isValid: () => {
//           const _isValid = value.every(val => val.isSameOrAfter(md, granularity));
//           isValid = isValid ? _isValid : false;
//           return _isValid;
//         }
//       });
//     }

//     if (maxDate) {
//       const md = this.convertToMoment(maxDate, format);
//       validators.push({
//         key: 'maxDate',
//         isValid: () => {
//           const _isValid = value.every(val => val.isSameOrBefore(md, granularity));
//           isValid = isValid ? _isValid : false;
//           return _isValid;
//         }
//       });
//     }

//     if (minTime) {
//       const md = this.onlyTime(this.convertToMoment(minTime, format));
//       validators.push({
//         key: 'minTime',
//         isValid: () => {
//           const _isValid = value.every(val => this.onlyTime(val).isSameOrAfter(md));
//           isValid = isValid ? _isValid : false;
//           return _isValid;
//         }
//       });
//     }

//     if (maxTime) {
//       const md = this.onlyTime(this.convertToMoment(maxTime, format));
//       validators.push({
//         key: 'maxTime',
//         isValid: () => {
//           const _isValid = value.every(val => this.onlyTime(val).isSameOrBefore(md));
//           isValid = isValid ? _isValid : false;
//           return _isValid;
//         }
//       });
//     }

//     return (inputVal: CalendarValue) => {
//       isValid = true;

//       // validate relative time
//       if (typeof inputVal === 'string' && this.isStringAValidNonDefaultTime(inputVal)) {
//         value = this.getNonDefaultFormatTime(inputVal).filter(Boolean);
//       } else {
//         value = this.convertToMomentArray(inputVal, format, true).filter(Boolean);
//       }

//       if (!value.every(val => val.isValid())) {
//         return {
//           format: {
//             given: inputVal
//           }
//         };
//       }

//       const errors = validators.reduce((map, err) => {
//         if (!err.isValid()) {
//           map[err.key] = {
//             given: value
//           };
//         }

//         return map;
//       }, {});

//       return !isValid ? errors : null;
//     };
//   }

}

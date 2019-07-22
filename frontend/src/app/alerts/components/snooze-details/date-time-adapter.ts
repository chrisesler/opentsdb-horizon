/*
import { NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from "@angular/material";

import * as moment from 'moment';

export class DateTimeAdapter extends NativeDateAdapter {

      parse(value: any): Date | null {
          console.log("date", value)
        if (value && typeof value == 'string') {
            return new Date(moment(value).valueOf())
            }
        return value ? new Date(moment(value).valueOf()) : null;
    }
   format(date: Date, displayFormat: string): string {

      const ts = date.getTime();
      console.log("display date", date, ts)
      return moment(ts).format("MM/DD/YYYY HH:mm");
   }

   private _to2digit(n: number) {
       return ('00' + n).slice(-2);
   } 
}

export const APP_DATE_FORMATS =
{
   parse: {
       dateInput: {month: 'short', year: 'numeric', day: 'numeric'}
   },
   display: {
       // dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
       dateInput: 'input',
       // monthYearLabel: { month: 'short', year: 'numeric', day: 'numeric' },
       monthYearLabel: 'inputMonth',
       dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
       monthYearA11yLabel: {year: 'numeric', month: 'long'},
   }
}
*/
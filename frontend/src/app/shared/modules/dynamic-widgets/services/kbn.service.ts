import { Injectable } from '@angular/core';
import kbn from './kbn';

@Injectable({
  providedIn: 'root',
})

export class KBNService {

  constructor() { }

  preciseNumber(desc: string, value: number, precision: number): number {
    const numDigitsBeforeDecimal = Math.abs(value).toFixed().toString() === '0' ? 0 : Math.abs(value).toFixed().toString().length;
    return kbn.valueFormats[desc](value, precision - numDigitsBeforeDecimal, precision - numDigitsBeforeDecimal);
  }

}


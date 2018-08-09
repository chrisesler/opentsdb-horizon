import { Injectable } from '@angular/core';
import kbn from './kbn';

@Injectable({
  providedIn: 'root',
})

export class KBNService {

  constructor() { }

  // Units for Scaling
  simpleUnits = ['', 'K', 'M', 'B', 'T', 'Q']; // base 1000
  binarySIUnits = ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi']; // base 1024
  decimalSIUnits = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']; // base 1000

  // Main Method
  public getBigNumber(val: number, unit: string, precision?: number): string {
    let bigNum: string;
    switch (unit) {
      // Data (Binary)
      case 'bits':
        bigNum = this.preciseNumber(this.binarySI(val, 0), precision) + 'b';
        break;
      case 'bytes':
        bigNum = this.preciseNumber(this.binarySI(val, 0), precision) + 'B';
        break;
      case 'kbytes':
        bigNum = this.preciseNumber(this.binarySI(val, 1), precision) + 'B';
        break;
      case 'mbytes':
        bigNum = this.preciseNumber(this.binarySI(val, 2), precision) + 'B';
        break;
      case 'gbytes':
        bigNum = this.preciseNumber(this.binarySI(val, 3), precision) + 'B';
        break;

      // Data (Decimal)
      case 'decbits':
        bigNum = this.preciseNumber(this.decimalSI(val, 0), precision) + 'b';
        break;
      case 'decbytes':
        bigNum = this.preciseNumber(this.decimalSI(val, 0), precision) + 'B';
        break;
      case 'deckbytes':
        bigNum = this.preciseNumber(this.decimalSI(val, 1), precision) + 'B';
        break;
      case 'decmbytes':
        bigNum = this.preciseNumber(this.decimalSI(val, 2), precision) + 'B';
        break;
      case 'decgbytes':
        bigNum = this.preciseNumber(this.decimalSI(val, 3), precision) + 'B';
        break;

      // Data Rate
      case 'pps':
        bigNum = this.preciseNumber(this.decimalSI(val, 0), precision) + 'pps';
        break;
      case 'bps':
        bigNum = this.preciseNumber(this.decimalSI(val, 0), precision) + 'bps';
        break;
      case 'Bps':
        bigNum = this.preciseNumber(this.decimalSI(val, 0), precision) + 'B/s';
        break;
      case 'KBs':
        bigNum = this.preciseNumber(this.decimalSI(val, 1), precision) + 'Bs';
        break;
      case 'Kbits':
        bigNum = this.preciseNumber(this.decimalSI(val, 1), precision) + 'bps';
        break;
      case 'MBs':
        bigNum = this.preciseNumber(this.decimalSI(val, 2), precision) + 'Bs';
        break;
      case 'Mbits':
        bigNum = this.preciseNumber(this.decimalSI(val, 2), precision) + 'bps';
        break;
      case 'GBs':
        bigNum = this.preciseNumber(this.decimalSI(val, 3), precision) + 'Bs';
        break;
      case 'Gbits':
        bigNum = this.preciseNumber(this.decimalSI(val, 3), precision) + 'bps';
        break;

      // Throughput
      case 'ops' || 'reqps' || 'rps' || 'wps' || 'iops' || 'opm' || 'rpm' || 'wpm':
        bigNum = this.preciseNumber(this.short(val), precision, false) + unit;
        break;

      // Time
      case 'ms':
        bigNum = this.preciseNumber(this.milliSeconds(val), precision);
        break;
      case 'second':
        bigNum = this.preciseNumber(this.seconds(val), precision);
        break;
      case 'minute':
        bigNum = this.preciseNumber(this.minutes(val), precision);
        break;
      case 'hour':
        bigNum = this.preciseNumber(this.hours(val), precision);
        break;
      case 'day':
        bigNum = this.preciseNumber(this.days(val), precision);
        break;
      case 'year':
        bigNum = this.preciseNumber(this.years(val), precision);
        break;

      // Simple Counts
      case 'short':
        bigNum = this.preciseNumber(this.short(val), precision);
        break;

      // Unrecognized unit defaults to 'short' + unit
      default:
        bigNum = this.preciseNumber(this.short(val), precision, false) + ' ' + unit;
        break;
    }
    return bigNum;
  }

  // HELPER Methods
  preciseNumber(numUnit: INumberUnit, precision?: number, spaceAfterNumber?: boolean): string {
    if (spaceAfterNumber == null) {
      spaceAfterNumber = true;
    }

    if (!numUnit.num) {
      return numUnit.unit || 'NA';
    }

    if (precision < 1 || precision > 15 || !precision) {
      precision = 3;
    }
    const fractionLength = (precision - this.intLength(numUnit.num) < 0) ? 0 : precision - this.intLength(numUnit.num);

    return (spaceAfterNumber) ? numUnit.num.toFixed(fractionLength) + ' ' + numUnit.unit
                              : numUnit.num.toFixed(fractionLength) + numUnit.unit;
  }

  intLength(num: number): number {
    return  Math.abs(num).toFixed().toString() === '0' ? 0 : Math.abs(num).toFixed().toString().length;
  }

  normalizer(base: number, magnitude: number, units: string[], val: number ): INumberUnit {
    if (base <= 1 || !units.length || magnitude < 0) {
      return {num: val, unit: 'NA'};
    }

    while (this.intLength(val) > 3) {
      val = val / base;
      magnitude++;
    }

    return (magnitude >= units.length) ? {num: null, unit: 'NA'} : {num: val, unit: units[magnitude]};
  }

  // NON-TIME Scales
  short(val: number): INumberUnit {
    return this.normalizer(1000, 0, this.simpleUnits, val);
  }

  binarySI(val: number, magnitude: number): INumberUnit {
    return this.normalizer(1024, magnitude, this.binarySIUnits, val);
  }

  decimalSI(val: number, magnitude: number): INumberUnit {
    return this.normalizer(1000, magnitude, this.decimalSIUnits, val);
  }

  // TIME Scales
  milliSeconds(val: number): INumberUnit {
    return (this.intLength(val) > 3) ? this.seconds(val / 1000) : { num: val, unit: 'ms'};
  }

  seconds(val: number): INumberUnit {
    return (Math.abs(val) > 60) ? this.minutes(val / 60) : { num: val, unit: 's'};
  }

  minutes(val: number): INumberUnit {
    return (Math.abs(val) > 60) ? this.hours(val / 60) : { num: val, unit: 'min'};
  }

  hours(val: number): INumberUnit {
    return (Math.abs(val) > 24) ? this.days(val / 24) : { num: val, unit: 'hour'};
  }

  days(val: number): INumberUnit {
    return (Math.abs(val) > 365) ? this.years(val / 365) : { num: val, unit: 'day'};
  }

  years(val: number): INumberUnit {
    // tslint:disable-next-line:prefer-const
    let numUnit = this.normalizer(1000, 0, this.simpleUnits, val);
    numUnit.unit = numUnit.unit + ' ' + 'yr';
    return numUnit;
  }

  // OLD Grafana method - only for testing
  kbnPreciseNumber(value: number, desc: string, precision: number): number {
    const numDigitsBeforeDecimal = Math.abs(value).toFixed().toString() === '0' ? 0 : Math.abs(value).toFixed().toString().length;
    return kbn.valueFormats[desc](value, precision - numDigitsBeforeDecimal, precision - numDigitsBeforeDecimal);
  }
}

interface INumberUnit {
  num: number;
  unit: string;
}

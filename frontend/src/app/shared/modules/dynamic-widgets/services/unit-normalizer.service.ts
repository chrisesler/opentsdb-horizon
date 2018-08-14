import { Injectable } from '@angular/core';
import kbn from './kbn';
import { Stringifiable } from 'd3';

@Injectable({
  providedIn: 'root',
})

export class UnitNormalizerService {

  constructor() { }

  // Units for Scaling
  simpleUnits = ['', 'K', 'M', 'B', 'T', 'Q']; // base 1000
  binarySIUnits = ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi']; // base 1024
  decimalSIUnits = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']; // base 1000
  errorUnit = 'NA';

  // Main Method
  public getBigNumber(val: number, unit: string, precision?: number): IBigNum {
    let bigNum: IBigNum;
    switch (unit) {
      // Data (Binary)
      case 'bits':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'b');
        break;
      case 'bytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'B');
        break;
      case 'kbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 1), precision, 'B');
        break;
      case 'mbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 2), precision, 'B');
        break;
      case 'gbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 3), precision, 'B');
        break;

      // Data (Decimal)
      case 'decbits':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'b');
        break;
      case 'decbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'B');
        break;
      case 'deckbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'B');
        break;
      case 'decmbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'B');
        break;
      case 'decgbytes':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'B');
        break;

      // Data Rate
      case 'pps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'pps');
        break;
      case 'bps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'bps');
        break;
      case 'Bps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'B/s');
        break;
      case 'KBs':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'Bs');
        break;
      case 'Kbits':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'bps');
        break;
      case 'MBs':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'Bs');
        break;
      case 'Mbits':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'bps');
        break;
      case 'GBs':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'Bs');
        break;
      case 'Gbits':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'bps');
        break;

      // Throughput
      case 'ops':
      case 'reqps':
      case 'rps':
      case 'wps':
      case 'iops':
      case 'opm':
      case 'rpm':
      case 'wpm':
        bigNum = this.formatNumberWithDim(this.short(val), precision, unit);
        break;

      // Time
      case 'ms':
        bigNum = this.formatNumber(this.milliSeconds(val), precision);
        break;
      case 'second':
        bigNum = this.formatNumber(this.seconds(val), precision);
        break;
      case 'minute':
        bigNum = this.formatNumber(this.minutes(val), precision);
        break;
      case 'hour':
        bigNum = this.formatNumber(this.hours(val), precision);
        break;
      case 'day':
        bigNum = this.formatNumber(this.days(val), precision);
        break;
      case 'year':
        bigNum = this.formatNumber(this.years(val), precision);
        break;

      // Currency
      case 'usd':
        bigNum = this.formatNumberWithDim(this.short(val), precision, '$');
        bigNum.unitPos = Position.left;
        bigNum.changeIndicatorHasUnit = false;
        break;

      // Simple Counts
      case 'short':
      case 'auto':
        bigNum = this.formatNumber(this.short(val), precision);
        break;

      // Unrecognized unit defaults to 'short' + dim
      default:
        bigNum = bigNum = this.formatNumberWithDim(this.short(val), precision, unit);
        break;
    }
    return bigNum;
  }

  // HELPER Methods

  // Used for 'short' (auto) and time
  formatNumber(numUnit: INumberUnit, precision: number): IBigNum {
    if (numUnit.num) {
      const fractionLength = this.getFractionLength(precision, numUnit.num);
      const _bigNum: string = numUnit.num.toFixed(fractionLength);
      return {num: _bigNum, unit: numUnit.unit, unitPos: Position.right, changeIndicatorHasUnit: true};
    } else {
      return {num: '', unit: this.errorUnit, unitPos: Position.right, changeIndicatorHasUnit: true};
    }
  }

  // Used for throughput, currency, custom units
  formatNumberWithDim(numUnit: INumberUnit, precision: number, dim: string): IBigNum {
    if (numUnit.num) {
      const fractionLength = this.getFractionLength(precision, numUnit.num);
      const _bigNum: string = numUnit.num.toFixed(fractionLength);
      return {num: _bigNum + numUnit.unit, unit: dim, unitPos: Position.right, changeIndicatorHasUnit: false};
    } else {
      return {num: '', unit: this.errorUnit + ' ' + dim, unitPos: Position.right, changeIndicatorHasUnit: false};
    }
  }

  // Used for data, data rate
  formatNumberWithSuffixToAppend(numUnit: INumberUnit, precision: number, suffix: string): IBigNum {
    if (numUnit.num) {
      const fractionLength = this.getFractionLength(precision, numUnit.num);
      const _bigNum: string = numUnit.num.toFixed(fractionLength);
      return {num: _bigNum, unit: numUnit.unit + suffix, unitPos: Position.right, changeIndicatorHasUnit: true};
    } else {
      return {num: '', unit: this.errorUnit, unitPos: Position.right, changeIndicatorHasUnit: true};
    }
  }

  getFractionLength(precision: number, num: number) {
    if (precision < 1 || precision > 15 || !precision) {
      precision = 3;
    }
    return (precision - this.intLength(num) < 0) ? 0 : precision - this.intLength(num);
  }

  intLength(num: number): number {
    return  Math.abs(num).toFixed().toString() === '0' ? 0 : Math.abs(num).toFixed().toString().length;
  }

  normalizer(base: number, magnitude: number, units: string[], val: number ): INumberUnit {
    if (base <= 1 || !units.length || magnitude < 0) {
      return {num: val, unit: this.errorUnit};
    }

    while (this.intLength(val) > 3) {
      val = val / base;
      magnitude++;
    }

    return (magnitude >= units.length) ? {num: null, unit: this.errorUnit} : {num: val, unit: units[magnitude]};
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
    if (numUnit.unit) {
      numUnit.unit = numUnit.unit + ' ' + 'yr';
    } else {
      numUnit.unit = 'yr';
    }
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

export interface IBigNum {
  num: string;
  unit: string;
  unitPos: Position;
  changeIndicatorHasUnit: boolean;
}

enum Position {
  left,
  right
}

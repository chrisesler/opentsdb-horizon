import { Injectable } from '@angular/core';
import { DynamicWidgetsModule } from '../../../modules/dynamic-widgets/dynamic-widgets.module';

@Injectable({
  providedIn: DynamicWidgetsModule,
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

    if (!val || typeof val !== 'number' || parseInt(val.toString(), 10) === NaN) {
      return  {num: '', unit: '', unitPos: Position.right, changeIndicatorHasUnit: false};
    }

    switch (unit) {
      // Ref: https://en.wikipedia.org/wiki/Kibibyte
      // Data (Binary/IEC/1024)
      case 'bits':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'b');
        break;
      case 'binbyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'B');
        break;
      case 'kibibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 1), precision, 'B');
        break;
      case 'mebibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 2), precision, 'B');
        break;
      case 'gibibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 3), precision, 'B');
        break;
      case 'tebibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 4), precision, 'B');
        break;
      case 'pebibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 5), precision, 'B');
        break;
      case 'exibyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 6), precision, 'B');
        break;

      // Ref: https://en.wikipedia.org/wiki/Kibibyte
      // Data (Decimal/SI/1000)
      case 'decbits':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'b');
        break;
      case 'decbyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'B');
        break;
      case 'kilobyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'B');
        break;
      case 'megabyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'B');
        break;
      case 'gigabyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'B');
        break;
      case 'terabyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 4), precision, 'B');
        break;
      case 'petabyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 5), precision, 'B');
        break;
      case 'exabyte':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 6), precision, 'B');
        break;

      // Ref: https://en.wikipedia.org/wiki/Data-rate_units
      // Data Rate (Binary/IEC/1024)
      case 'binbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'bit/s');
        break;
      case 'kibibps':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 1), precision, 'bit/s');
        break;
      case 'mebibps':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 2), precision, 'bit/s');
        break;
      case 'gibibps':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 3), precision, 'bit/s');
        break;
      case 'tebibps':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 4), precision, 'bit/s');
        break;
      case 'binbyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 0), precision, 'B/s');
        break;
      case 'kibibyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 1), precision, 'B/s');
        break;
      case 'mebibyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 2), precision, 'B/s');
        break;
      case 'gibibyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 3), precision, 'B/s');
        break;
      case 'tebibyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.binarySI(val, 4), precision, 'B/s');
        break;

      // Ref: https://en.wikipedia.org/wiki/Data-rate_units
      // Data Rate (Decimal/SI/1000)
      case 'decbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'bit/s');
        break;
      case 'kbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'bit/s');
        break;
      case 'mbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'bit/s');
        break;
      case 'gbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'bit/s');
        break;
      case 'tbps':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 4), precision, 'bit/s');
        break;
      case 'decbyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 0), precision, 'B/s');
        break;
      case 'kilobyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 1), precision, 'B/s');
        break;
      case 'megabyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 2), precision, 'B/s');
        break;
      case 'gigabyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 3), precision, 'B/s');
        break;
      case 'terabyte/s':
        bigNum = this.formatNumberWithSuffixToAppend(this.decimalSI(val, 4), precision, 'B/s');
        break;

      // Time
      case 'nanoseconds':
        bigNum = this.formatNumber(this.nanoSeconds(val), precision);
        break;
      case 'microseconds':
        bigNum = this.formatNumber(this.microSeconds(val), precision);
        break;
      case 'milliseconds':
        bigNum = this.formatNumber(this.milliSeconds(val), precision);
        break;
      case 'seconds':
        bigNum = this.formatNumber(this.seconds(val), precision);
        break;
      case 'minutes':
        bigNum = this.formatNumber(this.minutes(val), precision);
        break;
      case 'hours':
        bigNum = this.formatNumber(this.hours(val), precision);
        break;
      case 'days':
        bigNum = this.formatNumber(this.days(val), precision);
        break;
      case 'years':
        bigNum = this.formatNumber(this.years(val), precision);
        break;

      // Currency
      case 'usd':
        bigNum = this.formatNumberWithDim(this.short(val), precision, '$');
        bigNum.unit = '$';
        bigNum.unitPos = Position.left;
        bigNum.changeIndicatorHasUnit = false;
        break;

      // Simple Counts
      case 'short':
      case 'auto':
        bigNum = this.formatNumber(this.short(val), precision);
        break;

      // Do NOT normalize, but do decimals
      case 'raw':
        bigNum = {num: parseFloat(val.toFixed(precision)).toString(), unit: null, unitPos: Position.right, changeIndicatorHasUnit: false};
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
    if (parseInt(numUnit.num.toString(), 10) !== NaN) {
      const _bigNum: string = this.formatBigNumber(numUnit.num, precision);
      return {num: _bigNum, unit: numUnit.unit, unitPos: Position.right, changeIndicatorHasUnit: true};
    } else {
      return {num: '', unit: this.errorUnit, unitPos: Position.right, changeIndicatorHasUnit: true};
    }
  }

  // Used for throughput, currency, custom units
  formatNumberWithDim(numUnit: INumberUnit, precision: number, dim: string): IBigNum {
    if (parseInt(numUnit.num.toString(), 10) !== NaN) {
      const _bigNum: string = this.formatBigNumber(numUnit.num, precision);
      return {num: _bigNum + numUnit.unit, unit: dim, unitPos: Position.right, changeIndicatorHasUnit: false};
    } else {
      return {num: '', unit: this.errorUnit + ' ' + dim, unitPos: Position.right, changeIndicatorHasUnit: false};
    }
  }

  // Used for data, data rate
  formatNumberWithSuffixToAppend(numUnit: INumberUnit, precision: number, suffix: string): IBigNum {
    if (parseInt(numUnit.num.toString(), 10) !== NaN) {
      const _bigNum: string = this.formatBigNumber(numUnit.num, precision);
      return {num: _bigNum, unit: numUnit.unit + suffix, unitPos: Position.right, changeIndicatorHasUnit: true};
    } else {
      return {num: '', unit: this.errorUnit, unitPos: Position.right, changeIndicatorHasUnit: true};
    }
  }

  formatBigNumber(num: number, precision: number): string {
    if (!(precision > 0 && precision < 10)) {
      precision = 0;
    }
    return parseFloat(num.toFixed(precision)).toString();
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
  nanoSeconds(val: number): INumberUnit {
    return (this.intLength(val) > 3) ? this.microSeconds(val / 1000) : { num: val, unit: 'ns'};
  }

  microSeconds(val: number): INumberUnit {
    return (this.intLength(val) > 3) ? this.milliSeconds(val / 1000) : { num: val, unit: 'μs'};
  }

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

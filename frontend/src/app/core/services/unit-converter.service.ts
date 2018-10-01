import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UnitConverterService {

    value;

    units: any = {
        B: {
            desc : 'Bytes',
            m: 1
        },
        KB: {
            desc : 'Kilo Bytes',
            m: 1024
        },
        MB: {
            desc : 'Mega Bytes',
            m: 1048576
        },
        GB: {
            desc : 'Giga Bytes',
            m: 1073741824
        },
        TB: {
            desc : 'Tera Bytes',
            m: 1099511627776
        }
    };
    constructor() { }

    val(v) {
        this.value = v;
    }

    format( value, options ) {
        const oUnit = this.units[options.unit];
        let precision = options.precision ? options.precision : 0;
        if ( !oUnit ) {
            precision = Number.isInteger(value) ? 0 : precision;
            return typeof(value) === 'number' ? value.toFixed(precision) : parseFloat(value).toFixed(precision);
        }
        const result =  value / oUnit.m ;
        precision = Number.isInteger(result) ? 0 : precision;
        return result.toFixed(precision) + options.unit;
    }

    getDetails(unit) {
        return this.units[unit];
    }
}

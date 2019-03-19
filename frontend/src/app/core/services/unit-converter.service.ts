import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class UnitConverterService {

    units: any = [
            { 'key': 'binbyte', b: 1024 ,  power: 0  , type: 'bibyte', 'unit': 'B'},
            { 'key': 'kibibyte', b: 1024 ,  power: 1 , type: 'bibyte', 'unit': 'KiB' },
            { 'key': 'mebibyte', b: 1024 ,  power: 2, type: 'bibyte',  'unit': 'MiB'  },
            { 'key': 'gibibyte', b: 1024 ,  power: 3, type: 'bibyte',  'unit': 'GiB'  },
            { 'key': 'tebibyte', b: 1024 ,  power: 4, type: 'bibyte', 'unit': 'TiB'  },
            { 'key': 'pebibyte', b: 1024 ,  power: 5, type: 'bibyte', 'unit': 'PiB'  },
            { 'key': 'exibyte', b: 1024 ,  power: 6, type: 'bibyte', 'unit': 'EiB'  },
            // 'bibit/s' 
            { 'key': 'binbps', b: 1024 ,  power: 0  , type: 'bibit/s', 'unit': 'bit/s' },
            { 'key': 'kibibps', b: 1024 ,  power: 1 , type: 'bibit/s', 'unit': 'Kibit/s' },
            { 'key': 'mebibps', b: 1024 ,  power: 2 , type: 'bibit/s', 'unit': 'Mibit/s' },
            { 'key': 'gibibps', b: 1024 ,  power: 3 , type: 'bibit/s', 'unit': 'Gibit/s' },
            { 'key': 'tebibps', b: 1024 ,  power: 4 , type: 'bibit/s', 'unit': 'Tibit/s' },
            // 'bibyte/s'
            { 'key': 'binbyte/s', b: 1024 ,  power: 0 , type: 'bibyte/s', 'unit': 'B/s' },
            { 'key': 'kibibyte/s', b: 1024 ,  power: 1 , type: 'bibyte/s', 'unit': 'KiB/s' },
            { 'key': 'mebibyte/s', b: 1024 ,  power: 2 , type: 'bibyte/s', 'unit': 'MiB/s' },
            { 'key': 'gibibyte/s', b: 1024 ,  power: 3 , type: 'bibyte/s', 'unit': 'GiB/s' },
            { 'key': 'tebibyte/s', b: 1024 ,  power: 4 , type: 'bibyte/s', 'unit': 'TiB/s' },
            // 'default'
            { 'key': 'one', b: 1000 ,  power: 0 , type: 'default', 'unit': '' },
            { 'key': 'thousand', b: 1000 ,  power: 1 , type: 'default', 'unit': 'k' },
            { 'key': 'million', b: 1000 ,  power: 2 , type: 'default', 'unit': 'M' },
            { 'key': 'billion', b: 1000 ,  power: 3 , type: 'default', 'unit': 'B' },
            { 'key': 'trillion', b: 1000 ,  power: 4 , type: 'default', 'unit': 'T' },
            { 'key': 'quadrillion', b: 1000 ,  power: 5, type: 'default', 'unit': 'Q' },
            // 'byte'
            { 'key': 'decbyte', b: 1000 ,  power: 0 , type: 'byte', 'unit': 'B' },
            { 'key': 'kilobyte', b: 1000 ,  power: 1 , type: 'byte', 'unit': 'KB'  },
            { 'key': 'megabyte', b: 1000 ,  power: 2  , type: 'byte', 'unit': 'MB' },
            { 'key': 'gigabyte', b: 1000 ,  power: 3  , type: 'byte', 'unit': 'GB' },
            { 'key': 'terabyte', b: 1000 ,  power: 4  , type: 'byte', 'unit': 'TB' },
            { 'key': 'petabyte', b: 1000 ,  power: 5  , type: 'byte', 'unit': 'PB' },
            { 'key': 'exabyte', b: 1000 ,  power: 6  , type: 'byte', 'unit': 'EB' },
            // 'bit/s' 
            { 'key': 'decbps', b: 1000 ,  power: 0 , type: 'bit/s', 'unit': 'bit/s' },
            { 'key': 'kbps', b: 1000 ,  power: 1 , type: 'bit/s', 'unit': 'Kbit/s' },
            { 'key': 'mbps', b: 1000 ,  power: 2 , type: 'bit/s', 'unit': 'Mbit/s' },
            { 'key': 'gbps', b: 1000 ,  power: 3 , type: 'bit/s', 'unit': 'Gbit/s' },
            { 'key': 'tbps', b: 1000 ,  power: 4 , type: 'bit/s', 'unit': 'Tbit/s' },
            // 'byte/s'
            { 'key': 'decbyte/s', b: 1000 ,  power: 0, type: 'byte/s', 'unit': 'B/s'},
            { 'key': 'kilobyte/s', b: 1000 ,  power: 1, type: 'byte/s', 'unit': 'KB/s' },
            { 'key': 'megabyte/s', b: 1000 ,  power: 2, type: 'byte/s', 'unit': 'MB/s' },
            { 'key': 'gigabyte/s', b: 1000 ,  power: 3, type: 'byte/s', 'unit': 'GB/s' },
            { 'key': 'terabyte/s', b: 1000 ,  power: 4, type: 'byte/s', 'unit': 'TB/s' },
            // 'currency
            { 'key': 'usd', 'unit': '$', type: 'currency', position: 'right'},
            // 'time'
            { 'key': 'milliseconds',  index:0, 'type': 'time', 'unit': 'ms' },
            { 'key': 'seconds',  index:1, 'type': 'time', 'unit': 'sec' },
            { 'key': 'minutes', index:2, 'type': 'time', 'unit': 'min' },
            {  'key': 'hours', index:3, 'type': 'time', 'unit': 'hr' },
            { 'key': 'days', index:4, 'type': 'time', 'unit': 'day'},
            { 'key': 'years', index:5, 'type': 'time', 'unit': 'year'}
    ];
    constructor() { }

    val(v) {
        // this.value = v;
    }

    format( value, options ) {
        let oUnit = this.getDetails(options.unit);
        const prefix = options.unit === 'usd' ? '$' : '';
        const postfix = !oUnit && options.unit ? options.unit : ''; // unknown units will be added as postfix
        // get default unit if not defined. for usd follow KMBT units
        oUnit = !oUnit || options.unit === 'usd' ? this.getDefaultUnit(value, true): oUnit;
        let precision = options.precision ? options.precision : 0;

        let result = value;
        if( oUnit && oUnit.type !== 'time' ) {
            result =  value / oUnit.b ** (oUnit.power - oUnit.power);
        }

        precision = Number.isInteger(result) && !options.precisionStrict ? 0 : precision;
        return prefix + result.toFixed(precision) + ( oUnit ? oUnit.unit: '') + postfix;
    }

    getNormalizedUnit(value, options) {
        let sUnit = this.getDetails(options.unit);
        sUnit = !sUnit || options.unit === 'usd' ? this.getDefaultUnit(value): sUnit;

        let destUnit = sUnit.key;

        if ( sUnit.type === 'time' ) {
            const timeUnits:any[] = this.units.filter( (d:any)=> d.type === 'time' );
            for ( let i = sUnit.index; i < timeUnits.length; i++ ) {
                // asSeconds,asMinutes,asHours, asDays, asWeeks, asMonths:, asYears
                const dstMethodName =  'as' + timeUnits[i].key[0].toUpperCase() + timeUnits[i].key.substr(1);;
                let newValue = moment.duration(value, sUnit.key)[dstMethodName]();
                if ( parseInt(newValue) === 0 ) {
                    break;
                } else {
                    destUnit = timeUnits[i].key;
                }
            }
        } else {
            const base = sUnit.b;
            const power =  Math.floor(Math.log(value)/Math.log(base)); // Math.floor(Math.abs(value).toFixed().toString().length / 3);
            const units:any[] = this.units.filter( (d:any)=> d.type === sUnit.type );
            for ( let i=0; i < units.length; i++ ) {
                if ( units[i].power === power + sUnit.power ) {
                    destUnit = units[i].key;
                }
            }
        }
        return destUnit;
    }

    convert(value, srcUnit, destUnit, options) {
        let sUnit = this.getDetails(srcUnit);
        sUnit = !sUnit || options.unit === 'usd' ? this.getDefaultUnit(value): sUnit;
        
        let dUnit = this.getDetails(destUnit);
        dUnit = !dUnit ? sUnit: dUnit;

        let precision = options.precision ? options.precision : 0;
        const prefix = options.unit === 'usd' ? '$' : '';
        const postfix =  options.unit && this.isCustomUnit(options.unit) ? options.unit : ''; // unknown units will be added as postfix

        let result=value;
        if ( dUnit && dUnit.type === 'time' ) {
            const dstMethodName =  'as' + dUnit.key[0].toUpperCase() + dUnit.key.substr(1);;
            result = moment.duration(value, srcUnit)[dstMethodName]();
        } else if( dUnit ) {
            result =  value / dUnit.b ** (dUnit.power - sUnit.power);
        }
        precision = Number.isInteger(result) && !options.precisionStrict ? 0 : precision;
        return prefix + result.toFixed(precision) + ( dUnit ? dUnit.unit: '') +  postfix;
    }

    getDefaultUnit(value, bigUnit=false) {
        const power = value === 0 ? 0 : Math.floor(Math.log(value)/Math.log(1000));
        const defaultUnits:any[] = this.units.filter( (d:any)=> d.type === 'default' );
        let oUnit = defaultUnits[0];
        for ( let i=0; bigUnit && i < defaultUnits.length; i++ ) {
            if ( defaultUnits[i].power === power ) {
                oUnit = defaultUnits[i];
            }
        }
        return oUnit;
    }

    getDetails(unit) {
        const matches:any[] = this.units.filter( (d:any)=> d.key === unit );
        const oUnit = matches ? matches[0] : null;
        if ( oUnit && (oUnit.b || oUnit.type === 'time') ) {
            if ( oUnit.type === 'time' ) {
                oUnit.m = moment.duration(1, oUnit.key).asMilliseconds();
            } else {
                oUnit.m = oUnit.b ** oUnit.power;
            }
        }
        return oUnit;
    }

    isCustomUnit(unit) {
        return unit !== 'auto' && !this.getDetails(unit);
    }
}

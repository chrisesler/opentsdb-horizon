import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';

import { UnitNormalizerService, IBigNum } from '../../../dynamic-widgets/services/unit-normalizer.service';

// NOTE: This component needs more work. Just don't have time at the moment.
// NOTE: This feature is used in many places. So need to come back to it.

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dropdown-unit-type',
    templateUrl: './dropdown-unit-type.component.html',
    styleUrls: ['./dropdown-unit-type.component.scss']
})
export class DropdownUnitTypeComponent implements OnInit {

    // unit input
    @Input() unit: any = '';

    /** Outputs */
    @Output() onUnitChange = new EventEmitter;

    // menu data
    @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

    timeUnits: Array<string> = ['nanoseconds', 'microseconds', 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'years'];

    binaryDataUnitsKeys: Array<string> = [ 'binbyte', 'kibibyte', 'mebibyte', 'gibibyte', 'tebibyte', 'pebibyte', 'exibyte' ];


    decimalDataUnitsKeys: Array<string> = ['decbyte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte', 'exabyte'];

    binaryDataRateKeys: Array<string> = ['binbps', 'kibibps', 'mebibps', 'gibibps', 'tebibps', 'binbyte/s', 'kibibyte/s', 'mebibyte/s', 'gibibyte/s', 'tebibyte/s'];

    decimalDataRateKeys: Array<string> = ['decbps', 'kbps', 'mbps', 'gbps', 'tbps', 'decbyte/s', 'kilobyte/s', 'megabyte/s', 'gigabyte/s', 'terabyte/s'];
    
    units:any = {
        timeUnits: {
            'nanoseconds': 'Nanoseconds', 
            'microseconds': 'Microseconds', 
            'milliseconds': 'Milliseconds', 
            'seconds': 'Seconds', 
            'minutes': 'Minutes', 
            'hours':'Hours', 
            'days': 'Days', 
            'years' : 'Years'
        },
        decimalDataUnits: { 
            'decbyte' : 'B   - byte',
            'kilobyte': 'kB - kilobyte (1000 B)',
            'megabyte': 'MB - megabyte (1000 kB)',
            'gigabyte': 'GB - gigabyte (1000 MB)',
            'terabyte': 'TB - terabyte (1000 GB)',
            'petabyte': 'PB - petabyte (1000 TB)',
            'exabyte' : 'EB - exabyte  (1000 PB)'
        },

        binaryDataRateUnits: { 
            'binbps' : 'bit/s',
            'kibibps': 'Kibit/s (1024 bit/s)',
            'mebibps': 'Mibit/s (1024 Kibit/s)',
            'gibibps': 'Gibit/s (1024 Mibit/s)',
            'tebibps': 'Tibit/s (1024 Gibit/s)',
            'binbyte/s' : 'B/s (byte/s)',
            'kibibyte/s': 'KiB/s (1024 B/s)',
            'mebibyte/s': 'MiB/s (1024 KiB/s)',
            'gibibyte/s': 'GiB/s (1024 MiB/s)',
            'tebibyte/s': 'TiB/s (1024 GiB/s)'
        },

        decimalDataRateUnits: {
            'decbps' : 'bit/s',
            'kbps': 'kbit/s (1000 bit/s)',
            'mbps': 'Mbit/s (1000 kbit/s)',
            'gbps': 'Gbit/s (1000 Mbit/s)',
            'tbps': 'Tbit/s (1000 Gbit/s)',
            'decbyte/s' : 'B/s (byte/s)',
            'kilobyte/s': 'kB/s (1000 B/s)',
            'megabyte/s': 'MB/s (1000 kB/s)',
            'gigabyte/s': 'GB/s (1000 MB/s)',
            'terabyte/s': 'TB/s (1000 GB/s)'
        },
        binaryDataUnits: {
            'binbyte' : 'B   - byte',
            'kibibyte': 'KiB - kibibyte (1024 B)',
            'mebibyte': 'MiB - mebibyte (1024 KiB)',
            'gibibyte': 'GiB - gebibyte (1024 MiB)',
            'tebibyte': 'TiB - tebibyte (1024 GiB)',
            'pebibyte': 'PiB - pebibyte (1024 TiB)',
            'exibyte' : 'EiB - exibyte  (1024 PiB)'
        }
    };

    currencyUnits: Array<string> = ['usd'];
    otherUnits: Array<string> = ['auto'];

    // custom unit in menu
    @ViewChild('customUnit') customUnit: ElementRef;

    constructor(public UN: UnitNormalizerService) { }

    ngOnInit() {
    }

    KeyedOnUnitInputBox(value: string) {
        this.onUnitChange.emit( value);
    }

    customUnitEntered() {
        this.menuTrigger.closeMenu();
    }

    getUnitLabel(unit) {
        for ( const k in this.units ) {
            if ( this.units[k][unit] ) {
                return this.units[k][unit];
            }
        }
        return unit;
    }
}

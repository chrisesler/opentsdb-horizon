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

    // material form field values
    // tslint:disable-next-line:no-inferrable-types
    @Input() appearance: string = 'fill';
    // tslint:disable-next-line:no-inferrable-types
    @Input() floatLabel: string = 'never';

    // unit input
    @Input() unit: any = '';

    private _selectedUnit: any;
    get selectedUnit() {
        return this._selectedUnit;
    }
    set selectedUnit(value: any) {
        this._selectedUnit = value;
        this.unitUpdated.emit({selectedUnit: value});
    }

    // output
    @Output() unitUpdated: any = new EventEmitter();

    // menu data
    @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

    timeUnits: Array<string> = ['ms', 'second', 'minute', 'hour', 'day', 'year'];
    binaryDataUnits: Array<string> = ['bits', 'bytes', 'kbytes', 'mbytes', 'gbytes'];
    decimalDataUnits: Array<string> = ['decbits', 'decbytes', 'deckbytes', 'decmybytes', 'decgbytes'];
    dataRateUnits: Array<string> = ['pps', 'bps', 'Bps', 'KBs', 'Kbits', 'MBs', 'Mbits', 'GBs', 'Gbits'];
    throughputUnits: Array<string> = ['ops', 'reqps', 'rps', 'wps', 'iops', 'opm', 'rpm', 'wpm'];
    currencyUnits: Array<string> = ['usd'];
    otherUnits: Array<string> = ['auto'];

    // custom unit in menu
    @ViewChild('customUnit') customUnit: ElementRef;

    constructor(public UN: UnitNormalizerService) { }

    ngOnInit() {
        this._selectedUnit = this.unit;
    }

    KeyedOnUnitInputBox(value: string) {
        this.selectedUnit = value;
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    onMenuOpen(): void {
        const unit: string = this.selectedUnit;

        if (this.isUnitCustom(unit)) {
            (<HTMLInputElement>this.customUnit.nativeElement).value = unit;
        } else {
            (<HTMLInputElement>this.customUnit.nativeElement).value = '';
        }
    }

    customUnitEntered() {
      this.menuTrigger.closeMenu();
    }

    isUnitCustom(str: string): boolean {
        const allUnits: Array<string> =  this.timeUnits.concat(this.binaryDataUnits).concat(this.decimalDataUnits).
            concat(this.dataRateUnits).concat(this.throughputUnits).concat(this.currencyUnits).concat(this.otherUnits);
        return !allUnits.includes(str);
    }

    isStringOnlyLowercasedLetters(str: string): boolean {
        return /^[a-z\s]*$/.test(str);
    }

}

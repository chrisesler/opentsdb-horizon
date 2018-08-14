import { Component, OnInit, HostBinding, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { UnitNormalizerService, IBigNum } from '../../../../modules/dynamic-widgets/services/unit-normalizer.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-visual-appearance-big-number',
    templateUrl: './widget-config-visual-appearance-big-number.component.html',
    styleUrls: []
})
export class WidgetConfigVisualAppearanceBigNumberComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.visual-appearance-configuration-big-number') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;
    @Output() selectionChanged = new EventEmitter;

    /** Local variables */

    selectedMetric: object;
    colorType: string;

    @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

    timeUnits: Array<string> = ['ms', 'second', 'minute', 'hour', 'day', 'year'];
    binaryDataUnits: Array<string> = ['bits', 'bytes', 'kbytes', 'mbytes', 'gbytes'];
    decimalDataUnits: Array<string> = ['decbits', 'decbytes', 'deckbytes', 'decmybytes', 'decgbytes'];
    dataRateUnits: Array<string> = ['pps', 'bps', 'Bps', 'KBs', 'Kbits', 'MBs', 'Mbits', 'GBs', 'Gbits'];
    throughputUnits: Array<string> = ['ops', 'reqps', 'rps', 'wps', 'iops', 'opm', 'rpm', 'wpm'];
    currencyUnits: Array<string> = ['usd'];
    otherUnits: Array<string> = ['auto'];

    constructor(public UN: UnitNormalizerService) { }

    ngOnInit() {
        this.selectedMetric = this.widget;
        this.colorType = 'text'; // default color tab
    }

    // Prefix
    KeyedOnPrefixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefix'] = value;
        this.selectedMetric['configuration']['bigNum']['prefixUndercased'] = this.isStringOnlyLowercasedLetters(value);
    }

    selectedPrefixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefixSize'] = value;
    }

    selectedPrefixAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefixAlignment'] = value;
    }

    // Postfix
    KeyedOnPostfixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfix'] = value;
        this.selectedMetric['configuration']['bigNum']['postfixUndercased'] = this.isStringOnlyLowercasedLetters(value);
    }

    selectedPostfixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfixSize'] = value;
    }

    selectedPostfixAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfixAlignment'] = value;
    }

    // Unit
    KeyedOnUnitInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['unit'] = value;
        this.selectedMetric['configuration']['bigNum']['unitUndercased'] =
            this.isStringOnlyLowercasedLetters(this.UN.getBigNumber(this.selectedMetric['configuration']['bigNum']['bigNumber'],
            this.selectedMetric['configuration']['bigNum']['unit']).unit);

        console.log(this.isStringOnlyLowercasedLetters(
            this.UN.getBigNumber(this.selectedMetric['configuration']['bigNum']['bigNumber'],
            this.selectedMetric['configuration']['bigNum']['unit']).unit));
    }

    selectedUnitSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitSize'] = value;
    }

    selectedUnitAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitAlignment'] = value;
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    onMenuOpen(): void {
        const unit: string = this.selectedMetric['configuration']['bigNum']['unit'];

        if (this.isUnitCustom(unit)) {
            (<HTMLInputElement>document.getElementById('custom-unit')).value = unit;
        } else {
            (<HTMLInputElement>document.getElementById('custom-unit')).value = '';
        }
    }

    isUnitCustom(str: string): boolean {
        const allUnits: Array<string> =  this.timeUnits.concat(this.binaryDataUnits).concat(this.decimalDataUnits).
            concat(this.dataRateUnits).concat(this.throughputUnits).concat(this.currencyUnits).concat(this.otherUnits);
        return !allUnits.includes(str);
    }

    // Caption
    KeyedOnCaptionInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['caption'] = value;
    }

    selectedCaptionSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['captionSize'] = value;
    }

    // Precision
    KeyedOnPrecisionInputBox(value: string) {
        console.log('keyed on input box');
        this.selectedMetric['configuration']['bigNum']['precision'] = value;
    }

    // Color Picker
    selectedColorType(value: string) {
        this.colorType = value;
    }

    colorChanged(color: string) {
        if (this.colorType === 'text') {
            this.selectedMetric['configuration']['bigNum']['textColor'] = color['hex'];
        } else { // background
            this.selectedMetric['configuration']['bigNum']['backgroundColor'] = color['hex'];
        }
    }

    isStringOnlyLowercasedLetters(str: string): boolean {
        return /^[a-z\s]*$/.test(str);
    }

    indicatorToggleChange() {
        this.selectedMetric['configuration']['bigNum']['changedIndicatorEnabled'] =!
        this.selectedMetric['configuration']['bigNum']['changedIndicatorEnabled'];
    }

    // Options
}

import { Component, OnInit, HostBinding, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { UnitNormalizerService, IBigNum } from '../../../../services/unit-normalizer.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'big-number-visual-appearance',
    templateUrl: './big-number-visual-appearance.component.html',
    styleUrls: []
})

export class BignumberVisualAppearanceComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.big-number-visual-appearance') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;
    @Output() selectionChanged = new EventEmitter;

    /** Local variables */

    // selectedMetric: object;
    colorType: string;

    @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

    timeUnits: Array<string> = ['ms', 'second', 'minute', 'hour', 'day', 'year'];
    binaryDataUnits: Array<string> = ['bits', 'bytes', 'kbytes', 'mbytes', 'gbytes'];
    decimalDataUnits: Array<string> = ['decbits', 'decbytes', 'deckbytes', 'decmybytes', 'decgbytes'];
    dataRateUnits: Array<string> = ['pps', 'bps', 'Bps', 'KBs', 'Kbits', 'MBs', 'Mbits', 'GBs', 'Gbits'];
    throughputUnits: Array<string> = ['ops', 'reqps', 'rps', 'wps', 'iops', 'opm', 'rpm', 'wpm'];
    currencyUnits: Array<string> = ['usd'];
    otherUnits: Array<string> = ['auto'];

    captionPlaceholder: string = 'Enter Caption {{tag.key}}';
    prefixDisabled: boolean = true;

    constructor(public UN: UnitNormalizerService) { }

    ngOnInit() {
        // this.selectedMetric = this.widget;
        this.colorType = 'text'; // default color tab
    }

    // Prefix
    KeyedOnPrefixInputBox(value: string) {
        this.prefixDisabled = false;
        this.widget.query.settings.visual['prefix'] = value;
        this.widget.query.settings.visual['prefixUndercased'] = this.isStringOnlyLowercasedLetters(value);
    }

    selectedPrefixSize(value: string) {
        this.widget.query.settings.visual['prefixSize'] = value;
    }

    selectedPrefixAlignment(value: string) {
        this.widget.query.settings.visual['prefixAlignment'] = value;
    }

    // Postfix
    KeyedOnPostfixInputBox(value: string) {
        this.widget.query.settings.visual['postfix'] = value;
        this.widget.query.settings.visual['postfixUndercased'] = this.isStringOnlyLowercasedLetters(value);
    }

    selectedPostfixSize(value: string) {
        this.widget.query.settings.visual['postfixSize'] = value;
    }

    selectedPostfixAlignment(value: string) {
        this.widget.query.settings.visual['postfixAlignment'] = value;
    }

    // Unit
    KeyedOnUnitInputBox(value: string) {
        this.widget.query.settings.visual['unit'] = value;
        this.widget.query.settings.visual['unitUndercased'] =
            this.isStringOnlyLowercasedLetters(this.UN.getBigNumber(this.widget.query.settings.visual['bigNumber'],
            this.widget.query.settings.visual['unit']).unit);
    }

    selectedUnitSize(value: string) {
        this.widget.query.settings.visual['unitSize'] = value;
    }

    selectedUnitAlignment(value: string) {
        this.widget.query.settings.visual['unitAlignment'] = value;
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    onMenuOpen(): void {
        const unit: string = this.widget.query.settings.visual['unit'];

        if (this.isUnitCustom(unit)) {
            (<HTMLInputElement>document.getElementById('custom-unit')).value = unit;
        } else {
            (<HTMLInputElement>document.getElementById('custom-unit')).value = '';
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

    // Caption
    KeyedOnCaptionInputBox(value: string) {
        this.widget.query.settings.visual['caption'] = value;
    }

    selectedCaptionSize(value: string) {
        this.widget.query.settings.visual['captionSize'] = value;
    }

    // Precision
    KeyedOnPrecisionInputBox(value: string) {
        this.widget.query.settings.visual['precision'] = value;
    }

    // Color Picker
    selectedColorType(value: string) {
        this.colorType = value;
    }

    colorChanged(color: any) {
        if (color['hex']) { // make sure there is a hex
            if (this.colorType === 'text') {
                this.widget.query.settings.visual['textColor'] = color['hex'];
            } else { // background
                this.widget.query.settings.visual['backgroundColor'] = color['hex'];
            }
        }
    }

    isStringOnlyLowercasedLetters(str: string): boolean {
        return /^[a-z\s]*$/.test(str);
    }

    indicatorToggleChange() {
        // tslint:disable-next-line:whitespace
        this.widget.query.settings.visual['changedIndicatorEnabled'] =!
        this.widget.query.settings.visual['changedIndicatorEnabled'];
    }
}

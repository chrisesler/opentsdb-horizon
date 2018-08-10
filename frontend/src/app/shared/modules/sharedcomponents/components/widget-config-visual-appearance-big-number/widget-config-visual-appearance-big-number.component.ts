import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

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

    constructor() { }

    ngOnInit() {
        this.selectedMetric = this.widget;
        this.colorType = 'text'; // default color tab
    }

    // Prefix
    KeyedOnPrefixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefix'] = value;
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
    }

    selectedUnitSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitSize'] = value;
    }

    selectedUnitAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitAlignment'] = value;
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

    // Options
}

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

    /** Local variables */

    selectedMetric: object;
    colorType: string;

    setSelectedMetric(metric) {
        this.selectedMetric = metric;
    }

    constructor() { }

    ngOnInit() {
        this.selectedMetric = this.widget[0];
        this.colorType = 'text';
    }

    KeyedOnPrefixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefix'] = value;
    }

    selectedPrefixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefixSize'] = value;
    }

    KeyedOnPostfixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfix'] = value;
    }

    selectedPostfixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfixSize'] = value;
    }

    KeyedOnCaptionInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['caption'] = value;
    }

    selectedCaptionSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['captionSize'] = value;
    }

    selectedColorType(value: string) {
        this.colorType = value;
    }

    colorSelected(color: string) {
        console.log(color);
        if (this.colorType === 'text') {
            this.selectedMetric['configuration']['bigNum']['textColor'] = color['hex'];
        } else { // background
            this.selectedMetric['configuration']['bigNum']['backgroundColor'] = color['hex'];
        }
    }

}

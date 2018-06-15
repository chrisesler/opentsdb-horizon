import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-legend',
    templateUrl: './widget-config-legend.component.html',
    styleUrls: []
})
export class WidgetConfigLegendComponent implements OnInit {
    @HostBinding('class.widget-config-tab.legend-configuration') private _hostClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    constructor() { }

    ngOnInit() {
    }

}

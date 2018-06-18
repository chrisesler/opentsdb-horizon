import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-general',
    templateUrl: './widget-config-general.component.html',
    styleUrls: []
})
export class WidgetConfigGeneralComponent implements OnInit {
    @HostBinding('class.widget-config-tab.general-configuration') private _hostClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    constructor() { }

    ngOnInit() {
    }

}

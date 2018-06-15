import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-alerts',
    templateUrl: './widget-config-alerts.component.html',
    styleUrls: []
})
export class WidgetConfigAlertsComponent implements OnInit {
    @HostBinding('class.widget-config-tab.alerts-configuration') private _hostClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    constructor() { }

    ngOnInit() {
    }

}

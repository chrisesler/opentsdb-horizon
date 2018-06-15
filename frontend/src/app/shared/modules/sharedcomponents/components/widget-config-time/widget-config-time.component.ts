import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-time',
    templateUrl: './widget-config-time.component.html',
    styleUrls: []
})
export class WidgetConfigTimeComponent implements OnInit {
    @HostBinding('class.widget-config-tab.time-configuration.has-columns') private _hostClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    constructor() { }

    ngOnInit() {
    }

}

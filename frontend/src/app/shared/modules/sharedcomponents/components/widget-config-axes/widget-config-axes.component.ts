import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-axes',
    templateUrl: './widget-config-axes.component.html',
    styleUrls: []
})
export class WidgetConfigAxesComponent implements OnInit {
    @HostBinding('class.widget-config-tab.axes-configuration.has-columns') private _hostClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    constructor() { }

    ngOnInit() {
    }

}

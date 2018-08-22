import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-legend-big-number',
    templateUrl: './widget-config-legend-big-number.component.html',
    styleUrls: []
})
export class WidgetConfigLegendBigNumberComponent implements OnInit, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.legend-configuration') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Form Group */
    widgetConfigLegend: FormGroup;

    // subscriptions
    widgetConfigLegend_Sub: Subscription;

    // form values

    // legendHidden: any = false;
    // legendFormat: any;
    // legendPosition: any;
    // legendValues: any[] = [];

    /** Form Control Options */



    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        // populate form controls

    }

    ngAfterViewInit() {
        // initiate any subscriptions
    }

    ngOnDestroy() {
        // destroy any subscriptions
    }


    /**
     * Services
     */

     /**
      * Events
      */

}

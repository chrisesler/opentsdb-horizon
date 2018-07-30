import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-legend',
    templateUrl: './widget-config-legend.component.html',
    styleUrls: []
})
export class WidgetConfigLegendComponent implements OnInit, OnDestroy, AfterViewInit {
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

    legendHidden: any = false;
    legendFormat: any;
    legendPosition: any;
    legendValues: any[] = [];

    /** Form Control Options */

    formatOptions: any[] = [
        {
            label: 'Inline',
            value: 'inline'
        },
        {
            label: 'Table',
            value: 'table'
        }
    ];

    positionOptions: any[] = [
        {
            label: 'Top',
            value: 'top'
        },
        {
            label: 'Bottom',
            value: 'bottom'
        },
        {
            label: 'Right',
            value: 'right'
        },
        {
            label: 'Left',
            value: 'left'
        }
    ];

    valueOptions: any[] = [
        {
            label: 'Min',
            value: 'min'
        },
        {
            label: 'Max',
            value: 'max'
        },
        {
            label: 'Avg',
            value: 'avg'
        },
        {
            label: 'Total',
            value: 'total'
        }
    ];


    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        // populate form controls
        this.createForm();
    }

    ngAfterViewInit() {
        // initiate any subscriptions
    }

    ngOnDestroy() {
        // destroy any subscriptions
    }

    createForm() {

        // ? INFO: These are mapped to the form variables set at top
        this.widgetConfigLegend = this.fb.group({
            legendHidden:   new FormControl(false),
            legendFormat: new FormControl('inline'),
            legendPosition: new FormControl('bottom'),
            legendValues: this.fb.array([])
        });

    }

    /**
     * Services
     */

     /**
      * Events
      */

}

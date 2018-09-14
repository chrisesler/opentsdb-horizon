import { Component, OnInit, OnDestroy, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-legend',
    templateUrl: './widget-config-legend.component.html',
    styleUrls: []
})
export class WidgetConfigLegendComponent implements OnInit, OnDestroy {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.legend-configuration') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Form Group */
    widgetConfigLegend: FormGroup;

    // subscriptions
    subscription: Subscription;

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

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        // populate form controls
        this.createForm();
    }

    createForm() {
        console.log("creatform...", this.widget.query.settings.legend)

        this.widgetConfigLegend = this.fb.group({
            display:   new FormControl( this.widget.query.settings.legend.display || false ),
            format: new FormControl(this.widget.query.settings.legend.format || 'inline'),
            position: new FormControl(this.widget.query.settings.legend.position || 'bottom')
        });

        this.subscription = this.widgetConfigLegend.valueChanges.subscribe(data => {
            console.log("legend changes...", data);
            this.widgetChange.emit( {action: 'SetLegend', payload: {data: data} } );
        });

    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

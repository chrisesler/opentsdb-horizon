import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-time',
    templateUrl: './widget-config-time.component.html',
    styleUrls: [],
    providers: [
        // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
        // `MatMomentDateModule` in your applications root module. We provide it at the component level
        // here, due to limitations of our example generation script.
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    ]
})
export class WidgetConfigTimeComponent implements OnInit, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.time-configuration') private _tabClass = true;
    @HostBinding('class.has-columns') private _modifierClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local Variables */

    /** Form Group */
    widgetConfigTime: FormGroup;

    // subscriptions
    selectedDownsample_Sub: Subscription; // check formcontrol value change to see if it is 'custom'

    // form values
    selectedTimePreset: any = '1h';

    customTimeRangeStart: any;
    customTimeRangeEnd: any;

    selectedAggregator: any = 'SUM';
    timeOverTimeNumber: any = '';
    timeOverTimePeriod: any = '';

    selectedDownsample: any = 'auto';
    customDownsampleValue: any = 0;
    customDownsampleUnit: any = 'min';

    overrideRelativeTime: any;
    timeShift: any;

    /** Form control options */
    timePresetOptions: Array<any> = [
        {
            label: '1h',
            value: '1h'
        },
        {
            label: '6h',
            value: '6h'
        },
        {
            label: '12h',
            value: '12h'
        },
        {
            label: '24h',
            value: '24h'
        },
        {
            label: '2d',
            value: '2d'
        },
        {
            label: '4d',
            value: '4d'
        },
        {
            label: '7d',
            value: '7d'
        },
        {
            label: '1m',
            value: '1m'
        },
        {
            label: '3m',
            value: '3m'
        },
        {
            label: '1y',
            value: '1y'
        }
    ];

    timeAggregatorOptions: Array<any> = [
        {
            label: 'Sum',
            value: 'sum'
        },
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
        }
    ];

    timeDownsampleOptions: Array<any> = [
        {
            label: 'Auto',
            value: 'auto'
        },
        {
            label: '1 min',
            value: '1m'
        },
        {
            label: '5 min',
            value: '5m'
        },
        {
            label: '1 hr',
            value: '1h'
        },
        {
            label: '1 day',
            value: '1d'
        }
    ];

    timeOverTimeIterationOptions: Array<any> = [
        {
            label: '1',
            value: '1'
        },
        {
            label: '2',
            value: '2'
        },
        {
            label: '3',
            value: '3'
        },
        {
            label: '4',
            value: '4'
        },
        {
            label: '5',
            value: '5'
        },
        {
            label: '6',
            value: '6'
        },
        {
            label: '7',
            value: '7'
        }
    ];

    timeOverTimePeriodOptions: Array<any> = [
        {
            label: 'hours',
            value: 'hours'
        },
        {
            label: 'days',
            value: 'days'
        },
        {
            label: 'weeks',
            value: 'weeks'
        },
        {
            label: '30 days',
            value: '30 days'
        }
    ];

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.widget.query.settings.time.downsample.aggregator = this.widget.query.settings.time.downsample.aggregator || this.selectedAggregator;
        this.widget.query.settings.time.downsample.value = this.widget.query.settings.time.downsample.value || this.selectedDownsample;
        this.widget.query.settings.time.downsample.customNumber = this.widget.query.settings.time.downsample.customValue || 0;
        this.widget.query.settings.time.downsample.customUnit = this.widget.query.settings.time.downsample.customUnit || this.customDownsampleUnit;
        // populate form controls
        this.createForm();
    }

    ngAfterViewInit() {
        // subscribe to value changes to check if 'custom' is checked
        // so we can enable/disable the other custom fields
        this.selectedDownsample_Sub = this.widgetConfigTime.get('selectedDownsample').valueChanges.subscribe(function(data) {
            console.log('SELECTED DOWNSAMPLE CHANGED', data, this);
            if (data === 'custom') {
                this.widgetConfigTime.controls.customDownsampleValue.enable();
                this.widgetConfigTime.controls.customDownsampleUnit.enable();
            } else {
                this.widgetConfigTime.controls.customDownsampleValue.disable();
                this.widgetConfigTime.controls.customDownsampleUnit.disable();
            }
        }.bind(this));
    }

    ngOnDestroy() {
        // destroy our form control subscription
        this.selectedDownsample_Sub.unsubscribe();
    }

    createForm() {
        // need to actually add widget config values to form controls
        // NOTE: exception is 'time preset range', which is not a form control, and sets value on click

        // ?INFO: these are mapped to the form variables set at top
        const isCustomDownsample = this.widget.query.settings.time.downsample.value === 'custom' ? true : false;
        this.widgetConfigTime = this.fb.group({
            selectedAggregator:     new FormControl(this.widget.query.settings.time.downsample.aggregator),
            selectedDownsample:     new FormControl(this.widget.query.settings.time.downsample.value),
            customDownsampleValue:  new FormControl(
                                                        {
                                                            value: this.widget.query.settings.time.downsample.customValue,
                                                            disabled: !isCustomDownsample ? true : false
                                                        },
                                                        [ Validators.pattern('^[0-9]*$') ]
                                                    ),
            customDownsampleUnit:   new FormControl(
                                                        {
                                                            value: this.widget.query.settings.time.downsample.customUnit,
                                                            disabled: isCustomDownsample ? false : true
                                                        }),
            overrideRelativeTime:   new FormControl(),
            timeShift:              new FormControl()
        });

        console.log(this.widgetConfigTime,"widgetCpofnigtime..")

        this.widgetConfigTime.valueChanges.subscribe( function(value) {
            console.log("form value changes", value);
            if ( this.widgetConfigTime.valid ) {
                this.widget.query.settings.time.downsample.aggregator = this.widgetConfigTime.selectedAggregator;
                this.widget.query.settings.time.downsample.value = this.widgetConfigTime.selectedDownsample;
                this.widget.query.settings.time.downsample.customValue = this.widgetConfigTime.customDownsampleValue;
                this.widget.query.settings.time.downsample.customUnit = this.widgetConfigTime.customDownsampleUnit;


                console.log("passing widget config", this.widget);
                this.widgetChange.emit(this.widget);
            }
        }.bind(this));
    }





    /**
     * Services
     */


    /**
     * Events
     */

    click_TimePresetChange(val: any) {
        this.selectedTimePreset = val;
    }


}

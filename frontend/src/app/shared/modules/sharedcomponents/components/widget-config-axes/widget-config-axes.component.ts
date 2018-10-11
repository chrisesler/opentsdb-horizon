import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';
import { debounceTime } from 'rxjs/operators/debounceTime';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';


import { isDefaultChangeDetectionStrategy } from '@angular/core/src/change_detection/constants';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-axes',
    templateUrl: './widget-config-axes.component.html',
    styleUrls: []
})
export class WidgetConfigAxesComponent implements OnInit, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.axes-configuration') private _tabClass = true;
    @HostBinding('class.has-columns') private _modifierClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */
    // tslint:disable-next-line:no-inferrable-types
    y1AxisEnabled_label: string = 'enabled';
    // tslint:disable-next-line:no-inferrable-types
    y2AxisEnabled_label: string = 'disabled';
    // tslint:disable-next-line:no-inferrable-types
    // xAxisEnabled_label:  string = 'enabled';
    y1AxisEnabledToggleDisplay = true;

    /** Form Group */
    widgetConfigAxes: FormGroup;

    // subscriptions
    widgetConfigAxes_Sub: Subscription;
    y1UnitSub: Subscription;
    y2UnitSub: Subscription;


    /** Form Control Options */

    yAxisWhichOptions: Array<object> = [
        {
            label: 'Y1',
            value: 'y1'
        },
        {
            label: 'Y2',
            value: 'y2'
        }
    ];

    yAxisUnitOptions: Array<object> = [
        {
            label: 'auto',
            value: ''
        },
        {
            label: 'Kilobyte (KB)',
            value: 'KB'
        },
        {
            label: 'Megabyte (MB)',
            value: 'MB'
        },
        {
            label: 'Gigabyte (GB)',
            value: 'GB'
        }
    ];

    yAxisScaleOptions: Array<object> = [
        {
            label: 'Linear',
            value: 'linear'
        },
        {
            label: 'Logscale',
            value: 'logscale'
        }
    ];

    // NOTE: not using right now till clarification
    xAxisModeOptions: Array<object> = [
        {
            label: 'Time',
            value: 'time'
        }
    ];

    constructor(private fb: FormBuilder, private unit: UnitConverterService) { }

    ngOnInit() {
        // populate form controls
        this.createForm();
    }

    ngAfterViewInit() {
        // initiate any subscriptions
    }

    createForm() {
        // need to actually add widget config values to form controls
        // NOTE: exception is 'yAxisWhich' (y1 or y2), which is not a form control, and sets value on click

        // ?INFO: these are mapped to the form variables set at top
        this.widgetConfigAxes = this.fb.group({});

        switch ( this.widget.settings.component_type ) {
            case 'BarchartWidgetComponent':
            case 'StackedBarchartWidgetComponent':
                this.y1AxisEnabledToggleDisplay = false;
                this.widgetConfigAxes.addControl('y1', this.getAxisFormGroup(this.getAxisConfiguration('y1')));
            break;
            case 'LinechartWidgetComponent':
                this.y1AxisEnabledToggleDisplay = false;
                this.widgetConfigAxes.addControl('y1', this.getAxisFormGroup(this.getAxisConfiguration('y1')));
                this.widgetConfigAxes.addControl('y2', this.getAxisFormGroup(this.getAxisConfiguration('y2')));
            break;
        }

        this.y1UnitSub = this.widgetConfigAxes.controls['y1']['controls'].unit.valueChanges.subscribe( function(unit) {
            const oUnit = this.widget.query.settings.axes && this.widget.query.settings.axes.y1 ? this.unit.getDetails(this.widget.query.settings.axes.y1.unit) : null;
            const nUnit = this.unit.getDetails(unit);
            let min = this.widgetConfigAxes.controls['y1']['controls'].min.value.toString().trim();
            let max = this.widgetConfigAxes.controls['y1']['controls'].max.value.toString().trim();

            if ( min !== 'auto' && min !== '' ) {
                min = oUnit ? min * oUnit.m : min;
                this.widgetConfigAxes.controls['y1']['controls'].min.setValue(nUnit ? min / nUnit.m : min);
            }
            if ( max !== 'auto' && max !== '' ) {
                max = oUnit ? max * oUnit.m : max;
                this.widgetConfigAxes.controls['y1']['controls'].max.setValue(nUnit ? max / nUnit.m : max);
            }
        }.bind(this));

        if ( this.widget.settings.component_type === 'LinechartWidgetComponent' ) {
            this.y2UnitSub = this.widgetConfigAxes.controls['y2']['controls'].unit.valueChanges.subscribe( function(unit) {
                const oUnit = this.widget.query.settings.axes && this.widget.query.settings.axes.y2 ? this.unit.getDetails(this.widget.query.settings.axes.y2.unit) : null;
                const nUnit = this.unit.getDetails(unit);
                let min = this.widgetConfigAxes.controls['y2']['controls'].min.value.toString().trim();
                let max = this.widgetConfigAxes.controls['y2']['controls'].max.value.toString().trim();

                if ( min !== 'auto' && min !== '' ) {
                    min = oUnit ? min * oUnit.m : min;
                    this.widgetConfigAxes.controls['y2']['controls'].min.setValue(nUnit ? min / nUnit.m : min);
                }
                if ( max !== 'auto' && max !== '' ) {
                    max = oUnit ? max * oUnit.m : max;
                    this.widgetConfigAxes.controls['y2']['controls'].max.setValue(nUnit ? max / nUnit.m : max);
                }
            }.bind(this));
        }

        this.widgetConfigAxes_Sub = this.widgetConfigAxes.valueChanges
                                        // delay is required since we convert the min & max values to the respective unit size
                                        .pipe(debounceTime(500))
                                        .subscribe(function(data) {
                                            console.log(" axes form data changed");
                                            this.xAxisEnabled_label = (data.xAxisEnabled) ? 'enabled' : 'disabled';
                                            this.y1AxisEnabled_label = (data.y1AxisEnabled) ? 'enabled' : 'disabled';
                                            this.y2AxisEnabled_label = (data.y2AxisEnabled) ? 'enabled' : 'disabled';
                                            this.widgetChange.emit( {action: 'SetAxes', payload: { data: data }} );
                                        }.bind(this));
    }

    getAxisConfiguration(axis) {
        const defaultConfig = {
            enabled: 'true',
            unit: '',
            scale: 'linear',
            min: 'auto',
            max: 'auto',
            decimals: 'auto',
            label: ''
        };

        const widget = this.widget.query.settings;
        const wAxisConfig = widget.axes && widget.axes[axis] ? widget.axes[axis] : {};
        return { ...defaultConfig, ...wAxisConfig };

    }

    getAxisFormGroup(axis) {
        return this.fb.group({
            enabled : new FormControl( axis.enabled ),
            unit: new FormControl(axis.unit),
            scale: new FormControl(axis.scale),
            min: new FormControl(axis.min),
            max: new FormControl(axis.max),
            decimals: new FormControl(axis.decimals),
            label: new FormControl(axis.label)
        });
    }

    ngOnDestroy() {
        // destroy any subscriptions
        this.widgetConfigAxes_Sub.unsubscribe();
        this.y1UnitSub.unsubscribe();
        if ( this.y2UnitSub ) {
            this.y2UnitSub.unsubscribe();
        }
    }

    /* function to attach to unit dropdown component when it gets finished
    OnUnitUpdated(event: any) {
        console.log('UNIT UPDATED', event, this.widgetConfigAxes.get('y1').get('unit'));
        const y1 = this.widgetConfigAxes.get('y1');
        y1.get('unit').setValue(event.selectedUnit);

    }*/
}

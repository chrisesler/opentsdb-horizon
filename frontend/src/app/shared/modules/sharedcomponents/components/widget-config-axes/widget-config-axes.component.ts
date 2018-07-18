import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';
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
    xAxisEnabled_label:  string = 'enabled';

    /** Form Group */
    widgetConfigAxes: FormGroup;

    // subscriptions
    widgetConfigAxes_Sub: Subscription;

    // form values

    y1AxisEnabled: any = true;
    y1AxisUnit: any;
    y1AxisScale: any;
    y1AxisMin: any;
    y1AxisMax: any;
    y1AxisDecimals: any;
    y1AxisLabel: any;

    y2AxisEnabled: any = false;
    y2AxisUnit: any;
    y2AxisScale: any;
    y2AxisMin: any;
    y2AxisMax: any;
    y2AxisDecimals: any;
    y2AxisLabel: any;

    xAxisEnabled: any = true;
    xAxisMode: any;

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
            label: 'Kilobyte (Kb)',
            value: 'Kb'
        },
        {
            label: 'Megabyte (Mb)',
            value: 'Mb'
        },
        {
            label: 'Gigabyte (Gb)',
            value: 'Gb'
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
        this.widgetConfigAxes_Sub.unsubscribe();
    }

    createForm() {
        // need to actually add widget config values to form controls
        // NOTE: exception is 'yAxisWhich' (y1 or y2), which is not a form control, and sets value on click

        // ?INFO: these are mapped to the form variables set at top
        this.widgetConfigAxes = this.fb.group({
            y1AxisEnabled:   new FormControl(true),
            y1AxisUnit:      new FormControl('Kb'),
            y1AxisScale:     new FormControl('linear'),
            y1AxisMin:       new FormControl('auto'),
            y1AxisMax:       new FormControl('auto'),
            y1AxisDecimals:  new FormControl('auto'),
            y1AxisLabel:     new FormControl(),
            y2AxisEnabled:   new FormControl(false),
            y2AxisUnit:      new FormControl('Kb'),
            y2AxisScale:     new FormControl('linear'),
            y2AxisMin:       new FormControl('auto'),
            y2AxisMax:       new FormControl('auto'),
            y2AxisDecimals:  new FormControl('auto'),
            y2AxisLabel:     new FormControl(),
            xAxisEnabled:    new FormControl(true),
            xAxisMode:       new FormControl('time')
        });

        this.widgetConfigAxes.valueChanges.distinctUntilChanged( (prev, curr) => {
            console.log('PREVIOUS/CURRENT', prev, curr);
            return prev === curr;
        });

        this.widgetConfigAxes.controls.y1AxisEnabled.valueChanges.subscribe(data => {
            console.log('data', data);
        });

        // JUST CHECKING VALUES
        this.widgetConfigAxes_Sub = this.widgetConfigAxes.valueChanges.subscribe(function(data) {
            console.log('AXES CONFIG CHANGES', data, this.widgetConfigAxes);
            // if (this.xAxisEnabled !== data.xAxisEnabled) {
                this.xAxisEnabled_label = (data.xAxisEnabled) ? 'enabled' : 'disabled';
                console.log('xAxisLabel', this.xAxisEnabled_label);
            // }
            // if (this.y1AxisEnabled !== data.y1AxisEnabled) {
                this.y1AxisEnabled_label = (data.y1AxisEnabled) ? 'enabled' : 'disabled';
                console.log('y1AxisLabel', this.y1AxisEnabled_label);
            // }
            // if (this.y2AxisEnabled !== data.y2AxisEnabled) {
                this.y2AxisEnabled_label = (data.y2AxisEnabled) ? 'enabled' : 'disabled';
                console.log('y2AxisLabel', this.y2AxisEnabled_label);
            // }
        }.bind(this));
    }

    /**
     * Services
     */

     /**
      * Events
      */

    /*click_YAxisWhichChange(val: any) {
        this.yAxisWhich = val;
    }*/

}

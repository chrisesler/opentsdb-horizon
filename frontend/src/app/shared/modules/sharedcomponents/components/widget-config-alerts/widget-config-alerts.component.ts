import { Component, OnInit, OnChanges, SimpleChanges, OnDestroy, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-alerts',
    templateUrl: './widget-config-alerts.component.html',
    styleUrls: []
})
export class WidgetConfigAlertsComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.alerts-configuration') private _tabClass = true;
    @HostBinding('class.has-columns') private _modifierClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */
    formGroups: any;
    fgsSubscription: Subscription;

    thresholds: any = [
        {
            value: '',
            axis: 'y1',
            lineWeight: '1px',
            lineType: 'solid',
            lineColor: '#000000'
        },
        {
            value: '',
            axis: 'y1',
            lineWeight: '1px',
            lineType: 'solid',
            lineColor: '#000000'
        }
    ];

    showAxis =  false;

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        // populate form controls
        this.setThresholds(0);
        this.setThresholds(1);
        this.createForm();
    }

    ngOnChanges( changes: SimpleChanges ) {
        if ( changes.widget ) {
            const widget = changes.widget.currentValue;
            const y2Axis = widget.settings.axes && widget.settings.axes.y2 ? widget.settings.axes.y2 : {};
            this.showAxis = widget.settings.component_type === 'LinechartWidgetComponent' && (!Object.keys(y2Axis).length || y2Axis.enabled) ? true : false;
        }
    }

    createForm() {
        this.formGroups = this.fb.group({});
        switch ( this.widget.settings.component_type ) {
            case 'BarchartWidgetComponent':
                this.formGroups.addControl(0, this.getThresholdFormGroup(this.thresholds[0]));
                this.formGroups.addControl(1, this.getThresholdFormGroup(this.thresholds[1]));
                break;
            case 'LinechartWidgetComponent':
                this.formGroups.addControl(0, this.getThresholdFormGroup(this.thresholds[0]));
                this.formGroups.addControl(1, this.getThresholdFormGroup(this.thresholds[1]));
            break;
        }

        this.fgsSubscription = this.formGroups.valueChanges
                                                .pipe(debounceTime(500))
                                                .subscribe(function(data) {
                                                    const thresholds = {};
                                                    Object.keys(data).forEach( k => {
                                                        thresholds[k] = data[k];
                                                        thresholds[k].value = this.formGroups.controls[k].controls['value'].valid ? thresholds[k].value : '';
                                                    });
                                                    this.widgetChange.emit( { action: 'SetAlerts', payload: { data: thresholds }} );
                                                }.bind(this));
    }

    setThresholds(k) {
        const wThresholdConfig = this.widget.settings.thresholds && this.widget.settings.thresholds[k] ? this.widget.settings.thresholds[k] : {};
        this.thresholds[k] = Object.assign(this.thresholds[k], wThresholdConfig);
    }

    getThresholdFormGroup(threshold) {
        return this.fb.group({
            value: new FormControl(threshold.value, [Validators.pattern('^[0-9]+(\.[0-9]*)?$')]),
            axis: new FormControl(threshold.axis),
            lineWeight: new FormControl(threshold.lineWeight),
            lineType: new FormControl(threshold.lineType),
            lineColor: new FormControl(threshold.lineColor)
        });
    }

    selectColor(color, group) {
        this.formGroups.controls[group].controls['lineColor'].setValue(color.hex);
    }

    ngOnDestroy() {
        // destroy any subscriptions
        this.fgsSubscription.unsubscribe();
    }

}

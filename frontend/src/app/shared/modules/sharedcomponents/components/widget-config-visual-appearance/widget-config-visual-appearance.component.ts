import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

/*
export interface VisualizationData {
    color: string;
    lineWeight: string;
    lineType: string;
  }
*/
@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-visual-appearance',
    templateUrl: './widget-config-visual-appearance.component.html',
    styleUrls: []
})
export class WidgetConfigVisualAppearanceComponent implements OnInit, OnChanges  {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.visual-appearance-configuration') private _tabClass = true;
    @HostBinding('class.has-columns') private _modifierClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    dataSources = [];

    gForms: FormGroup;

    displayControl: FormControl;

    gSubscriptions: Subscription[] = [];

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.gForms = new FormGroup({});


        if (this.widget.settings.component_type === 'StackedBarchartWidgetComponent') {
            this.gForms.addControl( 'bars', new FormArray(
                this.widget.query.groups.map(item => new FormGroup({
                    label : new FormControl(item.title)
                })))
            );
            this.gForms.addControl( 'stacks', new FormArray(
                this.widget.query.settings.visual.stacks.map(
                    item => new FormGroup({
                        label : new FormControl(item.label),
                        color: new FormControl(item.color)
                    }))
                )
            );
            this.gForms.get('bars').valueChanges.subscribe(data => {
                console.log(data, 'bars..');
                this.widgetChange.emit( {'action': 'SetStackedBarBarVisuals', payload: { data: data }});
            });

            this.gForms.get('stacks').valueChanges.subscribe(data => {
                console.log(data, 'stacks..');
                this.widgetChange.emit( {'action': 'SetStackedBarStackVisuals', payload: { data: data }});
            });
        } else {
            // all others - LineChart, BarChart, DonutChart
            this.widget.queries.forEach((query, index) => {
                this.dataSources[index] = query.metrics;
                this.gForms.addControl(index, this.createFormArray(this.dataSources[index]));
                console.log(this.gForms, "forms", this.widget.queries)
            });
        }
        // console.log(this.gForms, 'this.gforms');

        if (this.widget.settings.component_type !== 'LinechartWidgetComponent') {
            const displayControlDefault = (this.widget.settings.component_type === 'DonutWidgetComponent') ? 'doughnut' : 'vertical';
            this.displayControl = new FormControl(this.widget.settings.visual.type || displayControlDefault);
        }
        /*
        switch ( this.widget.settings.component_type ) {
            case 'BarchartWidgetComponent':
                this.displayControl = new FormControl(this.widget.query.settings.visual.type || 'vertical');
            break;
            case 'DonutWidgetComponent':
                this.displayControl = new FormControl(this.widget.query.settings.visual.type || 'doughnut');
            break;
        }*/

        if ( this.displayControl ) {
            this.displayControl.valueChanges.subscribe( d => {
                // console.log('display changed', d );
                this.widgetChange.emit( {'action': 'ChangeVisualization', payload: { type: d }});
            });
        }

        Object.keys(this.gForms.controls).forEach( gIndex => {
            this.gSubscriptions[gIndex] = this.gForms.get(gIndex).valueChanges.subscribe(data => {
                // console.log(data, 'data....');
                this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: gIndex, data: data }});
            });
        });

    }
    ngOnChanges( changes: SimpleChanges ) {

    }
    createFormArray(ds): FormArray {
        switch ( this.widget.settings.component_type ) {
            case 'BarchartWidgetComponent':
            case 'DonutWidgetComponent':
                return new FormArray(ds.map(item => new FormGroup({
                    label : new FormControl(item.settings.visual.label),
                    color : new FormControl(item.settings.visual.color)
                })));
            case 'LinechartWidgetComponent':
            console.log("visula", ds)
                return new FormArray(ds.map(item => new FormGroup({
                    type: new FormControl( item.settings.visual.type || 'line'),
                    label : new FormControl(item.settings.visual.label),
                    color : new FormControl(item.settings.visual.color),
                    lineWeight : new FormControl(item.settings.visual.lineWeight || '1px'),
                    lineType: new FormControl(item.settings.visual.lineType || 'solid'),
                    axis: new FormControl( item.settings.visual.axis || 'y1' )
                })));
        }
    }

    selectColor(color, gIndex, index ) {
        this.gForms.controls[gIndex]['controls'][index]['controls'].color.setValue(color.hex);
    }

    // for stacked barcharts
    selectStackColor(color, index ) {
        this.gForms.controls['stacks']['controls'][index]['controls'].color.setValue(color.hex);
    }

}

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

        this.widget.query.groups.forEach((group, index) => {
            this.dataSources[index] = group.queries;
            this.gForms.addControl(index, this.createFormArray(this.dataSources[index]));
        });

        switch ( this.widget.settings.component_type ) {
            case 'BarchartWidgetComponent':
                this.displayControl = new FormControl(this.widget.query.settings.visual.type || 'vertical');
            break;
            case 'DonutWidgetComponent':
                this.displayControl = new FormControl(this.widget.query.settings.visual.type || 'doughnut');
            break;

        }

        this.displayControl.valueChanges.subscribe( d => {
            console.log("display changed", d );
            this.widgetChange.emit( {'action': 'ChangeVisualization', payload: { type: d }});
        });

        Object.keys(this.gForms.controls).forEach( gIndex => {
            this.gSubscriptions[gIndex] = this.gForms.get(gIndex).valueChanges.subscribe(data => {
                this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: gIndex, data: data }});
            });
        });

    }
    ngOnChanges( changes: SimpleChanges ) {

    }
    createFormArray(ds): FormArray {
        return new FormArray(ds.map(item => new FormGroup({
            stackLabel : new FormControl(item.settings.visual.stackLabel),
            color : new FormControl(item.settings.visual.color)
        })));
    }

    selectColor(color, gIndex, index ) {
        this.gForms.controls[gIndex]['controls'][index]['controls'].color.setValue(color.hex);
    }

}

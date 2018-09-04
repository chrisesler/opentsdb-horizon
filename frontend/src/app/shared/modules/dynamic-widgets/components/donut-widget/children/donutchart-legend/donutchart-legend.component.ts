import { Component, OnInit,  HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'donutchart-legend',
  templateUrl: './donutchart-legend.component.html',
  styleUrls: ['./donutchart-legend.component.scss']
})
export class DonutchartLegendComponent implements OnInit {

    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.donutchart-legend-configuration') private _tabClass = true;



    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;


    gForm: FormGroup;

    subs: Subscription;

    positionOptions: any[] = [
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
        console.log(this.widget.query.settings.legend, "settings....")
        this.gForm = new FormGroup({
            display : new FormControl(this.widget.query.settings.legend.display || false),
            position: new FormControl(this.widget.query.settings.legend.position ||  'right'),
            showPercentages: new FormControl( this.widget.query.settings.legend.showPercentages || false)
        });

        this.subs = this.gForm.valueChanges.subscribe(data => {
            //console.log("form changes...", data);
            this.widgetChange.emit( {action: 'SetLegend', payload: {data: data} } );
        });
    }

}

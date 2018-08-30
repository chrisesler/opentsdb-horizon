import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';


@Component({
  selector: 'stacked-barchart-visual-appearance',
  templateUrl: './stacked-barchart-visual-appearance.component.html',
  styleUrls: ['./stacked-barchart-visual-appearance.component.scss']
})
export class StackedBarchartVisualAppearanceComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.visual-appearance-configuration') private _tabClass = true;


    displayControl: FormControl;

    gForms: FormGroup;


    gSubscriptions: Subscription[] = [];

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    constructor() { }

    ngOnInit() {
        // handles horizontal or vertical switch
        this.displayControl = new FormControl(this.widget.query.settings.visual.direction || 'vertical');

        this.displayControl.valueChanges.subscribe( d => {
            console.log("display changed", d );
            this.widgetChange.emit( {'action': 'ChangeVisualization', payload: { type: d }});
        });

        this.gForms = new FormGroup({});
        this.gForms.addControl( 'bars', new FormArray(
                                                        this.widget.query.groups.map(item => new FormGroup({
                                                            label : new FormControl(item.settings.visual.label)
                                                        }))
                                                    )
                                );
        this.gForms.addControl( 'stacks', new FormArray(
                                                        this.widget.query.settings.visual.stacks.map(
                                                            item => new FormGroup({
                                                                label : new FormControl(item.label),
                                                                color: new FormControl(item.color)
                                                            })
                                                        )
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
    }

    selectColor(color, index ) {
        this.gForms.controls['stacks']['controls'][index]['controls'].color.setValue(color.hex);
    }

}

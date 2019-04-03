import {
    Component,
    OnInit,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    SimpleChange,
    Input,
    HostBinding
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'variable-template-bar',
    templateUrl: './variable-template-bar.component.html',
    styleUrls: []
})
export class VariableTemplateBarComponent implements OnInit, OnDestroy, OnChanges {

    @HostBinding('class.variable-template-bar') private _hostClass = true;

    private _shouldDisplay = false;
    get shouldDisplay(): boolean {
        return this._shouldDisplay;
    }

    /** Inputs */
    @Input() dbSettingsVariables: any = {};

    /** Outputs */

    /** local variables */
    variables: any;
    // tslint:disable-next-line:no-inferrable-types
    isUpdating: boolean = true;

    /** Form Variables */
    varForm: FormGroup;
    varFormSub: Subscription;
    optionLists: any = {};

    constructor(
        private fb: FormBuilder,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.dbSettingsVariables) {
            const data: SimpleChange = changes.dbSettingsVariables;

            // save local version
            this.variables = data.currentValue;
            this.checkIfShouldDisplay();

            if (this._shouldDisplay) {

                // check if there is an existing form
                // if it exists, then remove the changes subscription (so a new one can be applied)
                if (this.varForm) {
                    this.varFormSub.unsubscribe();
                }
                // create the form
                this.createForm();
                // we are done updating
                this.isUpdating = false;
            }
        }
    }

    ngOnDestroy() {
        if(this.varFormSub) {
            this.varFormSub.unsubscribe();
        }
    }


    createForm() {
        this.varForm = this.fb.group({
            enabled: this.variables.enabled,
            tplVariables: this.fb.array([])
        });

        this.initializeFormArrays();

        this.varFormSub = this.varForm.valueChanges.subscribe(val => {

            if (!this.isUpdating) {
                this.interCom.requestSend(<IMessage> {
                    id: 'variableToolBar',
                    action: 'updateDashboardSettings',
                    payload: {
                        variables: val
                    }
                });
                this.isUpdating = true;
            } else {
                this.isUpdating = false;
            }
        });
    }

    /** FORM ACCESORS */
    get tplVariables() { return this.varForm.get('tplVariables') || []; }
    get tplVariableControls() { return this.varForm.get('tplVariables'); }

    // helper to get nested group item control
    variableControl(item: FormGroup, label: string, value?: boolean) {
        if (value === true) {
            // if value flag is true, return only the value
            return item.get(label).value;
        } else {
            // return only the control
            return item.get(label);
        }
    }

    /** PRIVATE FUNCTIONS */

    // initialize form arrays
    private initializeFormArrays() {
        const control = <FormArray>this.varForm.controls['tplVariables'];

        // clear the array first (primarily if there has been a state update)
        while (control.length !== 0) {
            control.removeAt(0);
        }

        for (const tpl of this.variables.tplVariables) {
            const varData = {
                tagk: tpl.tagk,
                alias: tpl.alias,
                allowedValues: this.fb.array(tpl.allowedValues),
                filter: this.fb.array(tpl.filter),
                enabled: tpl.enabled,
                type: tpl.type
            };

            control.push(this.fb.group(varData));
        }
    }

    // check to see if the bar should form at all
    private checkIfShouldDisplay() {
        if (!this.variables.enabled) {
            this._shouldDisplay = false;
        } else {
            if (this.variables.tplVariables.length === 0) {
                this._shouldDisplay = false;
            } else {
                let enabled = false;
                for (const variable of this.variables.tplVariables) {
                    if (variable.enabled) {
                        enabled = true;
                    }
                }
                this._shouldDisplay = enabled;
            }
        }
    }

}

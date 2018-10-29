import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    HostBinding
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'variable-template-bar',
    templateUrl: './variable-template-bar.component.html',
    styleUrls: []
})
export class VariableTemplateBarComponent implements OnInit, OnDestroy {

    @HostBinding('class.variable-template-bar') private _hostClass = true;

    private _shouldDisplay = false;
    get shouldDisplay(): boolean {
        return this._shouldDisplay;
    }

    variables: any;

    /** Inputs */
    @Input() dbSettingsVariables: Observable<any>; // dashboard settings data, containing the template vars
    dbSettingsVariablesSub: Subscription;

    /** Outputs */

    /** local variables */

    varForm: FormGroup;

    optionLists: any = {};

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        // create the form data

        this.dbSettingsVariablesSub = this.dbSettingsVariables.subscribe(val => {
            console.group('%cVARIABLE CHANGES', 'color: white; background-color: red; padding: 8px; font-weight: bold;');
            console.log('val', val);
            this.variables = val;
            this.checkIfShouldDisplay();

            console.log('should display', this._shouldDisplay);
            if (this._shouldDisplay) {
                if (!this.varForm) {
                    console.log('creating form');
                    this.createForm();
                } else {
                    console.log('re-initializing form arrays');
                    this.initializeFormArrays();
                }
                console.log('VAR FORM', this.varForm);
            }
            console.groupEnd();
        });

        // this.createForm();
    }

    ngOnDestroy() {
        this.dbSettingsVariablesSub.unsubscribe();
    }

    createForm() {
        this.varForm = this.fb.group({
            enabled: this.variables.enabled,
            tplVariables: this.fb.array([])
        });

        this.initializeFormArrays();
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
            /*if (tpl.enabled) {
                const tplGrp = this.fb.group({
                    key: tpl.key,
                    alias: tpl.alias,
                    label: (tpl.alias.length > 0) ? tpl.alias : tpl.key,
                    options: new FormControl()
                });
                this.optionLists[tpl.key] = tpl.values.split(',');
                control.push(tplGrp);
            }*/

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

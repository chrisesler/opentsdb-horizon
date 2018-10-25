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

    variables: any;

    /** Inputs */
    @Input() dbSettingsVariables: Observable<any>; // dashboard settings data, containing the template vars
    dbSettingsVariablesSub: Subscription;

    /** Outputs */

    /** local variables */

    varForm: FormGroup;

    optionLists: any = {};

    // tslint:disable-next-line:no-inferrable-types
    barReady: boolean = false;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        // create the form data

        this.dbSettingsVariablesSub = this.dbSettingsVariables.subscribe(val => {
            this.barReady = false;
            this.variables = val;
            if (this.varForm) {
                this.initializeFormArrays();
            }
        });

        this.createForm();
    }

    ngOnDestroy() {
        this.dbSettingsVariablesSub.unsubscribe();
    }

    createForm() {
        this.varForm = this.fb.group({
            tplVariables: this.fb.array([])
        });

        this.initializeFormArrays();
    }

    get tplVariables() { return this.varForm.get('tplVariables') || []; }
    get tplVariableControls() { return this.varForm.get('tplVariables')['controls']; }

    private initializeFormArrays() {
        const control = <FormArray>this.varForm.controls['tplVariables'];

        // clear the array first (primarily if there has been a state update)
        while (control.length !== 0) {
            control.removeAt(0);
        }

        for (const tpl of this.variables.tplVariables) {
            if (tpl.enabled) {
                const tplGrp = this.fb.group({
                    key: tpl.key,
                    alias: tpl.alias,
                    label: (tpl.alias.length > 0) ? tpl.alias : tpl.key,
                    options: new FormControl()
                });
                this.optionLists[tpl.key] = tpl.values.split(',');
                control.push(tplGrp);
            }
        }

        this.barReady = true;
    }

    getLabel(tplVariable: FormGroup): string {
        const alias = tplVariable.get('alias').value;

        if (alias && alias.trim() !== '' ) {
            return alias;
        } else {
            return tplVariable.get('key').value;
        }
    }

    getValues(tmplVariable: any): string[] {
       return tmplVariable.values.split(',');
    }

    atleastOneTemplateVariableEnabled(tmplVariables: any[]): boolean {
        if (tmplVariables) {
            for (const variable of tmplVariables) {
                if (variable.enabled) {
                    return true;
                }
            }
        }
        return false;
    }
}

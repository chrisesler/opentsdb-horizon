import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'variable-template-bar',
    templateUrl: './variable-template-bar.component.html',
    styleUrls: []
})
export class VariableTemplateBarComponent implements OnInit {

    @HostBinding('class.variable-template-bar') private _hostClass = true;

    /** Inputs */
    @Input() dbSettingsVariables: any; // dashboard settings data, containing the template vars

    /** Outputs */

    /** local variables */

    // fake up some data. Would normally come from dbData
    fakeVariables: Array<any> = [
        {
            key: 'colo',
            alias: 'colo',
            values: 'bf1,gq1,sg3',
            enabled: true
        },
        {
            key: 'variable1',
            alias: 'variable 1',
            values: 'rotation, system',
            enabled: true
        },
        {
            key: 'interface',
            alias: 'interface',
            values: 'docker',
            enabled: true
        }
    ];

    varForm: FormGroup;

    optionLists: any = {};

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        // create the form data

        this.varForm = this.fb.group({
           variables: this.fb.array([])
        });

        this.initializeFormArrays();
    }

    get variables() { return this.varForm.get('variables'); }
    get variableControls() { return this.varForm.get('variables')['controls']; }

    private initializeFormArrays() {
        const control = <FormArray>this.varForm.controls['variables'];

        for (const tpl of this.dbSettingsVariables.tplVariables) {
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

    }

}

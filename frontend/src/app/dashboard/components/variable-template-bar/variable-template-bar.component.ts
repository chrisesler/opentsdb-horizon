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
    @Input() dbDataVariables: any; // dashboard settings data, containing the template vars

    /** Outputs */

    /** local variables */

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

    }

    get variables() { return this.varForm.get('variables'); }
    get variableControls() { return this.varForm.get('variables')['controls']; }


    getLabel(tmplVariable: any): string {
        if (tmplVariable.alias && tmplVariable.alias.trim() !== '' ) {
            return tmplVariable.alias;
        } else {
            return tmplVariable.key;
        }
    }

    getValues(tmplVariable: any): string[] {
       return tmplVariable.values.split(',');
    }

    atleastOneTemplateVariableEnabled(tmplVariables: any[]): boolean {
        if (tmplVariables) {
            for (let variable of tmplVariables) {
                if (variable.enabled) {
                    return true;
                }
            }
        }
        return false;
    }
}

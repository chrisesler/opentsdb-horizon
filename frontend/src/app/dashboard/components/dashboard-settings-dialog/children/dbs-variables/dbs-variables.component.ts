import {
    Component,
    OnInit,
    OnDestroy,
    HostBinding,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dbs-variables',
    templateUrl: './dbs-variables.component.html',
    styleUrls: []
})
export class DbsVariablesComponent implements OnInit, OnDestroy {

    @HostBinding('class.dbs-variables-component') private _hostClass = true;
    @HostBinding('class.dbs-settings-tab') private _tabClass = true;

    /** Inputs */
    @Input() dbData: any = {};

    /** Outputs */
    @Output() dataModified: any = new EventEmitter();

    /** Local Variables */
    varForm: FormGroup;
    varFormSub: Subscription;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {

        this.varForm = this.fb.group({
            enabled: new FormControl(this.dbData.variables.enabled),
            tplVariables: this.fb.array([])
        });

        this.varFormSub = this.varForm.valueChanges.subscribe(val => {
            console.log('%cVARIABLES FORM [CHANGES]', 'background-color: skyblue; padding: 2px 4px;', val);

            // need to remove unused variables (ones without keys)
            const pending = val;
            pending.tplVariables = val.tplVariables.filter(item => {
                const keyCheck = item.tagk.trim();
                return keyCheck.length > 0;
            });

            this.dataModified.emit({
                type: 'variables',
                data: pending
            });
        });

        this.initializeTplVariables(this.dbData.variables.tplVariables);

        console.log('%cVAR FORM', 'background-color: skyblue; padding: 2px 4px', this.varForm);
    }

    ngOnDestroy() {
        this.varFormSub.unsubscribe();
    }

    // form control accessors (come after form has been setup)
    get enabled() { return this.varForm.get('enabled'); }
    get tplVariables() { return this.varForm.get('tplVariables'); }

    initializeTplVariables(values: any) {

        if (values.length === 0) {
            // add an empty one if there are no values
            this.addTemplateVariable();
        } else {
            for (const item of values) {
                this.addTemplateVariable(item);
            }
        }
    }

    addTemplateVariable(data?: any) {

        // TODO: need to detect if filter contains '*' to change type to wildcard

        data = (data) ? data : {};

        const varData = {
            tagk: (data.tagk) ? data.tagk : '',
            alias: (data.alias) ? data.alias : '',
            allowedValues: (data.allowedValues) ? this.fb.array(data.allowedValues) : this.fb.array([]),
            filter: (data.filter) ? this.fb.array(data.filter) : this.fb.array([]),
            enabled: (data.enabled) ? data.enabled : true,
            type: (data.type) ? data.type : 'literalor'
        };

        const control = <FormArray>this.varForm.controls['tplVariables'];
        control.push(this.fb.group(varData));
    }

    removeTemplateVariable(i: number) {
        const control = <FormArray>this.varForm.controls['tplVariables'];
        control.removeAt(i);
        // this.dbData.variables.tplVariables.splice(i, 1);
    }

    /** ALL templates enable/disable toggle */

    // pivoting the enabled value for the toggle. easier to maintain
    get disabled(): boolean {
        return !this.varForm.get('enabled').value;
    }

    masterToggleChange(event: any) {
        console.log('%cMASTER TOGGLE CHANGE [EVENT]', 'color: white; background-color: blue; padding: 2px 4px;', event);
        this.varForm.get('enabled').setValue(!event.checked, { emitEvent: true });
    }
}

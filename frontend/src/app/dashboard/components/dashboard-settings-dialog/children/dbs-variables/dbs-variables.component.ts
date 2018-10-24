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

    enabled: FormControl;
    tplVariables: FormArray;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {

        this.varForm = this.fb.group({
            enabled: new FormControl(!this.dbData.variables.enabled),
            tplVariables: this.fb.array([])
        });

        this.varFormSub = this.varForm.valueChanges.subscribe(val => {
            console.log('%cVARIABLES FORM [CHANGES]', 'background-color: skyblue; padding: 2px 4px;', val);

            // need to remove unused variables (ones without keys)
            const pending = val;
            pending.tplVariables = val.tplVariables.filter(item => {
                return item.key.length > 0;
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

        data = data ? data : {
            key: '',
            alias: '',
            values: '',
            enabled: true
        };

        const control = <FormArray>this.varForm.controls['tplVariables'];
        control.push(this.fb.group(data));
    }

    removeTemplateVariable(i: number) {
        const control = <FormArray>this.varForm.controls['tplVariables'];
        control.removeAt(i);
    }

}

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
    @Output() dataUpdated: any = new EventEmitter();

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

        this.initializeTplVariables(this.dbData.variables.tplVariables);

        console.log('%cVAR FORM', 'color: #fff; background-color: red;', this.varForm);
    }

    ngOnDestroy() {
        // this.varFormSub.unsubscribe();
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

import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete, MatAutocompleteTrigger } from '@angular/material';

import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'template-variable-panel',
    templateUrl: './template-variable-panel.component.html',
    styleUrls: []
})
export class TemplateVariablePanelComponent implements OnInit {

    @HostBinding('class.template-variable-panel-component') private _hostClass = true;

    @Input() tplVariables: any;
    @Input() mode: string;
    @Output() variableChanges: EventEmitter<any> = new EventEmitter<any>();
    @Input() dbTagKeys: string[] = []; // all available tags from dashboard

    editForm: FormGroup;
    editFormSub: Subscription;

    // selectedKeys: string[] = [];

    /** Autocomplete variables */
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: Observable<string[]>; // options for value autosuggest

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        if (this.mode === 'edit') {
            this.initEditFormGroup();
        }
    }

    doEdit() {
        this.mode = 'edit';
        this.initEditFormGroup();
    }

    doList() {
        this.mode = 'view';
    }

    initEditFormGroup() {
        this.editForm = this.fb.group({
            formTplVariables: this.fb.array([])
        });

        this.editFormSub = this.editForm.valueChanges.subscribe(val => {
            console.log('value vhange', val);
            // need to remove unused variables (ones without keys)
            /*const pending = val;
            const pendingKeys = [];
            pending.tplVariables = val.tplVariables.filter(item => {
                const keyCheck = item.tagk.trim();
                if (keyCheck.length > 0) {
                    pendingKeys.push(keyCheck);
                    return true;
                } else {
                    return false;
                }
            });

            this.selectedKeys = pendingKeys;

            this.variableChanges.emit({
                type: 'variables',
                data: pending
            });
            */
        });

        this.initializeTplVariables(this.tplVariables);
    }

    // form control accessors (come after form has been setup)
    get formTplVariables() { return this.editForm.get('formTplVariables'); }

    initializeTplVariables(values: any) {

        if (values.length === 0) {
            // add an empty one if there are no values
            this.addVariableTemplate();
        } else {
            // this.selectedKeys = [];
            for (const item of values) {
                // this.selectedKeys.push(item.tagk);
                this.addVariableTemplate(item);
            }
        }
    }

    addVariableTemplate(data?: any) {

        data = (data) ? data : {};

        const varData = {
            tagk: (data.tagk) ? data.tagk : '',
            alias: (data.alias) ? data.alias : '',
            filter: (data.filter) ? data.filter : '',
        };

        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.push(this.fb.group(varData));

    }

    removeTemplateVariable(i: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.removeAt(i);
    }

    variabletTemplateEditDone() {
        // emit up whether there are changes...
        // if no changes, still emit so it will change the variableEditMode
    }

}

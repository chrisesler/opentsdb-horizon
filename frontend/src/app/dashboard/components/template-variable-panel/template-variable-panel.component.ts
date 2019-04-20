import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';
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

    @HostBinding('class.is-edit-mode')
    get isEditMode() {
        return this._mode === 'edit';
    }

    @Input() variables: any;

    @Output() variableChanges: EventEmitter<any> = new EventEmitter<any>();

    _mode = 'list'; // list or edit

    @Input()
    get mode() {
        return this._mode;
    }
    set mode(value: string) {
        if (this._mode !== value && value === 'edit') {
            this.initEditFormGroup();
        } else {
            this.editForm = undefined;
        }
        this._mode = value;
    }

    @Input() dbTagKeys: string[] = []; // all available tags from dashboard



    // FORM STUFF
    editForm: FormGroup;
    editFormSub: Subscription;

    selectedKeys: string[] = [];

    /** Autocomplete variables */
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: Observable<string[]>; // options for value autosuggest

    /** form variables */
    separatorKeysCodes: number[] = [ENTER, COMMA];

    allowedValuesInput: FormControl = new FormControl(); // form control for adding allowed value item

    displayedColumns: ['alias', 'key', 'value', 'actions'];

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
    }

    initEditFormGroup() {
        this.editForm = this.fb.group({
            enabled: new FormControl(this.variables.enabled),
            tplVariables: this.fb.array([])
        });

        this.editFormSub = this.editForm.valueChanges.subscribe(val => {

            // need to remove unused variables (ones without keys)
            const pending = val;
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
        });

        this.initializeTplVariables(this.variables.tplVariables);
    }

    // form control accessors (come after form has been setup)
    get enabled() { return this.editForm.get('enabled'); }
    get tplVariables() { return this.editForm.get('tplVariables'); }

    initializeTplVariables(values: any) {

        if (values.length === 0) {
            // add an empty one if there are no values
            this.addVariableTemplate();
        } else {
            this.selectedKeys = [];
            for (const item of values) {
                this.selectedKeys.push(item.tagk);
                this.addVariableTemplate(item);
            }
        }
    }

    addVariableTemplate(data?: any) {

        // TODO: need to detect if filter contains '*' to change type to wildcard

        data = (data) ? data : {};

        const varData = {
            tagk: (data.tagk) ? data.tagk : '',
            alias: (data.alias) ? data.alias : '',
            allowedValues: (data.allowedValues) ? this.fb.array(data.allowedValues) : this.fb.array([]),
            filter: (data.filter) ? this.fb.array(data.filter) : this.fb.array([]),
            enabled: data.enabled,
            type: (data.type) ? data.type : 'literalor'
        };

        const control = <FormArray>this.editForm.controls['tplVariables'];
        control.push(this.fb.group(varData));

    }

    removeTemplateVariable(i: number) {
        const control = <FormArray>this.editForm.controls['tplVariables'];
        control.removeAt(i);
    }

    variabletTemplateEditDone() {
        // emit up whether there are changes...
        // if no changes, still emit so it will change the variableEditMode
    }

}

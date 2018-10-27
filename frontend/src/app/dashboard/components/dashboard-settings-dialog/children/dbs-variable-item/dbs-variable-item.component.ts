import { COMMA, ENTER } from '@angular/cdk/keycodes';

import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    ViewChild,
    ElementRef
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete } from '@angular/material';

import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dbs-variable-item',
    templateUrl: './dbs-variable-item.component.html',
    styleUrls: []
})
export class DbsVariableItemComponent implements OnInit, OnDestroy {

    @HostBinding('class.template-variable-item') private _hostClass = true;
    @HostBinding('class.is-disabled') private _itemDisabled = false;

    @Input() formGroup: FormGroup;
    @Input() formGroupName: number;

    @Output() itemDataChanged: any = new EventEmitter();

    @Output() remove: any = new EventEmitter();

    private enabledSub: Subscription;

    /** Autocomplete variables */
    /** FAKE DATA */

    fakeKeyOptions: string[] = [
        'colo',
        'host',
        'appid'
    ];

    fakeValueOptions: string[] = [
        'value-1',
        'value-2',
        'value-3',
        'value-4',
        'value-5',
        'value-6',
        'value-7',
        'value-8',
        'value-9',
        'value-10',
        'value-11',
        'value-12',
        'value-13',
        'value-14'
    ];

    /** form variables */
    separatorKeysCodes: number[] = [ENTER, COMMA];

    restrictedValuesInput: FormControl = new FormControl();

    restrictedValues: FormArray = new FormArray([]);

    filteredKeyOptions: Observable<string[]>;
    filteredValueOptions: Observable<string[]>;

    @ViewChild('filterValueInput') filterValueInput: ElementRef<HTMLInputElement>;
    @ViewChild('filterValueAuto') valueAutocomplete: MatAutocomplete;

    addOnBlur = true;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        console.group('%cDBS VARIABLE ITEM', 'color: white; background: black; padding: 2px 4px;');
            const keys = Object.keys(this.formGroup['controls']);
            for (const key of keys) {
                console.log('%c' + key + ':', 'font-weight: bold;', this.formGroup['controls'][key].value);
            }
        console.groupEnd();

        // preset whether the item is disabled or not
        this._itemDisabled = !(this.formGroup.get('enabled').value);

        // listen for changes for enabled, and modify flag
        this.enabledSub = this.formGroup.get('enabled').valueChanges.subscribe(val => {
            // console.log('ENABLED VAL', val);
            this._itemDisabled = !val;
        });

        this.filteredKeyOptions = this.key.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterTagKeyOptions(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );

        this.filteredValueOptions = this.restrictedValuesInput.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterTagValueOptions(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );

        const tmpVals = this.values.value.split(',');
        for (let val of tmpVals) {
            val = val.trim();
            this.createRestrictedValue(val);
        }

    }

    get key() { return this.formGroup.get('key'); }
    get alias() { return this.formGroup.get('alias'); }
    get enabled() { return this.formGroup.get('enabled'); }
    get values() { return this.formGroup.get('values'); }
    get type() { return this.formGroup.get('type'); }

    get chipValues() { return this.restrictedValues['controls']; }

    ngOnDestroy() {
        this.enabledSub.unsubscribe();
    }

    // removes the entire form group
    removeItem() {
        this.remove.emit(this.formGroupName);
    }

    // remove a filter value option
    removeValue(i: number) {
        const control = <FormArray>this.restrictedValues;
        control.removeAt(i);
    }

    // add a filter value option
    addValue(event: any) {
        if (!this.valueAutocomplete.isOpen) {
            const input = event.input;
            const value = event.value;

            // Add our fruit
            if ((value || '').trim()) {
              this.createRestrictedValue(value.trim());
            }

            // Reset the input value
            if (input) {
              input.value = '';
            }

            this.restrictedValuesInput.setValue('');
        }
    }

    /** Auto Complete Functions */

    selectFilterKeyOption(event: any) {
        this.key.setValue(event.option.value);
    }

    selectFilterValueOption(event: any) {
        //
        this.createRestrictedValue(event.option.value);
        this.filterValueInput.nativeElement.value = '';
        this.restrictedValuesInput.setValue('');
    }


    /** private functions */

    private createRestrictedValue(val: string) {
        const data = { value: val };
        const control = <FormArray>this.restrictedValues;
        control.push(this.fb.group(data));
    }

    private filterTagKeyOptions(val: string) {
        return this.fakeKeyOptions.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

    private filterTagValueOptions(val: string) {
        return this.fakeValueOptions.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

}

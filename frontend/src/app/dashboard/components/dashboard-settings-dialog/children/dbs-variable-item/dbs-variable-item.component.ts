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

    allowedValuesInput: FormControl = new FormControl();

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
            console.log('%cformGroup', 'font-weight: bold;', this.formGroup);
        console.groupEnd();

        // preset whether the item is disabled or not
        this._itemDisabled = !(this.formGroup.get('enabled').value);

        // listen for changes for enabled, and modify flag
        this.enabledSub = this.formGroup.get('enabled').valueChanges.subscribe(val => {
            // console.log('ENABLED VAL', val);
            this._itemDisabled = !val;
        });

        this.filteredKeyOptions = this.tagk.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterTagKeyOptions(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );

        this.filteredValueOptions = this.allowedValuesInput.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterTagValueOptions(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );

    }

    get tagk() { return this.formGroup.get('tagk'); }
    get alias() { return this.formGroup.get('alias'); }
    get enabled() { return this.formGroup.get('enabled'); }
    get allowedValues() { return this.formGroup.get('allowedValues'); }
    get filter() { return this.formGroup.get('filter'); }
    get type() { return this.formGroup.get('type'); }

    get chipValues() { return this.allowedValues['controls']; }

    ngOnDestroy() {
        this.enabledSub.unsubscribe();
    }

    // removes the entire form group
    removeItem() {
        this.remove.emit(this.formGroupName);
    }

    // remove a filter value option
    removeValue(i: number) {
        const control = <FormArray>this.allowedValues;
        control.removeAt(i);
    }

    // add a filter value option
    addValue(event: any) {
        if (!this.valueAutocomplete.isOpen) {
            const input = event.input;
            const value = event.value;

            // Add our value
            if ((value || '').trim()) {
              this.createAllowedValue(value.trim());
            }

            // Reset the input value
            if (input) {
              input.value = '';
            }

            this.allowedValuesInput.setValue('');
        }
    }

    /** Auto Complete Functions */

    selectFilterKeyOption(event: any) {
        this.tagk.setValue(event.option.value);
    }

    selectFilterValueOption(event: any) {
        //
        this.createAllowedValue(event.option.value);
        this.filterValueInput.nativeElement.value = '';
        this.allowedValuesInput.setValue('');
    }


    /** private functions */

    private createAllowedValue(val: string) {
        const control = <FormArray>this.allowedValues;
        control.push(new FormControl(val));
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

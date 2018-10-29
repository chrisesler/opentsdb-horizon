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
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete, MatMenu, MatMenuTrigger } from '@angular/material';

import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'variable-selector',
    templateUrl: './variable-selector.component.html',
    styleUrls: []
})
export class VariableSelectorComponent implements OnInit, OnDestroy {

    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.variable-selector') private _hostClass: boolean = true;

    @ViewChild(MatMenu) valueMenu: MatMenu;
    @ViewChild(MatMenuTrigger) valueMenuTrigger: MatMenuTrigger;
    // tslint:disable-next-line:no-inferrable-types
    valueMenuOpen: boolean = false;

    @Input() formGroup: FormGroup;
    @Input() formGroupName: number;

    /** form variables */
    separatorKeysCodes: number[] = [ENTER, COMMA];
    addOnBlur = true;

    filterValueInput: FormControl = new FormControl('');

    filteredValueOptions: Observable<string[]>;

    @ViewChild('filterValueInputEl') filterValueInputEl: ElementRef<HTMLInputElement>;
    @ViewChild('filterValueAuto') valueAutocomplete: MatAutocomplete;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        console.group('%cVARIABLE SELECTOR', 'color: white; background: black; padding: 2px 4px;');
            const keys = Object.keys(this.formGroup['controls']);
            for (const key of keys) {
                console.log('%c' + key + ':', 'font-weight: bold;', this.formGroup['controls'][key].value);
            }
            console.log('%cformGroup', 'font-weight: bold;', this.formGroup);
        console.groupEnd();

        this.filteredValueOptions = this.filterValueInput.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterValueOptions(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );
    }

    ngOnDestroy() {
    }

    /** FORM ACCESSORS */
    get tagk() { return this.formGroup.get('tagk'); }
    get alias() { return this.formGroup.get('alias'); }
    get allowedValues() { return this.formGroup.get('allowedValues'); }
    get filter() { return this.formGroup.get('filter'); }

    get chipValues() { return this.filter['controls']; }

    // helpers
    get label() {
        const alias = this.alias.value;
        const key = this.tagk.value;

        if (alias.trim().length > 0) {
            return alias.trim();
        } else {
            return key.trim();
        }
    }


    /** AUTO COMPLETE FUNCTIONS */

    selectFilterValueOption(event: any) {
        //
        this.createSelectedValue(event.option.value);
        this.filterValueInputEl.nativeElement.value = '';
        this.filterValueInput.setValue('');
    }

    // remove a filter value option
    removeValue(i: number) {
        const control = <FormArray>this.filter;
        control.removeAt(i);
    }

    // add a filter value option
    addValue(event: any) {
        if (!this.valueAutocomplete.isOpen) {
            const input = event.input;
            const value = event.value;

            // Add our value
            if ((value || '').trim()) {
              this.createSelectedValue(value.trim());
            }

            // Reset the input value
            if (input) {
              input.value = '';
            }

            this.filterValueInput.setValue('');
        }
    }

    /** menu trigger events */
    toggleValueMenuOpen() {
        console.log('TOGGLE VALUE MENU OPEN', this.valueMenuTrigger.menuOpen);
        this.valueMenuOpen = this.valueMenuTrigger.menuOpen;
    }


    /** PRIVATE FUNCTIONS */
    private createSelectedValue(val: string) {
        const control = <FormArray>this.filter;
        control.push(new FormControl(val));
    }

    private filterValueOptions(val: string) {
        console.log('FILTER VALUE OPTIONS', val, this.allowedValues.value);

        // TODO: Need to add a way to do a global value search if there are no allowed values or wildcard value
        return this.allowedValues.value.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

}

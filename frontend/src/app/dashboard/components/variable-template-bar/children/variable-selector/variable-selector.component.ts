import { COMMA, ENTER } from '@angular/cdk/keycodes';

import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    HostBinding,
    ViewChild,
    ElementRef
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { MatAutocomplete, MatMenu, MatMenuTrigger, MatAutocompleteTrigger } from '@angular/material';

import { Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

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
    filterValueInputSub: Subscription;

    filteredValueOptions: string[];

    @ViewChild('filterValueInputEl', { read: MatAutocompleteTrigger }) valueTrigger: MatAutocompleteTrigger; 
    @ViewChild('filterValueInputEl') filterValueInputEl: ElementRef<HTMLInputElement>;
    @ViewChild('filterValueAuto') valueAutocomplete: MatAutocomplete;

    private listenSub: Subscription; // intercom subscription
    // tslint:disable-next-line:no-inferrable-types
    private expectingIntercomData: boolean = false;

    constructor(
        private fb: FormBuilder,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
            //console.group('%cVARIABLE SELECTOR', 'color: white; background: black; padding: 2px 4px;');
            const keys = Object.keys(this.formGroup['controls']);
            /* for (const key of keys) {
                console.log('%c' + key + ':', 'font-weight: bold;', this.formGroup['controls'][key].value);
            }*/
        this.filterValueInputSub = this.filterValueInput.valueChanges
            .pipe(debounceTime(300))
            .subscribe(val => {
                if (this.allowedValues.value.length > 0) {
                    this.filteredValueOptions = this.allowedValues.value.filter(option => {
                        return option.toLowerCase().includes(val.toLowerCase());
                    });
                    this.filterDownFilterOptions(this.filter.value);
                } else {
                    // console.log('*** ', val);
                    this.expectingIntercomData = true;
                    let payload = '.*';
                    if (val.trim().length > 0) {
                        payload += val + '.*';
                    }
                    this.interCom.requestSend(<IMessage>{
                        action: 'getTagValues',
                        id: 'variable-selector-' + this.formGroupName,
                        payload: {
                            tag : {
                                key: this.tagk.value.trim(),
                                value:  payload
                            }
                        }
                    });
                }
            });

        // listen to intercom
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message.action === 'TagValueQueryResults' && this.expectingIntercomData) {
                //console.log('%cTAG VALUES ResponseGet [InterCom]',
                //        'color: white; background-color: darkmagenta; padding: 2px 4px;',
                //        message);
                this.expectingIntercomData = false;
                this.filteredValueOptions = message.payload;
                this.filterDownFilterOptions(this.filter.value);
            }
        });
    }

    ngOnDestroy() {
        this.filterValueInputSub.unsubscribe();
        this.listenSub.unsubscribe();
    }

    onInputFocus(e: any) {
        this.valueTrigger._onChange('');
        this.valueTrigger.openPanel();
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
        this.createSelectedValue(event.option.value);
        this.filterValueInputEl.nativeElement.value = '';
        this.filterValueInput.setValue('');

    }
    // exclude selected value of this filteredValueOptions
    filterDownFilterOptions(vals: string[]) {
        this.filteredValueOptions = this.filteredValueOptions.filter(item => {
            return !this.filter.value.includes(item);
        });
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
        //console.log('TOGGLE VALUE MENU OPEN', this.valueMenuTrigger.menuOpen);
        this.valueMenuOpen = this.valueMenuTrigger.menuOpen;
    }


    /** PRIVATE FUNCTIONS */
    private createSelectedValue(val: string) {
        // should not add this val if they are in the list already
        const control = <FormArray>this.filter;
        control.push(new FormControl(val));
    }
}

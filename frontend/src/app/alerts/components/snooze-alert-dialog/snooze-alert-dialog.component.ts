
import {
    Component,
    OnInit,
    OnDestroy,
    Inject,
    HostBinding,
    ViewChild
} from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import {COMMA, ENTER} from '@angular/cdk/keycodes';

import {MatChipInputEvent} from '@angular/material';

import { FormBuilder, FormGroup, FormControl, Validators, FormArray, FormGroupDirective } from '@angular/forms';

import { Subscription, Observable } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'snooze-alert-dialog',
    templateUrl: './snooze-alert-dialog.component.html',
    styleUrls: []
})
export class SnoozeAlertDialogComponent implements OnInit {

    @HostBinding('class.snooze-alert-dialog-component') private _hostclass = true;

    @ViewChild('formDirective', {read: FormGroupDirective}) formDirective: FormGroupDirective;


    /** Form variables */
    snoozeForm: FormGroup;

    // options for various suggestions
    groupOptions = [];
    filteredGroupOptions: Observable<any[]>;

    contactOptions = [];
    filteredContactOptions: Observable<any[]>;

    presetOptions: any[] = ['1hr', '6hr', '12h', '1d', '2d', '1w'];

    presetChangeSub: Subscription;

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    groupsValueInput: FormControl = new FormControl();
    contactsValueInput: FormControl = new FormControl();

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<SnoozeAlertDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dbData: any,
    ) { }

    ngOnInit() {
        this.snoozeForm = this.fb.group({
            preset: '',
            custom: this.fb.group({
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: ''
            }),
            groups: this.fb.array([]),
            contacts: this.fb.array([]),
            message: ''
        });

        this.presetChangeSub = this.snoozeForm.get('preset').valueChanges.subscribe(val => {
            // console.log('%cSNOOZE FORM PRESET [CHANGES]', 'background-color: skyblue; padding: 2px 4px;', val);

        });

        this.snoozeForm.valueChanges.subscribe(val => {
            // console.log('SNOOZE FORM CHANGE', val);
        });
    }

    /** form helpers */

    get form() {
        return this.snoozeForm.controls;
    }

    get custom() {
        return this.form.custom['controls'];
    }

    get groupsValues() { return this.form.groups['controls']; }

    get contactValues() { return this.form.contacts['controls']; }

    /** events */

    presetTypeChange(event: any) {
        // console.log('PRESET TYPE CHANGE', event);
        this.snoozeForm.get('preset').setValue(event.value);
    }

    addGroupItem(event: any) {
        // console.log('ADD GROUP ITEM', event);

        const input = event.input;
        const value = event.value;

        // Add our value
        if ((value || '').trim()) {
            this.createGroupItemValue({name: value.trim()});
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }

        // clear formControl input value
        this.groupsValueInput.setValue('');
    }

    removeGroupItem(i: number) {
        // console.log('REMOVE GROUP ITEM', i);
        const control = <FormArray>this.snoozeForm.get('groups');
        control.removeAt(i);
    }

    addContactItem(event: any) {
        // console.log('ADD GROUP ITEM', event);

        const input = event.input;
        const value = event.value;

        // Add our value
        if ((value || '').trim()) {
            this.createContactItemValue({email: value.trim()});
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }

        // clear formControl input value
        this.contactsValueInput.setValue('');
    }

    removeContactItem(i: number) {
        // console.log('REMOVE GROUP ITEM', i);
        const control = <FormArray>this.snoozeForm.get('contacts');
        control.removeAt(i);
    }

    /** actions */

    saveSnooze() {
        if (!this.snoozeForm.valid) {
            // form not good
        } else {
            // form is good, save it
            const data: any = { };
            // do something with form data here

            // send data back to whoever called it (most likely alerts.component)
            this.dialogRef.close(data);
        }
    }

    resetForm() {
        this.snoozeForm.reset();
        this.formDirective.reset();

        this.snoozeForm.controls.groups = this.fb.array([]);
        this.snoozeForm.controls.contacts = this.fb.array([]);
    }

    /** privates */

    private createGroupItemValue(val: any) {
        const control = <FormArray>this.snoozeForm.get('groups');
        control.push(new FormControl(val));
    }

    private createContactItemValue(val: any) {
        const control = <FormArray>this.snoozeForm.get('contacts');
        control.push(new FormControl(val));
    }

}

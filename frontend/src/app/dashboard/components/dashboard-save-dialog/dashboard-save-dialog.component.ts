import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    Inject,
    EventEmitter,
    HostBinding
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-save-dialog',
    templateUrl: './dashboard-save-dialog.component.html',
    styleUrls: []
})
export class DashboardSaveDialogComponent implements OnInit, OnDestroy {

    @HostBinding('class.dashboard-save-dialog') private _hostClass = true;

    selectedNamespace: String | null;

    // FAKE DATA
    fakeNamespaceOptions = [
        'FLICKR',
        'FLURRY',
        'MAIL',
        'MAIL-JEDI',
        'UDB',
        'UDS',
        'YAMAS',
    ];
    filteredNamespaceOptions: Observable<string[]>;

    /** Form Variables */

    saveForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<DashboardSaveDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dbData: any
    ) { }

    ngOnInit() {
        this.saveForm = this.fb.group({
            title: new FormControl(this.dbData.title, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
            namespace: new FormControl(this.dbData.namespace, [Validators.required]),
            isPersonal: this.dbData.isPersonal
        });

        this.filteredNamespaceOptions = this.namespace.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterNamespace(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );
    }

    // form accessors should come after form initialized in ngOnInit
    get title() { return this.saveForm.get('title'); }
    get namespace() { return this.saveForm.get('namespace'); }
    get isPersonal() { return this.saveForm.get('isPersonal'); }

    ngOnDestroy() {
    }

    /** PERSONAL USE CHECKED */
    personalUseChecked(e: any) {
        console.log('%cPERSONAL USE CHECKBOX [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;', e, this.isPersonal);
        if (e.checked) {
            this.namespace.disable(); // disable namespace control
            this.namespace.clearValidators(); // remove namespace validators, so it doesn't block submission
        } else {
            this.namespace.enable(); // enable namespace control
            this.namespace.setValidators([Validators.required]); // add namespace validators
        }
    }

    /** NAMESPACE EVENTS */

    filterNamespace(val: string): string[] {
        return this.fakeNamespaceOptions.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

    /**
     * * If user hits enter, the input is valid and that option must exist in the list
     * * Is this still necessary?
     */
    namespaceKeydown(event: any) {
        // this.filterNamespace(this.namespace.value);
        if (this.namespace.valid && this.fakeNamespaceOptions.includes(this.namespace.value)) {
            this.selectedNamespace = this.namespace.value;
        }
    }
    /**
     * * Event fired when an autocomplete option is selected
     */
    namespaceOptionSelected(event: any) {
        this.namespace.setValue(event.option.value);
        this.selectedNamespace = event.option.value;
    }

    /** SAVE BUTTON */

    saveDashboardAction() {
        console.log('%cSAVE DASHBOARD [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;');
        if (!this.saveForm.valid) {
            // form not good
            console.log('%cSAVE DASHBOARD [NOT VALID]', 'color: #ffffff; background-color: red; padding: 2px 4px;', this.saveForm);
        } else {
            // form is good, save it
            console.log('%cSAVE DASHBOARD [VALID]', 'color: #ffffff; background-color: green; padding: 2px 4px;', this.saveForm);

            const dataReturn = {
                title: this.title.value,
                namespace: this.namespace.value,
                isPersonal: this.isPersonal.value
            };

            this.dialogRef.close(dataReturn);
        }
    }
}

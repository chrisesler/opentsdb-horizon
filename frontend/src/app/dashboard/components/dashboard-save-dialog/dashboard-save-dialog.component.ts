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
import { IntercomService, IMessage } from '../../../core/services/intercom.service';


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
    namespaceOptions = [
        /*
        'FLICKR',
        'FLURRY',
        'MAIL',
        'MAIL-JEDI',
        'UDB',
        'UDS',
        'YAMAS',
        */
    ];
    filteredNamespaceOptions: Observable<any[]>;

    /** Form Variables */

    saveForm: FormGroup;
    listenSub: Subscription;
    error: any;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<DashboardSaveDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dbData: any,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
        this.saveForm = this.fb.group({
            title: new FormControl(this.dbData.title, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]),
            namespace: new FormControl ( { value: this.dbData.namespace, disabled: this.dbData.isPersonal }),
            isPersonal: this.dbData.isPersonal
        });

        this.filteredNamespaceOptions = this.namespace.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                map(val => this.filterNamespace(val)) // autosuggest options shuld come from somewhere else. Currently fake data
            );

        this.interCom.requestSend(<IMessage> {
            action: 'getUserNamespaces',
            payload: {}
        });
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch ( message.action ) {
                case 'UserNamespaces':
                    console.log("save dialog on listen", message, this.namespace);
                    this.namespaceOptions = message.payload;
                    break;
            }
        });
    }

    // form accessors should come after form initialized in ngOnInit
    get title() { return this.saveForm.get('title'); }
    get namespace() { return this.saveForm.get('namespace'); }
    get isPersonal() { return this.saveForm.get('isPersonal'); }

    ngOnDestroy() {
        this.listenSub.unsubscribe();
    }

    /** PERSONAL USE CHECKED */
    personalUseChecked(e: any) {
        console.log('%cPERSONAL USE CHECKBOX [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;', e, this.isPersonal);
        if (e.checked) {
            this.namespace.disable(); // disable namespace control
        } else {
            this.namespace.enable(); // enable namespace control
        }
    }

    /** NAMESPACE EVENTS */

    filterNamespace(val: string): string[] {
        return this.namespaceOptions.filter(option => {
            return option.name.toLowerCase().includes(val.toLowerCase());
        });
    }

    /**
     * * If user hits enter, the input is valid and that option must exist in the list
     * * Is this still necessary?
     */
    namespaceKeydown(event: any) {
        // this.filterNamespace(this.namespace.value);
        if (this.namespace.valid && this.namespaceOptions.includes(this.namespace.value)) {
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

    isValidNamespaceSelected() {
        if ( this.namespace.status === 'DISABLED' ) {
             return true;
        }
        const namespace = this.namespace.value.trim();
        const errors: any = {};
        console.log(namespace, this.namespaceOptions.findIndex(d => namespace === d.name ));
        if ( namespace === '') {
            errors.required = true;
        }
        if ( namespace && this.namespaceOptions.findIndex(d => namespace === d.name ) === -1 ) {
            errors.invalid = true;
        }
        this.namespace.setErrors(Object.keys(errors).length ? errors : null);
        console.log(this.namespace);

        return Object.keys(errors).length === 0 ? true : false;
    }
    /** SAVE BUTTON */

    saveDashboardAction() {
        console.log('%cSAVE DASHBOARD [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;');
        if (!this.saveForm.valid) {
            // form not good
            console.log('%cSAVE DASHBOARD [NOT VALID]', 'color: #ffffff; background-color: red; padding: 2px 4px;', this.saveForm);
        } else if ( this.isValidNamespaceSelected() ) {
            // form is good, save it
            console.log('%cSAVE DASHBOARD [VALID]', 'color: #ffffff; background-color: green; padding: 2px 4px;', this.saveForm);

            const data: any = {
                title: this.title.value,
                isPersonal: this.isPersonal.value
            };

            if ( !this.isPersonal.value ) {
                data.namespace = this.namespace.value;
            }

            console.log("return data", data);
            this.dialogRef.close(data);
        }
    }
}

import {
    Component,
    OnInit,
    OnDestroy,
    Inject,
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

    namespaceOptions = [];
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
                map(val => this.filterNamespace(val))
            );

        this.interCom.requestSend(<IMessage> {
            action: 'getUserNamespaces',
            payload: {}
        });
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch ( message.action ) {
                case 'UserNamespaces':
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

    personalUseChecked(e: any) {
        if (e.checked) {
            this.namespace.disable(); // disable namespace control
        } else {
            this.namespace.enable(); // enable namespace control
        }
    }

    filterNamespace(val: string): string[] {
        return this.namespaceOptions.filter(option => {
            if(val === '') {
                return option.name;
            } else {
                return option.name.toLowerCase().includes(val.toLowerCase());
            }
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
        //console.log(namespace, this.namespaceOptions.findIndex(d => namespace === d.name ));
        if ( namespace === '') {
            errors.required = true;
        }
        if ( namespace && this.namespaceOptions.findIndex(d => namespace === d.name ) === -1 ) {
            errors.invalid = true;
        }
        this.namespace.setErrors(Object.keys(errors).length ? errors : null);
        //console.log(this.namespace);

        return Object.keys(errors).length === 0 ? true : false;
    }
    /** SAVE BUTTON */
    saveDashboardAction() {
        if (!this.saveForm.valid) {
            // form not good
        } else if ( this.isValidNamespaceSelected() ) {
            // form is good, save it
            const data: any = { name: this.title.value}; 
            if ( !this.isPersonal.value ) {
                // find the alias to build parentPath not the name
                let alias = '';
                for (let i =0; i < this.namespaceOptions.length; i++) {
                    if (this.namespaceOptions[i].name === this.namespace.value) {
                        alias = this.namespaceOptions[i].alias;
                        break;
                    }
                }
                data.parentPath = '/namespace/' + alias;
            }
            this.dialogRef.close(data);
        }
    }
}

import {
    Component,
    OnInit,
    OnDestroy,
    HostBinding,
    EventEmitter,
    Input,
    Output,
    ViewChild,
    ElementRef
} from '@angular/core';
import { MatInput } from '@angular/material';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dbs-meta',
    templateUrl: './dbs-meta.component.html',
    styleUrls: []
})
export class DbsMetaComponent implements OnInit, OnDestroy {

    @HostBinding('class.dbs-meta-component') private _hostClass = true;
    @HostBinding('class.dbs-settings-tab') private _tabClass = true;

    /** Inputs */
    @Input() dbData: any = {};

    /** Outputs */
    @Output() dataModified: any = new EventEmitter();

    /** Local Variables */
    metaForm: FormGroup;
    metaFormSub: Subscription;

    @ViewChild('newLabelInput') newLabelInput: ElementRef;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {

        this.metaForm = this.fb.group({
            title: new FormControl(this.dbData.meta.title),
            namespace: new FormControl(this.dbData.meta.namespace),
            isPersonal: new FormControl(this.dbData.meta.isPersonal),
            description: new FormControl(this.dbData.meta.description),
            labels: this.fb.array([])
        });

        this.metaFormSub = this.metaForm.valueChanges.subscribe(val => {
            console.log('%cMETA FORM [CHANGES]', 'background-color: skyblue; padding: 2px 4px;', val);
            this.dataModified.emit({
                type: 'meta',
                data: val
            });
        });

        this.intializeLabels(this.dbData.meta.labels);

    }

    get title() { return this.metaForm.get('title'); }
    get namespace() { return this.metaForm.get('namespace'); }
    get isPersonal() { return this.metaForm.get('isPersonal'); }
    get description() { return this.metaForm.get('description'); }
    get labels() { return this.metaForm.get('labels'); }

    ngOnDestroy() {
        this.metaFormSub.unsubscribe();
    }

    intializeLabels(values: any) {
        const control = <FormArray>this.metaForm.controls['labels'];

        for (const item of values) {
            control.push(this.fb.group(item));
        }

        console.log('%cMETA CONTROLS', 'background-color: skyblue; padding: 2px 4px;', this.metaForm);
    }


    /**
     * Click event for the 'plus' sign in the label input
     */
    addNewLabel(e: any) {
        console.log('ADD NEW LABEL', e);
        const labelValue = this.newLabelInput.nativeElement.value;
        this.addDbLabel(labelValue);
        this.newLabelInput.nativeElement.value = '';
    }

    /**
     * Method to push an item in the form labels array
     */
    addDbLabel(label: any) {
        const control = <FormArray>this.metaForm.controls['labels'];
        control.push(this.fb.group({ label: label }));
    }

    /**
     * method to remove item from form labels array
     */
    removeDbLabel(i: number) {
        // remove address from the list
        const control = <FormArray>this.metaForm.controls['labels'];
        control.removeAt(i);
    }

}

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
    @Output() dataUpdated: any = new EventEmitter();

    /** Local Variables */
    metaForm: FormGroup;
    metaFormSub: Subscription;

    title: FormControl;
    description: FormControl;
    labels: FormArray;

    @ViewChild('newLabelInput') newLabelInput: ElementRef;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {

        this.metaForm = this.fb.group({
            title: new FormControl(this.dbData.meta.title),
            description: new FormControl(this.dbData.meta.description),
            labels: this.fb.array([])
        });

        this.intializeLabels(this.dbData.meta.labels);

    }

    ngOnDestroy() {
        // this.metaFormSub.unsubscribe();
    }

    intializeLabels(values: any) {
        const control = <FormArray>this.metaForm.controls['labels'];

        for (const item of values) {
            control.push(this.fb.group(item));
        }

        console.log('%cMETA CONTROLS', 'color: red; font-weight: bold;', this.metaForm);
    }


    /**
     * Click event for the 'plus' sign in the label input
     */
    addNewLabel(e: any) {
        console.log('ADD NEW LABEL', e);
        const labelValue = this.newLabelInput.nativeElement.value;
        this.addDbLabel(labelValue);
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

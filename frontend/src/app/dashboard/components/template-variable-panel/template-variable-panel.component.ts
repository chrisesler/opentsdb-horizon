import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, debounceTime, skip } from 'rxjs/operators';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'template-variable-panel',
    templateUrl: './template-variable-panel.component.html',
    styleUrls: []
})
export class TemplateVariablePanelComponent implements OnInit {

    @HostBinding('class.template-variable-panel-component') private _hostClass = true;

    @Input() tplVariables: any;
    @Input() mode: string;
    @Output() variableChanges: EventEmitter<any> = new EventEmitter<any>();
    @Input() dbTagKeys: string[] = []; // all available tags from dashboard

    editForm: FormGroup;
    editFormSub: Subscription;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: Observable<string[]>; // options for value autosuggest
    fileredValues: string[];
    prevSelectedTagk = '';
    disableDone = false;

    constructor (private fb: FormBuilder, private interCom: IntercomService ) { }

    ngOnInit() {

        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message.action === 'dashboardTagValues') {
                this.filteredValueOptions = message.payload;
                this.fileredValues = message.payload;
            }
        });
    }

    doEdit() {
        this.mode = 'edit';
        this.initEditFormGroup();
        console.log('this tplVariables', this.tplVariables);
        this.interCom.requestSend({
            action: 'getDashboardTags',
        });
    }
    initEditFormGroup() {
        this.editForm = this.fb.group({
            formTplVariables: this.fb.array([])
        });
        this.initializeTplVariables(this.tplVariables);
        // we sub to form status changes
        this.editForm.statusChanges.subscribe(status => {
            console.log(' call this status', this.formTplVariables.controls.length, status);
            this.disableDone = status === 'VALID' ? false : true;
            const len = this.formTplVariables.controls.length;
            if (status === 'INVALID') {
                for (let i = 0; i < len - 1; i++) {
                    const invalid = this.formTplVariables.controls[i].invalid;
                    // one of them is invalid
                    if (invalid) {
                        this.disableDone = true;
                        return;
                    }
                }
                // if all pass then check the last item, since we allow it can be all empty
                const lastItem = this.formTplVariables.controls[len - 1];
                console.log('this last item', lastItem);
                if (lastItem && lastItem['controls']['alias'].value === '' && lastItem['controls']['tagk'].value === '') {
                    this.disableDone = false;
                }
            }
        });
    }
    get formTplVariables() { return this.editForm.get('formTplVariables') as FormArray; }

    initializeTplVariables(values: any) {
        console.log('values tplVariables', values);
        if (values.length === 0) {
            // add an empty one if there are no values
            this.addVariableTemplate();
        } else {
            for (const item of values) {
                this.addVariableTemplate(item);
            }
        }
    }

    addVariableTemplate(data?: any) {
        data = (data) ? data : {};
        const varData = {
            tagk: new FormControl((data.tagk) ? data.tagk : '', [Validators.required]),
            alias: new FormControl((data.alias) ? data.alias : '', [Validators.required]),
            filter: new FormControl((data.filter) ? data.filter : '', [])
        };
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.push(this.fb.group(varData));
    }

    onInputFocus(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const startVal = selControl['controls'][cname].value;
        // have to call this when value not change yet
        // this.validateAlias(startVal, index , selControl);
        // clear previous filters values incase take sometime to populate new one
        this.filteredValueOptions = null;
        this.filteredKeyOptions = selControl['controls'][cname].valueChanges
           .pipe (
                startWith(''),
                debounceTime(100),
                map(val => this._filter(val.toString(), cname, selControl, index)));
    }
    private getSelectedControl(index: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        return control.at(index);
    }
    private _filter(val: string, flag: string, selControl: any, index: number): string[] {
        // console.log('call here', this.dbTagKeys, val, flag, selControl);
        const filterVal = val.toLowerCase();
        if (flag === 'tagk') {
            // console.log('doing filter', filterVal);
            return this.dbTagKeys.filter(key => key.toLowerCase().includes(filterVal));
        } else if (flag === 'filter') {
            let payload = '.*';
            if (val.trim().length > 0) {
                payload += val + '.*';
            }
            if (selControl['controls'].tagk.value.trim() !== '') {
                this.interCom.requestSend(<IMessage>{
                    action: 'getTagValues',
                    id: flag,
                    payload: {
                        tag: {
                            key: selControl['controls'].tagk.value.trim(),
                            value: payload
                        }
                    }
                });
            }
        } else {
            // case of alias
            this.validateAlias(val, index, selControl);
        }
    }
    private validateAlias(val: string, index: number, selControl: any) {
        // const selControl = this.getSelectedControl(index);
        // check uniuq of alias
        const tplFormGroups = this.editForm.controls['formTplVariables']['controls'];
        if (tplFormGroups.length > 1 || val.trim() === '') {
            for (let i = 0; i < tplFormGroups.length; i++) {
                if (i === index) { continue; }
                const rowControl = tplFormGroups[i]['controls'];
                // console.log('val:', val, 'row:' + rowControl['alias'].value);
                if (val.trim() !== '' && val === rowControl['alias'].value) {
                    tplFormGroups[index].controls['alias'].setErrors({ 'unique': true });
                    tplFormGroups[i].controls['alias'].setErrors({ 'unique': true });
                } else {
                    tplFormGroups[i]['controls']['alias'].setErrors(null);
                    this.updateState(selControl);
                }
            }
        }
    }

    onInputBlur(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const val = selControl['controls'][cname].value;
        // when user type in and click select and if value is not valid, reset
        if (cname === 'tagk' && this.dbTagKeys.indexOf(val) === -1) {
            selControl['controls'][cname].setValue('');
            selControl['controls']['filter'].setValue('');
        } else {
            this.prevSelectedTagk = val;
        }
        if (cname === 'filter' &&  val  && this.fileredValues.indexOf(val) === -1) {
            selControl['controls'][cname].setValue('');
        }
    }

    // update state if it's is valid
    selectTagKeyOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        if (event.option.value !== this.prevSelectedTagk) {
            selControl['controls']['filter'].setValue('');
        }
        this.updateState(selControl);
    }
    // update state if it's is valid
    selectFilterValueOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        this.updateState(selControl);
    }

    removeTemplateVariable(index: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        const removedItem = control.at(index);
        control.removeAt(index);
        if (removedItem.valid) {
            this.updateState(removedItem);
        }

    }
    done() {
        // just as close the panel to list mode
        this.mode = 'view';
    }

    updateState(selControl: AbstractControl) {
        if (selControl.valid) {
            const sublist = [];
            for (let i = 0; i < this.formTplVariables.controls.length; i++) {
                if (this.formTplVariables.controls[i].valid) {
                    sublist.push(this.formTplVariables.controls[i].value);
                }
            }
            console.log('sublist', sublist);
            if (sublist.length > 0) {
                this.interCom.requestSend({
                    action: 'updateTemplateVariables',
                    payload: {
                        variables: sublist
                    }
                });
            }
        }
    }
}

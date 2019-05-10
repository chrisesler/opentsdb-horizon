import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
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
    selectedTagk = '';

    constructor (private fb: FormBuilder, private interCom: IntercomService ) { }

    ngOnInit() {
        if (this.mode === 'edit') {
            this.initEditFormGroup();
        }
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message.action === 'TagValueQueryResults') {
                this.filteredValueOptions = message.payload;
            }
        });
    }

    doEdit() {
        this.mode = 'edit';
        this.initEditFormGroup();
        // here we will request for getting dashboard tag
    }

    done(formTplVariables: any) {
        const sublist = [];
        for (let i = 0; i < formTplVariables.controls.length; i++) {
            console.log(formTplVariables.controls[i].value);
            sublist.push(formTplVariables.controls[i].value);
        }
        console.log('sublist', sublist);
        if (sublist.length > 0) {
            this.interCom.requestSend(<IMessage> {
                id: 'variableToolBar',
                action: 'updateDashboardSettings',
                payload: {
                    variables: sublist
                }
            });
        }
        // this.mode = 'view';
    }
    whatthe(tpl: any) {
        console.log('SSJSJSJ', tpl);
    }
    onInputFocus(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const startVal = selControl['controls'][cname].value;
        // have to call this when value not change yet
        this.validateAlias(startVal, index , selControl);
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
        console.log('call here', this.dbTagKeys, val, flag, selControl);
        const filterVal = val.toLowerCase();
        if (flag === 'tagk') {
                console.log('doing filter', filterVal);
            return this.dbTagKeys.filter(key => key.toLowerCase().includes(filterVal));
        } else if (flag === 'filter') {
            let payload = '.*';
            if (val.trim().length > 0) {
                payload += val + '.*';
            }
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
        } else {
            // case of alias
            this.validateAlias(val, index , selControl);
        }
    }
    private validateAlias(val: string, index: number, selControl: any) {
        // const selControl = this.getSelectedControl(index);
        // check uniuq of alias
        const tplFormGroups = this.editForm.controls['formTplVariables']['controls'];
        if (tplFormGroups.length > 1 || val.trim() === '') {
            for (let i = 0; i < tplFormGroups.length; i++) {
                if (i === index) { console.log('the index', index, i); continue; }
                const rowControl = tplFormGroups[i]['controls'];
                console.log('val:', val, 'row:' + rowControl['alias'].value);
                if (val.trim() !== '' && val === rowControl['alias'].value) {
                    tplFormGroups[index].controls['alias'].setErrors({ 'unique': true });
                    tplFormGroups[i].controls['alias'].setErrors({ 'unique': true });
                } else {
                    tplFormGroups[i]['controls']['alias'].setErrors(null);
                }
            }
        }
    }

    onInputBlur(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const val = selControl['controls'][cname].value;
        this.selectedTagk = val;
        // for tagk and filter, if not value on list then reset value
        if (this.dbTagKeys.indexOf(val) === -1) {
            selControl['controls'][cname].setValue('');
        }
    }

    selectFilterKeyOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        if (event.option.value !== this.selectedTagk) {
            selControl['controls']['filter'].setValue('');
        }
    }
    initEditFormGroup() {
        this.editForm = this.fb.group({
            formTplVariables: this.fb.array([])
        });
        this.initializeTplVariables(this.tplVariables);
    }

    // form control accessors (come after form has been setup)
    get formTplVariables() { return this.editForm.get('formTplVariables'); }

    initializeTplVariables(values: any) {

        if (values.length === 0) {
            // add an empty one if there are no values
            this.addVariableTemplate();
        } else {
            // this.selectedKeys = [];
            for (const item of values) {
                // this.selectedKeys.push(item.tagk);
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

    removeTemplateVariable(i: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.removeAt(i);
    }
}

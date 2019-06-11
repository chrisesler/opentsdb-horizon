import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { UtilsService } from '../../../core/services/utils.service';
import { DashboardService } from '../../services/dashboard.service';
import { HttpService } from '../../../core/http/http.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'template-variable-panel',
    templateUrl: './template-variable-panel.component.html',
    styleUrls: []
})
export class TemplateVariablePanelComponent implements OnInit, OnChanges {

    @HostBinding('class.template-variable-panel-component') private _hostClass = true;

    @Input() tplVariables: any[];
    @Input() mode: any;
    @Output() variableChanges: EventEmitter<any> = new EventEmitter<any>();
    @Input() dbTagKeys: any; // all available tags and widget tags from dashboard
    @Input() widgets: any[];

    editForm: FormGroup;
    listForm: FormGroup;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    // filteredValueOptions: Observable<string[]>; // options for value autosuggest
    filteredValues: string[];
    prevSelectedTagk = '';
    disableDone = false;
    effectedWidgets: any = {};
    constructor (
        private fb: FormBuilder, 
        private interCom: IntercomService,
        private dbService: DashboardService,
        private utils: UtilsService,
        private httpService: HttpService ) { }

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.tplVariables) {
            this.initListFormGroup();
        }
    }
    doEdit() {
        this.mode = { view: false};
        this.initEditFormGroup();
        this.interCom.requestSend({ action: 'getDashboardTags'});
    }
    initListFormGroup() {
        this.listForm = this.fb.group({
            listVariables: this.fb.array([])
        });
        for (const data of this.tplVariables) {
            const vardata = {
                tagk: new FormControl((data.tagk) ? data.tagk : '', []),
                alias: new FormControl((data.alias) ? data.alias : '', []),
                filter: new FormControl((data.filter) ? data.filter : '', [])
            };
            const control = <FormArray>this.listForm.controls['listVariables'];
            control.push(this.fb.group(vardata));
        }
    }

    initEditFormGroup() {
        this.editForm = this.fb.group({
            formTplVariables: this.fb.array([])
        });
        this.initializeTplVariables(this.tplVariables);
        // we sub to form status changes
        this.editForm.statusChanges.subscribe(status => {
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
                if (lastItem && lastItem['controls']['alias'].value === '' && lastItem['controls']['tagk'].value === '') {
                    this.disableDone = false;
                }
            }
        });
    }
    get listVariables() { return this.listForm.get('listVariables') as FormArray; }
    get formTplVariables() { return this.editForm.get('formTplVariables') as FormArray; }

    initializeTplVariables(values: any) {
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
        data = (data) ? data : { applied: 0};
        const varData = {
            tagk: new FormControl((data.tagk) ? data.tagk : '', [Validators.required]),
            alias: new FormControl((data.alias) ? data.alias : '', [Validators.required]),
            filter: new FormControl((data.filter) ? data.filter : '', [])
        };
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.push(this.fb.group(varData));
    }

    onVariableFocus(index: number) {
        this.filteredValues = [];
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        selControl.get('filter').valueChanges
        .pipe(
            startWith(''),
            debounceTime(300),
        ).subscribe(val => {
            this.getTagValues(val.toString(), selControl);
        });
    }

    onVariableBlur(event: any, index: number) {
        const cpFilterValues = [...this.filteredValues];
        this.filteredValues = [];
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        if (event.relatedTarget && event.relatedTarget.className === 'mat-option ng-star-inserted') {
            selControl['controls'].filter.setValue(event.relatedTarget.innerText.trim(), { emitEvent: false });
        } else {
            const val = selControl['controls'].filter.value;
            // error when the val is empty
            const idx = cpFilterValues.findIndex(item => item && item.toLowerCase() === val.toLowerCase());
            if (idx === -1) {
                selControl['controls'].filter.setValue('', { emitEvent: false });
            } else {
                selControl['controls'].filter.setValue(cpFilterValues[idx], { emitEvent: false });
            }
        }
        if (this.tplVariables[index].filter !== selControl['controls'].filter.value) {
            // comment this out since we don't want to save this over editForm
            // this.updateState(selControl, 'listForm');
            this.interCom.requestSend({
                action: 'ApplyTplVarValue'
            });
        }
    }

    onInputFocus(cname: string, index: number) {
        this.filteredValues = [];
        const selControl = this.getSelectedControl(index);
        switch (cname) {
            case 'tagk':
                this.filteredKeyOptions = selControl['controls'][cname].valueChanges
                    .pipe(
                        startWith(''),
                        debounceTime(300),
                        map(val => {
                            const filterVal = val.toString().toLowerCase();
                            return this.dbTagKeys.tags.filter(key => key.toLowerCase().includes(filterVal));
                        })
                    );
                break;
            case 'alias':
                const startVal = selControl['controls'][cname].value;
                console.log('hill - onfosuc', startVal, cname, index);
                selControl['controls'][cname].valueChanges.pipe(
                    debounceTime(300)
                ).subscribe(val => {
                    this.validateAlias(val.toString(), index, selControl, startVal);
                });
                break;
            case 'filter':
                selControl['controls'][cname].valueChanges.pipe(
                    startWith(''),
                    debounceTime(300),
                ).subscribe(val => {
                    this.getTagValues(val.toString(), selControl);
                });
                break;
        }
    }
    private getTagValues(val: string, selControl: any) {
        let payload = '.*';
        if (val.trim().length > 0) {
            payload += val + '.*';
        }
        const metrics = this.dbService.getMetricsFromWidgets(this.widgets);
        const tag = { key: selControl['controls'].tagk.value, value: payload};
        const query = { metrics, tag};
        this.httpService.getTagValues(query).subscribe(results => {
            this.filteredValues = results;
        });
    }
    private getSelectedControl(index: number, formArrayName = 'formTplVariables') {
        const control = <FormArray>this.editForm.controls[formArrayName];
        return control.at(index);
    }

    private validateAlias(val: string, index: number, selControl: any, startVal: string) {
        if (val.trim() !== '') { // if no change to value
            const tplFormGroups = this.editForm.controls['formTplVariables']['controls'];
            if (tplFormGroups.length > 0) {
                for (let i = 0; i < tplFormGroups.length; i++) {
                    if (i === index) {
                        // value is changed of its own
                        this.updateState(selControl, 'editForm');
                        this.interCom.requestSend({
                            action: 'UpdateTplAlias',
                            payload: { vartag: selControl.value, originVal: startVal }
                        });
                        continue;
                    }
                    const rowControl = tplFormGroups[i]['controls'];
                    if (val.trim() === rowControl['alias'].value.trim()) {
                        tplFormGroups[index].controls['alias'].setErrors({ 'unique': true });
                        tplFormGroups[i].controls['alias'].setErrors({ 'unique': true });
                    } else {
                        tplFormGroups[i]['controls']['alias'].setErrors(null);
                        this.updateState(selControl, 'editForm');
                        this.interCom.requestSend({
                            action: 'UpdateTplAlias',
                            payload: { vartag: selControl.value, originVal: startVal }
                        });
                    }
                }
            }
        }
        console.log('hill - this is it');
    }

    onInputBlur(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const val = selControl['controls'][cname].value;
        // when user type in and click select and if value is not valid, reset
        if (cname === 'tagk' && this.dbTagKeys.tags.indexOf(val) === -1) {
            selControl['controls'][cname].setValue('');
            selControl['controls']['filter'].setValue('');
        } else {
            this.prevSelectedTagk = val;
        }
        if (cname === 'filter' && this.filteredValues.indexOf(val) === -1) {
            selControl['controls'][cname].setValue('');
            if (this.tplVariables[index].filter !== val) {
                this.updateState(selControl, 'editForm');
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue'
                });
            }
        }

    }

    // update state if it's is valid
    selectTagKeyOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        if (event.option.value !== this.prevSelectedTagk) {
            selControl['controls']['filter'].setValue('');
            this.updateState(selControl, 'editForm');
            // remove this tag out if any
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: {
                    vartag: { tagk: this.prevSelectedTagk, alias: selControl.get('alias').value },
                    tplIndex: index
                }
            });
        }
    }
    // update state if it's is valid
    selectFilterValueOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        this.updateState(selControl, 'editForm');
        this.interCom.requestSend({
            action: 'ApplyTplVarValue'
        });
    }

    removeTemplateVariable(index: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        const removedItem = control.at(index);
        control.removeAt(index);
        if (removedItem.valid) {
            this.updateState(removedItem, 'editForm');
            // remove this tag out if any
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: {  vartag: removedItem.value,
                            tplIndex: index }
            });
        }
    }
    done() {
        // just as close the panel to list mode
        this.mode = { view: true };
        this.initListFormGroup();
    }
    updateState(selControl: AbstractControl, from: string) {
        if (selControl.valid) {
            const sublist = [];
            if (from === 'editForm') {
                for (let i = 0; i < this.formTplVariables.controls.length; i++) {
                    if (this.formTplVariables.controls[i].valid) {
                        sublist.push(this.formTplVariables.controls[i].value);
                    }
                }
            } else if (from === 'listForm') {
                for (let i = 0; i < this.listVariables.controls.length; i++) {
                    sublist.push(this.listVariables.controls[i].value);
                }
            }
            this.interCom.requestSend({
                action: 'updateTemplateVariables',
                payload: {
                    variables: sublist
                }
            });
            console.log('hill -tplVariables', sublist);
        }
    }

    calculateVariableDisplayWidth(item: FormGroup, options: any) {

        let minSize = (options && options.minSize) ? options.minSize : '50px';
        const filter = item.get('filter').value;
        const alias = item.get('alias').value;
        const fontFace = 'Ubuntu';
        const fontSize = 14;

        let inputWidth, prefixWidth;

        // input only (value)
        if (options && options.inputOnly && options.inputOnly === true) {
            // tslint:disable-next-line: max-line-length
            inputWidth = (!filter || filter.length === 0) ? minSize : (this.utils.calculateTextWidth(filter, fontSize, fontFace) + 40) + 'px';
            return inputWidth;
        // prefix only (alias)
        } else if (options && options.prefixOnly && options.prefixOnly === true) {
            // tslint:disable-next-line: max-line-length
            prefixWidth = (!alias || alias.length === 0 ) ? minSize : (this.utils.calculateTextWidth(alias, fontSize, fontFace) + 40) + 'px';
            return prefixWidth;
        // else, calculate both
        } else {
            // tslint:disable-next-line: radix
            minSize = parseInt(minSize);
            inputWidth = (!filter || filter.length === 0) ? minSize : this.utils.calculateTextWidth(filter, fontSize, fontFace);
            prefixWidth = this.utils.calculateTextWidth(alias, fontSize, fontFace);
            // 40 is padding and such
            return (prefixWidth + inputWidth + 40) + 'px';
        }
    }

    // return widget and qid of eligible to deal with
    checkEligibleWidgets(selControl: any) {
        const vartag = selControl.value;
        const ewid = {};
        let effectedCount = 0;
        for (const wid in this.dbTagKeys.rawDbTags) {
            if (this.dbTagKeys.rawDbTags.hasOwnProperty(wid)) {
                const eqid = {};
                for (const qid in this.dbTagKeys.rawDbTags[wid]) {
                    if (this.dbTagKeys.rawDbTags[wid].hasOwnProperty(qid)) {
                        if (this.dbTagKeys.rawDbTags[wid][qid].includes(vartag.tagk)) {
                            eqid[qid] = true;
                            effectedCount++;
                        }
                    }
                }
                if (Object.keys(eqid).length > 0) {
                    ewid[wid] = eqid;
                }
            }
        }
        return { ewid };
    }
}

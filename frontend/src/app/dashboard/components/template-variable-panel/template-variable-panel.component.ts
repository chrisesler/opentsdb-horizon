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
import { map, startWith, debounceTime, skip, distinctUntilChanged } from 'rxjs/operators';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { UtilsService } from '../../../core/services/utils.service';

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
    @Input() undoState: any;

    editForm: FormGroup;
    listForm: FormGroup;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: Observable<string[]>; // options for value autosuggest
    fileredValues: string[];
    prevSelectedTagk = '';
    disableDone = false;
    effectedWidgets: any = {};
    undo: any = {};
    countApplied = 0;
    constructor (private fb: FormBuilder, private interCom: IntercomService, private utils: UtilsService ) { }

    ngOnInit() {
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message.action === 'dashboardTagValues') {
                this.filteredValueOptions = message.payload;
                this.fileredValues = message.payload;
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.tplVariables) {
            this.initListFormGroup();
        }
         if (changes.undoState && changes.undoState.currentValue) {
            this.undo = { ...changes.undoState.currentValue };
            if (this.undo.index > -1 && !this.mode.view) {
                const selControl = this.getSelectedControl(this.undo.index);
                if (selControl) {
                    selControl.get('applied').setValue(this.undo.applied);
                }
            }
        }
    }

    bulkAction(action: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const chkWidgets = this.checkEligibleWidgets(selControl);
        if (action === 'append' && selControl.get('applied').value === chkWidgets.effectedCount) {
            return;
        }
        this.interCom.requestSend({
            action: 'BulkAction_' + action,
            payload: { vartag: selControl.value,
                       effectedWidgets: chkWidgets.ewid,
                       tplIndex: index
                    }
        });
    }

    undoAction(index: number) {
        // const selControl = this.getSelectedControl(index);
        // selControl.get('applied').setValue(0);
        this.interCom.requestSend({
            action: 'Undo_customFilers',
            payload: { tplIndex: index }
        });
    }

    doEdit() {
        this.mode = { view: false};
        this.initEditFormGroup();
    }
    initListFormGroup() {
        this.countApplied = 0;
        this.listForm = this.fb.group({
            listVariables: this.fb.array([])
        });
        for (const data of this.tplVariables) {
            const vardata = {
                tagk: new FormControl((data.tagk) ? data.tagk : '', []),
                alias: new FormControl((data.alias) ? data.alias : '', []),
                filter: new FormControl((data.filter) ? data.filter : '', []),
                applied: new FormControl(data.applied ? data.applied : 0)
            };
            const control = <FormArray>this.listForm.controls['listVariables'];
            control.push(this.fb.group(vardata));
            this.countApplied += data.applied || 0;
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
            filter: new FormControl((data.filter) ? data.filter : '', []),
            applied: new FormControl(data.applied ? data.applied : 0)
        };
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        control.push(this.fb.group(varData));
    }

    onVariableFocus(index: number) {
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        this.filteredValueOptions = null;
        selControl['controls'].filter.valueChanges.pipe(
            startWith(''),
            debounceTime(100),
            map(val => this._filter(val.toString(), 'filter', selControl, index, null))
        ).subscribe();
    }

    onVariableBlur(index: number) {
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        const val = selControl['controls'].filter.value;
        if (val  && this.fileredValues.indexOf(val) === -1) {
            selControl['controls'].filter.setValue('');
            this.updateState(selControl, 'listForm');
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
                payload: selControl.value
            });
        }
    }

    onInputFocus(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const startVal = selControl['controls'][cname].value;
        // clear previous filters values incase take sometime to populate new one
        this.filteredValueOptions = null;
        this.filteredKeyOptions = selControl['controls'][cname].valueChanges
           .pipe (
                startWith(''),
                debounceTime(100),
                distinctUntilChanged(),
                map(val => this._filter(val.toString(), cname, selControl, index, startVal))
            );
    }
    private getSelectedControl(index: number, formArrayName = 'formTplVariables') {
        const control = <FormArray>this.editForm.controls[formArrayName];
        return control.at(index);
    }
    private _filter(val: string, flag: string, selControl: any, index: number, startVal: string): string[] {
        const filterVal = val.toLowerCase();
        if (flag === 'tagk') {
            return this.dbTagKeys.tags.filter(key => key.toLowerCase().includes(filterVal));
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
            this.validateAlias(val, index, selControl, startVal);
        }
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
    }

    onInputBlur(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const val = selControl['controls'][cname].value;
        if (val) {
            // when user type in and click select and if value is not valid, reset
            if (cname === 'tagk' && this.dbTagKeys.tags.indexOf(val) === -1) {
                selControl['controls'][cname].setValue('');
                selControl['controls']['filter'].setValue('');
            } else {
                this.prevSelectedTagk = val;
            }
            if (cname === 'filter' && this.fileredValues.indexOf(val) === -1) {
                selControl['controls'][cname].setValue('');
                this.updateState(selControl, 'editForm');
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue',
                    payload: selControl.value
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
            action: 'ApplyTplVarValue',
            payload: selControl.value
        });
    }

    selectVarValueOption(index: number) {
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        this.updateState(selControl, 'listForm');
        this.interCom.requestSend({
            action: 'ApplyTplVarValue',
            payload: selControl.value
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
        return { ewid, effectedCount };
    }
    canAppend(index: number) {
        const selControl = this.getSelectedControl(index);
        const chkWidgets = this.checkEligibleWidgets(selControl);
        return selControl.get('applied').value < chkWidgets.effectedCount ? true : false;
    }
}

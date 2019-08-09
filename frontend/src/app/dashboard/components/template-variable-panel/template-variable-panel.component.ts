import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    OnDestroy,
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
export class TemplateVariablePanelComponent implements OnInit, OnChanges, OnDestroy {

    @HostBinding('class.template-variable-panel-component') private _hostClass = true;

    @Input() tplVariables: any;
    @Input() mode: any;
    @Input() dbTagKeys: any; // all available tags and widget tags from dashboard
    @Input() widgets: any[];
    @Output() modeChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() variableChanges: EventEmitter<any> = new EventEmitter<any>();

    editForm: FormGroup;
    listForm: FormGroup;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: string[][];
    prevSelectedTagk = '';
    disableDone = false;
    trackingSub: any = {};

    constructor (
        private fb: FormBuilder,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private utils: UtilsService,
        private httpService: HttpService ) {
            // predefine there
            this.listForm = this.fb.group({
                listVariables: this.fb.array([])
            });
            this.editForm = this.fb.group({
                formTplVariables: this.fb.array([])
            });
        }

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.tplVariables && changes.tplVariables.currentValue.editTplVariables.length > 0) {
            if (this.mode.view) {
                this.initListFormGroup();
            } else {
                this.initEditFormGroup();
            }
        } else if (changes.mode && !changes.mode.firstChange && changes.mode.currentValue.view) {
            // copy edit -> view list
            this.tplVariables.viewTplVariables = this.tplVariables.editTplVariables;
            this.initListFormGroup();
        } else if (changes.mode && !changes.mode.firstChange && !changes.mode.currentValue.view) {
            this.initEditFormGroup();
        }
    }
    doEdit() {
        this.modeChange.emit({ view: false });
    }

    // for filteredValueOptions, we can use both in view or edit mode, since
    // they have same index and all
    // @mode: from input, view or edit
    manageFilterControl(index: number) {
        const arrayControl = this.mode.view ? this.listForm.get('listVariables') as FormArray
            : this.editForm.get('formTplVariables') as FormArray;
        const name = this.mode.view ? 'view' : 'edit';
        const selControl = arrayControl.at(index);
        // unsubscribe if exists to keep list as new
        if (this.trackingSub.hasOwnProperty(name + index)) {
            this.trackingSub[name + index].unsubscribe();
        }
        this.trackingSub[name + index] = selControl.get('filter').valueChanges
            .pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(300)
            ).subscribe(val => {
                let payload = '.*';
                if (val.toString().trim().length > 0) {
                    payload += val + '.*';
                }
                const metrics = this.dbService.getMetricsFromWidgets(this.widgets);
                const tag = { key: selControl.get('tagk').value, value: payload };
                const query = { metrics, tag };
                this.httpService.getTagValues(query).subscribe(
                    results => {
                        this.filteredValueOptions[index] = results;
                    },
                    error => {
                        this.filteredValueOptions[index] = [];
                    });
            });
    }

    initListFormGroup() {
        this.filteredValueOptions = [];
        this.listForm.controls['listVariables'] = this.fb.array([]);
        this.tplVariables.viewTplVariables.forEach((data, index) => {
            const vardata = {
                tagk: new FormControl((data.tagk) ? data.tagk : '', []),
                alias: new FormControl((data.alias) ? data.alias : '', []),
                filter: new FormControl((data.filter) ? data.filter : '', [])
            };
            const control = <FormArray>this.listForm.controls['listVariables'];
            control.push(this.fb.group(vardata));
        });
    }

    initEditFormGroup() {
        this.filteredValueOptions = [];
        this.editForm.controls['formTplVariables'] = this.fb.array([]);
        this.initializeTplVariables(this.tplVariables.editTplVariables);
        // after reload the tplVariables state and if they are not the same as
        // viewTplVariables, we need to requery, since they are exactly same order, we can do JSON string check
        if (JSON.stringify(this.tplVariables.editTplVariables) !== JSON.stringify(this.tplVariables.viewTplVariables)) {
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
            });
        }
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

    get listVariables() {
        return this.listForm.get('listVariables') as FormArray;
    }
    get formTplVariables() {
        return this.editForm.get('formTplVariables') as FormArray;
    }

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
        this.manageFilterControl(index);
    }

    onVariableBlur(event: any, index: number) {
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        const val = selControl.get('filter').value;
        const idx = this.filteredValueOptions[index].findIndex(item => item && item.toLowerCase() === val.toLowerCase());
        if (idx === -1) {
           selControl.get('filter').setValue('');
        } else {
           selControl.get('filter').setValue(this.filteredValueOptions[index][idx]);
        }
        // if it's a different value from viewlist
        if (this.tplVariables.viewTplVariables[index].filter !== selControl.get('filter').value) {
            this.updateViewTplVariables();
        }
    }

    onInputFocus(cname: string, index: number) {
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
                selControl['controls'][cname].valueChanges.pipe(
                    debounceTime(1000)
                ).subscribe(val => {
                    this.validateAlias(val.toString(), index, selControl, startVal);
                });
                break;
            case 'filter':
                this.manageFilterControl(index);
                break;
        }
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
                        this.updateState(selControl, false);
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
                        this.updateState(selControl, false);
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
        // when user type in and click select and if value is not valid, reset
        if (cname === 'tagk') {
            if (this.dbTagKeys.tags.indexOf(val) === -1) {
                selControl['controls'][cname].setValue('');
                selControl['controls']['filter'].setValue('', { onlySelf: true, emitEvent: false });
            } else {
                this.prevSelectedTagk = val;
            }
        }
        if (cname === 'filter') {
            const idx = this.filteredValueOptions[index].findIndex(item => item && item.toLowerCase() === val.toLowerCase());
            if (idx === -1) {
               selControl.get('filter').setValue('', { emitEvent: false });
            } else {
               selControl.get('filter').setValue(this.filteredValueOptions[index][idx], { emitEvent: false });
            }
            if (this.tplVariables.editTplVariables[index].filter !== selControl.get('filter').value) {
                this.updateState(selControl);
            }
        }
        if (cname === 'alias' && selControl.valid) {
            this.updateState(selControl, false);
        }
    }

    // update state if it's is valid
    selectTagKeyOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        // if control is valid and the key is different
        if (selControl.valid && event.option.value !== this.prevSelectedTagk) {
            // const flag = selControl.get('filter').value !== '' ? true : false;
            selControl.get('filter').setValue('');
            // remove this tag out of widget if any
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: {
                    vartag: { tagk: this.prevSelectedTagk, alias: selControl.get('alias').value },
                    tplIndex: index
                }
            });
            this.updateState(selControl);
        }
    }
    // update state if it's is valid
    selectFilterValueOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        this.updateState(selControl);
    }

    selectVarValueOption(event: any, index: number) {
        if (this.tplVariables.viewTplVariables[index].filter !== event.option.value) {
            this.updateViewTplVariables();
        }
    }

    removeTemplateVariable(index: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        const removedItem = control.at(index);
        control.removeAt(index);
        if (removedItem.valid) {
            // remove this tag out of widget if manually add in.
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: {  vartag: removedItem.value }
            });
            this.updateState(removedItem);
        }
    }
    done() {
        this.modeChange.emit({ view: true });
    }
    updateState(selControl: AbstractControl, reQuery: boolean = true) {
        if (selControl.valid) {
            const sublist = [];
            for (let i = 0; i < this.formTplVariables.controls.length; i++) {
                if (this.formTplVariables.controls[i].valid) {
                    sublist.push(this.formTplVariables.controls[i].value);
                }
            }
            this.interCom.requestSend({
                action: 'updateTemplateVariables',
                payload: {
                    variables: sublist
                }
            });
            if (reQuery) {
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue',
                });
            }
        }
    }

    updateViewTplVariables() {
        const varsList = [];
        for (let i = 0; i < this.listVariables.controls.length; i++) {
            varsList.push(this.listVariables.controls[i].value);
        }
        this.tplVariables.viewTplVariables = varsList;
        this.interCom.requestSend({
            action: 'updateTemplateVariables',
            payload: {
                variables: varsList
            }
        });
        this.interCom.requestSend({
            action: 'ApplyTplVarValue',
        });
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

    ngOnDestroy() {
        for (const sub in this.trackingSub) {
            if (this.trackingSub.hasOwnProperty(sub) && this.trackingSub[sub] instanceof Subscription) {
                this.trackingSub[sub].unsubscribe();
            }
        }
    }
}

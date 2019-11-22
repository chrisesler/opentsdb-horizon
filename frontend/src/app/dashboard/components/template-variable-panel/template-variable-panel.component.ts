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
    @Input() widgets: any[];
    @Output() modeChange: EventEmitter<any> = new EventEmitter<any>();

    editForm: FormGroup;
    listForm: FormGroup;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: string[][];
    prevSelectedTagk = '';
    disableDone = false;
    trackingSub: any = {};
    selectedNamespaces: any[] = [];
    tagKeysByNamespaces: string[] = [];
    dbNamespaces: string[] = [];
    constructor(
        private fb: FormBuilder,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private utils: UtilsService,
        private httpService: HttpService) {
        // predefine there
        this.listForm = this.fb.group({
            listVariables: this.fb.array([])
        });
        this.editForm = this.fb.group({
            formTplVariables: this.fb.array([])
        });
    }

    ngOnInit() {}

    // to set reset these variable, will be call from dashboard component. 
    reset() {
        this.dbNamespaces = [];
        this.selectedNamespaces = [];
        this.tagKeysByNamespaces = [];
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('hill - tpl component changes', changes);
        if (changes.tplVariables && changes.tplVariables.currentValue.editTplVariables.tvars.length > 0) {
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
            // we need to get all tagkeys by namespace once first time only
            // and first assign to selectedNamespaces
            if (this.tplVariables.editTplVariables.namespaces.length > 0 && this.tagKeysByNamespaces.length === 0) {
                this.getTagkeysByNamespaces(this.tplVariables.editTplVariables.namespaces);
                this.selectedNamespaces = this.tplVariables.editTplVariables.namespaces;
            }
            this.tplVariables.editTplVariables.namespaces.sort(this.utils.sortAlphaNum);
            this.initEditFormGroup();
        } else if (changes.widgets) {
            // call to get dashboard namespaces
            this.dbNamespaces = this.dbService.getNamespacesFromWidgets(this.widgets);
            // update editTplVariables
            for (let i = 0; i < this.dbNamespaces.length; i++) {
                if (!this.tplVariables.editTplVariables.namespaces.includes(this.dbNamespaces[i])) {
                    this.tplVariables.editTplVariables.namespaces.push(this.dbNamespaces[i])
                }
            } 
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

                const query = {
                    namespaces: this.mode.view ? this.tplVariables.viewTplVariables.namespaces : this.tplVariables.editTplVariables.namespaces,
                    tag: { key: selControl.get('tagk').value, value: val }
                };
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
        this.tplVariables.viewTplVariables.tvars.forEach((data, index) => {
            const vardata = {
                tagk: new FormControl((data.tagk) ? data.tagk : '', []),
                alias: new FormControl((data.alias) ? data.alias : '', []),
                filter: new FormControl((data.filter) ? data.filter : '', []),
                mode: new FormControl((data.mode) ? data.mode : 'auto')
            };
            const control = <FormArray>this.listForm.controls['listVariables'];
            control.push(this.fb.group(vardata));
        });
    }

    initEditFormGroup() {
        this.filteredValueOptions = [];
        this.editForm.controls['formTplVariables'] = this.fb.array([]);
        this.initializeTplVariables(this.tplVariables.editTplVariables.tvars);

        // we dont deal with this way any more, carry over but if user save, it will save
        /* if (JSON.stringify(this.tplVariables.editTplVariables.tvars) !== JSON.stringify(this.tplVariables.viewTplVariables.tvars)) {
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
            });
        } */


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

    // to resturn the last filter mode to use for new one.
    getLastFilterMode(): string {
        let retString = 'auto';
        if (this.formTplVariables.controls.length > 0) {
            const lastFilter = this.formTplVariables.controls[this.formTplVariables.controls.length -1];
            retString = lastFilter.get('mode').value;
        }
        return retString;
    }

    // dirty flag to determine if the tag is insert or replace in auto mode
    // dirty = 1 means to do insert
    addVariableTemplate(data?: any) {
        data = (data) ? data : { mode: this.getLastFilterMode(), applied: 0, isNew: 1 };
        const varData = {
            tagk: new FormControl((data.tagk) ? data.tagk : '', [Validators.required]),
            alias: new FormControl((data.alias) ? data.alias : '', [Validators.required]),
            filter: new FormControl((data.filter) ? data.filter : '', []),
            mode: new FormControl((data.mode) ? data.mode : 'auto'),
            applied: data.applied,
            isNew: data.isNew
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
        const idx = this.filteredValueOptions[index].findIndex(item => item && item === val);
        if (idx === -1) {
            selControl.get('filter').setValue('');
        } else {
            selControl.get('filter').setValue(this.filteredValueOptions[index][idx]);
        }
        // if it's a different value from viewlist
        if (this.tplVariables.viewTplVariables.tvars[index].filter !== selControl.get('filter').value) {
            this.updateViewTplVariables(selControl.value);
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
                            // turn off lowercase
                            // const filterVal = val.toString().toLowerCase();
                            // return this.tagKeysByNamespaces.filter(key => key.toLowerCase().includes(filterVal));
                            const filterVal = val.toString();
                            return this.tagKeysByNamespaces.filter(key => key.includes(filterVal));
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

    // since alias/name has to be unique with db filters
    private validateAlias(val: string, index: number, selControl: any, startVal: string) {
        // debugger;
        if (val.trim() !== '') {
            const tplFormGroups = this.editForm.controls['formTplVariables']['controls'];
            if (tplFormGroups.length > 0) {
                for (let i = 0; i < tplFormGroups.length; i++) {
                    const rowControl = tplFormGroups[i];
                    console.log('hill - rowControl', rowControl, rowControl.getRawValue(), rowControl.get('alias').value);
                    let insert = 0;
                    if (rowControl.get('mode').value === 'auto') {
                        insert = rowControl.get('isNew').value;
                    }
                    if (i === index) { // value is changed of its own
                        rowControl.get('isNew').setValue(0, { emitEvent: false });
                        this.updateState(rowControl, false);
                        // run after state update
                        this.interCom.requestSend({
                            action: 'UpdateTplAlias',
                            payload: {
                                vartag: rowControl.getRawValue(),
                                originVal: startVal,
                                insert: insert
                            }
                        });
                        continue;
                    }
                    if (val.trim() === rowControl.get('alias').value.trim()) {
                        tplFormGroups[index].controls['alias'].setErrors({ 'unique': true });
                        tplFormGroups[i].controls['alias'].setErrors({ 'unique': true });
                    } else {
                        tplFormGroups[i]['controls']['alias'].setErrors(null);
                        rowControl.get('isNew').setValue(0, { emitEvent: false });
                        this.updateState(rowControl, false);
                        // make sure exec after updating dashboard state.
                        this.interCom.requestSend({
                            action: 'UpdateTplAlias',
                            payload: { vartag: rowControl.getRawValue(), originVal: startVal, insert: insert}
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
            if (this.tagKeysByNamespaces.indexOf(val) === -1) {
                selControl['controls'][cname].setValue('');
                selControl['controls']['filter'].setValue('', { onlySelf: true, emitEvent: false });
            } else {
                this.prevSelectedTagk = val;
            }
        }
        if (cname === 'filter') {
            // const idx = this.filteredValueOptions[index].findIndex(item => item && item.toLowerCase() === val.toLowerCase());
            const idx = this.filteredKeyOptions[index].findIndex(item => item && item === val) || -1;
            if (idx === -1) {
                selControl.get('filter').setValue('', { emitEvent: false });
            } else {
                selControl.get('filter').setValue(this.filteredValueOptions[index][idx], { emitEvent: false });
            }
            if (this.tplVariables.editTplVariables.tvars[index].filter !== selControl.get('filter').value) {
                this.updateState(selControl);
            }
        }
    }

    // update state if it's is valid
    selectTagKeyOption(event: any, index: number) {
        const selControl = this.getSelectedControl(index);
        // if control is valid and the key is different
        if (selControl.valid && event.option.value !== this.prevSelectedTagk) {
            const prevValue = selControl.get('filter').value;
            selControl.get('filter').setValue('');
            // remove this tag out of widget if any
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: {
                    vartag: { tagk: this.prevSelectedTagk, 
                              alias: selControl.get('alias').value,
                              filter: prevValue
                            }
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
        if (this.tplVariables.viewTplVariables.tvars[index].filter !== event.option.value) {
            this.updateViewTplVariables(this.tplVariables.viewTplVariables.tvars[index]);
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
                payload: { vartag: removedItem.value }
            });
            // we already trigger all widget update to requery from RemoveCustomTagFilter
            this.updateState(removedItem, false);
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
            // update db filters state.
            this.updateTplVariableState(this.selectedNamespaces, sublist);
            // we might need to run widgets which are affected by this tag
            if (reQuery) {
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue',
                    payload: selControl.value
                });
            }
        }
    }
    // for the view tpl variables, we do not update state value, unless user save it.
    updateViewTplVariables(vartag: any) {
        const varsList = [];
        for (let i = 0; i < this.listVariables.controls.length; i++) {
            varsList.push(this.listVariables.controls[i].value);
        }
        this.tplVariables.viewTplVariables.tvars = varsList;

        this.interCom.requestSend({
            action: 'ApplyTplVarValue',
            payload: vartag
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
            prefixWidth = (!alias || alias.length === 0) ? minSize : (this.utils.calculateTextWidth(alias, fontSize, fontFace) + 40) + 'px';
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

    addFilterToAll(index: any) {
        // add filter to all
    }

    removeFilterFromAll(index: any) {
        // remove filter from all
    }

    switchFilterMode(mode: string, index: number) {
        const selControl = this.getSelectedControl(index);
        selControl.get('mode').setValue(mode);

        if (mode === 'auto') {
            // when mode is from manual to auto, we will reapply all of them
            this.interCom.requestSend({
                action: 'UpdateTplAlias',
                payload: {
                    vartag: selControl.value,
                    originVal: '',
                    insert: 1,
                    index: index
                }
            });            
            this.updateState(selControl, true);
        } else { // set to manual mode
            this.updateState(selControl, false);
        }
    }

    addNamespace(namespace) {
        if (!this.selectedNamespaces.includes(namespace)) {
            this.selectedNamespaces.push(namespace);
            this.getTagkeysByNamespaces(this.selectedNamespaces);
        }
    }

    removeNamespace(namespace) {
        const index = this.selectedNamespaces.indexOf(namespace);
        if (!this.dbNamespaces.includes(namespace) && index !== -1) {
            this.selectedNamespaces.splice(index, 1);
            if (this.selectedNamespaces.length > 0) {
                this.getTagkeysByNamespaces(this.selectedNamespaces);
            } else {
                this.tagKeysByNamespaces = [];
                this.updateTplVariableState([], []);
            }
        }
    }

    getTagkeysByNamespaces(namespaces) {
        this.httpService.getTagKeys({ namespaces }).subscribe((res: string[]) => {
            this.tagKeysByNamespaces = res;
        });
    }

    updateTplVariableState(namespaces: string[], tvars: any[]) {
        this.interCom.requestSend({
            action: 'updateTemplateVariables',
            payload: {
                namespaces: namespaces,
                tvars: tvars
            }
        });
    }

    ngOnDestroy() {
        for (const sub in this.trackingSub) {
            if (this.trackingSub.hasOwnProperty(sub) && this.trackingSub[sub] instanceof Subscription) {
                this.trackingSub[sub].unsubscribe();
            }
        }
    }
}

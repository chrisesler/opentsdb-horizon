import {
    Component,
    OnInit,
    HostBinding,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IntercomService } from '../../../core/services/intercom.service';
import { UtilsService } from '../../../core/services/utils.service';
import { DashboardService } from '../../services/dashboard.service';
import { HttpService } from '../../../core/http/http.service';
import { moveItemInArray, CdkDragStart } from '@angular/cdk/drag-drop';

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
    @Input() tagKeysByNamespaces: string[];
    @Output() modeChange: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild('focusEl') focusEl: ElementRef;

    editForm: FormGroup;
    listForm: FormGroup;
    listenSub: Subscription;
    filteredKeyOptions: Observable<string[]>; // options for key autosuggest
    filteredValueOptions: string[][];
    prevSelectedTagk = '';
    disableDone = false;
    trackingSub: any = {};
    selectedNamespaces: any[] = [];
    dbNamespaces: string[] = [];
    originAlias: string[] = [];
    tagBlurTimeout: any;

    // style object for drag placeholder
    placeholderStyles: any = { width: '100%', height: '49px', transform: 'translate3d(0px,0px,0px)'};

    tagValueBlurTimeout: any;
    tagValueFocusTimeout: any;
    tagValueViewBlurTimeout: any;
    tagValueViewFocusTimeout: any;

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
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.tplVariables) {
            if (this.mode.view) {
                this.selectedNamespaces = changes.tplVariables.currentValue.viewTplVariables.namespaces;
                this.initListFormGroup();
            } else {
                this.selectedNamespaces = changes.tplVariables.currentValue.editTplVariables.namespaces;
                this.initEditFormGroup();
            }
        } else if (changes.mode && !changes.mode.firstChange && changes.mode.currentValue.view) {
            // copy edit -> view list
            this.tplVariables.viewTplVariables = this.utils.deepClone(this.tplVariables.editTplVariables);
            this.initListFormGroup();
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
        const conVal = selControl.get('filter').value;
        const res = conVal.match(/^regexp\((.*)\)$/);
        if (res) {
            selControl.get('filter').setValue(res[1]);
        }
        // unsubscribe if exists to keep list as new
        if (this.trackingSub.hasOwnProperty(name + index)) {
            this.trackingSub[name + index].unsubscribe();
        }
        // need to clear old list for new one
        if (this.filteredValueOptions[index]) {
            this.filteredValueOptions[index] = [];
        }
        this.trackingSub[name + index] = selControl.get('filter').valueChanges
            .pipe(
                startWith(''),
                distinctUntilChanged(),
                debounceTime(100)
            ).subscribe(val => {
                val = val ? val.trim() : '';
                const alias = '[' + selControl.get('alias').value + ']';
                const tagk = selControl.get('tagk').value;
                const metrics = [];
                // get tag values that matches metrics or namespace if metrics is empty
                for ( let i = 0; i < this.widgets.length; i++ ) {
                    const queries = this.widgets[i].queries;
                    for ( let j = 0; j < queries.length; j++ ) {
                        const filters = queries[j].filters;
                        let aliasFound = false;
                        for ( let k = 0; k < filters.length; k++ ) {
                            if ( filters[k].tagk === tagk && filters[k].customFilter && filters[k].customFilter.includes(alias)) {
                                aliasFound = true;
                            }
                        }
                        if ( aliasFound ) {
                            for ( let k = 0; k < queries[j].metrics.length; k++ ) {
                                if (!queries[j].metrics[k].expression) {
                                    metrics.push( queries[j].namespace + '.' + queries[j].metrics[k].name );
                                }
                            }
                        }
                    }
                }
                const query: any = {
                    tag: { key: tagk, value: val }
                };
                if ( metrics.length ) {
                    query.metrics = metrics;
                } else {
                    // tslint:disable-next-line: max-line-length
                    query.namespaces = this.mode.view ? this.tplVariables.viewTplVariables.namespaces : this.tplVariables.editTplVariables.namespaces;
                }
                const qid = 'v-' + name + index;
                if ( this.trackingSub[qid] ) {
                    this.trackingSub[qid].unsubscribe();
                }
                this.trackingSub[qid] = this.httpService.getTagValues(query).subscribe(
                    results => {
                        const regexStr = val === '' || val === 'regexp()' ? 'regexp(.*)' : /^regexp\(.*\)$/.test(val) ? val : 'regexp('+val+')';
                        results.unshift(regexStr);
                        this.filteredValueOptions[index] = results;
                    },
                    error => {
                        this.filteredValueOptions[index] = ['regexp('+val+')'];
                    });
            });
    }

    initListFormGroup() {
        this.filteredValueOptions = [];
        this.listForm.controls['listVariables'] = this.fb.array([]);
        if (this.tplVariables.viewTplVariables.tvars) {
            this.tplVariables.viewTplVariables.tvars.forEach((data, index) => {
                const vardata = {
                    tagk: new FormControl((data.tagk) ? data.tagk : '', []),
                    alias: new FormControl((data.alias) ? data.alias : '', []),
                    filter: new FormControl((data.filter) ? data.filter : '', []),
                    mode: new FormControl((data.mode) ? data.mode : 'auto'),
                    applied: data.applied,
                    isNew: data.isNew
                };
                const control = <FormArray>this.listForm.controls['listVariables'];
                control.push(this.fb.group(vardata));
            });
        }
    }

    initEditFormGroup() {
        this.filteredValueOptions = [];
        this.editForm.controls['formTplVariables'] = this.fb.array([]);
        this.initializeTplVariables(this.tplVariables.editTplVariables.tvars);

        // when switching to edit mode, we use the edit form and value and requery of needed
        if (JSON.stringify(this.tplVariables.editTplVariables.tvars) !== JSON.stringify(this.tplVariables.viewTplVariables.tvars)) {
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
                payload: this.tplVariables.editTplVariables.tvars
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

    initializeTplVariables(values: any[]) {
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
        this.tagValueViewFocusTimeout = setTimeout(() => {
            this.manageFilterControl(index);
        }, 100);

    }

    onVariableBlur(event: any, index: number) {
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        const val = selControl.get('filter').value;
        // no check and let user enter whatever
        /* let idx = -1;
        if (this.filteredValueOptions[index]) {
            idx = this.filteredValueOptions[index].findIndex(item => item && item === val);
        }
        if (idx === -1) {
            selControl.get('filter').setValue('');
        } else {
            selControl.get('filter').setValue(this.filteredValueOptions[index][idx]);
        }
        */
        // if it's a different value from viewlist
        this.tagValueViewBlurTimeout = setTimeout(()=> {
            if (this.tplVariables.viewTplVariables.tvars[index].filter !== val) {
                const res = val.match(/^regexp\((.*)\)$/);
                if (!res) {
                    selControl.get('filter').setValue('regexp(' + val + ')', {emitEvent: false});
                }
                this.tplVariables.viewTplVariables.tvars[index].filter = selControl.get('filter').value;
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue',
                    payload: [selControl.value]
                });
            }
        }, 300);
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
                // const startVal = selControl['controls'][cname].value;
                this.originAlias[index] = selControl['controls'][cname].value;
                // if the tag_key is invalid, we should not move on here
                if (selControl.get('tagk').value !== '') {
                    selControl['controls'][cname].valueChanges.pipe(
                        debounceTime(1000)
                    ).subscribe(val => {
                        this.validateAlias(val.toString(), index, selControl, this.originAlias);
                    });
                }
                break;
            case 'filter':
                this.tagValueFocusTimeout = setTimeout(() => {
                    this.manageFilterControl(index);
                }, 100);
                break;
        }
    }

    private getSelectedControl(index: number, formArrayName = 'formTplVariables') {
        const control = <FormArray>this.editForm.controls[formArrayName];
        return control.at(index);
    }

    // since alias/name has to be unique with db filters
    private validateAlias(val: string, index: number, selControl: any, originAlias: string[]) {
        if (val.trim() !== '') {
            const tplFormGroups = this.editForm.controls['formTplVariables']['controls'];
            // first let do the validation of the form to make sure we have unique alias
            for (let i = 0; i < tplFormGroups.length; i++) {
                const rowControl = tplFormGroups[i];
                // we need to reset error from prev round if any
                rowControl.controls['alias'].setErrors(null);
                if ( i === index ) { continue; }
                if (val.trim() === rowControl.get('alias').value) {
                    tplFormGroups[index].controls['alias'].setErrors({ 'unique': true });
                    tplFormGroups[i].controls['alias'].setErrors({ 'unique': true });
                    return;
                }
            }
            // form is valid, move on
            // first update state of this form, call one fill will update all the list
            // const selControl = this.getSelectedControl(index);
            this.updateState(selControl, false);
            // now update all of this tplVar
            if (this.originAlias.length === 0) {
                const rowControl = tplFormGroups[index];
                this.interCom.requestSend({
                    action: 'UpdateTplAlias',
                    payload: {
                        vartag: rowControl.getRawValue(),
                        originAlias: originAlias,
                        index: index,
                        insert: rowControl.get('isNew').value
                    }
                });
            } else {
                for (let i = 0; i < this.originAlias.length; i++) {
                    const rowControl = tplFormGroups[i];
                    // only alias has been update, we update in widget if it is
                    if (this.originAlias[i] !== undefined && this.originAlias[i] !== rowControl.get('alias').value) {
                        this.interCom.requestSend({
                            action: 'UpdateTplAlias',
                            payload: {
                                vartag: rowControl.getRawValue(),
                                originAlias: originAlias,
                                index: i,
                                insert: rowControl.get('isNew').value
                            }
                        });
                    }
                }
            }
            // reset originAlias list after completing validating
            this.originAlias = [];
        }
    }

    onInputBlur(cname: string, index: number) {
        const selControl = this.getSelectedControl(index);
        const val = selControl['controls'][cname].value;
        // set delay to avoid blur excute before onSelect
        if (cname === 'tagk' && val !== '') {
            this.tagBlurTimeout = setTimeout(() => {
                /* if (this.tagKeysByNamespaces.indexOf(val) === -1) {
                    selControl['controls'][cname].setValue('');
                    selControl['controls']['filter'].setValue('', { onlySelf: true, emitEvent: false });
                } else {*/
                    this.removeCustomTagFiler(index, val);
                    this.autoSetAlias(selControl, index);
                /*}*/
            }, 200);
        }
        if (cname === 'filter') {
            // to check filter again return list
            let idx = -1;
            if (this.filteredValueOptions[index]) {
                idx = this.filteredValueOptions[index].findIndex(item => item && item === val);
            }
            // when they not on the list we add 'regexp' around it
            if (idx === -1) {
                selControl.get('filter').setValue('regexp(' + val + ')', { emitEvent: false });
            } else {
                selControl.get('filter').setValue(this.filteredValueOptions[index][idx], { emitEvent: false });
            }
            this.tagValueBlurTimeout = setTimeout(() => {
                if (this.tplVariables.editTplVariables.tvars[index].filter !== selControl.get('filter').value) {
                    this.updateState(selControl);
                }
            }, 200);
        }
    }

    removeCustomTagFiler(index: number, currentTagk: string) {
        const selControl = this.getSelectedControl(index);
        const prevFilter = this.tplVariables.editTplVariables.tvars[index];
        // if control is valid and the key is different
        if (selControl.valid && prevFilter && currentTagk !== prevFilter.tagk) {
            selControl.get('filter').setValue('');
            selControl.get('applied').setValue(0);
            selControl.get('isNew').setValue(1);
            // remove this tag out of widget if any
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: prevFilter
            });
            this.updateState(selControl, false);
        }
    }

    // update state if it's is valid
    selectTagKeyOption(event: any, index: number) {
        if (this.tagBlurTimeout) {
            clearTimeout(this.tagBlurTimeout);
        }
        const selControl = this.getSelectedControl(index);
        this.removeCustomTagFiler(index, event.option.value);
        this.autoSetAlias(selControl, index);
    }
    // helper funtion to auto set alias name
    autoSetAlias(selControl: AbstractControl, index: number) {
        const tagk = selControl.get('tagk').value;
        let possibleAlias = [];
        for (let i = 1; i < 10; i++) {
            possibleAlias.push(tagk + i);
        }
        let aliases = [];
        for (let i = 0; i < this.tplVariables.editTplVariables.tvars.length; i++) {
            const tvar = this.tplVariables.editTplVariables.tvars[i];
            aliases.push(tvar.alias);
        }
        const matchKeys = aliases.filter(a => a.substring(0, tagk.length) === tagk);
        if (matchKeys.length === 0) {
            if (selControl.get('alias').value === '') {
                selControl.get('alias').setValue(tagk);
            }
        } else {
            if (selControl.get('alias').value === '') {
                for (let i = 0; i < possibleAlias.length; i++) {
                    if (!matchKeys.includes(possibleAlias[i])) {
                        selControl.get('alias').setValue(possibleAlias[i]);
                        break;
                    }
                }
            }
        }
        this.validateAlias(selControl.get('alias').value, index, selControl, this.originAlias);
    }
    // update state if it's is valid
    selectFilterValueOption(event: any, index: number) {
        if ( this.tagValueBlurTimeout ) {
            clearTimeout(this.tagValueBlurTimeout);
        }
        if ( this.tagValueFocusTimeout ) {
            clearTimeout(this.tagValueFocusTimeout);
        }
        const selControl = this.getSelectedControl(index);
        this.updateState(selControl);;
    }

    selectVarValueOption(event: any, index: number) {
        if ( this.tagValueViewBlurTimeout ) {
            clearTimeout(this.tagValueViewBlurTimeout);
        }
        if ( this.tagValueViewFocusTimeout ) {
            clearTimeout(this.tagValueViewFocusTimeout);
        }
        this.focusEl.nativeElement.focus();
        // the event is matAutocomplete event, we deal later to clear focus
        if (this.tplVariables.viewTplVariables.tvars[index].filter !== event.option.value) {
            this.tplVariables.viewTplVariables.tvars[index].filter = event.option.value;
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
                payload: [this.tplVariables.viewTplVariables.tvars[index]]
            });
        }
    }

    deleteTemplateVariable(index: number) {
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        const selControl = control.at(index);
        control.removeAt(index);
        // check in case they delete the one that not in state yet
        // then nothing need to do, just remove from form.
        if (this.tplVariables.editTplVariables.tvars[index]) {
            const removedItem = this.tplVariables.editTplVariables.tvars[index];
            // removing an item, then we should check the current editTplVariable
            // to find item to remove and it's the index.
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: removedItem
            });
            // we already trigger all widget update to requery from RemoveCustomTagFilter
            this.updateState(selControl, false);
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
            this.updateTplVariableState(this.utils.deepClone(this.selectedNamespaces), sublist);
            // we might need to run widgets which are affected by this tag
            if (reQuery) {
                this.interCom.requestSend({
                    action: 'ApplyTplVarValue',
                    payload: [selControl.value]
                });
            }
        }
    }

    // quickly update the namespace with add/remove namespace with valid one
    updateNamespaceState() {
        const sublist = [];
        for (let i = 0; i < this.formTplVariables.controls.length; i++) {
            if (this.formTplVariables.controls[i].valid) {
                sublist.push(this.formTplVariables.controls[i].value);
            }
        }
        // update db filters state.
        this.updateTplVariableState(this.utils.deepClone(this.selectedNamespaces), sublist);
    }

    calculateVariableDisplayWidth(item: FormGroup, options: any) {

        let minSize = (options && options.minSize) ? options.minSize : '50px';
        const filter = item.get('filter').value;
        const alias = item.get('alias').value;
        const fontFace = 'Ubuntu';
        const fontSize = 14;

        let inputWidth, prefixWidth, suffixWidth;

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
            // suffix is the reset icon
            suffixWidth = (filter.length > 0) ? 32 : 0;
            // 40 is padding and such
            return (prefixWidth + inputWidth + suffixWidth + 40) + 'px';
        }
    }

    addFilterToAll(index: number) {
        // add filter to all
        this.switchFilterMode('auto', index, false);
    }

    removeFilterFromAll(index: number) {
        // remove filter from all
        const control = <FormArray>this.editForm.controls['formTplVariables'];
        const removeTvar = control.at(index);
        if (removeTvar.valid) {
            // remove this tag out of widget if there
            this.interCom.requestSend({
                action: 'RemoveCustomTagFilter',
                payload: removeTvar.value
            });
            // we already trigger all widget update to requery from RemoveCustomTagFilter
            removeTvar.get('applied').setValue(0);
            this.updateState(removeTvar, false);
        }
    }

    switchFilterMode(mode: string, index: number, updateMode: boolean = true) {
        const selControl = this.getSelectedControl(index);
        if (updateMode) {
            selControl.get('mode').setValue(mode);
        }
        // quickly to update the mode.
        this.updateState(selControl, false);
        if (mode === 'auto') {
            if (selControl.valid) {
                // when mode is from manual to auto, we will reapply all of them
                this.interCom.requestSend({
                    action: 'UpdateTplAlias',
                    payload: {
                        vartag: selControl.value,
                        originAlias: [],
                        index: index,
                        insert: 1
                    }
                });
            } else {
                selControl.get('isNew').setValue(1);
            }
        } else { // set to manual mode
            selControl.get('isNew').setValue(0);
        }
    }

    addNamespace(namespace) {
        if (!this.selectedNamespaces.includes(namespace)) {
            this.selectedNamespaces.push(namespace);
            this.interCom.requestSend({
                action: 'UpdateTagKeysByNamespaces',
                payload: this.selectedNamespaces
            });
            this.updateNamespaceState();
        }
    }

    removeNamespace(namespace) {
        const index = this.selectedNamespaces.indexOf(namespace);
        if (!this.dbNamespaces.includes(namespace) && index !== -1) {
            this.selectedNamespaces.splice(index, 1);
            this.updateNamespaceState();
            if (this.selectedNamespaces.length > 0) {
                this.interCom.requestSend({
                    action: 'UpdateTagKeysByNamespaces',
                    payload: this.selectedNamespaces
                });
            } else {
                this.tagKeysByNamespaces = [];
            }
        }
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

    resetFilterValue(event: any, index: number) {
        event.stopPropagation();
        event.preventDefault();
        this.listVariables.controls[index].get('filter').setValue('');
        const control = <FormArray>this.listForm.controls['listVariables'];
        const selControl = control.at(index);
        // if it's a different value from viewlist
        if (this.tplVariables.viewTplVariables.tvars[index].filter !== selControl.get('filter').value) {
            this.tplVariables.viewTplVariables.tvars[index].filter = selControl.get('filter').value;
            this.interCom.requestSend({
                action: 'ApplyTplVarValue',
                payload: [selControl.value]
            });
        }
    }

    // DragDrop Table reorder event
    dropTable(event: any) {
        // console.log('DROP TABLE EVENT', event);
        // move item within the controls array
        moveItemInArray(this.formTplVariables['controls'], event.previousIndex, event.currentIndex);

        // extract variables values from form
        const values = this.formTplVariables.getRawValue();

        // Copy values over to the view side of the variables
        this.tplVariables.viewTplVariables.tvars = [...values];

        // need a control to pass to update state. Just going to grab the first one
        const selControl = this.getSelectedControl(0);
        this.updateState(selControl, false);
    }

    dragStart(cdkEvent: CdkDragStart, index: number) {
        // console.log('DRAG START', cdkEvent, index);
        // get size of the element we are dragging
        const sourceElCoords = cdkEvent.source.element.nativeElement.getBoundingClientRect();
        // synchronize the width of the placeholder with the dragged element
        this.placeholderStyles = { width: (sourceElCoords.width - 6) + 'px', height: '49px', transform: 'translate3d(0px,0px,0px)' };
    }

    ngOnDestroy() {
        for (const sub in this.trackingSub) {
            if (this.trackingSub.hasOwnProperty(sub) && this.trackingSub[sub] instanceof Subscription) {
                this.trackingSub[sub].unsubscribe();
            }
        }
    }
}

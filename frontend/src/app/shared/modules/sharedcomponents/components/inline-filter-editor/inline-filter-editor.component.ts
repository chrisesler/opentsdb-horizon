import {
    Component,
    OnInit,
    HostBinding,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    ViewChild,
    OnDestroy,
    HostListener, ChangeDetectorRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { startWith, debounceTime, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HttpService } from '../../../../../core/http/http.service';
import { Store } from '@ngxs/store';
import { DBSettingsState } from '../../../../../dashboard/state/settings.state';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'inline-filter-editor',
    templateUrl: './inline-filter-editor.component.html',
    styleUrls: ['./inline-filter-editor.component.scss']
})
export class InlineFilterEditorComponent implements OnInit, OnDestroy {
    @HostBinding('class.inline-filter-editor') private _hostClass = true;

    @Input() query: any;
    @Output() filterOutput = new EventEmitter();
    @ViewChild('tagValueSearchInput') tagValueSearchInput: ElementRef;
    @ViewChild('tagSearchInput') tagSearchInput: ElementRef;

    namespace: string;
    filters: any[];
    metrics: any[];
    queryBeforeEdit: any;
    tagOptions = [];
    filteredTagValues = [];
    selectedTagIndex = -1;
    selectedTag = '';
    loadFirstTagValues = true;
    tagValueTypeControl = new FormControl('literalor');
    tagSearchControl: FormControl;
    tagValueSearchControl: FormControl;
    message: any = { 'tagControl': { message: '' }, 'tagValueControl': { message: '' } };
    queryChanges$: BehaviorSubject<boolean>;
    queryChangeSub: Subscription;
    tagKeySub: Subscription;
    tagValueSub: Subscription;
    tplVariables: any[];
    visible = false;
    regexVars = /^\[.*\]$/;
    constructor(
        private elRef: ElementRef,
        private httpService: HttpService,
        private store: Store,
        private cdRef: ChangeDetectorRef) {

    }

    ngOnInit() {
        this.tplVariables = this.store.selectSnapshot(DBSettingsState.getTplVariables);
        this.namespace = this.query.namespace;
        this.metrics = this.query.metrics;
        this.filters = this.query.filters;
        this.queryChanges$ = new BehaviorSubject(false);

        this.queryChangeSub = this.queryChanges$
            .pipe(
                debounceTime(1000)
            )
            .subscribe(trigger => {
                if (trigger) {
                    this.triggerQueryChanges();
                }
            });
        this.initFormControls();
    }

    initFormControls() {
        this.setTagSearch();
        this.setTagValueSearch();
    }

    deleteFilter(index) {
        this.requestChanges();
    }

    setTagSearch() {
        this.tagSearchControl = new FormControl('');
        this.tagSearchControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(200)
            )
            .subscribe(value => {
                const query: any = { namespace: this.namespace, tags: this.filters, metrics: [] };
                query.search = value ? value : '';
                // remove remove filter is it's empty for tagkey search
                query.tags = query.tags.filter(t => t.filter.length !== 0);
                // filter tags by metrics
                if (this.metrics) {
                    for (let i = 0, len = this.metrics.length; i < len; i++) {
                        if (!this.metrics[i].expression) {
                            query.metrics.push(this.metrics[i].name);
                        }
                    }
                    query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) === i);
                }
                this.message['tagControl'] = {};
                if (this.tagKeySub) {
                    this.tagKeySub.unsubscribe();
                }
                this.tagKeySub = this.httpService.getNamespaceTagKeys(query)
                    .subscribe(res => {
                        const selectedKeys = this.filters.map(item => item.tagk);
                        res = res.filter(item => selectedKeys.indexOf(item.name) === -1);
                        const options = selectedKeys.map(item => ({ 'name': item })).concat(res);
                        if (this.loadFirstTagValues && options.length) {
                            this.handlerTagClick(options[0].name);
                        }
                        this.loadFirstTagValues = false;
                        this.tagOptions = options;
                        this.cdRef.detectChanges();
                    },
                        err => {
                            this.tagOptions = [];
                            const message = err.error.error ? err.error.error.message : err.message;
                            this.message['tagControl'] = { 'type': 'error', 'message': message };
                            this.cdRef.detectChanges();
                        });
            });
    }

    setTagValueSearch() {
        this.tagValueSearchControl = new FormControl('');

        // need to include switchMap to cancel the previous call
        this.tagValueSearchControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(200)
            )
            .subscribe(value => {

                const query: any = {
                    namespace: this.namespace,
                    // add condition since adding var may not with not existing value so fitler length is zero.
                    tags: this.filters.filter(item => item.tagk !== this.selectedTag && item.filter.length > 0),
                    metrics: []
                };
                query.search = value ? value : '';

                // filter by metrics
                if (this.metrics) {
                    for (let i = 0, len = this.metrics.length; i < len; i++) {
                        if (!this.metrics[i].expression) {
                            query.metrics.push(this.metrics[i].name);
                        }
                    }
                    query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) === i);
                }
                if (this.selectedTag && this.tagValueTypeControl.value === 'literalor') {
                    query.tagkey = this.selectedTag;
                    this.message['tagValueControl'] = {};
                    if (this.tagValueSub) {
                        this.tagValueSub.unsubscribe();
                    }
                    // any var template match with selected tag
                    const tplVars = this.tplVariables.filter(v => v.tagk === this.selectedTag);
                    this.tagValueSub = this.httpService.getTagValuesByNamespace(query)
                        .subscribe(res => {
                            // append tpl vars to the top of the list of value
                            if (Array.isArray(tplVars) && tplVars.length > 0) {
                                for (let i = 0; i < tplVars.length; i++) {
                                    res.unshift({name: '[' + tplVars[i].alias + ']'});
                                }
                            }
                            this.filteredTagValues = res;
                            this.cdRef.detectChanges();
                        },
                            err => {
                                this.filteredTagValues = [];
                                const message = err.error.error ? err.error.error.message : err.message;
                                this.message['tagValueControl'] = { 'type': 'error', 'message': message };
                                this.cdRef.detectChanges();
                            });
                }
            });
    }

    requestChanges() {
        this.filterOutput.emit(this.filters);
    }

    triggerQueryChanges() {
        this.requestChanges();
    }

    handlerTagClick(tag) {
        this.selectedTag = tag;
        this.selectedTagIndex = this.getTagIndex(tag);
        this.tagValueTypeControl.setValue('literalor');
        this.tagValueSearchControl.setValue(null);
    }

    // to remove tag key and all of its values
    removeTagValues(tag) {
        this.filters.splice(this.getTagIndex(tag), 1);
        this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.tagValueSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.queryChanges$.next(true);
        // because it acts like it is not selected after you remove it, but looks selected
        // simulate the click again
        this.handlerTagClick(tag);
    }

    getTagIndex(tag) {
        const tagIndex = this.filters.findIndex(item => item.tagk === tag);
        return tagIndex;
    }
    lastAddedKey(tag) {
        return (this.filters && this.filters.length) ? this.filters[this.filters.length - 1].tagk === tag : false;
    }
    getTagValueIndex(tag, v) {
        const tagIndex = this.getTagIndex(tag);
        let tagValueIndex = -1;
        let varValueIndex = -1;
        if (tagIndex !== -1) {
            tagValueIndex = this.filters[tagIndex].filter.indexOf(v);
            if (this.filters[tagIndex].customFilter) {
                varValueIndex = this.filters[tagIndex].customFilter.indexOf(v);
            }
        }
        if (tagValueIndex === -1 && varValueIndex === -1) {
            return -1;
        } else {
            return 0;
        }
    }

    addTagValueRegexp() {
        let v = this.tagValueSearchControl.value.trim();
        if (this.tagValueTypeControl.value === 'regexp' && v) {
            v = 'regexp(' + v + ')';
            this.updateTagValueSelection(v, 'add');
            this.tagValueSearchControl.setValue(null);
        }
    }

    updateTagValueSelection(v, operation) {
        v = v.trim();
        if (this.selectedTagIndex === -1 && operation === 'add') {
            this.selectedTagIndex = this.filters.length;
            const filter: any = { tagk: this.selectedTag, filter: [], customFilter: [] };
            filter.groupBy = false;
            this.filters[this.selectedTagIndex] = filter;
        }

        if (operation === 'add') {
            const checkVar = this.regexVars.test(v);
            if (checkVar) {
                this.filters[this.selectedTagIndex].customFilter ?
                this.filters[this.selectedTagIndex].customFilter.push(v) :
                this.filters[this.selectedTagIndex].customFilter = [v];
            } else {
                this.filters[this.selectedTagIndex].filter.push(v);
            }
        } else if (this.selectedTagIndex !== -1 && operation === 'remove') {
            if (this.regexVars.test(v)) {
                const varIndex = this.filters[this.selectedTagIndex].customFilter.indexOf(v);
                this.filters[this.selectedTagIndex].customFilter.splice(varIndex, 1);
            } else {
                const index = this.filters[this.selectedTagIndex].filter.indexOf(v);
                this.filters[this.selectedTagIndex].filter.splice(index, 1);
            }

            if ( (this.filters[this.selectedTagIndex].filter.length === 0 && !this.filters[this.selectedTagIndex].customFilter) ||
                (this.filters[this.selectedTagIndex].filter.length === 0 &&
                    this.filters[this.selectedTagIndex].customFilter && this.filters[this.selectedTagIndex].customFilter.length === 0)) {
                this.filters.splice(this.selectedTagIndex, 1);
                this.selectedTagIndex = -1;
            }
        }
        this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.queryChanges$.next(true);
    }

    isInfilteredKeys(key) {
        const keys = [];
        for (let i = 0, len = this.filters.length; i < len; i++) {
            keys.push(this.filters[i].tagk);
        }
        return keys.indexOf(key);
    }


    ngOnDestroy() {
        this.queryChangeSub.unsubscribe();
        if (this.tagKeySub) {
            this.tagKeySub.unsubscribe();
        }
        if (this.tagValueSub) {
            this.tagValueSub.unsubscribe();
        }
    }

    @HostListener('click', ['$event'])
    hostClickHandler(e) {
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if (!this.elRef.nativeElement.contains(target) && this.visible) {
            this.visible = false;

        } else if (!this.visible) {
            this.visible = true;
        }
    }
}

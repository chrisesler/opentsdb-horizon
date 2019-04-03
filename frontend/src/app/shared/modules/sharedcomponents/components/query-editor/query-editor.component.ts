import {
    Component,
    OnInit,
    HostBinding,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    Renderer,
    ViewChild,
    OnChanges,
    OnDestroy,
    SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { startWith, debounceTime, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'query-editor',
  templateUrl: './query-editor.component.html',
  styleUrls: []
})
export class QueryEditorComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.query-editor') private _hostClass = true;
    @Input() type;
    @Input() query: any = {   metrics: [] , filters: [], settings: {visual: {visible: true}}};
    @Input() label = '';
    @Input() edit = [];
    // @Input() edit = [];
    editNamespace = false;
    // @Input() showTag = false;
    // @Input() namespace = '';
    // @Input() tagsSelected: any = {};
    @Output() queryOutput = new EventEmitter();

    @ViewChild('tagValueSearchInput') tagValueSearchInput: ElementRef;
    @ViewChild('tagSearchInput') tagSearchInput: ElementRef;
    @ViewChild('metricSearchInput') metricSearchInput: ElementRef;

    queryBeforeEdit: any;
    tagOptions = [];
    filteredTagOptions: Observable<any>;
    filteredTagValues = [];
    metricOptions = [];
    selectedTagIndex = -1;
    selectedTag = '';
    loadFirstTagValues = false;
    tagValueTypeControl = new FormControl('literalor');
    metricSearchControl: FormControl;
    tagSearchControl: FormControl;
    tagValueSearchControl: FormControl;
    message:any = { 'tagControl' : { message: ''}, 'tagValueControl' : { message: '' }, 'metricSearchControl': { message : ''} };
    Object = Object;

    metricSelectedTabIndex = 0;
    editExpressionId = 0;
    isEditExpression = false;
    aliases = [];
     /** Form Group */
     expressionForm: FormGroup;

     // subscriptions
     expressionForm_Sub: Subscription;

    // form values
    expressionName: string;
    expressionValue: string;
    metrics: any[] = [];

    formControlInitiated = false;

    queryChanges$: BehaviorSubject<boolean>;
    queryChangeSub: Subscription;

    constructor(
        private elRef: ElementRef,
        private renderer: Renderer,
        private httpService: HttpService,
        private fb: FormBuilder,
        private utils: UtilsService ) {

        }

    ngOnInit() {
        this.queryChanges$ = new BehaviorSubject(false);

        this.queryChangeSub = this.queryChanges$
                                        .pipe(
                                            debounceTime(1000)
                                        )
                                        .subscribe( trigger => {
                                            if ( trigger ) {
                                                this.triggerQueryChanges();
                                            }
                                        });

        // TODO: find better place for this
        if (typeof this.query.settings.explicitTagMatch === 'undefined') {
            this.query.settings.explicitTagMatch = false;
        }
    }

    initExpressionForm() {
        this.expressionForm = this.fb.group({
            expressionName:     new FormControl('untitled expression'),
            expressionValue:    new FormControl('')
        });
    }

    ngOnChanges( changes: SimpleChanges) {
        if ( changes.query && changes.query.currentValue ) {
            this.query = JSON.parse(JSON.stringify(changes.query.currentValue));
            if ( !this.query.namespace ) {
                this.editNamespace = true;
            }

            if ( this.edit.length ) {
                this.initFormControls();
                this.queryBeforeEdit = JSON.parse(JSON.stringify(this.query));
                this.setEditMode(this.edit);
            }
        }
    }

    initFormControls() {
            this.initExpressionForm();
            this.setMetricSearch();
            this.setTagSearch();
            this.setTagValueSearch();
    }
    saveNamespace(namespace ) {
        this.query.namespace = namespace;
        this.editNamespace = false;
        this.triggerQueryChanges();
    }

    cancelSaveNamespace(e) {
        this.editNamespace = false;
    }

    requestEditMode(type) {
        if ( !this.edit.length) {
            this.requestChanges('SetQueryEditMode', { edit: type=== 'expression' ? ['expression', 'filters'] : ['metrics', 'filters']  });
        } else {
            this.edit.push(type);
            this.setEditMode([type]);
        }
    }

    setEditMode(types) {
        if ( types.indexOf('metrics') !== -1  || types.indexOf('expression') !== -1 ) {
            this.metricOptions = [];
            this.metricSearchControl.setValue(null);
            if ( types.indexOf('expression') !== -1 ) {
                this.edit.push('metrics');
                this.showExpressionForm();
            }
        }

        if ( types.indexOf('filters') !== -1  ) {
            this.tagSearchControl.setValue(null);
            this.loadFirstTagValues = true;
        }
    }

    toggleQuery() {
        this.requestChanges('ToggleQueryVisibility');
    }
    deleteQuery() {
        this.requestChanges('DeleteQuery');
    }
    toggleMetricVisibility(id) {
        this.requestChanges('ToggleQueryMetricVisibility', { mid: id });
    }

    deleteMetric(id) {
        this.requestChanges('DeleteQueryMetric', { mid: id });
    }

    deleteFilter(index) {
        this.requestChanges('DeleteQueryFilter', { findex: index });
    }

    setMetricSearch() {
        this.metricSearchControl = new FormControl();
        // need to include switchMap to cancel the previous call
        this.metricSearchControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.query.namespace, tags: this.query.filters };
            query.search = value ? value : '';

            if ( this.edit.indexOf('metrics') !== -1 ) {
                this.message['metricSearchControl'] = {};
                this.httpService.getMetricsByNamespace(query)
                                    .subscribe(res => {
                                        this.metricOptions = res;
                                    },
                                    err => {
                                        this.metricOptions = [];
                                        const message = err.error.error? err.error.error.message : err.message;
                                        this.message['metricSearchControl'] = { 'type': 'error', 'message' : message };
                                    }
                                    );
            }
        });
    }

    setTagSearch() {
        this.tagSearchControl = new FormControl('');
        this.tagSearchControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.query.namespace, tags: this.query.filters, metrics: [] };

            query.search = value ? value : '';

            // filter tags by metrics
            if ( this.query.metrics ) {
                for ( let i = 0, len = this.query.metrics.length; i < len; i++ ) {
                    if ( !this.query.metrics[i].expression ) {
                        query.metrics.push(this.query.metrics[i].name);
                    } else {
                        const metrics = this.query.metrics[i].metrics.map(item => item.name.replace(this.query.namespace + '.',''));
                        query.metrics = query.metrics.concat(metrics);
                    }
                }
                query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
            }
            if ( this.edit.indexOf('filters') !== -1 ) {
                this.message['tagControl'] = {};
                this.httpService.getNamespaceTagKeys(query)
                                                        .pipe(
                                                            // debounceTime(200),
                                                        ).subscribe( res => {
                                                            const selectedKeys = this.query.filters.map(item => item.tagk);
                                                            res = res.filter(item => selectedKeys.indexOf(item.name) === -1);
                                                            const options = selectedKeys.map(item => { return {name:item};}).concat(res);
                                                            if ( this.loadFirstTagValues && options.length ) {
                                                                this.handlerTagClick(options[0].name);
                                                            }
                                                            this.loadFirstTagValues = false;
                                                            this.tagOptions = options;
                                                        },
                                                        err => {
                                                            this.tagOptions = [];
                                                            const message = err.error.error? err.error.error.message : err.message;
                                                            this.message['tagControl'] = { 'type': 'error', 'message' : message };
                                                        });
            }
            // this.tagSearchInput.nativeElement.focus();
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
        .subscribe( value => {
            const query: any = { namespace: this.query.namespace, tags: this.query.filters.filter( item=>item.tagk !== this.selectedTag), metrics: [] };

            query.search = value ? value : '';

            // filter by metrics
            if ( this.query.metrics ) {
                for ( let i = 0, len = this.query.metrics.length; i < len; i++ ) {
                    if ( !this.query.metrics[i].expression ) {
                        query.metrics.push(this.query.metrics[i].name);
                    } else {
                        const metrics = this.query.metrics[i].metrics.map(item => item.name.replace(this.query.namespace + '.',''));
                        query.metrics = query.metrics.concat(metrics);
                    }
                }
                query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
            }
            if ( this.selectedTag && this.tagValueTypeControl.value === 'literalor' ) {
                query.tagkey = this.selectedTag;
                this.message['tagValueControl'] = {};
                this.httpService.getTagValuesByNamespace(query)
                                .subscribe(res => {
                                    this.filteredTagValues = res;
                                },
                                err => {
                                    this.filteredTagValues = [];
                                    const message = err.error.error? err.error.error.message : err.message;
                                    this.message['tagValueControl'] = { 'type': 'error', 'message' : message };
                                });
            }
        });
    }

    requestChanges(action, data= {}) {
        const message = {
                            id: this.query.id,
                            action : action,
                            payload : data
                        };
        this.queryOutput.emit(message);
    }

    triggerQueryChanges() {
        this.requestChanges('QueryChange', {'query': this.query});
    }

    updateMetricSelection(metric, operation) {
        metric = metric.trim();
        const index = this.getMetricIndex(metric);
        if ( index === -1  && operation === 'add') {
            const id = this.utils.generateId();
            const oMetric = {
                                id: id,
                                name: metric,
                                filters: [],
                                settings: {
                                    visual: {
                                        visible: this.type === 'TopnWidgetComponent' ? false : true,
                                        color: 'auto',
                                        aggregator: this.type === 'LinechartWidgetComponent' ? [] : ['avg'],
                                        label: ''}}
                            };
            this.query.metrics.push(oMetric);
        } else if ( index !== -1 && operation === 'remove' ) {
            this.query.metrics.splice(index, 1);
        }
        this.queryChanges$.next(true);
        this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.tagValueSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    }
    removeMetricById(mid) {
        const index = this.query.metrics.findIndex( d => d.id === mid );
        if ( index !== -1 ) {
            this.query.metrics.splice(index, 1);
            this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
            this.tagValueSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        }
        this.queryChanges$.next(true);
    }

    setMetricTagAggregator(id, value) {
        const index  = this.query.metrics.findIndex( item => item.id === id );
        this.query.metrics[index].tagAggregator = value;
        this.queryChanges$.next(true);
    }

    getMetricIndex(metric) {
        const index  = this.query.metrics.findIndex( item => item.name === metric );
        return index;
    }

    handlerTagClick( tag ) {
        this.selectedTag = tag;
        this.selectedTagIndex = this.getTagIndex(tag);
        this.tagValueTypeControl.setValue('literalor');
        this.tagValueSearchControl.setValue(null);
    }

    removeTagValues(tag) {
        this.query.filters.splice(this.getTagIndex(tag), 1);
        this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.tagValueSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.metricSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.queryChanges$.next(true);
    }

    getTagIndex ( tag ) {
        const tagIndex = this.query.filters.findIndex( item => item.tagk === tag );
        return tagIndex;
    }

    getTagValueIndex ( tag, v ) {
        const tagIndex = this.getTagIndex(tag);
        let tagValueIndex = -1;
        if ( tagIndex !== -1 ) {
            tagValueIndex = this.query.filters[tagIndex].filter.indexOf(v);
        }
        return tagValueIndex;
    }

    addTagValueFilter() {
        let v = this.tagValueSearchControl.value.trim();
        if ( this.tagValueTypeControl.value === 'regexp' && v ) {
            v = 'regexp(' + v + ')';
            this.updateTagValueSelection(v, 'add');
            this.tagValueSearchControl.setValue(null);
        } else if ( this.tagValueTypeControl.value === 'librange' && v ) {
            v = 'librange(' + v + ')';
            this.updateTagValueSelection(v, 'add');
            this.tagValueSearchControl.setValue(null);
        }
    }
    
    updateTagValueSelection(v, operation) {
        v = v.trim();
        if ( this.selectedTagIndex === -1  && operation === 'add' ) {
            this.selectedTagIndex = this.query.filters.length;
            const filter: any = { tagk: this.selectedTag,  filter: []};
            filter.groupBy = false; // this.type === 'LinechartWidgetComponent' ? true : true;
            this.query.filters[this.selectedTagIndex] = filter;
        }

        if (  operation === 'add') {
            this.query.filters[this.selectedTagIndex].filter.push(v);
        } else if ( this.selectedTagIndex !== -1 && operation === 'remove' ) {
            const index = this.query.filters[this.selectedTagIndex].filter.indexOf(v);
            this.query.filters[this.selectedTagIndex].filter.splice(index, 1);
            if ( !this.query.filters[this.selectedTagIndex].filter.length ) {
                this.query.filters.splice(this.selectedTagIndex, 1);
                this.selectedTagIndex = -1;
            }
        }
        this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.metricSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.queryChanges$.next(true);
    }

    setTagGroupBy(index, value) {
        this.query.filters[index].groupBy = value;
        this.queryChanges$.next(true);
    }

    isInfilteredKeys(key) {
        const keys = [];
        for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
            keys.push(this.query.filters[i].tagk );
        }
        return keys.indexOf(key);
    }

    showExpressionForm(id= 0) {
        this.aliases = [];
        let mIndex = 1, eIndex = 1;
        for ( let i = 0, n = this.query.metrics.length; i < n; i++ ) {
            let id, displayName, metrics = [], expression, isExpression;
            if ( this.query.metrics[i].expression ) {
                continue;
                id = 'e' + eIndex;
                displayName = this.query.metrics[i].name;
                expression = '(' + this.query.metrics[i].expression + ')';
                isExpression = true;
                eIndex++;
            } else {
                id = 'm' + mIndex;
                displayName = this.query.metrics[i].name;
                const metric = this.query.namespace + '.' + this.query.metrics[i].name;
                metrics = [metric];
                expression = metric;
                isExpression = false;
                mIndex++;
            }
            this.aliases.push( {    id: id,
                                    displayName: displayName,
                                    expression: expression,
                                    isExpression: isExpression,
                                    expanded: false,
                                    metrics: metrics
                                });
        }
        this.setExpressionFormEditMode(id);
    }

    setExpressionFormEditMode(id) {
        this.editExpressionId = id;
        const editExpression = this.query.metrics.find( d => d.id === id );

        let name = 'untitled expression';
        let expression = '';
        if ( editExpression ) {
            const mAliases = this.aliases.filter( d => d.isExpression === false );
            let mIndex = mAliases.length + 1;
            name = editExpression.name;
            expression = editExpression.expression;
            const metrics = editExpression.metrics;
            // add the metric aliases if it is not there in the metric list
            // const namespace = this.query.namespace;
            for ( let i = 0, len = metrics.length; i < len; i++ ) {
                const metric = metrics[i];
                const index = this.aliases.findIndex(d => !d.isExpression && d.metrics[0] === metric.name );
                if ( index === -1 ) {
                    const id = 'm' + mIndex;
                    this.aliases.push( {
                                            id: id,
                                            displayName: metric.name,
                                            expression: metric.name,
                                            isExpression: false,
                                            expanded: false,
                                            metrics: [metric.name]
                                        });
                    mIndex++;
                }
            }

            // form the expression
            for (let i = 0; i < this.aliases.length; i++ ) {
                 const id = this.aliases[i].id;
                 const metric = this.aliases[i].expression;
                 const regex = new RegExp( metric , 'g');
                 expression = expression.replace( regex, id);
            }
        }
        this.expressionForm.controls.expressionName.setValue(name);
        this.expressionForm.controls.expressionValue.setValue(expression);
        this.isEditExpression = true;
        this.metricSelectedTabIndex = 1;
    }

    toggleExpressionDetail(index) {
        this.aliases[index].expanded = !this.aliases[index].expanded;
    }

    updateExpression() {
        if ( this.isValidExpression() && this.expressionForm.valid ) {
            this.isEditExpression = false;
            const expression = this.getExpressionConfig();
            const index = this.query.metrics.findIndex(d => d.id === this.editExpressionId );
            if ( index === -1 ) {
                this.query.metrics.push(expression);
            } else {
                this.query.metrics[index] = expression;
            }
            this.queryChanges$.next(true);
        }
    }

    isValidExpression() {
        const value = this.expressionForm.controls.expressionValue.value.trim();
        const result = value.match(/((m|e)[0-9]+)/gi);
        const invalidRefs = [];

        for (let i = 0; result && i < result.length; i++ ) {
            const index = this.aliases.findIndex(item => item.id === result[i]);
            if ( index === -1 ) {
                invalidRefs.push( result[i] );
            }
        }

        const isValid =   result != null && !invalidRefs.length;
        this.expressionForm.controls.expressionValue.setErrors( !isValid ? { 'invalid': true } : null );
        return isValid;
    }

    getExpressionConfig() {
        let expInput = this.expressionForm.controls.expressionValue.value;
        let result = expInput.match(/((m|e)[0-9]+)/gi);
        result = result ? this.utils.arrayUnique(result) : result;
        let metrics = [];
        const replace = [];

        for (let i = 0; i < result.length; i++ ) {
            const alias = this.aliases.find(item => item.id === result[i]);
            replace.push( { 'old': result[i], 'new': alias.expression } );
            const metric = { name: alias.metrics[0], refId: result[i]};
            const index = metrics.findIndex(d => d.name === alias.metrics[0] );
            if ( index === -1 ) {
                metrics.push(metric);
            }
        }

        // update the expression with new reference ids
        for ( let i = 0; i < replace.length; i++ ) {
            const regex = new RegExp( replace[i].old , 'g');
            expInput = expInput.replace( regex, replace[i].new);
        }

        const expression = {
            id: this.editExpressionId || this.utils.generateId(),
            name: this.expressionForm.controls.expressionName.value,
            expression : expInput,
            originalExpression: this.expressionForm.controls.expressionValue.value,
            metrics: metrics,
            settings: {
                visual: {
                    label: this.expressionForm.controls.expressionName.value,
                    visible: this.type === 'TopnWidgetComponent' ? false : true,
                    aggregator: this.type === 'LinechartWidgetComponent' ? [] : ['avg'],
                    color: 'auto'
                }
            },
        };
        return expression;
    }

    toggleExplictTagMatch(e: any) {
        this.query.settings.explicitTagMatch = e.checked;
        this.queryChanges$.next(true);
    }

    cancelExpression() {
        this.isEditExpression = false;
    }

    closeEditMode() {
        this.edit = [];
        this.requestChanges('CloseQueryEditMode');
    }

    // handle when clicked on cancel
    cancel(): void {
        this.closeEditMode();
        this.query = this.queryBeforeEdit;
        this.triggerQueryChanges();
    }

    // handle when clicked on apply
    apply(): any {
        this.closeEditMode();
    }

    ngOnDestroy() {
        // this.expressionForm_Sub.unsubscribe();
        this.queryChangeSub.unsubscribe();
    }
}

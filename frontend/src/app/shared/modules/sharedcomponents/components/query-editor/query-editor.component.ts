import { Component, OnInit, HostBinding, Input, Output, EventEmitter, ElementRef, Renderer, ViewChild, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';


import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  selector: 'query-editor',
  templateUrl: './query-editor.component.html',
  styleUrls: ['./query-editor.component.scss']
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
    tagValueTypeControl = new FormControl('literalor');
    metricSearchControl: FormControl;
    tagSearchControl: FormControl;
    tagValueSearchControl: FormControl;
    addMetricEnabled = false;
    message = { 'tagControl' : { message: ''}, 'tagValueControl' : { message: '' }, 'metricSearchControl': { message : ''} };
    Object = Object;

    metricSelectedTabIndex = 0;
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

    constructor(
        private elRef: ElementRef,
        private renderer: Renderer,
        private httpService: HttpService,
        private fb: FormBuilder,
        private utils: UtilsService ) {

        }

    ngOnInit() {
        // console.log("this.query", JSON.stringify(this.query))
        // this.query.id  = this.utils.generateId();
        this.createForm();
    }

    createForm() {
        this.expressionForm = this.fb.group({
            expressionName:     new FormControl('untitled expression'),
            expressionValue:    new FormControl('')
        });

        // JUST CHECKING VALUES
        /*
        this.expressionForm_Sub = this.expressionForm.valueChanges
                                            .pipe(debounceTime(2000))
                                            .subscribe(function(data) {
                                                // if ( this.isValidExpression() && this.expressionForm.valid ) {
                                                    // this.queryData();
                                                // }
                                            }.bind(this));
                                            */
    }

    ngOnChanges( changes: SimpleChanges) {
        if ( changes.query && changes.query.currentValue ) {
            this.query = JSON.parse(JSON.stringify(changes.query.currentValue));
            if ( !this.query.namespace ) {
                this.editNamespace = true;
            }

            console.log("come shere", this.edit);
            if ( this.edit.length ) {
                this.initFormControls();
                this.queryBeforeEdit = JSON.parse(JSON.stringify(this.query));
                this.setEditMode();
            }
        }
    }

    initFormControls() {
            this.setMetricSearch();
            this.setTagSearch();
            this.setTagValueSearch();
    }
    saveNamespace(namespace ) {
        this.query.namespace = namespace;
        this.editNamespace = false;
        this.triggerQueryChanges();
        console.log( "savenamespace", this.query);
    }

    cancelSaveNamespace(e) {
        this.editNamespace = false;
        console.log("cancelsavens", e);
    }

    requestEditMode(type) {
        if ( !this.edit.length) {
            this.requestChanges('SetQueryEditMode', { edit: [type] });
        } else {
            this.edit.push(type);
            this.setEditMode();
        }
        console.log("seteditmode", this.edit)
    }

    setEditMode() {
        if ( this.edit.indexOf('metrics') !== -1 || this.query.metrics.length ) {
            this.addMetricEnabled = true;
            this.metricOptions = [];
            this.metricSearchControl.setValue(null);
        }

        if ( this.edit.indexOf('filters') !== -1 || this.query.filters.length ) {
            this.tagSearchControl.setValue(null);
        }
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
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;
            console.log("metric search", query);

            if ( this.edit.indexOf('metrics') !== -1 ) {
                console.log("metric search", query);

                this.httpService.getMetricsByNamespace(query)
                                    .subscribe(res => {
                                        this.metricOptions = res;
                                        // fqueryEditzconsole.log(this.metricSearchInput)
                                        // console.log(this.renderer.selectRootElement('.metric-search-input'));
                                        // this.metricSearchInput.nativeElement.focus();
                                        console.log("metricOptions", this.metricOptions);
                                    });
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
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;

            // filter tags by metrics
            if ( this.query.metrics ) {
                query.metrics = this.query.metrics.map( item => item.name );
            }
            console.log("tag query", query);
            if ( this.edit.indexOf('filters') !== -1 ) {
                this.httpService.getNamespaceTagKeys(query)
                                                        .pipe(
                                                            // debounceTime(200),
                                                            catchError(val => of(`I caught: ${val}`)),
                                                        ).subscribe( res => {
                                                            this.tagOptions = res;
                                                        });
            }
            // this.tagSearchInput.nativeElement.focus();
        });
    }

    filterTagOptions() {
        const selected = this.query.filters.map(item => item.tagk);
        this.tagOptions = this.tagOptions.filter( tag => selected.indexOf(tag) === -1);
        console.log("tag options", this.tagOptions);
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
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter.length && this.query.filters[i].tagk !== this.selectedTag ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;

            // filter by metrics
            if ( this.query.metrics ) {
                query.metrics = this.query.metrics.map( item => item.name );
            }
            if ( this.selectedTag && this.tagValueTypeControl.value === 'literalor' ) {
                console.log("query tab value", query)
                query.tagkey = this.selectedTag;
                this.httpService.getTagValuesByNamespace(query)
                                .subscribe(res => {
                                    this.filteredTagValues = res;
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
        console.log("________request changes_______", message);
        this.queryOutput.emit(message);
    }

    triggerQueryChanges() {
        // if ( !this.query.metrics.length ) {
        //    return;
        // }
        this.requestChanges('QueryChange', {'query': this.query});
    }

    updateMetricSelection(metric, operation) {
        console.log('metric=', metric);
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
                                        visible: true,
                                        color: this.utils.getColors(null, 1),
                                        aggregator: this.type === 'LinechartWidgetComponent' ? [] : ['sum'],
                                        label: ''}}
                            };
            this.query.metrics.push(oMetric);
        } else if ( index !== -1 && operation === 'remove' ) {
            this.query.metrics.splice(index, 1);
        }
        this.triggerQueryChanges();
    }

    setMetricSummarizer(id, value) {
        const index  = this.query.metrics.findIndex( item => item.id === id );
        this.query.metrics[index].settings.visual.aggregator = value;
        this.triggerQueryChanges();
    }

    getMetricIndex(metric) {
        const index  = this.query.metrics.findIndex( item => item.name === metric );
        return index;
    }

    getOptionIndex(type, option) {
        let key;
        switch ( type ) {
            case 'tag':
                key = 'tagk';
                break;
        }
        const index  = this.query[type].findIndex( item => item[key] === option );
        return index;
    }

    handlerTagClick( tag ) {
        // const selected = this.query.filters.map(item => item.tagk);
        // res = res.filter( tag => selected.indexOf(tag) === -1);
        this.selectedTag = tag;
        this.selectedTagIndex = this.getTagIndex(tag);
        if ( this.tagValueTypeControl.value === 'literalor' ) {
            this.loadTagValues();
        }
    }

    loadTagValues() {
        this.tagValueSearchControl.setValue(null);
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

    addTagValueRegexp() {
        let v = this.tagValueSearchControl.value.trim();
        if ( this.tagValueTypeControl.value === 'regexp' && v ) {
            v = 'regexp(' + v + ')';
            this.updateTagValueSelection(v, 'add');
            this.tagValueSearchControl.setValue(null);
        }
    }


    updateTagValueSelection(v, operation) {
        console.log('tag value=', v);
        v = v.trim();
        if ( this.selectedTagIndex === -1  && operation === 'add' ) {
            this.selectedTagIndex = this.query.filters.length;
            const filter: any = { tagk: this.selectedTag,  filter: []};
            filter.aggregator = this.type === 'LinechartWidgetComponent' ? 'unmerge' : 'sum';
            this.query.filters[this.selectedTagIndex] = filter;
        }

        if (  operation === 'add') {
            this.query.filters[this.selectedTagIndex].filter.push(v);
        } else if ( this.selectedTagIndex !== -1 && operation === 'remove' ) {
            const index = this.query.filters[this.selectedTagIndex].filter.indexOf(v);
            this.query.filters[this.selectedTagIndex].filter.splice(index, 1);
            if ( !this.query.filters[this.selectedTagIndex].filter.length ) {
                this.query.filters.splice(this.selectedTagIndex, 1);
                this.tagOptions.unshift(this.selectedTag);
                this.selectedTagIndex = -1;
            }
        }
        this.filterTagOptions();
        console.log("updateTagValueSelection", this.query.filters);
        this.triggerQueryChanges();
    }

    setTagAggregator(index, value) {
        this.query.filters[index].aggregator = value;
        if ( value !== 'unmerge' ) {
            for ( let i = 0; i < this.query.filters.lenght; i++ ) {
                if ( index !== i && this.query.filters[i].aggregator !== 'unmerge' ) {
                    this.query.filters[i].aggregator = value;
                }
            }
        }
        console.log("---value---", this.query.filters[0].aggregator, index, value);
        this.triggerQueryChanges();
    }

    isInfilteredKeys(key) {
        const keys = [];
        for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
            keys.push(this.query.filters[i].tagk );
        }
        return keys.indexOf(key);
    }

    showExpressionForm() {
        this.expressionForm.controls.expressionName.setValue('untitled expression');
        this.expressionForm.controls.expressionValue.setValue('');
        this.isEditExpression = true;
        this.metricSelectedTabIndex = 1;
        this.aliases = [];
        let mIndex = 1, eIndex = 1;
        for ( let i = 0, n = this.query.metrics.length; i < n; i++ ) {
            let id,  displayName, metrics = [], expression;
            if ( this.query.metrics[i].expression ) {
                id = 'e' + eIndex;
                displayName = this.query.metrics[i].name;
                expression = '(' + this.query.metrics[i].expression + ')';
                eIndex++;
            } else {
                id = 'm' + mIndex;
                displayName = this.query.metrics[i].name;
                const metric = this.query.namespace + '.' + this.query.metrics[i].name;
                metrics = [metric];
                expression = metric;
                mIndex++;
            }
            this.aliases.push( {    id: id,
                                    displayName: displayName,
                                    expression: expression,
                                    expand: false,
                                    metrics: metrics
                                });
        }
        console.log("aliases", this.aliases);
    }

    createExpression() {
        if ( this.isValidExpression() && this.expressionForm.valid ) {
            this.isEditExpression = false;
            const expression = this.getExpressionConfig();
            this.query.metrics.push(expression);
            this.triggerQueryChanges();
            console.log("expression", JSON.stringify(expression));
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
        console.log("isValidExpression", isValid, result != null , !invalidRefs.length)
        this.expressionForm.controls.expressionValue.setErrors( !isValid ? { 'invalid': true } : null );
        return isValid;
    }

    getExpressionConfig() {
        let expInput = this.expressionForm.controls.expressionValue.value;
        let result = expInput.match(/((m|e)[0-9]+)/gi);
        result = result ? this.utils.arrayUnique(result) : result;
        let metrics = [];
        const replace = [];

        console.log(result, "matches")
        for (let i = 0; i < result.length; i++ ) {
            const alias = this.aliases.find(item => item.id === result[i]);
            console.log(result[i], alias);
            replace.push( { 'old': result[i], 'new': alias.expression } );
            metrics = metrics.concat(alias.metrics);
        }
        metrics = this.utils.arrayUnique(metrics);


        // update the expression with new reference ids
        for ( let i = 0; i < replace.length; i++ ) {
            const regex = new RegExp( replace[i].old , 'g');
            expInput = expInput.replace( regex, replace[i].new);
        }

        const expression = {
            id: this.utils.generateId(),
            name: this.expressionForm.controls.expressionName.value,
            expression : expInput,
            metrics: metrics,
            settings: {
                visual: {
                    label: this.expressionForm.controls.expressionName.value,
                    visible: true
                }
            },
        };
        return expression;
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
        console.log("query before edit", this.queryBeforeEdit);
        this.triggerQueryChanges();
    }

    // handle when clicked on apply
    apply(): any {
        this.closeEditMode();
        console.log("this.query", JSON.stringify(this.query));
    }

    ngOnDestroy() {
        // this.expressionForm_Sub.unsubscribe();
    }
}
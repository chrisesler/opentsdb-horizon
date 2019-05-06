import {
    Component,
    HostBinding,
    Input,
    OnInit,
    ElementRef,
    Output,
    EventEmitter,
    ViewChild,
    ViewChildren,
    TemplateRef,
    QueryList,
    OnDestroy
} from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatMenuTrigger, MatMenu } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { MatTableDataSource, MatDialogRef, MatDialog } from '@angular/material';

import {
    animate,
    state,
    style,
    transition,
    trigger
} from '@angular/animations';

interface IQueryEditorOptions {
    deleteQuery?: boolean;
    toggleQuery?: boolean;
    cloneQuery?: boolean;
    toggleMetric?: boolean;
    enableGroupBy?: boolean;
    enableSummarizer?: boolean;
}

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: [],
    animations: [
        trigger( 'addQueryItem', [
            state('collapsed', style({ height: '0px', minHeight: '0px', visibility: 'hidden'})),
            state('expanded', style({ height: '*', minHeight: '48px', visibility: 'visible'})),
            transition('collapsed => expanded', animate('225ms ease-in-out')),
            transition('expanded => collapsed', animate('225ms ease-in-out'))
        ])
    ]
})

export class QueryEditorProtoComponent implements OnInit, OnDestroy {

    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.query-editor-proto') private _hostClass: boolean = true;
    // tslint:disable-next-line:no-inferrable-types

    @ViewChild('addExpressionInput') addExpressionInput: ElementRef;
    @ViewChild('editExpressionInput') editExpressionInput: ElementRef;
    @ViewChild('confirmDeleteDialog', {read: TemplateRef}) confirmDeleteDialogRef: TemplateRef<any>;


    @Input() type;
    @Input() query: any;
    @Input() label = '';
    @Input() options: IQueryEditorOptions;

    @Output() queryOutput = new EventEmitter;

    @ViewChild('tagFilterMenuTrigger', { read: MatMenuTrigger }) tagFilterMenuTrigger: MatMenuTrigger;

    @ViewChild('functionSelectionMenu', { read: MatMenu }) functionSelectionMenu: MatMenu;
    @ViewChildren(MatMenuTrigger) functionMenuTriggers: QueryList<MatMenuTrigger>;

    // confirmDelete Dialog
    confirmDeleteDialog: MatDialogRef<TemplateRef<any>> | null;

    editNamespace = false;
    editTag = false;
    isAddMetricProgress = false;
    isAddExpressionProgress = false;
    editExpressionId = -1;
    editMetricId = -1;
    fg: FormGroup;
    expressionControl: FormControl;
    expressionControls: FormGroup;

    timeAggregatorOptions: Array<any> = [
        {
            label: 'Sum',
            value: 'sum'
        },
        {
            label: 'Min',
            value: 'min'
        },
        {
            label: 'Max',
            value: 'max'
        },
        {
            label: 'Avg',
            value: 'avg'
        }
    ];

    summarizerOptions: Array<string> = ['avg', 'last', 'first', 'sum', 'min', 'max', 'count'];
    queryChanges$: BehaviorSubject<boolean>;
    queryChangeSub: Subscription;

    // FUNCTIONS SELECTOR STUFF
    selectedFunctionCategoryIndex: any = -1; // -1 for none selected, otherwise index
    currentFunctionMenuTriggerIdx: number;

    // store metric fx temporary here
    functionCategories: any[] = [
        {
            label: 'Rate',
            functions: [
                {
                    label: 'Rate of Change',
                    fxCall: 'RateOfChange'
                },
                {
                    label: 'Counter to Rate',
                    fxCall: 'CounterToRate'
                }
            ]
        }
    ];

    // MAT-TABLE DEFAULT COLUMNS
    metricTableDisplayColumns: string[] = [
        'metric-index',
        'name',
        'modifiers'
    ];

    // MAT-TABLE DATA SOURCE
    metricTableDataSource = new MatTableDataSource<any[]>([]);


    constructor(
        private elRef: ElementRef,
        private utils: UtilsService,
        private fb: FormBuilder,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private dialog: MatDialog
    ) {
        // add function (f(x)) icon to registry... url has to be trusted
        matIconRegistry.addSvgIcon(
            'function_icon',
            domSanitizer.bypassSecurityTrustResourceUrl('assets/function-icon.svg')
        );

    }

    ngOnInit() {
        this.initOptions();
        this.initFormControls();
        this.initMetricDataSource();
        this.initSummarizerValue();
        this.queryChanges$ = new BehaviorSubject(false);

        this.queryChangeSub = this.queryChanges$
            .pipe(
                debounceTime(1000)
            )
            // tslint:disable-next-line:no-shadowed-variable
            .subscribe(trigger => {
                if (trigger) {
                    this.triggerQueryChanges();
                }
            });
    }

    ngOnDestroy() {
        this.queryChangeSub.unsubscribe();
    }

    initOptions() {
        const defaultOptions = {
            'deleteQuery': false,
            'toggleQuery': false,
            'cloneQuery': false,
            'toggleMetric': true,
            'enableGroupBy': true,
            'enableSummarizer': false };
        this.options = Object.assign(defaultOptions, this.options);
    }


    // helper function to format the table datasource into a structure
    // that allows the table to work more or less like it did before
    initMetricDataSource() {

        // extract metrics only, then format with pre-constructed label, a type, and reference to the metric data
        const metrics = [];
        this.getMetricsByType('metrics').forEach((metric, i) => {
            metrics.push({ indexLabel: 'm' + (i + 1), type: 'metric', metric });
        });

        // placeholder row for Add Metric form
        metrics.push({addMetric: true});

        // extract expressions only, then format with pre-constructed label, a type, and reference to the expression data
        const expressions = [];
        this.getMetricsByType('expression').forEach((metric, i) => {
            expressions.push({ indexLabel: 'e' + (i + 1), type: 'expression', metric });
        });

        // placeholder row for Add Expression form
        expressions.push({addExpression: true});

        // merge the arrays and create datasource
        this.metricTableDataSource = new MatTableDataSource(metrics.concat(expressions));
    }

    initFormControls() {
        this.fg = new FormGroup({});
        const expressions = this.getMetricsByType('expression');
        for (let i = 0; i < expressions.length; i++) {
            this.fg.addControl(expressions[i].id, new FormControl(this.getExpressionUserInput(expressions[i].expression)));
        }
        this.fg.addControl('-1', new FormControl(''));
    }

    initSummarizerValue() {
        if (this.options.enableSummarizer) {
            for (let metric of this.query.metrics) {
                if (!metric.summarizer) {
                    metric.summarizer = 'avg';
                }
            }
        }
    }

    saveNamespace(namespace) {
        this.query.namespace = namespace;
        this.editNamespace = false;
        this.triggerQueryChanges();
    }

    cancelSaveNamespace(e) {
        this.editNamespace = false;
    }

    updateMetric(metrics, id) {
        const index = this.query.metrics.findIndex(item => item.id === id);
        if ( index !== -1 ) {
            this.query.metrics[index].name = metrics[0];
        } else {
            const insertIndex = this.getMetricsLength('metrics');
            for (let i = 0; i < metrics.length; i++) {
                // tslint:disable-next-line:no-shadowed-variable
                const id = this.utils.generateId(3);
                const oMetric = {
                    id: id,
                    name: metrics[i],
                    filters: [],
                    settings: {
                        visual: {
                            visible: true,
                            color: 'auto',
                            label: ''
                        }
                    },
                    tagAggregator: 'sum',
                    functions: [],
                    summarizer: ''
                };
                if (this.options.enableSummarizer) {
                    oMetric.summarizer = 'avg';
                }
                this.query.metrics.splice(insertIndex, 0, oMetric);
            }
            // update data source
            this.initMetricDataSource();
        }
        this.query.metrics = [...this.query.metrics];

        this.queryChanges$.next(true);
    }

    updateFilters(filters) {
        this.query.filters = filters;
        this.queryChanges$.next(true);
    }

    functionUpdate(event: any) {
        // event have metricId and fx
        const mIndex = this.query.metrics.findIndex(m => m.id === event.metricId);
        this.query.metrics[mIndex].functions = this.query.metrics[mIndex].functions || [];
        const fxIndex = this.query.metrics[mIndex].functions.findIndex(fx => fx.id === event.fx.id);
        if (fxIndex !== -1) {
            this.query.metrics[mIndex].functions[fxIndex] = event.fx;
        } else {
            this.query.metrics[mIndex].functions.push(event.fx);
        }
        this.queryChanges$.next(true);
    }

    functionDelete(event: any) {
        // event have metricId and funcId
        const mIndex = this.query.metrics.findIndex(m => m.id === event.metricId);
        const fxIndex = this.query.metrics[mIndex].functions.findIndex(fx => fx.id === event.funcId);
        if (fxIndex !== -1) {
            this.query.metrics[mIndex].functions.splice(fxIndex, 1);
        }
        this.queryChanges$.next(true);
    }

    setMetricTagAggregator(id, value) {
        const index = this.query.metrics.findIndex(item => item.id === id);
        if (index !== -1) {
            this.query.metrics[index].tagAggregator = value;
            this.queryChanges$.next(true);
        }
    }

    setMetricGroupByTags(id, tags) {
        const index = this.query.metrics.findIndex(item => item.id === id);
        if (index !== -1) {
            this.query.metrics[index].groupByTags = tags;
            this.queryChanges$.next(true);
        }
    }

    getGroupByTags(id) {
        const index = this.query.metrics.findIndex(d => d.id === id );
        let groupByTags = [];
        let expression = undefined;
        if (this.query.metrics[index] && this.query.metrics[index].expression) {
            expression = this.query.metrics[index].expression;
        }
        if (expression) {
            // replace {{<id>}} with query source id
            const re = new RegExp(/\{\{(.+?)\}\}/, "g");
            let matches = [];
            let i =0;
            while(matches = re.exec(expression)) {
                const id = matches[1];
                const mTags = this.getGroupByTags( id );
                groupByTags = i === 0 ? mTags : groupByTags.filter(v => mTags.includes(v));
                i++;
            }
        } else {
            if ( index > -1) {
                groupByTags  =  this.query.metrics[index].groupByTags || [];
            }
        }
        return groupByTags;
    }

    getMetricLabel(index) {
        const isExpression = this.query.metrics[index].expression !== undefined;
        let labelIndex = 0;
        for (let i = 0; i <= index; i++) {
            if (!isExpression && this.query.metrics[i].expression === undefined) {
                labelIndex++;
            }
            if (isExpression && this.query.metrics[i].expression !== undefined) {
                labelIndex++;
            }
        }
        return isExpression ? 'e' + labelIndex : 'm' + labelIndex;
    }

    getMetricsLength(type) {
        const res = this.getMetricsByType(type);
        return res.length;
    }

    getMetricsByType(type) {
        if (type === 'metrics') {
            return this.query.metrics.filter(d => d.expression === undefined);
        } else {
            return this.query.metrics.filter(d => d.expression !== undefined);
        }
    }

    editExpression(id) {
        if (this.fg.controls[this.editExpressionId].errors) { return; }
        this.editExpressionId = id;
        if (id === -1) {
            this.fg.controls[this.editExpressionId].setValue('');
            // this.isAddExpressionProgress = true;
            this.addQueryItemProgress('expression');
        } else {
            const index = this.query.metrics.findIndex(d => d.id === id);
            this.fg.controls[this.editExpressionId].setValue(this.getExpressionUserInput(this.query.metrics[index].expression));
            setTimeout(() => {
                this.editExpressionInput.nativeElement.focus();
            }, 100);
        }
    }

    getExpressionUserInput(expression) {
        // replace {{<id>}} to m|e<index>
        const re = new RegExp(/\{\{(.+?)\}\}/, 'g');
        let matches = [];
        let userExpression = expression;
        const aliases = this.getHashMetricIdUserAliases();
        while (matches = re.exec(expression)) {
            const id = '' + matches[1];
            const idreg = new RegExp('\\{\\{' + id + '\\}\\}', 'g');
            userExpression = userExpression.replace(idreg, aliases[id]);
        }
        return userExpression;
    }

    updateExpression(id, e) {
        const expression = e.srcElement.value.trim();
        let index = this.query.metrics.findIndex(d => d.id === id);
        if (expression && this.isValidExpression(id, expression)) {
            const expConfig = this.getExpressionConfig(expression);
            if (index === -1) {
                this.query.metrics.push(expConfig);
                this.isAddExpressionProgress = false;
                this.fg.addControl(expConfig.id, new FormControl(expression));
                index = this.query.metrics.length - 1;
            } else {
                expConfig.id = id;
                this.query.metrics[index] = expConfig;
                this.editExpressionId = -1;
            }
            this.query.metrics[index].groupByTags = this.getGroupByTags(expConfig.id);
            this.queryChanges$.next(true);
            this.initMetricDataSource();
        } else if (!expression && index === -1) {
            this.isAddExpressionProgress = false;
        }
    }

    isValidExpression(id, expression) {
        const result = expression.match(/((m|e)[0-9]+)/gi);
        const invalidRefs = [];

        const aliases = this.getMetricAliases();
        for (let i = 0; result && i < result.length; i++) {
            if (!aliases[result[i]]) {
                invalidRefs.push(result[i]);
            }
        }

        const isValid = result != null && !invalidRefs.length;
        this.fg.controls[id].setErrors(!isValid ? { 'invalid': true } : null);
        return isValid;
    }

    /* <metric.id>: m|e<index>, e.g. { aaa: m1, bbb: m2, ccc: e1 } */
    getHashMetricIdUserAliases() {
        let metricIndex = 0;
        let expressionIndex = 0;
        const aliases = {};
        for (let i = 0; i < this.query.metrics.length; i++) {
            const alias = this.query.metrics[i].expression === undefined ? 'm' + ++metricIndex : 'e' + ++expressionIndex;
            aliases[this.query.metrics[i].id] = alias;
        }
        return aliases;
    }

    /* m|e<index>:<metric.id>, e.g. { m1: aaa, m2: bbb, e1: ccc } */
    getMetricAliases() {
        let metricIndex = 0;
        let expressionIndex = 0;
        const aliases = {};
        for (let i = 0; i < this.query.metrics.length; i++) {
            const alias = this.query.metrics[i].expression === undefined ? 'm' + ++metricIndex : 'e' + ++expressionIndex;
            aliases[alias] = this.query.metrics[i].id;
        }
        return aliases;
    }

    getExpressionConfig(expression) {
        let transformedExp = expression;
        let result = expression.match(/((m|e)[0-9]+)/gi);
        result = result ? this.utils.arrayUnique(result) : result;
        // const replace = [];

        const aliases = this.getMetricAliases();

        // update the expression with metric ids
        for (let i = 0; i < result.length; i++) {
            const regex = new RegExp(result[i], 'g');
            transformedExp = transformedExp.replace(regex, '{{' + aliases[result[i]] + '}}');
        }


        const config = {
            id: this.utils.generateId(3),
            expression: transformedExp,
            originalExpression: expression,
            settings: {
                visual: {
                    visible: true,
                }
            },
        };
        return config;
    }

    functionMenuOpened($event, idx) {
        // maybe need this?
        // console.log('MENU OPENED', $event, idx);
        // console.log('TRIGGERS', this.functionMenuTriggers);
        this.currentFunctionMenuTriggerIdx = idx;
    }

    functionMenuClosed($event) {
        // console.log('MENU CLOSED', $event);
        this.selectedFunctionCategoryIndex = -1;
        this.currentFunctionMenuTriggerIdx = null;
    }

    selectFunctionCategory($event, catIdx) {
        this.selectedFunctionCategoryIndex = catIdx;
    }

    addFunction(func: any, metricId: string) {
        const newFx = {
            id: this.utils.generateId(3),
            fxCall: func.fxCall,
            val: ''
        };
        const metricIdx = this.query.metrics.findIndex(d => d.id === metricId ) ;
        this.query.metrics[metricIdx].functions = this.query.metrics[metricIdx].functions || [];
        this.query.metrics[metricIdx].functions.push(newFx);
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:no-shadowed-variable
        const trigger: MatMenuTrigger = <MatMenuTrigger>this.functionMenuTriggers.find((el, i) => i === this.currentFunctionMenuTriggerIdx);
        if (trigger) {
            trigger.closeMenu();
        }
        this.queryChanges$.next(true);
    }

    setSummarizerValue(id, summarizer: string) {
        const index = this.query.metrics.findIndex(item => item.id === id);
        if (index !== -1) {
            this.query.metrics[index].summarizer = summarizer;
            // todo - do not trigger full requery
            this.queryChanges$.next(true);
        }
    }

    showMetricAC() {

    }

    requestChanges(action, data = {}) {
        const message = {
            id: this.query.id,
            action: action,
            payload: data
        };
        this.queryOutput.emit(message);
    }

    triggerQueryChanges() {
        this.requestChanges('QueryChange', { 'query': this.query });
    }

    toggleExplictTagMatch(e: any) {
        this.query.settings.explicitTagMatch = e.checked;
        this.queryChanges$.next(true);
    }

    showTagFilterMenu() {
        this.tagFilterMenuTrigger.openMenu();
    }

    toggleMetric(id) {
        this.requestChanges('ToggleQueryMetricVisibility', { mid : id} );
    }

    toggleQuery() {
        this.requestChanges('ToggleQueryVisibility');
    }

    cloneQuery() {
        this.requestChanges('CloneQuery');
    }

    deleteQuery() {
        this.confirmDeleteDialog.close({deleted: true});
    }


    confirmQueryDelete(label) {
        this.confirmDeleteDialog = this.dialog.open(this.confirmDeleteDialogRef, {data: { label: label}});
        this.confirmDeleteDialog.afterClosed().subscribe(event => {
            if ( event.deleted ) {
                this.requestChanges('DeleteQuery');
            }
        });
    }

    cloneMetric(id) {
        const index = this.query.metrics.findIndex(d => d.id === id );
        const oMetric = this.query.metrics[index];
        const nMetric = this.utils.deepClone(oMetric);
        nMetric.id = this.utils.generateId(3);
        const insertIndex = this.query.metrics.findIndex(d => d.id === oMetric.id ) + 1;
        this.query.metrics.splice(insertIndex, 0, nMetric);
        this.queryChanges$.next(true);
        this.initMetricDataSource();
    }

    deleteMetric(id) {
        this.requestChanges('DeleteQueryMetric', { mid : id} );
        this.initMetricDataSource();
    }

    canDeleteMetric(id) {
        const index = this.query.metrics.findIndex(d => d.id === id ) ;
        const metrics = this.query.metrics;
        let canDelete = true;
        for ( let i = 0; i < metrics.length; i++ ) {
            const expression = metrics[i].expression;
            if ( expression && i !== index  &&  expression.indexOf('{{' + id + '}}') !== -1 ) {
                canDelete = false;
                break;
            }
        }
        return canDelete;
    }

    addQueryItemProgress(type: string) {
        // console.log('ADD QUERY ITEM PROGRESS', type);
        if (type === 'metric') {
            this.isAddExpressionProgress = false;
            this.isAddMetricProgress = !this.isAddMetricProgress;
        }
        if (type === 'expression') {
            this.isAddMetricProgress = false;
            this.isAddExpressionProgress = !this.isAddExpressionProgress;
            setTimeout(() => {
                this.addExpressionInput.nativeElement.focus();
            }, 100);
        }
    }

    // datasource table stuff - predicate helpers to determine if add metric/expression rows should show
    checkAddMetricRow = (i: number, data: object) => data.hasOwnProperty('addMetric');
    checkAddExpressionRow = (i: number, data: object) => data.hasOwnProperty('addExpression');

}

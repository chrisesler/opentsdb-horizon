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
    QueryList,
    OnDestroy
} from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatMenuTrigger, MatMenu } from '@angular/material';
import { MatIconRegistry } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';



@Component({
    // tslint:disable-next-line:component-selector
    selector: 'query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: []
})
export class QueryEditorProtoComponent implements OnInit, OnDestroy {

    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.query-editor-proto') private _hostClass: boolean = true;
    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.can-disable-metrics') private _canDisableMetrics: boolean = true;

    @Input() type;
    @Input() query: any;
    @Input() label = '';
    @Input() edit = [];

    @Input() // true for normal queries... false for alerts queries
    get canDisableMetrics(): boolean {
        return this._canDisableMetrics;
    }
    set canDisableMetrics(value: boolean) {
        this._canDisableMetrics = value;
    }

    @Output() queryOutput = new EventEmitter;

    @ViewChild('tagFilterMenuTrigger', { read: MatMenuTrigger }) tagFilterMenuTrigger: MatMenuTrigger;

    @ViewChild('functionSelectionMenu', { read: MatMenu }) functionSelectionMenu: MatMenu;
    @ViewChildren(MatMenuTrigger) functionMenuTriggers: QueryList<MatMenuTrigger>;

    editNamespace = false;
    editTag = false;
    isAddMetricProgress = false;
    isAddExpressionProgress = false;
    editExpressionId = -1;
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
                    fxCall: 'RateChange'
                },
                {
                    label: 'Counter to Rate',
                    fxCall: 'CounterToRate'
                }
            ]
        }
    ];

    constructor(
        private elRef: ElementRef,
        private utils: UtilsService,
        private fb: FormBuilder,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer
    ) {
        // add function (f(x)) icon to registry... url has to be trusted
        matIconRegistry.addSvgIcon(
            'function_icon',
            domSanitizer.bypassSecurityTrustResourceUrl('assets/function-icon.svg')
        );
    }

    ngOnInit() {
        this.queryChanges$ = new BehaviorSubject(false);
        this.initFormControls();

        this.queryChangeSub = this.queryChanges$
            .pipe(
                debounceTime(1000)
            )
            .subscribe(trigger => {
                if (trigger) {
                    this.triggerQueryChanges();
                }
            });
    }

    ngOnDestroy() {
        this.queryChangeSub.unsubscribe();
    }

    initFormControls() {
        this.fg = new FormGroup({});
        const expressions = this.getMetricsByType('expression');
        for (let i = 0; i < expressions.length; i++) {
            this.fg.addControl(expressions[i].id, new FormControl(this.getExpressionUserInput(expressions[i].expression)));
        }
        this.fg.addControl('-1', new FormControl(''));
    }
    saveNamespace(namespace) {
        this.query.namespace = namespace;
        this.editNamespace = false;
        this.triggerQueryChanges();
    }

    cancelSaveNamespace(e) {
        this.editNamespace = false;
    }

    updateMetric(metrics, index) {
        if (index) {
            this.query.metrics[index].name = metrics[0];
        } else {
            let insertIndex = this.getMetricsLength('metrics');
            for (let i = 0; i < metrics.length; i++) {
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
                    functions: []
                };
                this.query.metrics.splice(insertIndex, 0, oMetric);
            }
        }
        this.query.metrics = [...this.query.metrics];
        this.queryChanges$.next(true);
    }

    updateFilters(filters) {
        this.query.filters = filters;
        this.queryChanges$.next(true);
    }

    functionUpdate(func: any, metricIdx: number) {
        this.query.metrics[metricIdx].functions = this.query.metrics[metricIdx].functions || [];
        const fxIndex = this.query.metrics[metricIdx].functions.findIndex(fx => fx.id === func.id);
        if (fxIndex !== -1) {
            this.query.metrics[metricIdx].functions[fxIndex] = func;
        } else {
            this.query.metrics[metricIdx].functions.push(func);
        }
    }

    functionDelete(funcId: string, metricIdx: number) {
        const fxIndex = this.query.metrics[metricIdx].functions.findIndex(fx => fx.id === funcId);
        if (fxIndex !== -1) {
            this.query.metrics[metricIdx].functions.slice(fxIndex,1);
        }
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
        let res = this.getMetricsByType(type);
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
        if (this.fg.controls[this.editExpressionId].errors) return;
        this.editExpressionId = id;
        if (id === -1) {
            this.fg.controls[this.editExpressionId].setValue('');
            this.isAddExpressionProgress = true;
        } else {
            const index = this.query.metrics.findIndex(d => d.id === id);
            this.fg.controls[this.editExpressionId].setValue(this.getExpressionUserInput(this.query.metrics[index].expression));
        }
    }

    getExpressionUserInput(expression) {
        // replace {{<id>}} to m|e<index>
        const re = new RegExp(/\{\{(.+?)\}\}/, "g");
        let matches = [];
        let userExpression = expression;
        const aliases = this.getHashMetricIdUserAliases();
        while (matches = re.exec(expression)) {
            const id = matches[1];
            const idreg = new RegExp('{{' + id + '}}', 'g');
            userExpression = userExpression.replace(idreg, aliases[id]);
        }
        return userExpression;
    }

    updateExpression(id, e) {
        const expression = e.srcElement.value.trim();
        const index = this.query.metrics.findIndex(d => d.id === id);
        if (expression && this.isValidExpression(id, expression)) {
            const expConfig = this.getExpressionConfig(expression);
            if (index === -1) {
                this.query.metrics.push(expConfig);
                this.isAddExpressionProgress = false;
                this.fg.addControl(expConfig.id, new FormControl(expression));
            } else {
                expConfig.id = id;
                this.query.metrics[index] = expConfig;
                this.editExpressionId = -1;
            }

            this.queryChanges$.next(true);
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
        console.log('MENU OPENED', $event, idx);
        console.log('TRIGGERS', this.functionMenuTriggers);
        this.currentFunctionMenuTriggerIdx = idx;
    }

    functionMenuClosed($event) {
        console.log('MENU CLOSED', $event);
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
        this.query.metrics[metricIdx].functions.push(newFx);
        // tslint:disable-next-line:max-line-length
        const trigger: MatMenuTrigger = <MatMenuTrigger>this.functionMenuTriggers.find((el, i) => i === this.currentFunctionMenuTriggerIdx);
        if (trigger) {
            trigger.closeMenu();
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
        const index = this.query.metrics.findIndex(d => d.id === id ) ;
        this.query.metrics[index].settings.visual.visible = !this.query.metrics[index].settings.visual.visible;
        this.queryChanges$.next(true);
    }

    cloneMetric(oMetric) {
        const nMetric = this.utils.deepClone(oMetric);
        nMetric.id = this.utils.generateId(3);
        const insertIndex = this.query.metrics.findIndex(d => d.id === oMetric.id ) + 1;
        this.query.metrics.splice(insertIndex, 0, nMetric);
        this.queryChanges$.next(true);
    }

    deleteMetric(id) {
        const index = this.query.metrics.findIndex(d => d.id === id ) ;
        this.query.metrics.splice(index, 1);
        this.queryChanges$.next(true);
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

}

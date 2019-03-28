import {
    Component,
    HostBinding,
    Input,
    OnInit,
    HostListener,
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
import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';



@Component({
    // tslint:disable-next-line:component-selector
    selector: 'query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: []
})
export class QueryEditorProtoComponent implements OnInit, OnDestroy {

    @HostBinding('class.query-editor-proto') private _hostClass = true;

    @Input() type;
    @Input() query: any;
    @Input() label = '';
    @Input() edit = [];
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

    // FAKE DATA
    fakeFunctionCategories: any[] = [
        {
            label: 'category 1',
            functions: [
                {
                    label: 'function 1',
                    functionCall: 'someFunction1'
                },
                {
                    label: 'function 2',
                    functionCall: 'someFunction2'
                },
                {
                    label: 'function 3',
                    functionCall: 'someFunction3'
                },
                {
                    label: 'function 4',
                    functionCall: 'someFunction4'
                }
            ]
        },
        {
            label: 'category 2',
            functions: [
                {
                    label: 'function 5',
                    functionCall: 'someFunction5'
                },
                {
                    label: 'function 6',
                    functionCall: 'someFunction6'
                },
                {
                    label: 'function 7',
                    functionCall: 'someFunction7'
                },
                {
                    label: 'function 8',
                    functionCall: 'someFunction8'
                }
            ]
        },
        {
            label: 'category 3',
            functions: [
                {
                    label: 'function 9',
                    functionCall: 'someFunction9'
                },
                {
                    label: 'function 10',
                    functionCall: 'someFunction10'
                },
                {
                    label: 'function 11',
                    functionCall: 'someFunction11'
                },
                {
                    label: 'function 12',
                    functionCall: 'someFunction12'
                }
            ]
        },
        {
            label: 'category 4',
            functions: [
                {
                    label: 'function 13',
                    functionCall: 'someFunction13'
                },
                {
                    label: 'function 14',
                    functionCall: 'someFunction14'
                },
                {
                    label: 'function 15',
                    functionCall: 'someFunction15'
                },
                {
                    label: 'function 16',
                    functionCall: 'someFunction16'
                }
            ]
        },
        {
            label: 'category 5',
            functions: [
                {
                    label: 'function 17',
                    functionCall: 'someFunction17'
                },
                {
                    label: 'function 18',
                    functionCall: 'someFunction18'
                },
                {
                    label: 'function 19',
                    functionCall: 'someFunction19'
                },
                {
                    label: 'function 20',
                    functionCall: 'someFunction20'
                }
            ]
        }
    ];

    constructor(private elRef: ElementRef, private utils: UtilsService, private fb: FormBuilder, ) { }

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
                };
                this.query.metrics.splice(insertIndex, 0, oMetric);
            }
        }
        this.queryChanges$.next(true);
    }

    updateFilters(filters) {
        this.query.filters = filters;
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

    addFunction($event, catIdx, funcIdx) {
        console.log('MENU', this.functionSelectionMenu);
        // do something

        // close menu
        // tslint:disable-next-line:max-line-length
        const trigger: MatMenuTrigger = <MatMenuTrigger>this.functionMenuTriggers.find((el, i) => i === this.selectedFunctionCategoryIndex);
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

}

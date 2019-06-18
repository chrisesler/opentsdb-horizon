import {
    Component,
    OnInit,
    OnDestroy,
    HostBinding,
    ViewChild,
    ElementRef,
    AfterContentInit, EventEmitter,
    Output,
    Input
} from '@angular/core';

import { FormBuilder, FormGroup, FormArray, FormControl, Validators, FormsModule, NgForm } from '@angular/forms';
import { ElementQueries, ResizeSensor} from 'css-element-queries';

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material';

import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef
} from '@angular/material';

import { Subscription} from 'rxjs';

import { NameAlertDialogComponent } from '../name-alert-dialog/name-alert-dialog.component';
import { IDygraphOptions } from '../../../shared/modules/dygraphs/IDygraphOptions';
import { QueryService } from '../../../core/services/query.service';
import { HttpService } from '../../../core/http/http.service';
import { UtilsService } from '../../../core/services/utils.service';
import { DatatranformerService } from '../../../core/services/datatranformer.service';
import { ErrorDialogComponent } from '../../../shared/modules/sharedcomponents/components/error-dialog/error-dialog.component';
import { pairwise, startWith } from 'rxjs/operators';
import { IntercomService } from '../../../core/services/intercom.service';
import { AlertConverterService } from '../../services/alert-converter.service';

@Component({
// tslint:disable-next-line: component-selector
    selector: 'alert-configuration-dialog',
    templateUrl: './alert-configuration-dialog.component.html',
    styleUrls: []
})


export class AlertConfigurationDialogComponent implements OnInit, OnDestroy, AfterContentInit {
    @HostBinding('class.alert-configuration-dialog-component') private _hostClass = true;

    @ViewChild('graphOutput') private graphOutput: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;

    @Input() response;

    @Output() configChange = new EventEmitter();

    // placeholder for expected data from dialogue initiation
    @Input() data: any = {
        namespace: '',
        name: 'Untitled Alert',
        queries: []
    };

    // metric query?
    queries = [];

    // DYGRAPH OPTIONS
    options: IDygraphOptions = {
        labels: ['x'],
        labelsUTC: false,
        labelsKMB: true,
        connectSeparatedPoints: false,
        drawPoints: false,
        //  labelsDivWidth: 0,
        // legend: 'follow',
        logscale: false,
        digitsAfterDecimal: 2,
        stackedGraph: false,
        strokeWidth: 1,
        strokeBorderWidth: 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            highlightCircleSize: 7
        },
        xlabel: '',
        ylabel: '',
        y2label: '',
        axisLineWidth: 0,
        axisTickSize: 0,
        axisLineColor: '#fff',
        axes: {
            y: {
                valueRange: [null, null],
                tickFormat: {}
            },
            y2: {
                valueRange: [null, null],
                drawGrid: true,
                independentTicks: true,
                tickFormat: {}
            }
        },
        series: {},
        visibility: [],
        gridLineColor: '#ccc',
    };
    queryData: any = {};
    chartData = { ts: [[0]] };
    size: any = {
        height: 180
    };

    recipients = {'slack' : [{'name': 'yamas_dev'}], 'oc': [{'name': 'oc red'}]};

    thresholds: any = { };
    // tslint:disable-next-line:no-inferrable-types
    showThresholdAdvanced: boolean = false; // toggle in threshold form

    // FORM STUFF
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    alertName: FormControl = new FormControl('');
    alertForm: FormGroup;

    // form control options
    ocSeverityOptions: any[] = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' }
    ];

    opsGeniePriorityOptions: any[] = [
        { label: 'P1', value: 'P1' },
        { label: 'P2', value: 'P2' },
        { label: 'P3', value: 'P3' },
        { label: 'P4', value: 'P4' },
        { label: 'P5', value: 'P5' }
    ];

    // SUBSCRIPTIONS HOLDER
    subs: any = {};
    sub: Subscription;
    nQueryDataLoading = 0;
    showDetail = false;

    // DIALOGUES
    nameAlertDialog: MatDialogRef<NameAlertDialogComponent> | null;

    error: any;
    errorDialog: MatDialogRef<ErrorDialogComponent> | null;

    // tslint:disable-next-line:no-inferrable-types
    activeTabIndex: number = 0;

    constructor(
        private fb: FormBuilder,
        private queryService: QueryService,
        private httpService: HttpService,
        private dataTransformer: DatatranformerService,
        private utils: UtilsService,
        private elRef: ElementRef,
        public dialog: MatDialog,
        private interCom: IntercomService,
        private alertConverter: AlertConverterService
    ) {
        // this.data = dialogData;
        if (this.data.name) {
            this.alertName.setValue(this.data.name);
        }
    }

    ngOnInit() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        this.setupForm(this.data);
    }

    ngOnDestroy() {
        this.subs.badStateSub.unsubscribe();
        this.subs.warningStateSub.unsubscribe();
        this.subs.recoveryStateSub.unsubscribe();
        this.subs.recoveryTypeSub.unsubscribe();
        this.subs.metricIdSub.unsubscribe();
    }

    ngAfterContentInit() {

        ElementQueries.listen();
        ElementQueries.init();

        const resizeSensor = new ResizeSensor(this.graphOutput.nativeElement, () => {
             const newSize = {
                width: this.graphOutput.nativeElement.clientWidth,
                height: this.graphOutput.nativeElement.clientHeight
            };
            this.size = newSize;
        });
    }

    setupForm(data = null) {
        const def = {
                threshold : { singleMetric: {} },
                notification: {},
                queries: { raw: {}, tsdb: {}}
            };
        data = Object.assign(def, data);
        this.showDetail = data.id ? true : false;
        this.setQuery();
        this.reloadData();

        // TODO: need to check if there is something in this.data

        this.alertForm = this.fb.group({
            name: data.name || 'Untitled Alert',
            type: data.type || 'simple',
            enabled: data.enabled === undefined ? true : data.enabled,
            alertGroupingRules: [ data.alertGroupingRules || []],
            labels: this.fb.array(data.labels || []),
            threshold: this.fb.group({
                subType: data.threshold.subType || 'singleMetric',
                nagInterval: data.threshold.nagInterval || '0',
                notifyOnMissing: data.threshold.notifyOnMissing ? data.threshold.notifyOnMissing.toString() : 'false',
                delayEvaluation: data.threshold.delayEvaluation || 0,
                singleMetric: this.fb.group({
                    queryIndex: data.threshold.singleMetric.queryIndex || -1 ,
                    queryType : data.threshold.singleMetric.queryType || 'tsdb',
                    // tslint:disable-next-line:max-line-length
                    metricId: [ data.threshold.singleMetric.metricId ? this.getMetricDropdownValue(data.queries.raw, data.threshold.singleMetric.queryIndex, data.threshold.singleMetric.metricId) : ''],
                    badThreshold:  data.threshold.singleMetric.badThreshold || null,
                    warnThreshold: data.threshold.singleMetric.warnThreshold || null,
                    recoveryThreshold: data.threshold.singleMetric.recoveryThreshold || null,
                    recoveryType: data.threshold.singleMetric.recoveryType || 'minimum',
                    slidingWindow : data.threshold.singleMetric.slidingWindow ? data.threshold.singleMetric.slidingWindow.toString() : '300',
                    comparisonOperator : data.threshold.singleMetric.comparisonOperator || 'above',
                    timeSampler : data.threshold.singleMetric.timeSampler || 'at_least_once'
                }),
            }, this.validateThresholds),
            notification: this.fb.group({
                transitionsToNotify: [ data.notification.transitionsToNotify || []],
                recipients: [ data.notification.recipients || {}],
                subject: data.notification.subject  || '',
                body: data.notification.body || '',
                opsgeniePriority:  data.notification.opsgeniePriority || '',
                // opsgenieTags: data.notification.opsgenieTags || '',
                // OC conditional values
                runbookId: data.notification.runbookId || '',
                ocSeverity: data.notification.ocSeverity || '5'
            })
        });

        // need to 'set' values to start the value watching from the start
        // Ideally you create the fromgroup first, then set values to get correct valueChange events
        // This is to fix the issue of there not being a first change event
        this.alertForm['controls'].threshold['controls'].singleMetric.get('badThreshold')
            .setValue(data.threshold.singleMetric.badThreshold || null, { emitEvent: true });

        this.alertForm['controls'].threshold['controls'].singleMetric.get('warnThreshold')
            .setValue(data.threshold.singleMetric.warnThreshold || null, { emitEvent: true });

        this.setThresholds('bad', data.threshold.singleMetric.badThreshold || '');
        this.setThresholds('warning', data.threshold.singleMetric.warnThreshold || '');
        this.setThresholds('recovery', data.threshold.singleMetric.recoveryType === 'specific' ? data.threshold.singleMetric.recoveryThreshold : '');

        this.subs.comparisionSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['comparisonOperator'].valueChanges.subscribe(val => {
            this.thresholdSingleMetricControls['warnThreshold'].setErrors(null);
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
        });

        // tslint:disable-next-line:max-line-length
        this.subs.badStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].valueChanges
            .pipe(
                startWith(this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].value),
                pairwise()
            ).subscribe(([prev, bad]: [any, any]) => {
                this.setThresholds('bad', bad);
                let possibleTransitions =  ['goodToBad', 'badToGood', 'warnToBad', 'badToWarn'];
                const transitions = this.alertForm['controls'].notification.get('transitionsToNotify').value;
                if ( bad === null ) {
                    // remove possible transitions (if any were selected)
                    this.alertForm['controls'].notification.get('transitionsToNotify')
                        .setValue(transitions.filter(d => !possibleTransitions.includes(d) ));
                } else if (prev === null && bad !== null) {
                    // In case warn threshold is empty, do not check warn/bad combos
                    if (this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].value === null) {
                        possibleTransitions = possibleTransitions.filter(d => !d.toLowerCase().includes('warn'));
                    }
                    // if it was previously empty/null, then turn on the default transitions
                    this.alertForm['controls'].notification.get('transitionsToNotify')
                        .setValue(transitions.concat(possibleTransitions));
                }
                this.thresholdSingleMetricControls['warnThreshold'].setErrors(null);
                this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
            });

        // tslint:disable-next-line:max-line-length
        this.subs.warningStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].valueChanges
            .pipe(
                startWith(this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].value),
                pairwise()
            ).subscribe(([prev, warn]: [any, any]) => {
                this.setThresholds('warning', warn);
                let possibleTransitions = ['warnToBad', 'badToWarn', 'warnToGood', 'goodToWarn'];
                const transitions = this.alertForm['controls'].notification.get('transitionsToNotify').value;
                if ( warn === null ) {
                    // remove possible transitions (if any were selected)
                    this.alertForm['controls'].notification.get('transitionsToNotify')
                        .setValue(transitions.filter(d => !possibleTransitions.includes(d)));
                } else if (prev === null && warn !== null) {
                    // In case bad threshold is empty, do not check warn/bad combos
                    if (this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].value === null) {
                        possibleTransitions = possibleTransitions.filter(d => !d.toLowerCase().includes('bad'));
                    }
                    // if it was previously empty/null, then turn on the default transitions
                    this.alertForm['controls'].notification.get('transitionsToNotify')
                        .setValue(transitions.concat(possibleTransitions));
                }
                this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
            });

        // tslint:disable-next-line:max-line-length
        this.subs.recoveryStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('recovery', val);
        });

        // tslint:disable-next-line:max-line-length
        this.subs.recoveryTypeSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryType'].valueChanges.subscribe(val => {
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
            // tslint:disable-next-line:max-line-length
            this.setThresholds('recovery', val === 'specific' ? this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].value : '');
        });

        // tslint:disable-next-line: max-line-length
        this.subs.metricIdSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['metricId'].valueChanges.subscribe(val => {
            const [qindex, mindex] = val ? val.split(':') : [null, null];
            const gValues = this.alertForm.get('alertGroupingRules').value;
            if ( qindex && mindex && gValues.length ) {
                let tags = this.getMetricGroupByTags(qindex, mindex);
                tags = tags.filter(v => gValues.includes(v));
                this.alertForm.get('alertGroupingRules').setValue(tags);
            } else {
                this.alertForm.get('alertGroupingRules').setValue([]);
            }
            this.refreshChart();
        });
    }


    setQuery() {
        this.queries = this.data.queries && this.data.queries.raw ? this.data.queries.raw : [{
                id: this.utils.generateId(6, this.utils.getIDs(this.data.queries)),
                namespace: '',
                metrics: [],
                filters: [],
                settings: {
                    visual: {
                        visible: true
                    }
                }
            }
        ];
    }

    validateThresholds(group) {
        const badStateCntrl = this.thresholdSingleMetricControls['badThreshold'];
        const warningStateCntrl = this.thresholdSingleMetricControls['warnThreshold'];
        const recoveryStateCntrl = this.thresholdSingleMetricControls['recoveryThreshold'];

        const recoveryMode = this.thresholdRecoveryType;
        const bad = badStateCntrl.value ? badStateCntrl.value : '';
        const warning = warningStateCntrl.value ? warningStateCntrl.value : '';
        const recovery = recoveryStateCntrl.value ? recoveryStateCntrl.value : '';
        const operator = this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;

        if ( this.alertForm.touched && bad === '' && warning === '') {
            this.alertForm['controls'].threshold.setErrors({ 'required': true });
        }

        // validate the warning value
        if ( this.alertForm.touched && bad !== '' && warning !== '' ) {
            if ( (operator === 'above' || operator === 'above_or_equal_to') && warning >= bad ) {
                warningStateCntrl.setErrors({ 'invalid': true }); 
            }
            if ( (operator === 'below' || operator === 'below_or_equal_to') && warning <= bad ) {
                warningStateCntrl.setErrors({ 'invalid': true });
            }
        }
        if ( this.alertForm.touched && recoveryMode === 'specific' && recovery === '') {
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors({ 'required': true });
        }

        // validate the recovery value
        const badOrWarning = warning !== '' ? warning : bad;
        if ( recoveryMode === 'specific' && this.alertForm.touched && badOrWarning !== '' && recovery !== '' ) {
            if ( (operator === 'above' || operator === 'above_or_equal_to') && recovery >= badOrWarning ) {
                recoveryStateCntrl.setErrors({ 'invalid': true }); 
            }
            if ( (operator === 'below' || operator === 'below_or_equal_to') && recovery <= badOrWarning ) {
                recoveryStateCntrl.setErrors({ 'invalid': true });
            }
        }
    }

    getMetricDropdownValue(queries, qindex, mid) {
        const REGDSID = /q?(\d+)?_?(m|e)(\d+).*/;
        const qids = REGDSID.exec(mid);
        const mIndex =  this.utils.getDSIndexToMetricIndex(queries[qindex], parseInt(qids[3], 10) - 1, qids[2] );
        return qindex + ':' + mIndex;
    }

    setThresholds(type, value) {
        let color;
        switch ( type ) {
            case 'bad':
                color = '#e21717';
                break;
            case 'warning':
                color = '#f0b200';
                break;
            case 'recovery':
                color = '#87d812';
                break;
        }
        const config = {
            value: value,
            scaleId: 'y',
            borderColor: color,
            borderWidth: 2,
            borderDash: [4, 4]
        };

        if ( value === null || value === '' ) {
            delete(this.thresholds[type]);
        } else {
            this.thresholds[type] = config;
        }

        this.setThresholdLines();
    }

    setThresholdLines() {
        this.options.thresholds = Object.values(this.thresholds);
        this.setChartYMax();
        this.options = {...this.options};
    }

    getSelectedMetricQueryIndex() {
        const v = this.alertForm.get('threshold').get('singleMetric').get('metricId').value;
        const [qindex, mindex] = v ? v.split(':') : [null, null];
        return qindex;
    }

    getSelectedMetric() {
        const v = this.alertForm.get('threshold').get('singleMetric').get('metricId').value;
        const [qindex, mindex] = v ? v.split(':') : [null, null];
        if ( qindex && mindex  && this.queries[qindex].metrics.length) {
            if ( this.queries[qindex].metrics[mindex].expression === undefined ) {
                return this.queries[qindex].metrics[mindex].name;
            } else {
                return this.getExpressionMetrics(qindex, mindex);
            }
        }
        return '';
    }

    getSelectedMetricTags() {
        const v = this.alertForm.get('threshold').get('singleMetric').get('metricId').value;
        const [qindex, mindex] = v ? v.split(':') : [null, null];
        if ( qindex && mindex  && this.queries[qindex].metrics.length) {
                return this.queries[qindex].metrics[mindex].groupByTags || [];
        }
        return [];
    }

    getMetricGroupByTags(qindex, mindex) {
        return this.queries[qindex] &&  this.queries[qindex].metrics[mindex] ? this.queries[qindex].metrics[mindex].groupByTags : [];
    }

    getExpressionMetrics(qindex, mindex) {
        let metrics = [];
        const expression = this.queries[qindex].metrics[mindex].expression;
        if (expression) {
            // extract the {{id}} from the expression
            const re = new RegExp(/\{\{(.+?)\}\}/, 'g');
            let matches = [];
            while (matches = re.exec(expression)) {
                const id = matches[1];
                const midx = this.queries[qindex].metrics.findIndex(d => d.id === id );
                metrics = metrics.concat(this.getExpressionMetrics( qindex, midx));
            }
        } else {
            metrics = [ this.queries[qindex].metrics[mindex].name ];
        }
        return metrics;
    }

    get thresholdControls() {
        return this.alertForm['controls'].threshold['controls'];
    }

    get thresholdSingleMetricControls() {
        return this.alertForm['controls'].threshold['controls'].singleMetric['controls'];
    }

    get thresholdType() {
        return this.thresholdControls.subType.value;
    }

    get thresholdRecoveryType() {
        return this.alertForm.get('threshold').get('singleMetric').get('recoveryType').value;
    }

    get groupRulesLabelValues() {
        return this.alertForm.get('alertGroupingRules');
    }

    get notificationRecipients() {
        return this.alertForm['controls'].notification.get('recipients');
    }

    get notificationRecipientsValue() {
        return this.alertForm['controls'].notification.get('recipients').value;
    }

    get notificationLabelValues() {
        return this.alertForm.get('labels');
    }

    get alertStateDirection() {
        const val = this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;
        const direction = { 'above': 'above',
                            'above_or_equal_to': 'above or equal to',
                            'below': 'below',
                            'below_or_equal_to': 'below or equal to' };
        return direction[val];
    }

    get recoveryStateDirection() {
        const valCheck = this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;
        switch (valCheck) {
            case 'above':
                return 'below or equal to';
            case 'above_or_equal_to':
                return 'below';
            case 'below':
                return 'above or equal to';
            case 'below_or_equal_to':
                return 'above';
        }
    }

    /** methods */


    getData() {
        const settings = {
            settings: {
                data_source: 'yamas',
                component_type: 'LinechartWidgetComponent'
            }
        };
        const time = {
            start: '1h-ago'
        };
        if (this.queries[0].namespace && this.queries[0].metrics.length) {
            const query = this.queryService.buildQuery( settings, time, {0: this.queries[0]});
            this.getYamasData(query);
        } else {
            this.nQueryDataLoading = 0;
            this.chartData = { ts: [[0]] };
        }
    }

    getTsdbQuery() {
        const settings = {
            settings: {
                data_source: 'yamas',
                component_type: 'LinechartWidgetComponent'
            }
        };
        const time = {
            start: '1h-ago'
        };
        const query = this.queryService.buildQuery( settings, time, {0 : this.queries[0]});
        return [query];
    }

    // to get query for selected metrics, my rebuild to keep time sync 1h-ago
    getYamasData(query) {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        const queryObserver = this.httpService.getYamasData(query);
        this.sub = queryObserver.subscribe(
            result => {
                this.nQueryDataLoading = 0;
                this.queryData = result;
                this.refreshChart();
            },
            err => {
                this.nQueryDataLoading = 0;
                this.error = err;
            }
        );
    }

    refreshChart() {
        const config = {
            queries: []
        };
        const v = this.thresholdSingleMetricControls.metricId.value;
        const [qIndex, mIndex] = v ? v.split(':') : [null, null];
        const queries = this.utils.deepClone(this.queries);
        if ( qIndex && mIndex && queries.length ) {
            for ( let i = 0; i < queries.length; i++ ) {
                for ( let j = 0; j < queries[i].metrics.length; j++ ) {
                    queries[i].metrics[j].settings.visual.visible = qIndex == i && mIndex == j ? true : false;
                }
            }
        }
        config.queries = queries;
        const data = this.dataTransformer.yamasToDygraph(config, this.options, [[0]], this.queryData);
        this.setChartYMax();
        this.chartData = { ts: data };
    }

    setChartYMax() {
        // check the y max value 
        const bad = this.thresholdSingleMetricControls['badThreshold'].value;
        const warning = this.thresholdSingleMetricControls['warnThreshold'].value;
        const recovery = this.thresholdSingleMetricControls['recoveryThreshold'].value;
        const max = Math.max(bad, warning, recovery);
        if ( max && max > this.options.axes.y.tickFormat.max ) {
            this.options.axes.y.valueRange[1] = max +  max * 0.1 ;
        }
    }

    updateQuery(message) {
        switch (message.action) {
            case 'QueryChange':
                // show threshold & notification section when metric is added first time
                this.showDetail = this.showDetail === false ? this.queries[0].metrics.length!==0 : this.showDetail;
                this.reloadData();
                break;
        }
    }

    reloadData() {
        this.error = '';
        this.nQueryDataLoading = 1;
        this.getData();
    }

    getExpressionLabel(qindex, mindex) {
        const label = 'e';
        let eIndex = -1;
        for ( let i =0; i <= mindex && i < this.queries[qindex].metrics.length; i++ ) {
            if ( this.queries[qindex].metrics[i].expression ) {
                eIndex++;
            }
        }
        return label + (eIndex + 1);
    }

    showError() {
        const parentPos = this.elRef.nativeElement.getBoundingClientRect();
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        const offsetHeight = 60;
        dialogConf.width = '50%';
        dialogConf.minWidth = '500px';
        dialogConf.height = '200px';
        dialogConf.backdropClass = 'error-dialog-backdrop';
        dialogConf.panelClass = 'error-dialog-panel';
        dialogConf.data = this.error;

        this.errorDialog = this.dialog.open(ErrorDialogComponent, dialogConf);
        this.errorDialog.afterClosed().subscribe((dialog_out: any) => {
        });
    }

    setAlertName(name) {
        this.alertForm.get('name').setValue(name);
    }

    validate() {
        this.alertForm.markAsTouched();
        this.validateThresholds(this.alertForm['controls'].threshold);

        if ( !this.thresholdSingleMetricControls.metricId.value ) {
            this.thresholdSingleMetricControls.metricId.setErrors({ 'required': true });
        }

        if ( !this.alertForm['controls'].notification.get('transitionsToNotify').value.length ) {
            this.alertForm['controls'].notification.get('transitionsToNotify').setErrors({ 'required': true });
        }

        if ( Object.keys(this.notificationRecipientsValue).length === 0 ) {
            this.notificationRecipients.setErrors({ 'required': true });
        }
        if ( this.alertForm['controls'].notification.get('subject').value.trim() === '' ) {
            this.alertForm['controls'].notification.get('subject').setErrors({ 'required': true });
        }

        if ( this.alertForm['controls'].notification.get('body').value.trim() === '' ) {
            this.alertForm['controls'].notification.get('body').setErrors({ 'required': true });
        }

        if ( this.alertForm.valid ) {
            // clear system message bar
            this.interCom.requestSend({
                action: 'clearSystemMessage',
                payload: {}
            });

            if ( !this.data.id && this.data.name === 'Untitled Alert' ) {
                this.openAlertNameDialog();
            } else {
                this.saveAlert();
            }


        } else {
            // set system message bar
            this.interCom.requestSend({
                action: 'systemMessage',
                payload: {
                    type: 'error',
                    message: 'Your form has errors. Please review your form, and try again.'
                }
            });
        }

    }

    saveAlert() {
        const data: any = this.utils.deepClone(this.alertForm.getRawValue());
        data.id = this.data.id;
        data.queries = { raw: this.queries, tsdb: this.getTsdbQuery()};
        const [qindex, mindex] = data.threshold.singleMetric.metricId.split(':');
        data.threshold.singleMetric.queryIndex = qindex;
        // tslint:disable-next-line: max-line-length
        data.threshold.singleMetric.metricId =  this.utils.getDSId({0 : this.queries[0]}, qindex, mindex) + (this.queries[qindex].metrics[mindex].expression === undefined ? '-groupby' : '');
        data.threshold.isNagEnabled = data.threshold.nagInterval!== "0" ? true : false;
        data.version = this.alertConverter.getAlertCurrentVersion();
        // emit to save the alert
        this.configChange.emit({ action: 'SaveAlert', namespace: this.data.namespace, payload: { data: this.utils.deepClone([data]) }} );
    }

    cancelEdit() {
        // emit with no event
        this.configChange.emit({
            action: 'CancelEdit'
        });
    }

    /** Events */

    removeNotificationLabelValue(i: number) {
        const control = <FormArray>this.notificationLabelValues;
        control.removeAt(i);
    }

    addNotificationLabelValue(event: MatChipInputEvent) {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            const control = <FormArray>this.notificationLabelValues;
            control.push(new FormControl(value.trim()));
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }

    /*
    removeQueryGroupRuleValue(i: number) {
        const control = <FormArray>this.groupRulesLabelValues;
        control.removeAt(i);
    }

    addQueryGroupRuleValue(event: MatChipInputEvent) {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            const control = <FormArray>this.groupRulesLabelValues;
            control.push(new FormControl(value.trim()));
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }
    */

    setQueryGroupRules(arr) {
        this.groupRulesLabelValues.setValue(arr);
    }

    recoveryTypeChange(event: any) {
        const control = <FormControl>this.thresholdSingleMetricControls.recoveryType;
        control.setValue(event.value);
        // console.log('recoveryTypeChange', event.value);
    }

    alertRecipientsUpdate(event: any) {
        if ( this.notificationRecipients.value.oc &&  !event.oc) {
            this.alertForm['controls'].notification.get('runbookId').setValue('');
            this.alertForm['controls'].notification.get('ocSeverity').setValue('');
        }

        if ( this.notificationRecipients.value.opsgenie && !event.opsgenie) {
            this.alertForm['controls'].notification.get('opsgeniePriority').setValue('');
        }
        this.notificationRecipients.setValue(event);

    }

    /** Privates */

    private openAlertNameDialog() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        dialogConf.width = '300px';
        dialogConf.panelClass = 'name-alert-dialog-panel';

        this.nameAlertDialog = this.dialog.open(NameAlertDialogComponent, dialogConf);

        this.nameAlertDialog.afterClosed().subscribe((dialog_out: any) => {
            // console.log('NAME ALERT DIALOG [afterClosed]', dialog_out);
            if (dialog_out && dialog_out.alertName) {
                this.data.name = dialog_out.alertName;
                this.alertForm.controls.name.setValue(this.data.name);
                this.saveAlert();
            } else {
                this.nameAlertDialog.close();
            }
        });
    }

}

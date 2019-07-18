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
import { MatChipInputEvent, MatTableDataSource } from '@angular/material';

import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef
} from '@angular/material';

import { Subscription, Observable, of } from 'rxjs';

import { NameAlertDialogComponent } from '../name-alert-dialog/name-alert-dialog.component';
import { IDygraphOptions } from '../../../shared/modules/dygraphs/IDygraphOptions';
import { QueryService } from '../../../core/services/query.service';
import { HttpService } from '../../../core/http/http.service';
import { UtilsService } from '../../../core/services/utils.service';
import { MetaService } from '../../../core/services/meta.service';
import { DatatranformerService } from '../../../core/services/datatranformer.service';
import { ErrorDialogComponent } from '../../../shared/modules/sharedcomponents/components/error-dialog/error-dialog.component';
import { pairwise, startWith } from 'rxjs/operators';
import { IntercomService } from '../../../core/services/intercom.service';
import { AlertConverterService } from '../../services/alert-converter.service';

@Component({
// tslint:disable-next-line: component-selector
    selector: 'alert-details',
    templateUrl: './alert-details.component.html',
    styleUrls: []
})

export class AlertDetailsComponent implements OnInit, OnDestroy, AfterContentInit {
    @HostBinding('class.alert-details-component') private _hostClass = true;

    @ViewChild('graphOutput') private graphOutput: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;

    @Input() response;

    @Input() viewMode: string = ''; // edit || view

    @Input() hasWriteAccess: boolean = false;

    get readOnly(): boolean {
        if (!this.hasWriteAccess) { return true; }
        return (this.viewMode === 'edit') ? false : true;
    }

    @Output() configChange = new EventEmitter();

    // placeholder for expected data from dialogue initiation
    @Input() data: any = {
        namespace: '',
        name: 'Untitled Alert',
        queries: []
    };

    // metric query?
    queries = [];
    tags: string[];

    // DYGRAPH OPTIONS
    options: IDygraphOptions = {
        labels: ['x'],
        labelsUTC: false,
        labelsKMB: true,
        connectSeparatedPoints: true,
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
    thresholdType: String = '';
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

    alertOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    recoverOptions: any[] = [
                                { label: 'Never', value: null },
                                { label: 'After 1 hour', value: 60 * 60 },
                                { label: 'After 2 hours', value: 120 * 60 },
                                { label: 'After 4 hours', value: 240 * 60 },
                                { label: 'After 8 hours', value: 480 * 60 },
                                { label: 'After 12 hours', value: 720 * 60 },
                                { label: 'After 24 hours', value: 1440 * 60 }
                            ];

    transitionOptions: any = {
                                'goodToBad' : 'Good To Bad',
                                'warnToBad' : 'Warn To Bad',
                                'warnToGood' : 'Warn To Good',
                                'badToGood' : 'Bad to Good',
                                'goodToWarn' : 'Good To Warn',
                                'badToWarn' : 'Bad to Warn',
                                'goodToUnknown' : 'Good To Unknown',
                                'UnknownToGood' : 'Unknown To Good',
                                'badToUnknown' : 'Bad To Unknown',
                                'UnknownToBad' : 'Unknown To Bad',
                                'warnToUnknown' : 'Warn To Unknown',
                                'UnknownToWarn' : 'Unknown To Warn'
                            };
    sub: Subscription;
    nQueryDataLoading = 0;
    showDetail = false;

    // DIALOGUES
    nameAlertDialog: MatDialogRef<NameAlertDialogComponent> | null;

    error: any;
    errorDialog: MatDialogRef<ErrorDialogComponent> | null;

    // tslint:disable-next-line:no-inferrable-types
    activeTabIndex: number = 0;
    private subscription: Subscription = new Subscription();

    // FOR DISPLAY ONLY VIEW - metric columns
    metricTableDisplayColumns: string[] = [
        'metric-index',
        'name',
        'modifiers'
    ];

    constructor(
        private fb: FormBuilder,
        private queryService: QueryService,
        private metaService: MetaService,
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
        switch ( this.data.type ) {
            case 'simple':
                this.thresholdType = 'singleMetric';
                this.setupForm(this.data);
                break;
            case 'healthcheck':
                this.thresholdType = 'healthCheck';
                this.setupHealthCheckForm(this.data);
                break;
        }
    }


    ngOnDestroy() {
        this.subscription.unsubscribe();
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
        const bad = data.threshold.singleMetric.badThreshold !== undefined ? data.threshold.singleMetric.badThreshold : null;
        const warn = data.threshold.singleMetric.warnThreshold !== undefined ? data.threshold.singleMetric.warnThreshold : null;
        const recover = data.threshold.singleMetric.recoveryThreshold !== undefined ? data.threshold.singleMetric.recoveryThreshold : null;
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
                    badThreshold:  bad,
                    warnThreshold: warn,
                    recoveryThreshold: recover,
                    recoveryType: data.threshold.singleMetric.recoveryType || 'minimum',
                    // tslint:disable-next-line:max-line-length
                    slidingWindow : data.threshold.singleMetric.slidingWindow ? data.threshold.singleMetric.slidingWindow.toString() : '300',
                    comparisonOperator : data.threshold.singleMetric.comparisonOperator || 'above',
                    timeSampler : data.threshold.singleMetric.timeSampler || 'at_least_once'
                })
            }, this.validateSingleMetricThresholds),
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
        this.setTags();

        // need to 'set' values to start the value watching from the start
        // Ideally you create the fromgroup first, then set values to get correct valueChange events
        // This is to fix the issue of there not being a first change event
        this.alertForm['controls'].threshold['controls'].singleMetric.get('badThreshold')
            .setValue(bad, { emitEvent: true });

        this.alertForm['controls'].threshold['controls'].singleMetric.get('warnThreshold')
            .setValue(warn, { emitEvent: true });

        this.setThresholds('bad', bad);
        this.setThresholds('warning', warn);
        this.setThresholds('recovery', recover);

        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['comparisonOperator'].valueChanges.subscribe(val => {
            this.thresholdSingleMetricControls['warnThreshold'].setErrors(null);
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
        }));

        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].valueChanges
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
            }));

        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].valueChanges
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
            }));

        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('recovery', val);
        }));

        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryType'].valueChanges.subscribe(val => {
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors(null);
            // tslint:disable-next-line:max-line-length
            this.setThresholds('recovery', val === 'specific' ? this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].value : '');
        }));

        // tslint:disable-next-line: max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['metricId'].valueChanges.subscribe(val => {
            const [qindex, mindex] = val ? val.split(':') : [null, null];
            const gValues = this.alertForm.get('alertGroupingRules').value;
            if ( qindex && mindex && gValues.length ) {
                let tags = this.getMetricGroupByTags(qindex, mindex);
                tags = tags.filter(v => gValues.includes(v));
                this.alertForm.get('alertGroupingRules').setValue(tags);
            } else {
                this.alertForm.get('alertGroupingRules').setValue([]);
            }
            this.setTags();
            this.refreshChart();
        }));
    }

    setupHealthCheckForm(data = null) {
        const def = {
                threshold : { healthCheck: {} },
                notification: {},
                queries: { aura: [] }
            };
        data = Object.assign(def, data);
        this.showDetail = data.id ? true : false;
        this.showThresholdAdvanced = data.threshold.nagInterval > 0 ? true : false;
        this.setQuery();
        this.alertForm = this.fb.group({
            name: data.name || 'Untitled Alert',
            type: 'healthcheck',
            enabled: data.enabled === undefined ? true : data.enabled,
            alertGroupingRules: [ data.alertGroupingRules || []],
            labels: this.fb.array(data.labels || []),
            threshold: this.fb.group({
                subType: data.threshold.subType || 'healthCheck',
                nagInterval: data.threshold.nagInterval || '0',
                notifyOnMissing: data.threshold.notifyOnMissing ? data.threshold.notifyOnMissing.toString() : 'false',
                missingDataPurgeInterval: data.threshold.missingDataPurgeInterval || null,
                missingDataInterval: data.threshold.missingDataInterval || null,
                healthCheck: this.fb.group({
                    queryIndex: 0,
                    queryType : 'aura',
                    badThreshold:  data.threshold.healthCheck.badThreshold || null,
                    recoveryThreshold: data.threshold.healthCheck.recoveryThreshold || 1,
                    warnThreshold: data.threshold.healthCheck.warnThreshold || null,
                    unknownThreshold: data.threshold.healthCheck.unknownThreshold || null,
                })
            }),
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
        this.setTags();
        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['healthCheck']['controls']['badThreshold'].valueChanges
                .subscribe( bad => {
                    const transitions = this.alertForm['controls'].notification.get('transitionsToNotify').value;
                    if ( !bad ) {
                        // remove possible transitions (if any were selected)
                        this.alertForm['controls'].notification.get('transitionsToNotify')
                            .setValue(transitions.filter(d => !d.toLowerCase().includes('bad') ));
                    }
                }));
        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['healthCheck']['controls']['warnThreshold'].valueChanges
                .subscribe( warn => {
                    const transitions = this.alertForm['controls'].notification.get('transitionsToNotify').value;
                    if ( !warn ) {
                        this.alertForm['controls'].notification.get('transitionsToNotify')
                            .setValue(transitions.filter(d => !d.toLowerCase().includes('warn') ));
                    }
                }));
        // tslint:disable-next-line:max-line-length
        this.subscription.add(<Subscription>this.alertForm.controls['threshold']['controls']['healthCheck']['controls']['unknownThreshold'].valueChanges
                .subscribe( unknown => {
                    const transitions = this.alertForm['controls'].notification.get('transitionsToNotify').value;
                    if ( !unknown ) {
                        this.alertForm['controls'].notification.get('transitionsToNotify')
                            .setValue(transitions.filter(d => !d.toLowerCase().includes('unknown') ));
                    }
                }));
    }

    setQuery() {
        this.queries = this.data.queries && this.data.queries.raw ? this.data.queries.raw : [ this.getNewQueryConfig() ];
    }

    addNewQuery() {
        this.queries.push(this.getNewQueryConfig());
    }

    cloneQuery(qid) {
        const qindex = this.queries.findIndex(d => d.id === qid);
        if ( qindex !== -1 ) {
            const query = this.utils.getQueryClone(this.queries, qindex);
            this.queries.splice(qindex + 1, 0, query);
        }
    }

    deleteQuery(qid) {
        const [ qidx, midx ] = this.thresholdSingleMetricControls.metricId.value.split(':');
        const qindex = this.queries.findIndex(d => d.id === qid);
        if ( parseInt(qidx, 10) === qindex ) {
            this.thresholdSingleMetricControls.metricId.setValue('');
        }
        this.queries.splice(qindex, 1);
    }

    getNewQueryConfig() {
        const query: any = {
            id: this.utils.generateId(6, this.utils.getIDs(this.queries)),
            namespace: '',
            metrics: [],
            filters: [],
            settings: {
                visual: {
                    visible: true
                }
            }
        };
        return query;
    }

    validateSingleMetricThresholds(group) {
        const badStateCntrl = this.thresholdSingleMetricControls['badThreshold'];
        const warningStateCntrl = this.thresholdSingleMetricControls['warnThreshold'];
        const recoveryStateCntrl = this.thresholdSingleMetricControls['recoveryThreshold'];

        const recoveryMode = this.thresholdRecoveryType;
        const bad = badStateCntrl.value;
        const warning = warningStateCntrl.value;
        const recovery = recoveryStateCntrl.value;
        const operator = this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;

        if ( this.alertForm.touched && badStateCntrl.value === null && warningStateCntrl.value === null ) {
            this.alertForm['controls'].threshold.setErrors({ 'required': true });
        }

        // validate the warning value
        if ( this.alertForm.touched && badStateCntrl.value !== null && warningStateCntrl.value !== null ) {
            if ( (operator === 'above' || operator === 'above_or_equal_to') && warning >= bad ) {
                warningStateCntrl.setErrors({ 'invalid': true }); 
            }
            if ( (operator === 'below' || operator === 'below_or_equal_to') && warning <= bad ) {
                warningStateCntrl.setErrors({ 'invalid': true });
            }
        }
        if ( this.alertForm.touched && recoveryMode === 'specific' && recoveryStateCntrl.value === null ) {
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors({ 'required': true });
        }

        // validate the recovery value
        const badOrWarning = warningStateCntrl.value !== null ? warning : bad;
        if ( recoveryMode === 'specific' && this.alertForm.touched && badOrWarning !== null && recoveryStateCntrl.value !== null ) {
            if ( (operator === 'above' || operator === 'above_or_equal_to') && recovery >= badOrWarning ) {
                recoveryStateCntrl.setErrors({ 'invalid': true }); 
            }
            if ( (operator === 'below' || operator === 'below_or_equal_to') && recovery <= badOrWarning ) {
                recoveryStateCntrl.setErrors({ 'invalid': true });
            }
        }
    }

    validateHealthCheckForm() {
        const bad = this.healthCheckControls['badThreshold'].value;
        const warn = this.healthCheckControls['warnThreshold'].value;
        const unknown = this.healthCheckControls['unknownThreshold'].value;
        const notifyOnMissing = this.thresholdControls['notifyOnMissing'].value;
        const missingDataInterval = this.thresholdControls['missingDataInterval'].value;

        if (  !bad  && !warn && !unknown && notifyOnMissing === 'false' ) {
            this.alertForm['controls'].threshold.setErrors({ 'required': true });
        }

        this.thresholdControls.missingDataInterval.setErrors(null);
        if ( notifyOnMissing === 'true' && missingDataInterval === null ) {
            this.thresholdControls.missingDataInterval.setErrors({ 'required': true });
        }

        // transitionsToNotify is required only when bad or warn or unknown is selected
        if ( (bad  || warn || unknown)  && !this.alertForm['controls'].notification.get('transitionsToNotify').value.length ) {
            this.alertForm['controls'].notification.get('transitionsToNotify').setErrors({ 'required': true });
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

    setTags() {
        if ( this.thresholdType === 'singleMetric' ) {
            const v = this.alertForm.get('threshold').get('singleMetric').get('metricId').value;
            const [qindex, mindex] = v ? v.split(':') : [null, null];
            let res = [];
            if ( qindex && mindex  && this.queries[qindex] && this.queries[qindex].metrics.length) {
                    res = this.queries[qindex].metrics[mindex].groupByTags || [];
                    this.tags = res;
            }
        } else {
            const query: any = { search: '', namespace: this.queries[0].namespace, tags: this.queries[0].filters, metrics: [] };
            if (this.queries[0].namespace !== '' ) {
                this.httpService.getNamespaceTagKeys(query, 'aurastatus')
                                .subscribe( res => {
                                    this.tags = res.map( d => d.name);
                                });
            }
        }
    }


    getMetricGroupByTags(qindex, mindex) {
        return this.queries[qindex] &&  this.queries[qindex].metrics[mindex] ? this.queries[qindex].metrics[mindex].groupByTags : [];
    }


    get thresholdControls() {
        return this.alertForm['controls'].threshold['controls'];
    }

    get thresholdSingleMetricControls() {
        return this.alertForm['controls'].threshold['controls'].singleMetric['controls'];
    }

    get healthCheckControls() {
        return this.alertForm['controls'].threshold['controls'].healthCheck['controls'];
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

    getAutoRecoveryOptionByVal(v) {
        const index = this.recoverOptions.findIndex(d => d.value === v );
        return this.recoverOptions[index];
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
        const queries = {};
        for (let i = 0; i < this.queries.length; i++) {
            const query: any = JSON.parse(JSON.stringify(this.queries[i]));
            if (query.namespace && query.metrics.length) {
                queries[i] = query;
            }
        }

        if ( Object.keys(queries).length ) {
            const query = this.queryService.buildQuery( settings, time, queries);
            this.getYamasData(query);
        } else {
            this.nQueryDataLoading = 0;
            this.options.labels = ['x'];
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
        const queries = {};
        for (let i = 0; i < this.queries.length; i++) {
            const query: any = JSON.parse(JSON.stringify(this.queries[i]));
            queries[i] = query;
        }
        const q = this.queryService.buildQuery( settings, time, queries);
        return [q];
    }

    getMetaQuery() {
        const query: any = { search: '', namespace: this.queries[0].namespace, tags: this.queries[0].filters, metrics: [] };
        const metaQuery = this.metaService.getQuery('aurastatus', 'TAG_KEYS', query);
        return metaQuery.queries;
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
        this.options.labels = ['x'];
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
                const metrics = this.utils.getAllMetrics(this.queries);
                this.showDetail = this.showDetail === false ? metrics.length !== 0 : this.showDetail;
                this.reloadData();
                this.setTags();
                break;
            case 'CloneQuery':
                this.cloneQuery(message.id);
                this.queries = this.utils.deepClone(this.queries);
                this.reloadData();
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.id);
                if ( this.queries.length === 0 ) {
                    this.addNewQuery();
                }
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
        const label = 'q' + (qindex + 1) + '.e';
        let eIndex = -1;
        for ( let i = 0; i <= mindex && i < this.queries[qindex].metrics.length; i++ ) {
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
        switch ( this.data.type ) {
            case 'simple':
                this.validateSingleMetricThresholds(this.alertForm['controls'].threshold);
                if ( !this.thresholdSingleMetricControls.metricId.value ) {
                    this.thresholdSingleMetricControls.metricId.setErrors({ 'required': true });
                }
                if ( !this.alertForm['controls'].notification.get('transitionsToNotify').value.length ) {
                    this.alertForm['controls'].notification.get('transitionsToNotify').setErrors({ 'required': true });
                }
                break;
            case 'healthcheck':
                this.validateHealthCheckForm();
                break;
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
        switch( data.type ) {
            case 'simple':
                data.queries = { raw: this.queries, tsdb: this.getTsdbQuery()};
                const [qindex, mindex] = data.threshold.singleMetric.metricId.split(':');
                data.threshold.singleMetric.queryIndex = qindex;
                // tslint:disable-next-line: max-line-length
                data.threshold.singleMetric.metricId =  this.utils.getDSId( this.utils.arrayToObject(this.queries), qindex, mindex) + (this.queries[qindex].metrics[mindex].expression === undefined ? '_groupby' : '');
                break;
            case 'healthcheck':
                data.threshold.missingDataInterval = data.threshold.notifyOnMissing === 'true' ? data.threshold.missingDataInterval : null;
                data.queries = { aura: this.getMetaQuery(), raw: this.queries };
                break;
        }
        data.threshold.isNagEnabled = data.threshold.nagInterval !== '0' ? true : false;
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

    // FOR DISPLAY ONLY VIEW OF METRICS - Simulate data source for metric table
    simulateMetricDataSource(queryMetrics: any[]) {

        // extract metrics only, then format with pre-constructed label, a type, and reference to the metric data
        const metrics = [];
        queryMetrics.filter(d => d.expression === undefined).forEach((metric, i) => {
            metrics.push({ indexLabel: 'm' + (i + 1), type: 'metric', metric });
        });

        // extract expressions only, then format with pre-constructed label, a type, and reference to the expression data
        const expressions = [];
        queryMetrics.filter(d => d.expression !== undefined).forEach((metric, i) => {
            expressions.push({ indexLabel: 'e' + (i + 1), type: 'expression', metric });
        });

        // merge the arrays and create datasource
        return new MatTableDataSource(metrics.concat(expressions));
    }

    // FOR DISPLAY ONLY VIEW OF METRICS - to get expression output
    getExpressionUserInput(expression, query) {

        const handleBarsRegex = /\{\{(.+?)\}\}/;
        // replace {{<id>}} to m|e<index>
        const re = new RegExp(handleBarsRegex, 'g');
        let matches = [];
        let userExpression = expression;
        const aliases = this.getHashMetricIdUserAliases(query);
        while (matches = re.exec(expression)) {
            const id = '' + matches[1];
            const idreg = new RegExp('\\{\\{' + id + '\\}\\}', 'g');
            userExpression = userExpression.replace(idreg, aliases[id]);
        }
        return userExpression;
    }

    // FOR DISPLAY ONLY VIEW OF METRICS - helper used by the above function
    getHashMetricIdUserAliases(query: any) {
        let metricIndex = 0;
        let expressionIndex = 0;
        const aliases = {};

        // cross-query aliases
        for (let i = 0; i < this.queries.length; i++) {
            const queryIndex = i + 1;
            metricIndex = 0;
            expressionIndex = 0;
            for (let j = 0; j < this.queries[i].metrics.length; j++) {
                const alias = this.queries[i].metrics[j].expression === undefined ?
                    'q' + queryIndex + '.' + 'm' + ++metricIndex :
                    'q' + queryIndex + '.' + 'e' + ++expressionIndex;
                aliases[this.queries[i].metrics[j].id] = alias;
            }
        }

        metricIndex = 0;
        expressionIndex = 0;
        for (let i = 0; i < query.metrics.length; i++) {
            const alias = query.metrics[i].expression === undefined ?
            'm' + ++metricIndex :
            'e' + ++expressionIndex;
            aliases[query.metrics[i].id] = alias;
        }

        return aliases;
    }

    // FOR DISPLAY ONLY VIEW OF METRICS - helper to extract recipient types from data
    getRecipientTypeKeys(): any[] {
        return Object.keys(this.data.notification.recipients);
    }

    // FOR DISPLAY ONLY VIEW OF METRICS - helper to get display value of recipient type
    typeToDisplayName(type: string): string {
        const types = {
            opsgenie: 'OpsGenie',
            slack: 'Slack',
            http: 'HTTP',
            oc: 'OC',
            email: 'Email'
        }
        return types[type];
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

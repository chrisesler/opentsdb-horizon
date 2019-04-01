import {
    Component,
    OnInit,
    OnDestroy,
    OnChanges,
    Inject,
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
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material';

import { Subscription, Observable } from 'rxjs';

import { NameAlertDialogComponent } from '../name-alert-dialog/name-alert-dialog.component';
import { IDygraphOptions } from '../../../shared/modules/dygraphs/IDygraphOptions';
import { QueryService } from '../../../core/services/query.service';
import { HttpService } from '../../../core/http/http.service';
import { UtilsService } from '../../../core/services/utils.service';
import { DatatranformerService } from '../../../core/services/datatranformer.service';
import { ErrorDialogComponent } from '../../../shared/modules/sharedcomponents/components/error-dialog/error-dialog.component';

@Component({
    selector: 'app-alert-configuration-dialog',
    templateUrl: './alert-configuration-dialog.component.html',
    styleUrls: []
})


export class AlertConfigurationDialogComponent implements OnInit, OnChanges, OnDestroy, AfterContentInit {
    @HostBinding('class.alert-configuration-dialog-component') private _hostClass = true;

    @ViewChild('graphOutput') private graphOutput: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;

    @Input() response;
    request = new EventEmitter();


    // placeholder for expected data from dialogue initiation
    data: any = {
        namespace: 'UDB',
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
            },
            y2: {
                valueRange: [null, null],
                drawGrid: true,
                independentTicks: true
            }
        },
        series: {},
        visibility: [],
        gridLineColor: '#ccc',
        /*
        thresholds:  [
            {
                value: 200,
                axis: 'y',
                lineWeight: '2px',
                lineType: 'solid',
                lineColor: 'red'
            },
            {
                value: 500,
                axis: 'y',
                lineWeight: '2px',
                lineType: 'solid',
                lineColor: 'orange'
            }
        ]
        */
    };
    chartData: any = [[0]];
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

    // SUBSCRIPTIONS HOLDER
    subs: any = {};
    sub: Subscription;
    nQueryDataLoading = 0;

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
        public dialogRef: MatDialogRef<AlertConfigurationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any
    ) {
        this.data = dialogData;
        if (this.data.name) {
            this.alertName.setValue(this.data.name);
        }
        this.setupForm();
    }

    ngOnInit() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        if (!this.data.name || this.data.name === '') {
            // have to use setTimeout due to some issue when opening mat-dialog from a lifecycle hook.
            // see: https://github.com/angular/material2/issues/5268
            // setTimeout(() => this.openAlertNameDialog());
        }
        this.setNewQuery();
        this.reloadData();
    }

    ngOnChanges(changes) {
        console.log("changes....", changes)
    }



    ngOnDestroy() {
        // TODO: uncomment
        // this.subs.alertName.unscubscribe();
        // this.subs.alertFormName.unsubscribe();
    }

    ngAfterContentInit() {

        ElementQueries.listen();
        ElementQueries.init();
        let initSize = {
            width: this.graphOutput.nativeElement.clientWidth,
            height: this.graphOutput.nativeElement.clientHeight
        };
        
        const resizeSensor = new ResizeSensor(this.graphOutput.nativeElement, () =>{
             const newSize = {
                width: this.graphOutput.nativeElement.clientWidth,
                height: this.graphOutput.nativeElement.clientHeight
            };
            this.size = newSize;
        });
    }

    setupForm(data = null) {
        if ( ! data ) {
            data = {
                threshold : { singleMetric: {} },
                notification: {},
                queries: {}
            }
        } 
        // TODO: need to check if there is something in this.data
        this.alertForm = this.fb.group({
            name: data.name || 'Untitled Alert',
            type: data.type || 'SIMPLE',
            enabled: data.enabled || true,
            alertGroupingRules: this.fb.array(data.alertGroupingRules || []),
            labels: this.fb.array(data.labels || []),
            threshold: this.fb.group({
                subType: data.threshold.subType || 'singleMetric', 
                isNagEnabled:  data.threshold.isNagEnabled || 'false', 
                nagInterval: data.threshold.nagInterval || 0, 
                notifyOnMissing: data.threshold.notifyOnMissing || false, 
                singleMetric: this.fb.group({
                    queryIndex: data.threshold.singleMetric.queryIndex || 0 ,
                    queryType : data.threshold.singleMetric.queryIndex || 'tsdb',
                    metricId: [ data.threshold.singleMetric.metricId || '', Validators.required],
                    badThreshold:  data.threshold.singleMetric.badThreshold || '',
                    warnThreshold: data.threshold.singleMetric.warnThreshold || '',
                    recoveryThreshold: data.threshold.singleMetric.recoveryThreshold || '',
                    recoveryType: data.threshold.singleMetric.recoveryType || 'minimum', 
                    slidingWindow : data.threshold.singleMetric.slidingWindow || '',
                    comparisonOperator : data.threshold.singleMetric.comparisonOperator || 'above',
                    timeSampler : data.threshold.singleMetric.timeSampler || 'at_least_once'
                }),
            }, this.validateThresholds),
            notification: this.fb.group({
                transitionsToNotify: [ this.getAlertStatesArray(data.notification.transitionsToNotify || {})],
                recipients: [ data.notification.recipients || {}], 
                subject: data.notification.subject  || '', 
                body: data.notification.subject || '', 
                opsgeniePriority:  data.notification.opsgeniePriority || '',
                opsgenieTags: data.notification.opsgenieTags || '',
                runbookId: data.notification.runbookId || '' 
            })
        }, );


        this.subs.alertFormSub = <Subscription>this.alertForm.valueChanges.subscribe(val => {
            console.log('FORM CHANGE', val);
        });

        this.subs.badStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('bad', val);
        });
        this.subs.warningStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('warning', val);
        });
        this.subs.recoveryStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('recovery', val);
        });
        this.subs.recoveryStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryType'].valueChanges.subscribe(val => {
            this.setThresholds('recovery', val === 'specific' ? this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].value : '');
        });
    }


    setNewQuery() {
        this.queries = [{
            id: this.utils.generateId(),
            namespace: '',
            metrics: [],
            filters: [],
            settings: {
                visual: {
                    visible: true
                }
            }
        }];
    }

    getAlertStatesArray(alerts) {
        const res = [];
        for ( let k in alerts ) {
            if ( alerts[k] === true ) {
                res.push(k);
            }
        }
        return res;
    }
    validateThresholds(group) {
        const badStateCntrl = this.thresholdSingleMetricControls['badThreshold'];
        const warningStateCntrl = this.thresholdSingleMetricControls['warnThreshold'];
        const recoveryStateCntrl = this.thresholdSingleMetricControls['recoveryThreshold'];

        const recoveryMode = this.thresholdSingleMetricControls['recoveryType'].value;
        const bad = badStateCntrl.value ? badStateCntrl.value : '';
        const warning = warningStateCntrl.value ? warningStateCntrl.value : '';
        const recovery = recoveryStateCntrl.value ? recoveryStateCntrl.value : '';

        if ( this.alertForm.touched && bad === '' && warning === '') {
            this.alertForm['controls'].threshold.setErrors({ 'required': true });
        }

        if ( this.alertForm.touched && recoveryMode === 'specific' && recovery === '') {
            this.thresholdSingleMetricControls['recoveryThreshold'].setErrors({ 'required': true });
        }
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

        if ( value === '' ) {
            delete(this.thresholds[type]);
        } else {
            this.thresholds[type] = config;
        }
        this.setThresholdLines();
    }

    setThresholdLines() {
        this.options.thresholds = Object.values(this.thresholds);
        this.options = {...this.options};
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

    get notificationLabelValues() {
        return this.alertForm.get('labels');
    }

    get alertStateDirection() {
        return this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;
    }

    get recoveryStateDirection() {
        const valCheck = this.alertForm.get('threshold').get('singleMetric').get('comparisonOperator').value;
        if (valCheck === 'above') {
            return 'below';
        }
        return 'above';
    }

    /** methods */


    queryData() {
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
            const query = this.queryService.buildQuery( settings, time, this.queries[0]);
            this.getYamasData(query);
        } else {
            this.nQueryDataLoading = 0;
            this.chartData = [[0]];
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
        const query = this.queryService.buildQuery( settings, time, this.queries[0]);
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
                const groupData = {};
                groupData[query.id] = result;
                const config = {
                    queries: []
                };
                config.queries[0] = query;
                this.chartData = this.dataTransformer.yamasToDygraph(config, this.options, [[0]], groupData);
            },
            err => {
                this.nQueryDataLoading = 0;
                this.error = err;
            }
        );
    }

    updateQuery(message) {
        switch (message.action) {
            case 'QueryChange':
                // this.query = message.payload.query;
                this.reloadData();
                break;
        }
    }

    reloadData() {
        this.error = '';
        this.nQueryDataLoading = 1;
        this.queryData();
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

    validate() {
        this.alertForm.markAsTouched();
        this.validateThresholds(this.alertForm['controls'].threshold);

        if ( this.alertForm.valid ) {
            console.log("validate", !this.data.id, this.data.name)
            if ( !this.data.id && !this.data.name   ) {
                this.openAlertNameDialog();
            } else {
                this.saveAlert(); 
            }
        }

    }

    saveAlert() {
        const data:any = this.utils.deepClone(this.alertForm.getRawValue());
        data.queries = { raw: this.queries, tsdb: this.getTsdbQuery()};
        const [qindex, mindex] = data.threshold.singleMetric.metricId.split(':');
        data.threshold.singleMetric.queryIndex = qindex;
        data.threshold.singleMetric.metricId =  this.queries[qindex].metrics[mindex].expression === undefined ? 'm' + mindex + '-avg-groupby' : 'm' + mindex; 
        const transitionsToNotify = data.notification.transitionsToNotify;
        // change the notify format : {goodToBad:true}
        const objTransitionsToNotify = {};
        for ( let i = 0; i < transitionsToNotify.length; i++ ) {
            objTransitionsToNotify[transitionsToNotify[i]] = true;
        }
        data.notification.transitionsToNotify = objTransitionsToNotify;
        this.request.emit({ action: 'SaveAlert', payload: { id:this.data.id, data: this.utils.deepClone([data]) }} );
        // console.log(JSON.stringify(data), "alert form", qindex, mindex,this.queries[qindex].metrics[mindex] )
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

    recoveryTypeChange(event: any) {
        const control = <FormControl>this.thresholdSingleMetricControls.recoveryType;
        control.setValue(event.value);
        console.log("recoveryTypeChange", event.value);
    }

    alertRecipientsUpdate(event: any) {
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
            console.log('NAME ALERT DIALOG [afterClosed]', dialog_out);
            if (dialog_out && dialog_out.alertName) {
                this.data.name = dialog_out.alertName;
                this.alertForm.controls.name.setValue(this.data.name);
                this.saveAlert();
            } else {
                this.dialogRef.close();
            }
        });
    }

}

import {
    Component,
    OnInit,
    OnDestroy,
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
import { min } from 'rxjs/operators';

@Component({
    selector: 'app-alert-configuration-dialog',
    templateUrl: './alert-configuration-dialog.component.html',
    styleUrls: []
})


export class AlertConfigurationDialogComponent implements OnInit, OnDestroy, AfterContentInit {
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
        public dialogRef: MatDialogRef<AlertConfigurationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any
    ) {
        this.data = dialogData;
        if (this.data.name) {
            this.alertName.setValue(this.data.name);
        }
        this.setupForm(this.data);
    }

    ngOnInit() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        if (!this.data.name || this.data.name === '') {
            // have to use setTimeout due to some issue when opening mat-dialog from a lifecycle hook.
            // see: https://github.com/angular/material2/issues/5268
            // setTimeout(() => this.openAlertNameDialog());
        }
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
        let initSize = {
            width: this.graphOutput.nativeElement.clientWidth,
            height: this.graphOutput.nativeElement.clientHeight
        };

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
                queries: { raw: {}, tsdb:{}}
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
                isNagEnabled:  data.threshold.nagInterval ? true : 'false', 
                nagInterval: data.threshold.nagInterval || '0', 
                notifyOnMissing: data.threshold.notifyOnMissing ? data.threshold.notifyOnMissing.toString() : 'false', 
                singleMetric: this.fb.group({
                    queryIndex: data.threshold.singleMetric.queryIndex || -1 ,
                    queryType : data.threshold.singleMetric.queryType || 'tsdb',
                    // tslint:disable-next-line:max-line-length
                    metricId: [ data.threshold.singleMetric.metricId ? this.getMetricDropdownValue(data.threshold.singleMetric.queryIndex, data.threshold.singleMetric.metricId) : '', Validators.required],
                    badThreshold:  data.threshold.singleMetric.badThreshold || '',
                    warnThreshold: data.threshold.singleMetric.warnThreshold || '',
                    recoveryThreshold: data.threshold.singleMetric.recoveryThreshold || '',
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
                body: data.notification.subject || '', 
                opsgeniePriority:  data.notification.opsgeniePriority || '',
                // opsgenieTags: data.notification.opsgenieTags || '',
                // OC conditional values
                runbookId: data.notification.runbookId || '',
                ocSeverity: data.notification.ocSeverity || '5'
            })
        });

        this.setThresholds('bad', data.threshold.singleMetric.badThreshold || '');
        this.setThresholds('warning', data.threshold.singleMetric.warnThreshold || '');
        this.setThresholds('recovery', data.threshold.singleMetric.recoveryType === 'specific' ? data.threshold.singleMetric.recoveryThreshold : '');

        //this.subs.alertFormSub = <Subscription>this.alertForm.valueChanges.subscribe(val => {
        //    console.log('FORM CHANGE', val);
        //});

        // tslint:disable-next-line:max-line-length
        this.subs.badStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['badThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('bad', val);
        });
        // tslint:disable-next-line:max-line-length
        this.subs.warningStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['warnThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('warning', val);
        });
        // tslint:disable-next-line:max-line-length
        this.subs.recoveryStateSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].valueChanges.subscribe(val => {
            this.setThresholds('recovery', val);
        });
        // tslint:disable-next-line:max-line-length
        this.subs.recoveryTypeSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryType'].valueChanges.subscribe(val => {
            // tslint:disable-next-line:max-line-length
            this.setThresholds('recovery', val === 'specific' ? this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['recoveryThreshold'].value : '');
        });

        this.subs.metricIdSub = <Subscription>this.alertForm.controls['threshold']['controls']['singleMetric']['controls']['metricId'].valueChanges.subscribe(val => {
            const [qindex, mindex] = val.split(':');
            const gValues = this.alertForm.get('alertGroupingRules').value;
            if ( qindex && mindex && gValues ) {
                let tags = this.getGroupbyTags(qindex, mindex);
                tags = tags.filter(v => gValues.includes(v));
                console.log("metric selection changes", tags, JSON.stringify(gValues));
                this.alertForm.get('alertGroupingRules').setValue(tags);   
            }
        });
    }


    setQuery() {
        this.queries = this.data.queries && this.data.queries.raw ? this.data.queries.raw : [{
                id: this.utils.generateId(),
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

    getMetricDropdownValue(qindex, sourceid) {
        const mIndex = sourceid.split('-')[0].replace( /\D+/g, '');
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

    getSelectedMetricQueryIndex() {
        const [qindex, mindex] = this.alertForm.get('threshold').get('singleMetric').get('metricId').value.split(':');
        return qindex;
    }

    getSelectedMetric() {
        const [qindex, mindex] = this.alertForm.get('threshold').get('singleMetric').get('metricId').value.split(':');
        if ( qindex && mindex  && this.queries[qindex].metrics.length) {
            if ( this.queries[qindex].metrics[mindex].expression === undefined ) {
                return this.queries[qindex].metrics[mindex].name;
            } else {
                return this.getExpressionMetrics(qindex, mindex);
            }
        }
        return '';
    }

    getGroupbyTags(qindex, mindex) {
        let groupByTags = [];
        const expression = this.queries[qindex].metrics[mindex].expression;
        if (expression) {
            // replace {{<id>}} with query source id
            const re = new RegExp(/\{\{(.+?)\}\}/, "g");
            let matches = [];
            let i =0;
            while(matches = re.exec(expression)) {
                const id = matches[1];
                const mindex = this.queries[qindex].metrics.findIndex(d => d.id === id );
                const mTags = this.getGroupbyTags(qindex, mindex);
                groupByTags = i === 0 ? mTags : groupByTags.filter(v => mTags.includes(v));
                i++;
            }
        } else {
                groupByTags  =  this.queries[qindex].metrics[mindex].groupByTags || [];
        }
        return groupByTags;
    }

    getExpressionMetrics(qindex, mindex) {
        let metrics = [];
        const expression = this.queries[qindex].metrics[mindex].expression;
        if (expression) {
            // extract the {{id}} from the expression
            const re = new RegExp(/\{\{(.+?)\}\}/, "g");
            let matches = [];
            while(matches = re.exec(expression)) {
                const id = matches[1];
                const mindex = this.queries[qindex].metrics.findIndex(d => d.id === id );
                metrics = metrics.concat(this.getExpressionMetrics( qindex, mindex));
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
                groupData[this.queries[0].id] = result;
                const config = {
                    queries: []
                };
                config.queries = this.queries;
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
                // show threshold & notification section when metric is added first time
                this.showDetail = this.showDetail === false ? this.queries[0].metrics.length!==0 : this.showDetail;
                this.reloadData();
                break;
        }
    }

    reloadData() {
        this.error = '';
        this.nQueryDataLoading = 1;
        this.queryData();
    }

    getExpressionLabel(qindex, mindex) {
        let label = 'e';
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
            if ( !this.data.id && this.data.name === 'Untitled Alert' ) {
                this.openAlertNameDialog();
            } else {
                this.saveAlert();
            }
        }

    }

    saveAlert() {
        const data: any = this.utils.deepClone(this.alertForm.getRawValue());
        data.id = this.data.id;
        data.queries = { raw: this.queries, tsdb: this.getTsdbQuery()};
        const [qindex, mindex] = data.threshold.singleMetric.metricId.split(':');
        data.threshold.singleMetric.queryIndex = qindex;
        data.threshold.singleMetric.metricId =  this.queries[qindex].metrics[mindex].expression === undefined ? 'm' + mindex + '-avg-groupby' : 'm' + mindex; 
        data.threshold.isNagEnabled = data.threshold.nagInterval ? true : false;
        this.request.emit({ action: 'SaveAlert', payload: { data: this.utils.deepClone([data]) }} );
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
        console.log('recoveryTypeChange', event.value);
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
            console.log('NAME ALERT DIALOG [afterClosed]', dialog_out);
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

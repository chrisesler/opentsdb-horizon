import {
    Component,
    OnInit,
    OnDestroy,
    Inject,
    HostBinding,
    ViewChild,
    ElementRef,
    AfterContentInit
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
export class AlertConfigurationDialogComponent implements OnInit, OnDestroy, AfterContentInit {
    @HostBinding('class.alert-configuration-dialog-component') private _hostClass = true;

    @ViewChild('graphOutput') private graphOutput: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;

    // placeholder for expected data from dialogue initiation
    data: any = {
        namespace: 'UDB',
        alertName: 'Untitled Alert',
        queries: []
    };

    // metric query?
    query: any = {};

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
        gridLineColor: '#ccc'
    };
    chartData: any = [[0]];
    size: any = {
        height: 180
    };

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
        if (this.data.alertName) {
            this.alertName.setValue(this.data.alertName);
        }
        this.setupForm();
    }

    ngOnInit() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        if (!this.data.alertName || this.data.alertName === '') {
            // have to use setTimeout due to some issue when opening mat-dialog from a lifecycle hook.
            // see: https://github.com/angular/material2/issues/5268
            // setTimeout(() => this.openAlertNameDialog());
        }
        this.setNewQuery();
        this.reloadData();
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
        // this.newSize$ = new BehaviorSubject(initSize);

        /*
        this.newSizeSub = this.newSize$.subscribe(size => {
            this.setSize(size);
            this.newSize = size;
        });
        */
        
        const resizeSensor = new ResizeSensor(this.graphOutput.nativeElement, () =>{
             const newSize = {
                width: this.graphOutput.nativeElement.clientWidth,
                height: this.graphOutput.nativeElement.clientHeight
            };
            this.size = newSize;
            // this.newSize$.next(newSize);
        });
    }

    setupForm() {
        // TODO: need to check if there is something in this.data
        this.alertForm = this.fb.group({
            queries: this.fb.group({
                groupingRules: this.fb.array([])
            }),
            threshold: this.fb.group({
                type: 'simple',
                query: '',
                badStateValue: '',
                warningStateValue: '',
                recoveryNotification: 'minimum', // minimum or specific
                recoveryStateValue: '', // if recoveryNotification is 'specific'
                nagInterval: 'disabled',
                missingData: 'doNotNotify',
                slidingWindow: this.fb.group({
                    direction: 'above',
                    interval: 1,
                    windowSize: '5 min'
                })
            }),
            notification: this.fb.group({
                notifyWhen: new FormControl([]),
                recipients: this.fb.array([]),
                subject: '',
                message: '',
                labels: this.fb.array([]),
                runbookId: ''
            })
        });

        this.subs.alertFormSub = <Subscription>this.alertForm.valueChanges.subscribe(val => {
            console.log('FORM CHANGE', val);
        });

    }

    get thresholdControls() {
        return this.alertForm['controls'].threshold['controls'];
    }

    get thresholdType() {
        return this.thresholdControls.type.value;
    }

    get thresholdRecoveryNotification() {
        return this.alertForm.get('threshold').get('recoveryNotification').value;
    }

    get groupRulesLabelValues() {
        return this.alertForm['controls'].queries.get('groupingRules');
    }

    get notificationLabelValues() {
        return this.alertForm['controls'].notification.get('labels');
    }

    get alertStateDirection() {
        return this.alertForm.get('threshold').get('slidingWindow').get('direction').value;
    }

    get recoveryStateDirection() {
        const valCheck = this.alertForm.get('threshold').get('slidingWindow').get('direction').value;
        if (valCheck === 'above') {
            return 'below';
        }
        return 'above';
    }

    /** methods */

    setNewQuery() {
        this.query = {
            id: this.utils.generateId(),
            namespace: '',
            metrics: [],
            filters: [],
            settings: {
                visual: {
                    visible: true
                }
            }
        };
    }

    queryData() {
        const widget = {
            settings: {
                data_source: 'yamas',
                component_type: 'LinechartWidgetComponent'
            }
        };
        const time = {
            start: '1h-ago'
        };
        if (this.query.namespace && this.query.metrics.length) {
            const query = this.queryService.buildQuery(widget, time, this.query);
            this.getYamasData(query);
        } else {
            this.nQueryDataLoading = 0;
            this.chartData = [[0]];
        }
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
                groupData[this.query.id] = result;
                const config = {
                    queries: []
                };
                config.queries[0] = this.query;
                // this.chartData = this.dataTransformerService.yamasToDygraph(config, this.options, [[0]] , groupData);
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
                this.query = message.payload.query;
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

    recoveryNotificationChange(event: any) {
        const control = <FormControl>this.alertForm.get('threshold')['controls'].recoveryNotification;
        control.setValue(event.value);
    }

    alertRecipientsUpdate(event: any) {
        console.log('ALERT RECIPIENT UPDATE', event);
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
                this.data.alertName = dialog_out.alertName;
                this.alertName.setValue(this.data.alertName);
            } else {
                this.dialogRef.close();
            }
        });
    }

}

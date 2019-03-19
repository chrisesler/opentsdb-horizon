import {
    Component,
    OnInit,
    OnDestroy,
    Inject,
    HostBinding,
    ViewChild,
    ElementRef,
    AfterViewInit
} from '@angular/core';

import { FormControl } from '@angular/forms';

import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material';

import { Subscription, Observable } from 'rxjs';

import { NameAlertDialogComponent } from '../name-alert-dialog/name-alert-dialog.component';
import { IDygraphOptions } from  '../../../shared/modules/dygraphs/IDygraphOptions';
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
export class AlertConfigurationDialogComponent implements OnInit, OnDestroy, AfterViewInit {


    @HostBinding('class.alert-configuration-dialog-component') private _hostClass = true;

    @ViewChild('graphLegend') private dygraphLegend: ElementRef;

    nameAlertDialog: MatDialogRef<NameAlertDialogComponent> | null;

    data: any = {
        namespace: 'UDB',
        alertName: 'Untitled Alert',
        queries: []
    };

    query: any = {};

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
        strokeBorderWidth:  1,
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
        gridLineColor: '#ccc'
    };
    chartData: any = [[0]];
    size: any = {};

    // tslint:disable-next-line:no-inferrable-types
    selectedThresholdType: string = 'simple';

    alertName: FormControl = new FormControl('');

    subs: any = {};
    sub: Subscription;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;

    // tslint:disable-next-line:no-inferrable-types
    activeTabIndex: number = 0;

    constructor(
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

    setNewQuery() {
        this.query =  {
                id: this.utils.generateId(),
                namespace: '',
                metrics: [
                    
                ],
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
        if ( this.query.namespace && this.query.metrics.length ) {
            const query = this.queryService.buildQuery(widget, time, this.query);
            this.getYamasData(query);
        } else {
            this.nQueryDataLoading = 0;
            this.chartData = [[0]];
        }
    }

    // to get query for selected metrics, my rebuild to keep time sync 1h-ago
    getYamasData(query) {
        if ( this.sub ) {
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
        switch( message.action ) {
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

    ngOnDestroy() {
        this.subs.alertName.unscubscribe();
    }

    ngAfterViewInit() {
        // this.measureDetailForBalancer();
    }

    /** Events */
    /*configTabChange(index: any) {
        console.log('CONFIG TAB CHANGE', index);
        this.activeTabIndex = index;
    }*/

    changeThresholdType(thresholdType: string) {
        this.selectedThresholdType = thresholdType;
    }

    /** Privates */

    private openAlertNameDialog() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        dialogConf.width = '300px';
        // dialogConf.maxWidth = '600px';
        // dialogConf.height = 'auto';
        // dialogConf.hasBackdrop = true;
        // dialogConf.direction = 'ltr';
        // dialogConf.backdropClass = 'snooze-alert-dialog-backdrop';
        dialogConf.panelClass = 'name-alert-dialog-panel';
        /*dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };*/

        this.nameAlertDialog = this.dialog.open(NameAlertDialogComponent, dialogConf);
        // this.snoozeAlertDialog.updatePosition({ top: '48px' });
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

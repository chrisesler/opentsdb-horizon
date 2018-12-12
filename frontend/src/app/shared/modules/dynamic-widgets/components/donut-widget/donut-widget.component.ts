import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementQueries, ResizeSensor } from 'css-element-queries';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'donut-widget',
    templateUrl: './donut-widget.component.html',
    styleUrls: ['./donut-widget.component.scss']
})

export class DonutWidgetComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.donutchart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: any;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types

    type = 'doughnut';
    type$: BehaviorSubject<string>;
    typeSub: Subscription;


    options: any  = {
        labels : [ ],
        legend: {
            display: true,
            position: 'right',
            labels: {
                padding: 20
            }
        },
        plugins: {
            labels: {
                render: 'percentage',
                precision: 2
            }
        }
    };
    data: any = [ { data: [] } ];
    width = '100%';
    height = '100%';
    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;
    editQueryId = null;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        public dialog: MatDialog,
        private util: UtilsService
    ) { }

    ngOnInit() {
        this.type$ = new BehaviorSubject(this.widget.settings.visual.type || 'doughnut');
        this.typeSub = this.type$.subscribe( type => {
            console.log("mail...type...", type)
            this.widget.settings.visual.type = type;
            this.type = type === 'doughnut' ? 'doughnut' : 'pie';
        });

        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch( message.action ) {
                case 'reQueryData':
                    this.refreshData();
                    break;
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        if ( !this.isDataLoaded ) {
                            this.isDataLoaded = true;
                            this.options.labels = [];
                            this.data = [];
                        }
                        if ( message.payload.error ) {
                            this.error = message.payload.error;
                        }
                        this.setOptions();
                        this.data = this.dataTransformer.yamasToChartJS('donut', this.options, this.widget, this.data, message.payload.rawdata);
                        break;
                    case 'getUpdatedWidgetConfig':
                        this.widget = message.payload;
                        this.setOptions();
                        this.refreshData();
                        break;
                }
            }
        });
        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        this.requestData();
    }

    ngOnChanges(changes: SimpleChanges) {

    }

    ngAfterViewInit() {
        // this event will happend on resize the #widgetoutput element,
        // in  chartjs we don't need to pass the dimension to it.
        // Dimension will be picked up by parent node which is #container
        ElementQueries.listen();
        ElementQueries.init();
        let initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.pipe(
            debounceTime(100)
        ).subscribe(size => {
            this.setSize();
        });
        
        new ResizeSensor(this.widgetOutputElement.nativeElement, () =>{
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }

      // this will be first called from AfterViewInit.
      setSize() {

        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        const nativeEl = (this.editMode) ? this.widgetOutputElement.nativeElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        const outputSize = nativeEl.getBoundingClientRect();
        if (this.editMode) {
            this.width = '100%';
            this.height = '100%';
        } else {
            this.width = (outputSize.width - 30) + 'px';
            this.height = (outputSize.height - 20) + 'px';
        }
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = this.widget.queries.length;
            this.error = null;
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget
            });
        }
    }

    requestCachedData() {
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'getWidgetCachedData'
        });
    }

    updateConfig(message) {
        switch ( message.action ) {
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                break;
            case 'SetLegend':
                this.widget.settings.legend = message.payload.data;
                this.setLegendOption();
                this.options = {...this.options};
                break;
            case 'ChangeVisualization':
                this.type$.next(message.payload.type);
                break;
            case 'SetVisualization':
                this.setVisualization(message.payload.data);
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.refreshData();
                break;
            case 'SetQueryEditMode':
                this.editQueryId = message.payload.id;
                break;
            case 'CloseQueryEditMode':
                this.editQueryId = null;
                break;
            case 'ToggleQueryMetricVisibility':
                this.toggleQueryMetricVisibility(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'DeleteQueryMetric':
                this.deleteQueryMetric(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.refreshData();
                break;
            case 'DeleteQueryFilter':
                this.deleteQueryFilter(message.id, message.payload.findex);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.refreshData();
                break;
        }
    }

    updateQuery( payload ) {
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex !== -1 ) {
            this.widget.queries[qindex] = query;
        }

        console.log("donut chart updateQuery", qindex, this.widget.queries);
    }

    setVisualization( mconfigs ) {
        mconfigs.forEach( (config, i) => {
            this.widget.queries[0].metrics[i].settings.visual = { ...this.widget.queries[0].metrics[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setOptions() {
        this.type$.next(this.widget.settings.visual.type);
        this.setLegendOption();
    }

    setLegendOption() {
        this.options.legend = {...this.widget.settings.legend};
        this.options.plugins.labels = this.options.legend.showPercentages ? {
            render: 'percentage',
            precision: 2,
            fontColor: 'black'
        } : false;
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setTimeConfiguration(config) {
        this.widget.settings.time = {
                                             shiftTime: config.shiftTime,
                                             overrideRelativeTime: config.overrideRelativeTime,
                                             downsample: {
                                                 value: config.downsample,
                                                 aggregator: config.aggregator,
                                                 customValue: config.downsample !== 'custom' ? '' : config.customDownsampleValue,
                                                 customUnit: config.downsample !== 'custom' ? '' : config.customDownsampleUnit
                                             }
                                         };
        this.refreshData();
     }

    refreshData(reload = true) {
        this.isDataLoaded = false;
        if ( reload ) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
    }

    toggleQueryMetricVisibility(qid, mid) {
        // toggle the individual query metric
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics[mindex].settings.visual.visible =
            !this.widget.queries[qindex].metrics[mindex].settings.visual.visible;
        this.refreshData(false);
    }

    deleteQueryMetric(qid, mid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics.splice(mindex, 1);
    }

    deleteQueryFilter(qid, findex) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].filters.splice(findex, 1);
    }
    
    showError() {
        console.log('%cErrorDialog', 'background: purple; color: white;', this.error);
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

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: true
        });
    }

    applyConfig() {
        const cloneWidget = { ...this.widget };
        cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
        this.interCom.requestSend({
            action: 'updateWidgetConfig',
            payload: cloneWidget
        });
        this.closeViewEditMode();
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
        this.typeSub.unsubscribe();
    }
}

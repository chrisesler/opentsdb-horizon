import { Component, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef,
    SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';
import { ElementQueries, ResizeSensor } from 'css-element-queries';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';
import { DebugDialogComponent } from '../../../sharedcomponents/components/debug-dialog/debug-dialog.component';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-barchart-widget',
  templateUrl: './barchart-widget.component.html',
  styleUrls: ['./barchart-widget.component.scss'],
})
export class BarchartWidgetComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.barchart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: any;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    isStackedGraph: boolean = false;
    // properties to pass to  chartjs chart directive

    type = 'bar';
    doRefreshData$: BehaviorSubject<boolean>;
    doRefreshDataSub: Subscription;
    type$: BehaviorSubject<string>;
    typeSub: Subscription;

    categoryAxis: any = {
        type: 'category',
        ticks: {
            autoSkip: true
        }
    };

    valueAxis: any = {
        ticks: {
            beginAtZero: true,
            precision: 0
        },
        type: 'linear'
    };

    options: any  = {
        scales: {
            yAxes : [],
            xAxes : []
        },
        // not part of chartjs config. this config will be used for bar, doughnut and pie charts
        labels : [ ],
        // contains stack series details like label, color, datasetIndex
        stackSeries : {},
        legend: {
            display: false,
            position: 'right'
        }
    };
    data: any = [ ];
    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;
    width = '100%';
    height = '100%';
    editQueryId = null;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    debugData: any; // debug data from the data source.
    debugDialog: MatDialogRef < DebugDialogComponent > | null;
    storeQuery: any;
    needRequery = false;
    isDestroying = false;

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        public dialog: MatDialog,
        private util: UtilsService,
        private unit: UnitConverterService,
        private cdRef: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.doRefreshData$ = new BehaviorSubject(false);

        this.doRefreshDataSub = this.doRefreshData$
            .pipe(
                debounceTime(1000)
            )
            .subscribe(trigger => {
                if (trigger) {
                    this.refreshData();
                }
            });

        this.type$ = new BehaviorSubject(this.widget.settings.visual.type || 'vertical');
        this.options.legend.display = this.isStackedGraph ? true : false;

        this.typeSub = this.type$.subscribe( type => {

            this.widget.settings.visual.type = type;
            this.options.scales.yAxes[0] = type === 'vertical' ? this. valueAxis : this.categoryAxis;
            this.options.scales.xAxes[0] = type === 'vertical' ? this.categoryAxis : this.valueAxis;
            this.type = type === 'vertical' ? 'bar' : 'horizontalBar';
            // add to change gridline color
            this.options.scales.xAxes[0].gridLines = { color: '#eeeeee' };
            this.options.scales.yAxes[0].gridLines = { color: '#eeeeee' };
        });
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch( message.action ) {
                case 'TimeChanged':
                case 'reQueryData':
                case 'ZoomDateRange':
                    this.refreshData();
                    break;
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        if ( !this.isDataLoaded ) {
                            this.options.labels = [];
                            this.data = [];
                            this.isDataLoaded = true;
                        }
                        if ( message.payload.error ) {
                            this.error = message.payload.error;
                        }
                        if (environment.debugLevel.toUpperCase() === 'TRACE' ||
                            environment.debugLevel.toUpperCase() == 'DEBUG' ||
                            environment.debugLevel.toUpperCase() == 'INFO') {
                                this.debugData = message.payload.rawdata.log; // debug log
                        }
                        this.data = this.dataTransformer
                            .yamasToChartJS(this.type, this.options, this.widget, this.data, message.payload.rawdata, this.isStackedGraph);
                        this.detectChanges();
                        break;
                    case 'getUpdatedWidgetConfig':
                        this.widget = message.payload.widget;
                        this.setOptions();
                        this.refreshData(message.payload.needRefresh);
                        break;
                    case 'WidgetQueryLoading':
                        this.nQueryDataLoading = 1;
                        this.storeQuery = message.payload.storeQuery;
                        this.cdRef.detectChanges();
                        break;
                    case 'ResetUseDBFilter':
                        this.widget.settings.useDBFilter = true;
                        this.cdRef.detectChanges();
                        break;
                }
            }
        });

        // first time when displaying chart
        if (!this.widget.settings.sorting) {
            this.widget.settings.sorting = { limit: 25, order: 'top' };
        }

        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        setTimeout(()=>{
            this.refreshData(this.editMode ? false : true);
            this.setOptions();
        });
    }

    ngOnChanges(changes: SimpleChanges) {

    }

    ngAfterViewInit() {
        // this event will happend on resize the #widgetoutput element,
        // in bar chart we don't need to pass the dimension to it.
        // Dimension will be picked up by parent node which is #container
        ElementQueries.listen();
        ElementQueries.init();
        const initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.pipe(
            debounceTime(100)
        ).subscribe(size => {
            this.setSize(size);
        });
        const resizeSensor = new ResizeSensor(this.widgetOutputElement.nativeElement, () =>{
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }
    requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = 1;
            this.error = null;
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget
            });
            this.detectChanges();
        }
    }

    requestCachedData() {
        this.nQueryDataLoading = 1;
        this.error = null;
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'getWidgetCachedData',
            payload: this.widget
        });
    }

    updateConfig(message) {
        switch ( message.action ) {
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'SetStackedBarVisualization':
                this.setStackedBarVisualization( message.payload.gIndex, message.payload.data );
                break;
            case 'SetVisualization':
                this.setBarVisualization( message.payload.gIndex, message.payload.data );
                break;
            case 'SetAlerts':
                this.widget.settings.thresholds = message.payload.data;
                this.setAlertOption();
                this.options = { ...this.options };
                break;
            case 'SetAxes' :
                this.updateAlertValue(message.payload.data.y1);
                this.widget.settings.axes = { ...this.widget.settings.axes, ...message.payload.data };
                this.setAxisOption();
                this.options = { ...this.options };
                break;
            case 'SetSorting':
                this.setSorting(message.payload);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'ChangeVisualization':
                this.type$.next(message.payload.type);
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'SetQueryEditMode':
                this.editQueryId = message.payload.id;
                break;
            case 'CloseQueryEditMode':
                this.editQueryId = null;
                break;
            case 'ToggleQueryMetricVisibility':
                this.toggleQueryMetricVisibility(message.id, message.payload.mid);
                this.refreshData(false);
                break;
            case 'DeleteQueryMetric':
                this.deleteQueryMetric(message.id, message.payload.mid);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQueryFilter':
                this.deleteQueryFilter(message.id, message.payload.findex);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'ToggleQueryVisibility':
                this.toggleQueryVisibility(message.id);
                this.refreshData(false);
                this.needRequery = false;
                break;
            case 'CloneQuery':
                this.cloneQuery(message.id);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.id);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'ToggleDBFilterUsage':
                this.widget.settings.useDBFilter = message.payload.apply;
                this.refreshData();
                this.needRequery = message.payload.reQuery;
                break;
            case 'SummarizerChange':
                this.refreshData();
                break;
        }
    }
    isApplyTpl(): boolean {
        return (!this.widget.settings.hasOwnProperty('useDBFilter') || this.widget.settings.useDBFilter);
    }
    // for first time and call.
    setSize(newSize) {
        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        const nativeEl = (this.editMode) ?
            this.widgetOutputElement.nativeElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        const outputSize = nativeEl.getBoundingClientRect();
        if (this.editMode) {
            this.width = '100%';
            this.height = '100%';
        } else {
            this.width = (outputSize.width - 30) + 'px';
            this.height = (outputSize.height - 20) + 'px';
        }
        this.detectChanges();
    }

    detectChanges() {
        if ( ! this.isDestroying ) {
            this.cdRef.detectChanges();
        }
    }

    updateQuery( payload ) {
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex !== -1 ) {
            this.widget.queries[qindex] = query;
        }
    }

    toggleQueryVisibility(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].settings.visual.visible = !this.widget.queries[qindex].settings.visual.visible;
    }

    cloneQuery(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        if ( qindex !== -1 ) {
            const query = this.util.getQueryClone(this.widget.queries, qindex);
            this.widget.queries.splice(qindex + 1, 0, query);
        }
    }

    deleteQuery(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries.splice(qindex, 1);
    }

    deleteMetrics(groups) {
        let deletedMetrics = false;
        const usedStacks = [];
        for ( let i = groups.length - 1; i >= 0; i-- ) {
            const group = groups[i];
            const queries = group.queries;
            // group delete
            if ( group.settings.tempUI.selected === 'all' ) {
                groups.splice( i, 1 );
                deletedMetrics = true;
            } else {
                for ( let j = queries.length - 1;  j >= 0; j-- ) {
                    if ( queries[j].settings.selected ) {
                        queries.splice( j, 1 );
                        deletedMetrics = true;
                    } else {
                        const stack = queries[j].settings.visual.stack;
                        if ( usedStacks.indexOf( stack) === -1 ) {
                            usedStacks.push(stack);
                        }
                    }
                }
            }
        }
        if ( deletedMetrics ) {
            this.widget.queries.groups = groups;
            // delete the stacks that are no longer used
            const stacks = this.widget.settings.visual.stacks;
            if ( usedStacks.length !== stacks.length ) {
                this.widget.settings.visual.stacks = stacks.filter( stack => usedStacks.indexOf(stack.id) !== -1 );
            }
            this.widget = { ...this.widget };
        }
    }

    refreshData(reload = true) {
        this.isDataLoaded = false;
        if ( reload ) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
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
                                                aggregators: config.aggregators,
                                                customValue: config.downsample !== 'custom' ? '' : config.customDownsampleValue,
                                                customUnit: config.downsample !== 'custom' ? '' : config.customDownsampleUnit
                                            }
                                        };
    }


    setAxisOption() {
        const axis = this.valueAxis;
        const config = this.widget.settings.axes && this.widget.settings.axes.y1 ?
                            this.widget.settings.axes.y1 : <Axis>{};
        axis.type = !config.scale || config.scale === 'linear' ? 'linear' : 'logarithmic';
        axis.ticks = { beginAtZero: true };
        if ( !isNaN( config.min ) && config.min ) {
            axis.ticks.min =  config.min;
        }
        if ( !isNaN( config.max ) && config.max ) {
            axis.ticks.max = config.max;
        }
        const label = config.label ? config.label.trim() : '';
        const decimals = !config.decimals || config.decimals.toString().trim() === 'auto' ? 'auto' : config.decimals;
        axis.scaleLabel = label ? { labelString: label, display: true } : {};
        axis.ticks.format = { unit: config.unit, precision: decimals, unitDisplay: config.unit ? true : false };
    }

    setStackedBarVisualization(gIndex, configs) {
        configs.forEach( (config, i) => {
            this.widget.queries.groups[gIndex].queries[i].settings.visual = { ...this.widget.queries.groups[gIndex].queries[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setBarVisualization( gIndex, configs ) {
        configs.forEach( (config, i) => {
            this.widget.queries[gIndex].metrics[i].settings.visual = { ...this.widget.queries[gIndex].metrics[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setAlertOption() {
        const thresholds = this.widget.settings.thresholds || {};
        const axis = this.widget.settings.axes && this.widget.settings.axes.y1 ? this.widget.settings.axes.y1 : <Axis>{};
        const oUnit = this.unit.getDetails(axis.unit);

        this.options.threshold = { thresholds: [] };
        Object.keys(thresholds).forEach( k => {
            const threshold = thresholds[k];
            if ( threshold.value !== '' ) {
                let lineType;
                switch ( threshold.lineType ) {
                    case 'solid':
                        lineType = [];
                        break;
                    case 'dashed':
                        lineType = [4, 4];
                        break;
                    case 'dotted':
                        lineType = [2, 3];
                        break;
                    case 'dot-dashed':
                        lineType = [4, 4, 2];
                        break;
                }
                const o = {
                    value: oUnit ? threshold.value * oUnit.m : threshold.value,
                    scaleId: this.type === 'bar' ? 'y-axis-0' : 'x-axis-0',
                    borderColor: threshold.lineColor,
                    borderWidth: parseInt(threshold.lineWeight, 10),
                    borderDash: lineType
                };
                this.options.threshold.thresholds.push(o);
            }
        });
    }

    setOptions() {
        this.type$.next(this.widget.settings.visual.type);
        this.setAxisOption();
        this.setAlertOption();
        this.options = {...this.options};
    }

    updateAlertValue(nConfig) {
        const oConfig = this.widget.settings.axes && this.widget.settings.axes.y1 ? this.widget.settings.axes.y1 : <Axis>{};
        const oUnit = this.unit.getDetails(oConfig.unit);
        const nUnit = this.unit.getDetails(nConfig.unit);
        const thresholds = this.widget.settings.thresholds || {};
        for ( let i in thresholds ) {
            thresholds[i].value = oUnit ? thresholds[i].value * oUnit.m : thresholds[i].value;
            thresholds[i].value = nUnit ? thresholds[i].value / nUnit.m : thresholds[i].value;
        }
    }


    setSorting(sConfig) {
        this.widget.settings.sorting = { order: sConfig.order, limit: sConfig.limit };
    }

    toggleGroup(gIndex) {
        this.widget.queries.groups[gIndex].settings.visual.visible = !this.widget.queries.groups[gIndex].settings.visual.visible;
        for (let i = 0; i < this.widget.queries.groups[gIndex].queries.length; i++) {
            this.widget.queries.groups[gIndex].queries[i].settings.visual.visible =
            this.widget.queries.groups[gIndex].settings.visual.visible;
        }
        this.refreshData(false);
    }
    deleteGroup(gIndex) {
        this.widget.queries.splice(gIndex, 1);
        this.refreshData();
    }

    toggleGroupQuery(gIndex, index) {
        // toggle the individual query
        this.widget.queries.groups[gIndex].queries[index].settings.visual.visible =
        !this.widget.queries.groups[gIndex].queries[index].settings.visual.visible;

        // set the group to visible if the individual query is visible
        if (this.widget.queries.groups[gIndex].queries[index].settings.visual.visible) {
            this.widget.queries.groups[gIndex].settings.visual.visible = true;
        } else { // set the group to invisible if all queries are invisible
            this.widget.queries.groups[gIndex].settings.visual.visible = false;
            for (let i = 0; i < this.widget.queries.groups[gIndex].queries.length; i++) {
                if (this.widget.queries.groups[gIndex].queries[i].settings.visual.visible) {
                    this.widget.queries.groups[gIndex].settings.visual.visible = true;
                    break;
                }
            }
        }
        this.refreshData(false);
    }

    toggleQueryMetricVisibility(qid, mid) {
        // toggle the individual query metric
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics[mindex].settings.visual.visible =
            !this.widget.queries[qindex].metrics[mindex].settings.visual.visible;
    }

    deleteQueryMetric(qid, mid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        if (this.widget.queries[qindex]) {
            const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
            this.widget.queries[qindex].metrics.splice(mindex, 1);
        }
    }

    deleteQueryFilter(qid, findex) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].filters.splice(findex, 1);
    }

    changeWidgetType(type) {
        const wConfig = this.util.deepClone(this.widget);
        wConfig.id = wConfig.id.replace('__EDIT__', '');
         this.interCom.requestSend({
             action: 'changeWidgetType',
             id: wConfig.id,
             payload: { wConfig: wConfig, newType: type }
         });
     }

    showError() {
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

    showDebug() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        const offsetHeight = 60;
        dialogConf.width = '75%';
        dialogConf.minWidth = '500px';
        dialogConf.height = '75%';
        dialogConf.minHeight = '200px';
        dialogConf.backdropClass = 'error-dialog-backdrop'; // re-use for now
        dialogConf.panelClass = 'error-dialog-panel';
         dialogConf.data = {
          log: this.debugData,
          query: this.storeQuery 
        };
        
        // re-use?
        this.debugDialog = this.dialog.open(DebugDialogComponent, dialogConf);
        this.debugDialog.afterClosed().subscribe((dialog_out: any) => {
        });
    }

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: 'dashboard'
        });
    }

    applyConfig() {
        const cloneWidget = this.util.deepClone(this.widget);
        cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
        this.interCom.requestSend({
            action: 'updateWidgetConfig',
            id: cloneWidget.id,
            payload: { widget: cloneWidget, needRequery: this.needRequery }
        });

        this.closeViewEditMode();
    }

    ngOnDestroy() {
        this.isDestroying = true;
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
        this.typeSub.unsubscribe();
        this.doRefreshDataSub.unsubscribe();
    }
}

export class StackedBarchartWidgetComponent extends BarchartWidgetComponent  {
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;
    isStackedGraph = true;
}

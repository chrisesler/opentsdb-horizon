import {
    Component, OnInit, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit
} from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';
import { Subscription, Observable } from 'rxjs';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';
import { DebugDialogComponent } from '../../../sharedcomponents/components/debug-dialog/debug-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementQueries, ResizeSensor} from 'css-element-queries';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LoggerService } from '../../../../../core/services/logger.service';
import { environment } from '../../../../../../environments/environment';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'linechart-widget',
    templateUrl: './linechart-widget.component.html',
    styleUrls: []
})
export class LinechartWidgetComponent implements OnInit, AfterViewInit, OnDestroy {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.linechart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetOutputContainer') private widgetOutputContainer: ElementRef;
    @ViewChild('widgetTitle') private widgetTitle: ElementRef;
    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;
    @ViewChild('dygraph') private dygraph: ElementRef;
    @ViewChild(MatSort) sort: MatSort;

    private subscription: Subscription = new Subscription();
    private isDataLoaded = false;
    private isStackedGraph = false;
    chartType = 'line';

    doRefreshData$: BehaviorSubject<boolean>;
    doRefreshDataSub: Subscription;

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
        stackedGraph: this.isStackedGraph,
        strokeWidth: 1,
        strokeBorderWidth: this.isStackedGraph ? 0 : 0,
        highlightSeriesBackgroundAlpha: 0.5,
        isZoomedIgnoreProgrammaticZoom: true,
        isCustomZoomed: false,
        highlightSeriesOpts: {
            strokeWidth: 2,
            highlightCircleSize: 3
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
                tickFormat: {},
                drawGrid: true,
                independentTicks: true
            }
        },
        series: {},
        visibility: [],
        gridLineColor: '#ccc'
    };
    data: any = { ts: [[0]] };
    size: any = { width: 120, height: 60};
    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;
    legendWidth;
    legendHeight;
    nQueryDataLoading: number;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    debugData: any; // debug data from the data source.
    debugDialog: MatDialogRef < DebugDialogComponent > | null;
    storeQuery: any;
    legendDisplayColumns = ['color', 'min', 'max', 'avg', 'last', 'name'];
    editQueryId = null;
    needRequery = false;

    legendDataSource; // = new MatTableDataSource(this.tmpArr);

    timer = null;
    preventSingleClick: boolean;
    clickTimer: any;

    // EVENTS
    buckets: any[] = []; // still need this, as dygraph was looking for it
    events: any[];
    showEventStream = false; // Local flag whether island open
    eventsWidth: number;
    startTime: number;
    endTime: number;

    // behaviors that get passed to island legend
    private _buckets: BehaviorSubject<any[]> = new BehaviorSubject([]);
    private _timeRange: BehaviorSubject<any> = new BehaviorSubject({});
    private _timezone: BehaviorSubject<any> = new BehaviorSubject('');
    private _expandedBucketIndex: BehaviorSubject<number> = new BehaviorSubject(-1);

    constructor(
        private cdRef: ChangeDetectorRef,
        private interCom: IntercomService,
        public dialog: MatDialog,
        private dataTransformer: DatatranformerService,
        private util: UtilsService,
        private elRef: ElementRef,
        private unit: UnitConverterService,
        private logger: LoggerService
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

        this.subscription.add(this._buckets.pipe().subscribe( buckets => {
            this.buckets = buckets;
        }));

        // subscribe to event stream
        this.subscription.add(this.interCom.responseGet().subscribe((message: IMessage) => {
            switch (message.action) {
                case 'TimeChanged':
                    this.options.isCustomZoomed = false;
                    delete this.options.dateWindow;
                    this.refreshData();
                    break;
                case 'reQueryData':
                    this.refreshData();
                    break;
                case 'TimezoneChanged':
                    this.setTimezone(message.payload.zone);
                    this.options = { ...this.options };
                    break;
                case 'ZoomDateRange':
                    const downsample = this.widget.settings.time.downsample.value;
                    this.options.isCustomZoomed = message.payload.date.isZoomed;
                    // requery data if auto is set, otherwise set/unset the dateWindow option to zoom/unzoon
                    if ( downsample === 'auto' ) {
                        this.refreshData();
                    } else {
                        if ( message.payload.date.start !== null ) {
                            this.options.dateWindow = [message.payload.date.start * 1000, message.payload.date.end * 1000];
                        } else {
                            delete this.options.dateWindow;
                        }
                        this.options = {...this.options};
                        this.cdRef.markForCheck();
                    }
                    break;
            }

            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'InfoIslandClosed':
                        this.logger.action('[widget sub] INFO ISLAND CLOSED');
                        this.updatedShowEventStream(false);
                        break;
                    case 'UpdateExpandedBucketIndex':
                        this._expandedBucketIndex.next(message.payload.index);
                        break;
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        if (!this.isDataLoaded) {
                            this.isDataLoaded = true;
                            this.resetChart();
                        }
                        if (message.payload.error) {
                            this.error = message.payload.error;
                            this.cdRef.markForCheck();
                        } else {
                            const rawdata = message.payload.rawdata;
                            this.setTimezone(message.payload.timezone);
                            this.resetChart(); // need to reset this data
                            this.data.ts = this.dataTransformer.yamasToDygraph(this.widget, this.options, this.data.ts, rawdata);
                            this.data = { ...this.data };
                            if (environment.debugLevel.toUpperCase() === 'TRACE' ||
                                environment.debugLevel.toUpperCase() == 'DEBUG' ||
                                environment.debugLevel.toUpperCase() == 'INFO') {
                                    this.debugData = rawdata.log; // debug log
                            }
                            setTimeout(() => {
                                this.setSize();
                            });
                            this.cdRef.detectChanges();
                            this.refreshLegendSource();
                        }
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
                        // reset useDBFilter to true
                        this.widget.settings.useDBFilter = true;
                        this.cdRef.detectChanges();
                        break;
                    case 'updatedEvents':
                        this.events = message.payload.events;
                        this.cdRef.detectChanges();
                        break;
                }
            }
        }));

        this.setDefaultEvents();
        this.getEvents();

        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        setTimeout(() => this.refreshData(this.editMode ? false : true), 0);
        this.setOptions();
    }

    refreshLegendSource() {
        this.legendDataSource = new MatTableDataSource(this.buildLegendData());
        this.legendDataSource.sort = this.sort;
    }

    buildLegendData() {
        const series = this.options.series;
        const table = [];
        // tslint:disable-next-line: forin
        for (const index in series) {
            let config;
            if (series.hasOwnProperty(index)) {
                config = series[index];
            } else {continue;}
            const row = {};
            row['srcIndex'] = index;
            for (let column = 0; column < this.legendDisplayColumns.length; column++) {
                const columnName = this.legendDisplayColumns[column];
                switch (columnName) {
                    case 'color':
                        row['color'] = config.color;
                        break;
                    case 'name':
                        row[columnName] = this.getSeriesLabel(index);
                        break;
                    default:
                        row[columnName] = this.getSeriesAggregate(index, columnName, false);
                        break;
                }
            }
            table.push(row);
        }
        return table;
    }

    setOptions() {
        this.setLegendDiv();
        this.setAxesOption();
        this.setAlertOption();
    }

    resetChart() {
        this.options = {...this.options, labels: ['x']};
        this.data = { ts: [[0]] };
    }

    updateConfig(message) {
        switch ( message.action ) {
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                this.doRefreshData$.next(true);
                this.needRequery = true; // set flag to requery if apply to dashboard
                break;
            case 'SetVisualization':
                this.setVisualization( message.payload.gIndex, message.payload.data );
                this.options = { ...this.options };
                this.widget = { ...this.widget };
                this.refreshData(false);
                this.cdRef.detectChanges();
                break;
            case 'SetAlerts':
                this.widget.settings.thresholds = message.payload.data;
                this.setAlertOption();
                this.options = { ...this.options };
                break;
            case 'SetAxes' :
                this.updateAlertValue(message.payload.data); // update the alert unit type and value
                this.widget.settings.axes = { ...this.widget.settings.axes, ...message.payload.data };
                this.setAxesOption();
                this.options = { ...this.options };
                this.refreshData(false);
                break;
            case 'SetLegend':
                this.setLegend(message.payload.data);
                this.cdRef.detectChanges();
                this.refreshLegendSource();
                this.setSize();
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.setOptions();
                this.needRequery = true;
                this.doRefreshData$.next(true);
                break;
            case 'SetQueryEditMode':
                this.editQueryId = message.payload.id;
                break;
            case 'SetShowEvents':
                this.setShowEvents(message.payload.showEvents);
                break;
            case 'SetEventQuerySearch':
                this.setEventQuerySearch(message.payload.search);
                break;
            case 'SetEventQueryNamespace':
                this.setEventQueryNamespace(message.payload.namespace);
                break;
            case 'CloseQueryEditMode':
                this.editQueryId = null;
                break;
            case 'ToggleQueryVisibility':
                this.toggleQueryVisibility(message.id);
                this.refreshData(false);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'ToggleQueryMetricVisibility':
                this.toggleQueryMetricVisibility(message.id, message.payload.mid);
                this.refreshData(false);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'CloneQuery':
                this.cloneQuery(message.id);
                this.widget = this.util.deepClone(this.widget);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.id);
                this.widget = this.util.deepClone(this.widget);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQueryMetric':
                this.deleteQueryMetric(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQueryFilter':
                this.deleteQueryFilter(message.id, message.payload.findex);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'ToggleDBFilterUsage':
                this.widget.settings.useDBFilter = message.payload.apply;
                this.refreshData();
                this.needRequery = message.payload.reQuery;
                break;
        }
    }

    updateQuery( payload ) {
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex === -1 ) {
            query.id = this.util.generateId(6, this.util.getIDs(this.widget.queries));
            this.widget.queries.push(query);
        } else {
            this.widget.queries[qindex] = query;
        }
    }

    ngAfterViewInit() {
        ElementQueries.listen();
        ElementQueries.init();
        const initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.subscribe(size => {
            this.setSize();
            // this.newSize = size;
        });
        const resizeSensor = new ResizeSensor(this.widgetOutputElement.nativeElement, () => {
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }

    isApplyTpl(): boolean {
        return (!this.widget.settings.hasOwnProperty('useDBFilter') || this.widget.settings.useDBFilter);
    }

    setSize() {
        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        const nativeEl = (this.editMode) ?
            this.widgetOutputElement.nativeElement.parentElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        const newSize = nativeEl.getBoundingClientRect();
        // let newSize = outputSize;
        let nWidth, nHeight, padding;

        const legendSettings = this.widget.settings.legend;
        const legendColumns = legendSettings.columns ? legendSettings.columns.length : 0;

        let widthOffset = 0;
        let heightOffset = 0;
        let labelLen = 0;
        for ( const i in this.options.series ) {
            if (this.options.series.hasOwnProperty(i)) {
            labelLen = labelLen < this.options.series[i].label.length ? this.options.series[i].label.length: labelLen ;
            }
        }
        if (legendSettings.display &&
                                    ( legendSettings.position === 'left' ||
                                    legendSettings.position === 'right' ) ) {
            widthOffset = 10 + labelLen * 6.5 + 60 * legendColumns;
        }

        if ( legendSettings.display &&
                                    ( legendSettings.position === 'top' ||
                                    legendSettings.position === 'bottom' ) ) {
            heightOffset = newSize.height * .25;
            heightOffset = heightOffset <= 80 ? 80 : heightOffset;
        }

        if (this.editMode) {
            let titleSize = {width: 0, height: 0};
            if (this.widgetTitle) {
                titleSize = this.widgetTitle.nativeElement.getBoundingClientRect();
            }
            padding = 8; // 8px top and bottom
            nHeight = newSize.height - heightOffset - titleSize.height - (padding * 2);

            if (this.widget.settings.visual.showEvents) {  // give room for events
                nHeight = nHeight - 45;
            }

            nWidth = newSize.width - widthOffset  - (padding * 2) - 30;
        } else {
            padding = 10; // 10px on the top
            const paddingSides = 1;
            nHeight = newSize.height - heightOffset - (padding * 2);

            if (this.widget.settings.visual.showEvents) {  // give room for events
                nHeight = nHeight - 35;
            }

            // nWidth = newSize.width - widthOffset  - (padding * 2);
            nWidth = newSize.width - widthOffset  - paddingSides;
        }
        this.legendWidth = !widthOffset ? nWidth + 'px' : widthOffset + 'px';
        this.legendHeight = !heightOffset ? nHeight + 'px' : heightOffset + 'px';
        this.size = {width: nWidth, height: nHeight };

        // Canvas Width resize
        this.eventsWidth = nWidth - 55;

        // after size it set, tell Angular to check changes
        this.cdRef.detectChanges();
    }

    setTimezone(timezone) {
        this.options.labelsUTC = timezone === 'utc' ? true : false;
        this._timezone.next(timezone);
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

    setAxesOption() {
        const axisKeys = Object.keys(this.widget.settings.axes);
        const thresholds = this.widget.settings.thresholds || {};
        for (let i = 0; i < axisKeys.length; i++ ) {
            const config = this.widget.settings.axes[axisKeys[i]];
 //           if (Object.keys(config).length > 0) {
            const chartAxisID = axisKeys[i] === 'y1' ? 'y' : axisKeys[i] === 'y2' ? 'y2' : 'x';
            const axis = this.options.axes[chartAxisID];
            axis.valueRange = [null, null];
            if ( !isNaN( config.min ) && config.min.trim() !== '' ) {
                axis.valueRange[0] =  config.min;
            }
            if ( !isNaN( config.max)  && config.max.trim() !== '' ) {
                axis.valueRange[1] = config.max;
            }

            if (  axisKeys[i] === 'y1' || axisKeys[i] === 'y2' ) {
                axis.logscale = config.scale === 'logscale' ? true : false;
                if ( axisKeys[i] === 'y1' ) {
                    this.options.logscale = axis.logscale;
                }
                const label = config.label ? config.label.trim() : '';
                this.options[chartAxisID + 'label'] = label;
            }

            axis.drawAxis = config.enabled || axisKeys[i] === 'y1' && typeof config.enabled === 'undefined' ? true : false;
            // move series from y2 to y1 if y2 is disabled
            if ( this.options.series &&  axisKeys[i] === 'y2' && !config.enabled) {
                for ( let k in this.options.series ) {
                    if (this.options.series[k]) {
                        this.options.series[k].axis = 'y';
                    }
                }
                const wqueries = this.widget.queries;
                for ( let m = 0; m < wqueries.length; m++ ) {
                    const wmetrics = wqueries[m].metrics;
                    for ( let n = 0; n < wmetrics.length; n++ ) {
                        // wmetrics[n].settings.visual.axis = 'y1';
                    }
                }
            }

            // change threshold axis y2=>y1
            if ( axisKeys[i] === 'y2' && !config.enabled  && Object.keys(thresholds).length ) {
                for ( const key in thresholds ) {
                    if (thresholds.hasOwnProperty(key)) {
                        thresholds[key].axis = 'y1';
                    }
                }
                this.setAlertOption();
            }

            const decimals = !config.decimals || config.decimals.toString().trim() === 'auto' ? 2 : config.decimals;
            const unit = config.unit ? config.unit : 'auto';
            axis.tickFormat = { unit: unit, precision: decimals, unitDisplay: true };
            //}
        }

        // draw the axis if one series on the axis
        let y1Enabled = false, y2Enabled = false;
        const queries = this.widget.queries;
        for ( let m = 0; m < queries.length; m++ ) {
            const metrics = queries[m].metrics;
            for ( let n = 0; n < metrics.length; n++ ) {
                const vConfig = metrics[n].settings.visual;
                if ( !vConfig.axis || vConfig.axis === 'y1' ) {
                    y1Enabled = true;
                } else if ( vConfig.axis === 'y2') {
                    y2Enabled = true;
                }
            }
        }
        // y.drawaxis always to be true or it causing y2 not to be drawn
        this.options.axes.y.drawAxis = true;
        this.options.axes.y.axisLabelWidth = y1Enabled ? 50 : 0;
        this.options.ylabel = y1Enabled ? this.options.ylabel : '';
        this.options.y2label = y2Enabled ? this.options.y2label : '';
        this.options.axes.y2.axisLabelWidth = y2Enabled ? 50 : 0;
    }

    updateAlertValue(nConfig) {
        const thresholds = this.widget.settings.thresholds || {};
        for ( const k in nConfig ) {
            if (nConfig.hasOwnProperty(k)) {
                const oConfig = this.widget.settings.axes ? this.widget.settings.axes[k] : <Axis>{};
                const oUnit = this.unit.getDetails(oConfig.unit);
                const nUnit = this.unit.getDetails(nConfig[k].unit);
                for (const i in thresholds) {
                    if (thresholds[i].axis === k) {
                        thresholds[i].value = oUnit ? thresholds[i].value * oUnit.m : thresholds[i].value;
                        thresholds[i].value = nUnit ? thresholds[i].value / nUnit.m : thresholds[i].value;
                    }
                }
            }
        }
    }

    setAlertOption() {
        const thresholds = this.widget.settings.thresholds || {};
        this.options.thresholds =  [] ;
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
                const scaleId = !threshold.axis || threshold.axis !== 'y2' ? 'y' : threshold.axis;
                const axis = this.widget.settings.axes ? this.widget.settings.axes[threshold.axis] : null;
                const oUnit = axis ? this.unit.getDetails(axis.unit) : null;
                const o = {
                    value: oUnit ? threshold.value * oUnit.m : threshold.value,
                    scaleId: scaleId,
                    borderColor: threshold.lineColor,
                    borderWidth: parseInt(threshold.lineWeight, 10),
                    borderDash: lineType
                };
                this.options.thresholds.push(o);
            }
        });
    }

    setVisualization( qIndex, configs ) {

        configs.forEach( (config, i) => {
            // tslint:disable-next-line:max-line-length
            this.widget.queries[qIndex].metrics[i].settings.visual = { ...this.widget.queries[qIndex].metrics[i].settings.visual, ...config };
        });

        const mConfigs = this.widget.queries[qIndex].metrics;
        for ( let i = 0; i < mConfigs.length; i++ ) {
            const vConfig = mConfigs[i].settings.visual;
            /*
            const label =  mConfigs[i].metric;
            this.options.series[label] = {
                strokeWidth: parseFloat(vConfig.lineWeight),
                strokePattern: this.getStrokePattern(vConfig.lineType),
                color: vConfig.color || '#000000',
                axis: !vConfig.axis || vConfig.axis === 'y' ? 'y' : 'y2'
            };
            */
            if ( vConfig.axis === 'y2' ) {
                this.widget.settings.axes.y2.enabled = true;
            }
        }
        // call only axis changes
        this.setAxesOption();
    }

    setLegend(config) {
        this.widget.settings.legend = config;
        this.setLegendDiv();
        // this.setSize();
        this.options = {...this.options};
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setLegendDiv() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        this.legendDisplayColumns = ['color'].concat(this.widget.settings.legend.columns || []).concat(['name']);
    }

    setDefaultEvents() {
        this.widget = this.util.setDefaultEventsConfig(this.widget, false);
    }

    getEvents() {
        if (this.widget.settings.visual.showEvents) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getEventData',
                payload: {eventQueries: this.widget.eventQueries, limit: 1000}
            });
        }
    }

    setShowEvents(showEvents: boolean) {
        this.widget.settings.visual.showEvents = showEvents;
        this.widget.settings = {... this.widget.settings};
        if (showEvents) {
            this.getEvents();
        }
    }

    setEventQuerySearch(search: string) {
        // todo: set correctly
        const deepClone = JSON.parse(JSON.stringify(this.widget));
        deepClone.eventQueries[0].search = search;
        this.widget.eventQueries = [...deepClone.eventQueries];
        this.getEvents();
    }

    setEventQueryNamespace(namespace: string) {
        // todo: set correctly
        const deepClone = JSON.parse(JSON.stringify(this.widget));
        deepClone.eventQueries[0].namespace = namespace;
        this.widget.eventQueries = [... deepClone.eventQueries];
        this.getEvents();
    }

    toggleChartSeries(index: number, focusOnly) {
        this.preventSingleClick = focusOnly;
        if (!focusOnly) {
            this.clickTimer = 0;
            const delay = 250;

            this.clickTimer = setTimeout(() => {
                if (!this.preventSingleClick) {
                    this.options.visibility[index] = !this.options.visibility[index];
                }
                this.options = {...this.options};
                this.cdRef.markForCheck();
            }, delay);
        } else {
            clearTimeout(this.clickTimer);
            this.clickTimer = 0;

            let allHidden = true;
            // check if all the time-series are already hidden
            for (let i = 0; i < this.options.visibility.length; i += 1) {
                if (i === (index)) { continue; }
                allHidden = allHidden && !this.options.visibility[i];
            }
            // if all are already hidden, user probably wants to show all with a dblclick
            // else the intention is to hide all except the selected one
            const newVisibility = allHidden === true ? true : false;
            for (let i = 0; i < this.options.visibility.length; i += 1) {
                this.options.visibility[i] = newVisibility;
            }
            this.options.visibility[index] = true;
            this.options = { ...this.options };
        }

    }

    handleZoom(zConfig) {
        const n = this.data.ts.length;
        if ( zConfig.isZoomed && n > 0 ) {
            const startTime = new Date(this.data.ts[0][0]).getTime() / 1000;
            const endTime = new Date(this.data.ts[n - 1][0]).getTime() / 1000;
            zConfig.start = Math.floor(zConfig.start) <= startTime ? -1 : zConfig.start;
            zConfig.end = Math.ceil(zConfig.end) >= endTime ? -1 : zConfig.end;
        }
        // zoom.start===-1 or zoom.end=== -1, the start or end times will be calculated from the datepicker start or end time
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'SetZoomDateRange',
            payload: zConfig
        });
    }

    bucketClickedAtIndex(index) {
        // this.expandedBucket = index;
        this._expandedBucketIndex.next(index);

        // NEED TO CHECK IF ISLAND IS OPEN
        if ( !this.showEventStream ) {
            // IF NOT OPEN, OPEN IT

            // to open info island
            const payload = {
                portalDef: {
                    type: 'component',
                    name: 'EventStreamComponent'
                },
                data: {
                    buckets$: this._buckets.asObservable(),
                    timeRange$: this._timeRange.asObservable(),
                    timezone$: this._timezone.asObservable(),
                    expandedBucketIndex$: this._expandedBucketIndex.asObservable()
                },
                options: {
                    title: this.widget.eventQueries[0].search ?
                        'Events: ' + this.widget.eventQueries[0].namespace + ' - ' + this.widget.eventQueries[0].search :
                        'Events: ' + this.widget.eventQueries[0].namespace
                }
            };

            this.interCom.requestSend({
                id: this.widget.id,
                action: 'InfoIslandOpen',
                payload: payload
            });

            this.updatedShowEventStream(true);
        }
    }

    receivedDateWindow(dateWindow: any) {
        this.startTime = dateWindow.startTime;
        this.endTime = dateWindow.endTime;
        this._timeRange.next({startTime: this.startTime, endTime: this.endTime });
    }

    updatedShowEventStream(showEventStream: boolean) {
        this.showEventStream = showEventStream;
    }

    newBuckets(buckets) {
        this._buckets.next(buckets);
        this._expandedBucketIndex.next(-1);
    }

    getSeriesLabel(index) {
        const label = this.options.series[index].label;
        return label;
    }

    getSeriesAggregate( index, aggregate, normalizeUnit = true ) {
        const config = this.options.series[index];

        const value = config.aggregations[aggregate];
        if (!normalizeUnit) {
            return value;
        }

        if ( isNaN(value)) {
            return '-';
        }

        return this.normalizeValue(value, index);
    }

    normalizeValue(value, index) {
        if ( isNaN(value)) {
            return '-';
        }
        const config = this.options.series[index];
        const format = config.axis === 'y' ? this.options.axes.y.tickFormat : this.options.axes.y2.tickFormat;
        const dunit = this.unit.getNormalizedUnit(value, format);
        return this.unit.convert(value, format.unit, dunit, format);
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = 1;
            this.error = null;
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget,
            });
            this.cdRef.detectChanges();
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

    refreshData(reload = true) {
        this.isDataLoaded = false;
        if ( reload ) {
            this.requestData();
            this.getEvents();
        } else {
            this.requestCachedData();
            this.getEvents(); // todo: add events cache in-future
        }
    }

    toggleQueryVisibility(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].settings.visual.visible =
            !this.widget.queries[qindex].settings.visual.visible;
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

    toggleQueryMetricVisibility(qid, mid) {
        // toggle the individual query metric
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics[mindex].settings.visual.visible =
            !this.widget.queries[qindex].metrics[mindex].settings.visual.visible;
    }

    deleteQueryMetric(qid, mid) {
        // toggle the individual query
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics.splice(mindex, 1);
    }

    deleteQueryFilter(qid, findex) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].filters.splice(findex, 1);
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

    showDebug() {
        const parentPos = this.elRef.nativeElement.getBoundingClientRect();
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

    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend({
            action: 'closeViewEditMode',
            payload: 'dashboard'
        });
    }

    // apply config from editing
    applyConfig() {
        this.closeViewEditMode();
        const cloneWidget = JSON.parse(JSON.stringify(this.widget));
        cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
        this.interCom.requestSend({
            action: 'updateWidgetConfig',
            id: cloneWidget.id,
            payload: { widget: cloneWidget, needRequery: this.needRequery }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.newSizeSub.unsubscribe();
        this.doRefreshDataSub.unsubscribe();
    }

}

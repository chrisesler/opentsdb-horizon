import {
    Component, OnInit, OnChanges, AfterContentInit, SimpleChanges, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { ElementQueries, ResizeSensor} from 'css-element-queries';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'linechart-widget',
    templateUrl: './linechart-widget.component.html',
    styleUrls: []
})
export class LinechartWidgetComponent implements OnInit, OnChanges, AfterContentInit, OnDestroy {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.linechart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;
    @ViewChild('graphLegend') private dygraphLegend: ElementRef;
    @ViewChild('dygraph') private dygraph: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    private isStackedGraph: boolean = false;
    // properties to pass to dygraph chart directive
    chartType = 'line';

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
        stackedGraph: this.isStackedGraph,
        strokeWidth: 1,
        strokeBorderWidth: this.isStackedGraph ? null : 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            highlightCircleSize: 7
        },
        xlabel: '',
        ylabel: '',
        y2label: '',
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
        visibility: []
    };
    data: any = [[0]];
    size: any = {};
    newSize: any = {};
    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;
    legendWidth;
    legendHeight;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    legendDisplayColumns = ['series', 'name', 'min', 'max', 'avg', 'last'];
    editQueryId = null;
    constructor(
        private interCom: IntercomService,
        public dialog: MatDialog,
        private dataTransformer: DatatranformerService,
        private util: UtilsService,
        private elRef: ElementRef,
        private unit: UnitConverterService
    ) { }

    ngOnInit() {
                // subscribe to event stream
                this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
                    switch ( message.action ) {
                        case 'reQueryData':
                            this.refreshData();
                            break;
                        case 'TimezoneChanged':
                            this.setTimezone(message.payload.zone);
                            this.options = {...this.options};
                            break;
                    }

                    if (message && (message.id === this.widget.id)) {
                        switch (message.action) {
                            case 'updatedWidgetGroup':
                                this.nQueryDataLoading--;
                                if ( !this.isDataLoaded ) {
                                    this.isDataLoaded = true;
                                    this.resetChart();
                                }
                                if ( message.payload.error ) {
                                    this.error = message.payload.error;
                                }
                                const rawdata = message.payload.rawdata;
                                this.setTimezone(message.payload.timezone);
                                this.data = this.dataTransformer.yamasToDygraph(this.widget, this.options, this.data, rawdata);
                                break;
                            case 'getUpdatedWidgetConfig':
                                if (this.widget.id === message.id) {
                                    this.widget = message.payload;
                                    this.setOptions();
                                    this.refreshData();
                                }
                                break;
                            }
                        }
                });
                // when the widget first loaded in dashboard, we request to get data
                // when in edit mode first time, we request to get cached raw data.
                this.requestData();
                this.setOptions();
    }
    setOptions() {
        this.setLegendDiv();
        this.setAxesOption();
        this.setAlertOption();
    }

    resetChart() {
        this.options = {...this.options, labels: ['x']};
        this.data = [[0]];
    }

    updateConfig(message) {
        switch ( message.action ) {
            case 'AddMetricsToGroup':
                this.addMetricsToGroup(message.payload.data);
                this.refreshData();
                break;
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                break;
            case 'SetVisualization':
                this.setVisualization( message.payload.gIndex, message.payload.data );
                this.options = { ...this.options };
                this.refreshData(false);
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
                break;
            case 'SetLegend':
                this.setLegend(message.payload.data);
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.setOptions();
                this.refreshData();
                break;
            case 'SetQueryEditMode':
                this.editQueryId = message.payload.id;
                break;
            case 'CloseQueryEditMode':
                this.editQueryId = null;
                break;
            case 'ToggleQueryVisibility':
                this.toggleQueryVisibility(message.id);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'ToggleQueryMetricVisibility':
                this.toggleQueryMetricVisibility(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.id);
                this.widget = this.util.deepClone(this.widget);
                this.refreshData();
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
        if ( qindex === -1 ) {
            query.id = this.util.generateId(6);
            this.widget.queries.push(query);
        } else {
            this.widget.queries[qindex] = query;
        }
    }

    addMetricsToGroup(gConfig) {
        let gid = gConfig.id;

        if ( gid === 'new' ) {
            const g = this.createNewGroup();
            this.widget.queries.push(g);
            gid = g.id;
        }
    }

    createNewGroup() {
        const gid = this.util.generateId(6);
        const g = {
                    id: gid,
                    metrics: [],
                    settings: {
                        tempUI: {
                            selected: false
                        },
                        visual: {
                            visible: true
                        }
                    }
                };
        return g;
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    ngAfterContentInit() {

        ElementQueries.listen();
        ElementQueries.init();
        let initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.subscribe(size => {
            this.setSize(size);
            this.newSize = size;
        });
        
        const resizeSensor = new ResizeSensor(this.widgetOutputElement.nativeElement, () =>{
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }

    setSize(newSize: any) {
        if ( !Object.keys(newSize).length ) {
            return;
        }
        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        //const nativeEl = (this.editMode) ? this.widgetOutputElement.nativeElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        //const outputSize = nativeEl.getBoundingClientRect();
        const offset = this.editMode ? 100 : 0;

        let nWidth, nHeight, padding;

        const legendSettings = this.widget.settings.legend;

        let widthOffset = 0;
        let heightOffset = 0;
        if (legendSettings.display &&
                                    ( legendSettings.position === 'left' ||
                                    legendSettings.position === 'right' ) ) {
            widthOffset = 350;
        }

        if ( legendSettings.display &&
                                    ( legendSettings.position === 'top' ||
                                    legendSettings.position === 'bottom' ) ) {
            heightOffset = newSize.height * .25;
            heightOffset = heightOffset <= 80 ? 80 : heightOffset;
        }

        if (this.editMode) {
            padding = 8; // 8px top and bottom
            nHeight = newSize.height - heightOffset - (padding * 2);
            nWidth = newSize.width - widthOffset  - (padding * 2);
        } else {
            padding = 10; // 10px on the top
            nHeight = newSize.height - heightOffset - (padding * 2);
            nWidth = newSize.width - widthOffset  - (padding * 2);
        }
        this.legendWidth = !widthOffset ? nWidth + 'px' : widthOffset + 'px';
        this.legendHeight = !heightOffset ? nHeight + 'px' : heightOffset + 'px';
        this.size = {width: nWidth, height: nHeight };
    }

    setTimezone(timezone) {
        this.options.labelsUTC = timezone === 'utc' ? true : false;
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
        this.refreshData();
    }

    setAxesOption() {
        const axisKeys = Object.keys(this.widget.settings.axes);
        const thresholds = this.widget.settings.thresholds || {};
        for (let i = 0; i < axisKeys.length; i++ ) {
            const config = this.widget.settings.axes[axisKeys[i]];
            const chartAxisID = axisKeys[i] === 'y1' ? 'y' : axisKeys[i] === 'y2' ? 'y2' : 'x';
            const axis = this.options.axes[chartAxisID];
            if ( !isNaN( config.min ) ) {
                const oUnit = this.unit.getDetails(config.unit);
                axis.valueRange[0] = oUnit ? config.min * oUnit.m : config.min;
            }
            if ( !isNaN( config.max ) ) {
                const oUnit = this.unit.getDetails(config.unit);
                axis.valueRange[1] = oUnit ? config.max * oUnit.m : config.max;
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
                const queries = this.widget.queries;
                for ( let m = 0; m < queries.length; m++ ) {
                    const metrics = queries[m].metrics;
                    for ( let n = 0; n < metrics.length; n++ ) {
                        metrics[n].settings.visual.axis = 'y1';
                    }
                }
            }

            // change threshold axis y2=>y1
            if ( axisKeys[i] === 'y2' && !config.enabled  && Object.keys(thresholds).length ) {
                for ( let i in thresholds ) {
                    thresholds[i].axis = 'y1';
                }
                this.setAlertOption();
            }

            const decimals = !config.decimals || config.decimals.toString().trim() === 'auto' ? 2 : config.decimals;
            if ( config.unit ) {
                axis.tickFormat = { unit: config.unit, precision: decimals, unitDisplay: true };
            } else {
                axis.digitsAfterDecimal = decimals;
            }
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
        for ( let k in nConfig ) {
            const oConfig = this.widget.settings.axes ? this.widget.settings.axes[k] : <Axis>{};
            const oUnit = this.unit.getDetails(oConfig.unit);
            const nUnit = this.unit.getDetails(nConfig[k].unit);
            for ( let i in thresholds ) {
                if ( thresholds[i].axis === k) {
                    thresholds[i].value = oUnit ? thresholds[i].value * oUnit.m : thresholds[i].value;
                    thresholds[i].value = nUnit ? thresholds[i].value / nUnit.m : thresholds[i].value;
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
            if ( vConfig.type === 'bar' ) {
                // this.options.series[label].plotter = multiColumnGroupPlotter;
            }
        }
        // call only axis changes
        this.setAxesOption();
    }

    setLegend(config) {
        this.widget.settings.legend = config;
        this.setLegendDiv();
        this.options = {...this.options};
    }


    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setLegendDiv() {
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        this.setSize(this.newSize);
    }

    toggleChartSeries(index) {
        this.options.visibility[index - 1 ] = !this.options.visibility[index - 1];
        this.options = {...this.options};
    }

    getSeriesLabel(index) {
        const label = this.dataTransformer.getLableFromMetricTags(this.options.series[index].metric, this.options.series[index].tags);
        return label;
    }
    getSeriesAggregate( index, aggregate ) {
        const config = this.options.series[index];

        const value = config.aggregations[aggregate];
        const format = config.axis === 'y' ? this.options.axes.y.tickFormat : this.options.axes.y2.tickFormat;
        const precision = format && format.precision ? format.precision : 2;
        return this.unit.format(value, { unit: format ? format.unit : '', precision: precision } );
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = this.widget.queries.length;
            this.error = null;
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget,
            });
        }
    }

    requestCachedData() {
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'getWidgetCachedData'
        });
    }

    refreshData(reload = true) {
        this.isDataLoaded = false;
        if ( reload ) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
    }

    toggleQueryVisibility(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].settings.visual.visible =
            !this.widget.queries[qindex].settings.visual.visible;
        this.refreshData(false);
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
        this.refreshData(false);
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
    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend({
            action: 'closeViewEditMode',
            payload: 'dashboard'
        });
    }

    // apply config from editing
    applyConfig() {
        const cloneWidget = JSON.parse(JSON.stringify(this.widget));
        cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
        this.interCom.requestSend({
            action: 'updateWidgetConfig',
            payload: cloneWidget
        });

        this.closeViewEditMode();
    }

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.newSizeSub.unsubscribe();
    }

}

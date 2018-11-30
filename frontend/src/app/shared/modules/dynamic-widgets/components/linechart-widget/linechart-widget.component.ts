import {
    Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef
} from '@angular/core';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'linechart-widget',
    templateUrl: './linechart-widget.component.html',
    styleUrls: []
})
export class LinechartWidgetComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

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
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    legendDisplayColumns = [];
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
        console.log("this.widget", JSON.stringify(this.widget));
        // console.log('TEST', this.widgetOutputElement.nativeElement.getBoundingClientRect());
                // subscribe to event stream
                this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

                    //console.log('MESSAGE', message);
                    switch ( message.action ) {
                        case 'resizeWidget':
                            this.setSize();
                            break;
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
                            console.log("updatedWidgetGroup...", message);
                                this.nQueryDataLoading--;
                                if ( !this.isDataLoaded ) {
                                    this.isDataLoaded = true;
                                    this.options = {...this.options, labels: ['x']};
                                    this.data = [[0]];
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
                                    this.setLegendDiv();
                                    this.setAxesOption();
                                    this.setAlertOption();
                                    this.refreshData();
                                }
                                break;
                            }
                        }
                });
                // when the widget first loaded in dashboard, we request to get data
                // when in edit mode first time, we request to get cached raw data.
                if (this.editMode) {
                    this.setSize(true);
                }
                this.requestData();
                this.setLegendDiv();
                this.setAxesOption();
                this.setAlertOption();
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
                console.log('axs', message);
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
                this.refreshData();
                break;
            case 'SetQueryEditMode':
                this.editQueryId = message.payload.id;
                break;
            case 'CloseQueryEditMode':
                this.editQueryId = null;
                break;
                /*
            case 'MergeMetrics':
                this.mergeMetrics(message.payload.data);
                this.refreshData();
                break;
            case 'SplitMetrics':
                this.splitMetrics(message.payload.data);
                this.refreshData();
                break;
            case 'DeleteMetrics':
                this.deleteMetrics(message.payload.data);
                this.refreshData(false);
                break;
            case 'ToggleGroup':
                this.toggleGroup(message.payload.gIndex);
                break;
            case 'ToggleGroupQuery':
                this.toggleGroupQuery(message.payload.gIndex, message.payload.index);
                break;
            case 'DeleteGroup':
                this.deleteGroup(message.payload.gIndex);
                break;

            case 'DeleteGroupQuery':
                this.deleteGroupQuery(message.payload.gIndex, message.payload.index);
                break;
                */
        }
    }

    updateQuery( payload ) {
        console.log("linechart updateQuery", payload, this.widget.queries);
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex === -1 ) {
            query.id = this.util.generateId(6);
            this.widget.queries.push(query);
        } else {
            this.widget.queries[qindex] = query;
        }
        console.log("line chart updateQuery", this.widget.queries);
    }

    addMetricsToGroup(gConfig) {
        let gid = gConfig.id;

        if ( gid === 'new' ) {
            const g = this.createNewGroup();
            this.widget.queries.push(g);
            gid = g.id;
        }

        /*
        const config = this.util.getObjectByKey(this.widget.queries, 'id', gid);
        for ( let i = 0; i < gConfig.metrics.length; i++ ) {
            gConfig.metrics[i].settings.visual.type = 'line';
        }
        config.metrics = config.queries.concat(gConfig.queries);
        */
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

    ngAfterViewInit() {
    }

    setSize(init = false) {

        console.group('LINE-CHART');
            console.log('WIDGET', this.widget);
            console.log('EDIT MODE', this.editMode);
            console.log('ELEMENT', this.widgetOutputElement);
            console.log('OFFSET HEIGHT', this.widgetOutputElement.nativeElement.offsetHeight, this.widgetOutputElement.nativeElement.getBoundingClientRect());
        console.groupEnd();
        /*const wm =  this.widget.query.settings.legend.display &&
                    ( this.widget.query.settings.legend.position === 'left' ||
                        this.widget.query.settings.legend.position === 'right' ) ? .8 : 1;
        const hm = this.widget.query.settings.legend.display &&
                    ( this.widget.query.settings.legend.position === 'top' ||
                        this.widget.query.settings.legend.position === 'bottom' ) ? .8 : 1;
        // update graph content size
        const nWidth = this.widgetOutputElement.nativeElement.offsetWidth * wm;
        // let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
        let nHeight = this.editMode ? 270 : this.widgetOutputElement.nativeElement.offsetHeight;
        nHeight = nHeight * hm;
        // const titleSpace = this.editMode ? 30 : 0;
        this.size = { width: nWidth - 24, height: nHeight };
        // console.log("sie", nWidth, nHeight, wm, hm, this.size);*/

        // REDOING THIS - Wasn't really rendering correctly

        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        const nativeEl = (this.editMode) ? this.widgetOutputElement.nativeElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        const outputSize = nativeEl.getBoundingClientRect();
        const offset = init && this.editMode ? 100 : 0;

        let nWidth, nHeight, padding;

        const legendSettings = this.widget.settings.legend;

        let widthModifier = 1;
        this.legendDisplayColumns = [];
        if (legendSettings.display &&
                              ( legendSettings.position === 'left' ||
                                legendSettings.position === 'right' ) ) {
            this.legendDisplayColumns = ['series', 'name'];
            widthModifier = .7;
        }

        let heightModifier = 1;
        if ( legendSettings.display &&
                               ( legendSettings.position === 'top' ||
                                 legendSettings.position === 'bottom' ) ) {
            heightModifier = .75;
        }

        if (this.editMode) {
            padding = 8; // 8px top and bottom
            nHeight = ((outputSize.height - offset) * heightModifier) - (padding * 2);
            nWidth = (outputSize.width * widthModifier) - (padding * 2);
        } else {
            padding = 10; // 10px on the top
            nHeight = (outputSize.height * heightModifier) - (padding * 2);
            nWidth = (outputSize.width * widthModifier) - (padding * 2);
        }
        if ( this.legendDisplayColumns.length ) {
            if (nWidth >= 800 ) {
                this.legendDisplayColumns.push('min');
            }
            if (nWidth >= 1000 ) {
                this.legendDisplayColumns.push('max');
            }
        }
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
                                                 aggregator: config.aggregator,
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
            axis.tickFormat = { unit: config.unit, precision: decimals, unitDisplay: true };
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
        // this.options.axes.y.drawAxis = y1Enabled;
        // this.options.axisLabelWidth = y1Enabled ? 50 : 1;
         this.options.axes.y.drawAxis = true;
        // this.options.axes.y2.drawAxis = y2Enabled;
        this.options.axes.y.axisLabelWidth = y1Enabled ? 50 : 0;
        this.options.axes.y2.axisLabelWidth = y2Enabled ? 50 : 0;
        console.log("setaxis",  y1Enabled, y2Enabled, this.options, this.widget.queries);
    }

    updateAlertValue(nConfig) {
        const thresholds = this.widget.settings.thresholds || {};
        for ( let k in nConfig ) {
            const oConfig = this.widget.settings.axes ? this.widget.settings.axes[k] : <Axis>{};
            const oUnit = this.unit.getDetails(oConfig.unit);
            const nUnit = this.unit.getDetails(nConfig[k].unit);
            for ( let i in thresholds ) {
                if ( thresholds[i].axis === k) {
                    console.log("k=", k, thresholds[i], oUnit, nUnit);
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
        console.log('set visual', this.options, this.widget);
    }

    setLegend(config) {
        this.widget.settings.legend = config;
        this.setLegendDiv();
        this.setSize();
        this.options = {...this.options};
    }


    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setLegendDiv() {
        // NOTE: This is a weird way to do this. Do we really need 4 different divs for legen position? Just style the one.
        const lConfig = this.widget.settings.legend;
        this.options.labelsDiv = this.dygraphLegend.nativeElement;
        if ( lConfig.display ) {
            /*const position = lConfig.position[0].toUpperCase() + lConfig.position.slice(1);
            const legendDiv = this.elRef.nativeElement.querySelector('#dygraphLegend' + position );
            this.options.labelsDiv = lConfig.display ? legendDiv  : null;
            this.options.legend = lConfig.display ? 'always' : 'follow';*/

            //const legendDiv = this.dygraphLegend.nativeElement;
            //this.options.labelsDiv = lConfig.display ? legendDiv  : null;
            //this.options.legend = lConfig.display ? 'always' : 'follow';
        }
    }

    toggleChartSeries(index) {
        this.options.visibility[index - 1 ] = !this.options.visibility[index - 1];
        this.options = {...this.options};
    }

    getSeriesLabel(index) {
        const label = this.options.series[index].metric;
        return label.length > 30 ? label.substr(0, 30) + '..' : label;
    }
    getSeriesAggregate( index, aggregate ) {
        const sdata = [];
        for ( let i = 0; i < this.data.length; i++ ) {
            sdata.push( this.data[i][index]);
        }
        const value = this.util.getArrayAggregate( aggregate, sdata);
        const config = this.options.series[index];
        const format = config.axis === 'y' ? this.options.axes.y.tickFormat : this.options.axes.y2.tickFormat;
        const precision = format.precision ? format.precision : 2;
        return this.unit.format(value, { unit: format.unit, precision: precision } );
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
        console.log("nQueryDataLoading", this.nQueryDataLoading)
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

    /*
    mergeMetrics( groups ) {
        const newGroup = this.createNewGroup();
        let cntMergedQueries = 0;
        for ( let i = groups.length - 1; i >= 0; i-- ) {
            const group = groups[i];
            const queries = group.queries;
            if ( group.settings.tempUI.selected !== 'none' ) {
                for ( let j = queries.length - 1; j >= 0; j-- ) {
                    if ( queries[j].settings.selected ) {
                        const items = queries.splice( j, 1 );
                        newGroup.queries.push(items[0]);
                        cntMergedQueries++;
                    }
                }
                if ( !queries.length ) {
                    groups.splice( i, 1);
                }
            }
        }
        if ( cntMergedQueries > 1 ) {
            groups.unshift( newGroup );
            this.widget.query.groups = groups;
            this.widget = { ...this.widget };
        }
        console.log('___MERGE METRICS___',  groups, cntMergedQueries);
    }

    splitMetrics(groups) {
        let split = false;
        for ( let i = 0; i < groups.length; i++ ) {
            const group = groups[i];
            let cloneGroupIndex = 1;
            const queries = group.queries;
            if ( group.settings.tempUI.selected !== 'none') {
                for ( let j = 0; queries.length > 1 && j < queries.length; j++ ) {
                    if ( queries[j].settings.selected ) {
                        const cloneGroup = Object.assign({}, group);
                        cloneGroup.queries = [];
                        cloneGroup.id = this.util.generateId(6);
                        cloneGroup.title = 'clone ' +  cloneGroup.title + ' ' + (cloneGroupIndex++);
                        const query = queries.splice( j, 1 );
                        cloneGroup.queries.push(query[0]);
                        groups.splice(i + 1, 0, cloneGroup);
                        i++; // skip the loop for the newly created group
                        split = true;
                    }
                }
            }
        }
        if ( split ) {
            this.widget.query.groups = groups;
            this.widget = { ...this.widget };
        }
    }

    deleteMetrics(groups) {
        let deletedMetrics = false;
        for ( let i = groups.length - 1; i >= 0; i-- ) {
            const group = groups[i];
            const queries = group.queries;
            // group delete 
            if ( group.settings.tempUI.selected === 'all' ) {
                groups.splice( i, 1 );
                deletedMetrics = true;
            } else if ( group.settings.tempUI.selected !== 'none') {
                for ( let j = queries.length - 1;  j >= 0; j-- ) {
                    if ( queries[j].settings.selected ) {
                        queries.splice( j, 1 );
                        deletedMetrics = true;
                    }
                }
            }
        }
        if ( deletedMetrics ) {
            this.widget.query.groups = groups;
            this.widget = { ...this.widget };
        }
    }

    toggleGroup(gIndex) {
        this.widget.query.groups[gIndex].settings.visual.visible = !this.widget.query.groups[gIndex].settings.visual.visible;
        for (let i = 0; i < this.widget.query.groups[gIndex].queries.length; i++) {
            this.widget.query.groups[gIndex].queries[i].settings.visual.visible =
            this.widget.query.groups[gIndex].settings.visual.visible;
        }
        // if ( this.widget.query.groups[gIndex].queries.length === 1 ) {
        //     this.widget.query.groups[gIndex].queries[0].settings.visual.visible = this.widget.query.groups[gIndex].settings.visual.visible;
        // }
        this.refreshData(false);
    }
    deleteGroup(gIndex) {
        this.widget.query.groups.splice(gIndex, 1);
        this.refreshData();
    }

    toggleGroupQuery(gIndex, index) {
        // toggle the individual query
        this.widget.query.groups[gIndex].queries[index].settings.visual.visible =
            !this.widget.query.groups[gIndex].queries[index].settings.visual.visible;

        // set the group to visible if the individual query is visible
        if (this.widget.query.groups[gIndex].queries[index].settings.visual.visible) {
            this.widget.query.groups[gIndex].settings.visual.visible = true;
        } else { // set the group to invisible if all queries are invisible
            this.widget.query.groups[gIndex].settings.visual.visible = false;
            for (let i = 0; i < this.widget.query.groups[gIndex].queries.length; i++) {
                if (this.widget.query.groups[gIndex].queries[i].settings.visual.visible) {
                    this.widget.query.groups[gIndex].settings.visual.visible = true;
                    break;
                }
            }
        }
        this.refreshData(false);
    }

    deleteGroupQuery(gIndex, index) {
        this.widget.query.groups[gIndex].queries.splice(index, 1);
        this.refreshData();
    }
    */

    showError() {
        console.log('%cErrorDialog', 'background: purple; color: white;', this.error);
        const parentPos = this.elRef.nativeElement.getBoundingClientRect();
        console.log("parentpos", parentPos);
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        const offsetHeight = 60;
        dialogConf.width = '50%';
        dialogConf.minWidth = '500px';
        dialogConf.height = '200px';
        dialogConf.backdropClass = 'error-dialog-backdrop';
        dialogConf.panelClass = 'error-dialog-panel';
        /*
        dialogConf.position = <DialogPosition>{
            top:   '30%',
            bottom: '0px',
            left: parentPos.left + 'px',
            right: '0px'
        };
        console.log("dialogConf", dialogConf.position);
        */
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
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

}

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
import multiColumnGroupPlotter from '../../../../../shared/dygraphs/plotters';

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
    @ViewChild('dygraphLegendLeft') private dygraphLegendLeft: ElementRef;

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
        connectSeparatedPoints: true,
        drawPoints: false,
        //  labelsDivWidth: 0,
        // legend: 'follow',
        logscale: true,
        digitsAfterDecimal: 2,
        stackedGraph: this.isStackedGraph,
        hightlightCircleSize: 1,
        strokeWidth: 1,
        strokeBorderWidth: this.isStackedGraph ? null : 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            strokeBorderWidth: 1,
            hightlightCircleSize: 5
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
    };
    data: any = [[0]];
    size: any = {};

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        private util: UtilsService,
        private elRef: ElementRef,
        private unit: UnitConverterService
    ) { }

    ngOnInit() {
        // console.log('TEST', this.widgetOutputElement.nativeElement.getBoundingClientRect());
                // subscribe to event stream
                this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

                    switch( message.action ) {
                        case 'resizeWidget':
                            this.setSize();
                            break;
                        case 'reQueryData':
                            this.refreshData();
                            break;
                        case 'TimezoneChanged':
                            this.setTimezone(message.payload);
                            this.options = {...this.options};
                            break;
                    }

                    if (message && (message.id === this.widget.id)) {
                        switch (message.action) {
                            case 'updatedWidgetGroup':
                                if (this.widget.id === message.id) {
                                    this.isDataLoaded = true;
                                    const rawdata = message.payload.rawdata;
                                    this.setTimezone(message.payload.timezone);
                                    this.setLegendDiv();
                                    this.data = this.dataTransformer.yamasToDygraph(this.widget, this.options, this.data, rawdata);
                                }
                                break;
                            case 'getUpdatedWidgetConfig':
                                if(this.widget.id === message.id) {
                                    this.widget = message.payload;
                                    console.log('call here erer', );                            
                                    this.refreshData();
                                }
                                break;
                            }
                        }
                });
                // when the widget first loaded in dashboard, we request to get data
                // when in edit mode first time, we request to get cached raw data.
                if (!this.editMode) {
                    this.requestData();
                } else {
                    this.setSize();
                    this.requestCachedData();
                }
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
                break;
            case 'SetAlerts':
                this.widget.query.settings.thresholds = message.payload.data;
                this.setAlertOption();
                this.options = { ...this.options };
                break;
            case 'SetAxes' :
                this.updateAlertValue(message.payload.data.y1);
                this.widget.query.settings.axes = { ...this.widget.query.settings.axes, ...message.payload.data };
                this.setAxesOption();
                this.options = { ...this.options };
                break;
            case 'SetLegend':
                this.setLegend(message.payload.data);
                break;
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
        }
    }

    addMetricsToGroup(gConfig) {
        let gid = gConfig.id;

        if ( gid === 'new' ) {
            const g = this.createNewGroup();
            this.widget.query.groups.push(g);
            gid = g.id;
        }

        const config = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
        config.queries = config.queries.concat(gConfig.queries);
    }

    createNewGroup() {
        const gid = this.util.generateId(6);
        const g = {
                    id: gid,
                    title: 'untitled group',
                    queries: [],
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

    setSize() {
        const wm =  this.widget.query.settings.legend.display &&
                    ( this.widget.query.settings.legend.position === 'left' ||
                        this.widget.query.settings.legend.position === 'right' ) ? .8 : 1;
        const hm = this.widget.query.settings.legend.display &&
                    ( this.widget.query.settings.legend.position === 'top' ||
                        this.widget.query.settings.legend.position === 'bottom' ) ? .8 : 1;
        // update graph content size
        const nWidth = this.widgetOutputElement.nativeElement.offsetWidth * wm;
        // let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
        let nHeight = this.editMode ? 300 : this.widgetOutputElement.nativeElement.offsetHeight;
        nHeight = nHeight * hm;
        // const titleSpace = this.editMode ? 30 : 0;
        this.size = { width: nWidth - 24, height: nHeight - 50 };
        // console.log("sie", nWidth, nHeight, wm, hm, this.size);
    }

    setTimezone(timezone) {
        this.options.labelsUTC = timezone === 'utc' ? true : false;
    }

    setTimeConfiguration(config) {
        this.widget.query.settings.time = {
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
        const axisKeys = Object.keys(this.widget.query.settings.axes);
        const thresholds = this.widget.query.settings.thresholds || {};
        for (let i = 0; i < axisKeys.length; i++ ) {
            const config = this.widget.query.settings.axes[axisKeys[i]];
            const chartAxisID = axisKeys[i] === 'y1' ? 'y' : axisKeys[i] === 'y2' ? 'y2' : 'x';
            const axis = this.options.axes[chartAxisID];
            if ( !isNaN( config.min ) ) {
                axis.valueRange[0] = config.min;
            }
            if ( !isNaN( config.max ) ) {
                axis.valueRange[1] = config.max;
            }

            if ( axisKeys[i] === 'y1' || axisKeys[i] === 'y2' ) {
                axis.logscale = config.scale === 'linear' ? false : true;
                const label = config.label.trim();
                this.options[chartAxisID + 'label'] = label;
            }

            axis.drawAxis = config.enabled ? true : false;
            // move series from y2 to y1 if y2 is disabled
            if ( this.options.series &&  axisKeys[i] === 'y2' && !config.enabled) {
                for ( let k in this.options.series ) {
                    if (this.options.series[k]) {
                        this.options.series[k].axis = 'y';
                    }
                }
                const groups = this.widget.query.groups;
                for ( let m = 0; m < groups.length; m++ ) {
                    const queries = groups[m].queries;
                    for ( let n = 0; n < queries.length; n++ ) {
                        queries[n].settings.visual.axis = 'y1';
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
        console.log("setaxis",  this.options, this.widget.query.groups[0].queries);
    }

    updateAlertValue(nConfig) {
        const oConfig = this.widget.query.settings.axes ? this.widget.query.settings.axes.y1 : <Axis>{};
        const oUnit = this.unit.getDetails(oConfig.unit);
        const nUnit = this.unit.getDetails(nConfig.unit);
        const thresholds = this.widget.query.settings.thresholds || {};
        for ( let i in thresholds ) {
            thresholds[i].value = oUnit ? thresholds[i].value * oUnit.m : thresholds[i].value;
            thresholds[i].value = nUnit ? thresholds[i].value / nUnit.m : thresholds[i].value;
        }
    }

    setAlertOption() {
        const thresholds = this.widget.query.settings.thresholds;
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
                const axis = this.widget.query.settings.axes ? this.widget.query.settings.axes[k] : null;
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

    setVisualization( gIndex, configs ) {

        configs.forEach( (config, i) => {
            // tslint:disable-next-line:max-line-length
            this.widget.query.groups[gIndex].queries[i].settings.visual = { ...this.widget.query.groups[gIndex].queries[i].settings.visual, ...config };
        });

        const mConfigs = this.widget.query.groups[gIndex].queries;
        for ( let i = 0; i < mConfigs.length; i++ ) {
            const vConfig = mConfigs[i].settings.visual;
            const label =  mConfigs[i].metric;
            this.options.series[label] = {
                strokeWidth: parseFloat(vConfig.lineWeight),
                strokePattern: this.getStrokePattern(vConfig.lineType),
                color: vConfig.color || '#000000',
                axis: !vConfig.axis || vConfig.axis === 'y' ? 'y' : 'y2'
            };
            if ( vConfig.axis === 'y2' ) {
                this.widget.query.settings.axes.y2.enabled = true;
            }
            if ( vConfig.type === 'bar' ) {
                // this.options.series[label].plotter = multiColumnGroupPlotter;
            }
        }
        console.log('set visual', this.options);
        this.options = {...this.options};
    }

    setLegend(config) {
        this.widget.query.settings.legend = config;
        this.setLegendDiv();
        this.setSize();
        this.options = {...this.options};
    }


    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setLegendDiv() {
        // NOTE: This is a weird way to do this. Do we really need 4 different divs for legen position? Just style the one.
        const lConfig = this.widget.query.settings.legend;
        this.options.labelsDiv = null;
        this.options.legend = 'follow';
        if ( lConfig.display ) {
            const position = lConfig.position[0].toUpperCase() + lConfig.position.slice(1);
            const legendDiv = this.elRef.nativeElement.querySelector('#dygraphLegend' + position );
            this.options.labelsDiv = lConfig.display ? legendDiv  : null;
            this.options.legend = lConfig.display ? 'always' : 'follow';
        }
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.query
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
        this.options = {...this.options, labels: ['x']};
        this.data = [[0]];
        if ( reload ) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
    }

    getStrokePattern( lineType ) {
        let pattern = [];
        switch ( lineType ) {
            case 'solid':
                pattern = [];
                break;
            case 'dashed':
                pattern = [4, 4];
                break;
            case 'dotted':
                pattern = [2, 3];
                break;
            case 'dot-dashed':
                pattern = [4, 4, 2];
                break;
        }
        return pattern;
    }

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
        if ( this.widget.query.groups[gIndex].queries.length === 1 ) {
            this.widget.query.groups[gIndex].queries[0].settings.visual.visible = this.widget.query.groups[gIndex].settings.visual.visible;
        }
        this.refreshData(false);
    }
    deleteGroup(gIndex) {
        this.widget.query.groups.splice(gIndex, 1);
        this.refreshData(false);
    }

    toggleGroupQuery(gIndex, index) {
        this.widget.query.groups[gIndex].queries[index].settings.visual.visible = !this.widget.query.groups[gIndex].queries[index].settings.visual.visible;
        this.refreshData(false);
    }

    deleteGroupQuery(gIndex, index) {
        this.widget.query.groups[gIndex].queries.splice(index, 1);
        this.refreshData(false);
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
        let cloneWidget = {...this.widget};
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

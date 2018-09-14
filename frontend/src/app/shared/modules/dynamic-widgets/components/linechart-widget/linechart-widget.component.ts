import {
    Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef
} from '@angular/core';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';


import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
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
        connectSeparatedPoints: true,
        drawPoints: false,
        //  labelsDivWidth: 0,
        //legend: 'follow',
        logscale: true,
        digitsAfterDecimal: 2,
        stackedGraph: this.isStackedGraph,
        hightlightCircleSize: 1,
        strokeWidth: 1,
        strokeBorderWidth: this.isStackedGraph ? null : 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            strockeBorderWidth: 1,
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
        private elRef:ElementRef
    ) { }

    ngOnInit() {
        // console.log('TEST', this.widgetOutputElement.nativeElement.getBoundingClientRect());
                // subscribe to event stream
                this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

                    if (message.action === 'resizeWidget') {
                        this.setSize();
                    }
                    if (message && (message.id === this.widget.id)) {
                        switch (message.action) {
                            case 'updatedWidgetGroup':
                                if (this.widget.id === message.id) {
                                    this.isDataLoaded = true;
                                    const rawdata = message.payload;
                                    this.setLegendDiv();
                                    this.data = this.dataTransformer.yamasToDygraph(this.widget, this.options, this.data, rawdata);
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
                    this.interCom.requestSend({
                        id: this.widget.id,
                        action: 'getWidgetCachedData'
                    });
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
                this.setAlerts(message.payload.data);
                break;
            case 'SetAxes' :
                this.setAxes(message.payload.data);
                break;
            case 'SetLegend':
                this.setLegend(message.payload.data);
                break;
        }
    }

    addMetricsToGroup(gConfig) {
        let gid = gConfig.id;

        if ( gid === 'new' ) {
            const g = this.addNewGroup();
            gid = g.id;
        }

        const config = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
        config.queries = config.queries.concat(gConfig.queries);
    }

    addNewGroup() {
        const gid = this.util.generateId(6);
        const g = {
                    id: gid,
                    title: 'untitled group',
                    queries: [],
                    settings: {
                        tempUI: {
                            selected: false
                        }
                    }
                };
        this.widget.query.groups.push(g);
        return g;
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    ngAfterViewInit() {

        if (this.editMode) {
            this.setSize();
        }

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
        //const titleSpace = this.editMode ? 30 : 0;
        this.size = { width: nWidth - 24, height: nHeight - 50 };
        //console.log("sie", nWidth, nHeight, wm, hm, this.size);
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
    }

    setAxes( axes ) {
console.log("...setAxes....", axes);
        this.widget.query.settings.axes = { ...this.widget.query.settings.axes, ...axes };

        const keys = Object.keys(this.widget.query.settings.axes);
        for (let i = 0; i < keys.length; i++ ) {
            const k = keys[i];
            const config = this.widget.query.settings.axes[keys[i]];
            const axisKey = k === 'y1' ? 'y' : k === 'y2' ? 'y2' : 'x';
            const axis = this.options.axes[axisKey];
            if ( !isNaN( config.min ) ) {
                axis.valueRange[0] = config.min;
            }
            if ( !isNaN( config.max ) ) {
                axis.valueRange[1] = config.max;
            }

            if ( axisKey === 'y' || axisKey === 'y2' ) {
                axis.logscale = config.scale === 'linear' ? false : true;
                const label = config.label.trim();
                this.options[axisKey + 'label'] = label;
            }

            if ( config.enable) {

            }

            axis.drawAxis = config.enabled ? true : false;
            // move series from y2 to y1 if y2 is disabled
            if ( this.options.series &&  axisKey === 'y2' && !config.enabled) {
                for ( let k in this.options.series ) {
                    this.options.series[k].axis = 'y';
                }
                const groups = this.widget.query.groups;
                for ( let m = 0; m < groups.length; m++ ) {
                    const queries = groups[m].queries;
                    for ( let n = 0; n < queries.length; n++ ) {
                        queries[n].settings.visual.axis = 'y';
                    }
                }
            }


            if ( config.decimals || config.unit  ) {
                axis.tickFormat = { unit: config.unit, precision: config.decimals, unitDisplay: true };
            }
        }
        console.log("setaxis",  this.options, this.widget.query.groups[0].queries);


        this.options = {...this.options};
    }

    setAlerts(thresholds) {
        console.log('thresholds', thresholds);
        this.widget.query.settings.thresholds = thresholds;
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
                const o = {
                    value: threshold.value,
                    scaleId: 'y',
                    borderColor: threshold.lineColor,
                    borderWidth: parseInt(threshold.lineWeight, 10),
                    borderDash: lineType
                };
                this.options.thresholds.push(o);
            }
        });
        this.options = { ...this.options };
    }

    setVisualization( gIndex, configs ) {

        configs.forEach( (config, i) => {
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
                //this.options.series[label].plotter = multiColumnGroupPlotter;
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

    refreshData() {
        this.isDataLoaded = false;
        this.options = {...this.options, labels: ['x']};
        this.data = [[0]];
        this.requestData();
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

    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: 'dashboard'
        });
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

}

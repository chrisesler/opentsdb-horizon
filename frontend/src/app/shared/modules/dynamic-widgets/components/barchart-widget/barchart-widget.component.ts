import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';

import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
import { isNumber } from 'util';
import { CompilerConfig } from '../../../../../../../node_modules/@angular/compiler';


@Component({
  selector: 'app-barchart-widget',
  templateUrl: './barchart-widget.component.html',
  styleUrls: ['./barchart-widget.component.scss'],
})
export class BarchartWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.barchart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    isStackedGraph: boolean = false;
    // properties to pass to  chartjs chart directive

    type = 'bar';
    type$: BehaviorSubject<string>;
    typeSub: Subscription;

    categoryAxis: any = {
        type: 'category'
    };

    valueAxis: any = {
        ticks: {
            beginAtZero: true
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

    };
    data: any = [ ];
    width = '100%';
    height = '100%';

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        private util: UtilsService
    ) { }

    ngOnInit() {
        this.type$ = new BehaviorSubject(this.widget.query.settings.visual.type || 'vertical');

        this.typeSub = this.type$.subscribe( type => {
            this.widget.query.settings.visual.type = type;
            this.options.scales.yAxes[0] = type === 'vertical' ? this. valueAxis : this.categoryAxis;
            this.options.scales.xAxes[0] = type === 'vertical' ? this.categoryAxis : this.valueAxis;
            this.type = type === 'vertical' ? 'bar' : 'horizontalBar';
        });

        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if ( message.action === 'resizeWidget' && !this.editMode ) {
                // we get the size to update the graph size
                this.width = message.payload.width * this.widget.gridPos.w - 30 + 'px';
                this.height = message.payload.height * this.widget.gridPos.h - 70 + 'px';
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        console.log('updateWidget', message);
                            this.isDataLoaded = true;
                            //const gid = Object.keys(message.payload)[0];
                            //const config = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
                            //config.wSettings = this.widget.query.settings;
                            //console.log('bar widget==>', config.queries, gid , message);
                            this.data = this.dataTransformer.yamasToChartJS(this.type, this.options, this.widget.query, this.data, message.payload, this.isStackedGraph);
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

    ngOnChanges(changes: SimpleChanges) {
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

    updateConfig(message) {
        switch ( message.action ) {
            case 'AddMetricsToGroup':
                this.addMetricsToGroup(message.payload.data);
                this.refreshData();
            break;
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                break;
            case 'SetVisualization':
                this.setBarVisualization( message.payload.gIndex, message.payload.data );
                break;
            case 'SetAlerts':
                this.setAlerts(message.payload.data);
                break;
            case 'SetAxes' :
                this.setAxis(message.payload.data);
                break;
            case 'ChangeVisualization':
                this.type$.next(message.payload.type);
                break;
            case 'SetStackedBarBarVisuals':
                this.setStackedBarLabels(message.payload.data);
                break;
            case 'SetStackedBarStackVisuals':
                this.setStackedStackVisuals(message.payload.data);
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
        const prevTotal = config.queries.length;

        let i = 1;
        const dVisaul = {
            color: '#000000',
            aggregator: 'sum'
        };

        for (const metric of gConfig.queries ) {
            metric.settings.visual = {...dVisaul, ...metric.settings.visual };
            metric.settings.visual.stackLabel = 'bar-' + ( prevTotal + i) ;
            i++;
        }
        config.queries = config.queries.concat(gConfig.queries);
        this.widget = {...this.widget};
    }

    addNewGroup() {
        const gid = this.util.generateId(6);
        const g = {
                    id: gid,
                    title: 'untitled group',
                    queries: [],
                    settings: {
                    }
                };
        this.widget.query.groups.push(g);
        return g;
    }

    refreshData() {
        this.isDataLoaded = false;
        this.requestData();
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
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


    setAxis( axes ) {

        this.widget.query.settings.axes = { ...this.widget.query.settings.axes, ...axes };
        const axis = this.valueAxis;
        const config = this.widget.query.settings.axes.y1;
        axis.type = config.scale === 'linear' ? 'linear' : 'logarithmic';

        axis.ticks = {};

        if ( !isNaN( config.min ) ) {
            axis.ticks.min = config.min;
        }
        if ( !isNaN( config.max ) ) {
            axis.ticks.max = config.max;
        }
        const label = config.label.trim();
        axis.scaleLabel = label ? { labelString: label, display: true } : {};

        if ( config.decimals || config.unit  ) {
            axis.ticks.format = { unit: config.unit, precision: config.decimals, unitDisplay: true };
        }

        this.options = {...this.options};
    }

    setBarVisualization( gIndex, configs ) {
        let reload = false;
        configs.forEach( (config, i) => {
            if (this.widget.query.groups[0].queries[i].settings.visual.aggregator !== config.aggregator ) {
                reload = true;
            }
            this.widget.query.groups[gIndex].queries[i].settings.visual = { ...this.widget.query.groups[gIndex].queries[i].settings.visual, ...config };
        });

        if ( reload ) {
            this.refreshData();
        } else {
            const labels = [];
            const colors = [];
            const mConfigs = this.widget.query.groups[0].queries;
            for ( let i = 0; i < mConfigs.length; i++ ) {
                const vConfig = mConfigs[i].settings.visual;
                let label = vConfig.stackLabel.length ? vConfig.stackLabel : mConfigs[i].metric;
                label = label.length <= 20 ? label : label.substr(0, 17) + '..';
                const color = vConfig.color;
                labels.push( label );
                colors.push(color);
            }
            this.options.labels = labels;
            this.options = {...this.options};
            this.data[0] = { ...this.data[0], ...{'backgroundColor': colors } };
        }
    }

    setAlerts(thresholds) {
        console.log('thresholds', thresholds);
        this.widget.query.settings.thresholds = thresholds;
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
                    value: threshold.value,
                    scaleId: 'y-axis-0',
                    borderColor: threshold.lineColor,
                    borderWidth: parseInt(threshold.lineWeight, 10),
                    borderDash: lineType
                };
                this.options.threshold.thresholds.push(o);
            }
        });
        this.options = { ...this.options };
    }

    setStackedBarLabels(gConfigs) {
        const labels = [];
        gConfigs.forEach( (config, i ) => {
            this.widget.query.groups[i].settings.visual.label = config.label;
            labels.push( config.label);
        });
        this.options.labels = labels;
        this.options = {...this.options};
        console.log(this.widget.query.groups);
    }

    setStackedStackVisuals(configs) {
        this.widget.query.settings.visual.stacks = configs;
        this.widget.query.settings.visual.stacks.forEach((config, i) => {
            this.data[i].label = config.label;
            this.data[i].backgroundColor = config.color;
        });
        this.data = [...this.data];
        console.log("stacks..", this.data);
    }

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: true
        });
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
        this.typeSub.unsubscribe();
    }
}

export class StackedBarchartWidgetComponent extends BarchartWidgetComponent  {
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;
    isStackedGraph = true;
}

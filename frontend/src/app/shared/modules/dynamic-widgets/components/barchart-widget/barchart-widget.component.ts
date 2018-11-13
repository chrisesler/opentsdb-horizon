import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';

import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
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
        legend: {
            display: false,
            position: 'right'
        }
    };
    data: any = [ ];
    width = '100%';
    height = '100%';

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        private util: UtilsService,
        private unit: UnitConverterService
    ) { }

    ngOnInit() {
        this.type$ = new BehaviorSubject(this.widget.query.settings.visual.type || 'vertical');
        this.options.legend.display = this.isStackedGraph ? true : false;

        this.typeSub = this.type$.subscribe( type => {
            this.widget.query.settings.visual.type = type;
            this.options.scales.yAxes[0] = type === 'vertical' ? this. valueAxis : this.categoryAxis;
            this.options.scales.xAxes[0] = type === 'vertical' ? this.categoryAxis : this.valueAxis;
            this.type = type === 'vertical' ? 'bar' : 'horizontalBar';
        });
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch( message.action ) {
                case 'resizeWidget':
                    if ( !this.editMode ) {
                        this.width = message.payload.width * this.widget.gridPos.w - 30 + 'px';
                        this.height = message.payload.height * this.widget.gridPos.h - 70 + 'px';
                    }
                    break;
                case 'reQueryData':
                    this.refreshData();
                    break;
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        if ( !this.isDataLoaded ) {
                            this.options.labels = [];
                            this.data = [];
                            this.isDataLoaded = true;
                        }
                        this.data = this.dataTransformer.yamasToChartJS(this.type, this.options, this.widget.query, this.data, message.payload.rawdata, this.isStackedGraph);
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
        this.setOptions();
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    requestData() {
        if (!this.isDataLoaded) {
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
            case 'SetStackedBarVisualization':
                this.setStackedBarVisualization( message.payload.gIndex, message.payload.data );
                break;
            case 'SetVisualization':
                this.setBarVisualization( message.payload.gIndex, message.payload.data );
                break;
            case 'SetAlerts':
                this.widget.query.settings.thresholds = message.payload.data;
                this.setAlertOption();
                this.options = { ...this.options };
                break;
            case 'SetAxes' :
                this.updateAlertValue(message.payload.data.y1);
                this.widget.query.settings.axes = { ...this.widget.query.settings.axes, ...message.payload.data };
                this.setAxisOption();
                this.options = { ...this.options };
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
                console.log("DeleteGroupQuery", message.payload);
                this.deleteGroupQuery(message.payload.gIndex, message.payload.index);
                break;
            case 'DeleteMetrics':
                this.deleteMetrics(message.payload.data);
                this.refreshData(false);
                break;

        }
    }
    addMetricsToGroup(gConfig) {
        console.log("addMetricstogroup....", JSON.stringify(gConfig));
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
            visible: true,
            aggregator: 'sum'
        };

        for (const metric of gConfig.queries ) {
            metric.settings.visual = {...dVisaul, ...metric.settings.visual };
            if ( !this.isStackedGraph ) {
                metric.settings.visual.stackLabel = 'bar-' + ( prevTotal + i) ;
            }
            i++;
        }
        config.queries = config.queries.concat(gConfig.queries);
        
        if ( this.isStackedGraph ) {
            this.setStackForGroup(gid);
        }

        console.log("addMetricstogroup....", this.widget.query);
        this.widget = {...this.widget};
    }

    setStackForGroup(gid) {
        const gconfig = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
        const queries = gconfig.queries;
        const stacks = this.widget.query.settings.visual.stacks || [];

        const availStacks = stacks.filter(x => !queries.find(function(a) { console.log("x=",x,'a=',a.settings.visual,"cno=",x.id === a.settings.visual.stack); return x.id === a.settings.visual.stack; } ));
        console.log("available stacks", availStacks, "len=", availStacks.length);
        for ( let i = 0; i < queries.length; i++ ) {
            const vSetting = queries[i].settings.visual;
            if ( !vSetting.stack ) {
                const stack = availStacks.length ?  availStacks.shift() : this.addNewStack();
                vSetting.stack = stack.id;
            }
        }
    }

    addNewStack() {
        const oStack = {
            id : this.util.generateId(3),
            label: 'Stack-' + ( this.widget.query.settings.visual.stacks.length + 1 ),
            color: '#000000'
        };
        const index = this.widget.query.settings.visual.stacks.push(oStack);
        return oStack;
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
                        },
                        visual: {
                            visible: true
                        }
                    }
                };
        this.widget.query.groups.push(g);
        return g;
    }

    deleteMetrics(groups) {
        let deletedMetrics = false;
        const usedStacks = [];
        for ( let i = groups.length - 1; i >= 0; i-- ) {
            const group = groups[i];
            const queries = group.queries;
            //group delete 
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
            this.widget.query.groups = groups;
            // delete the stacks that are no longer used
            const stacks = this.widget.query.settings.visual.stacks;
            if ( usedStacks.length !== stacks.length ) {
                this.widget.query.settings.visual.stacks = stacks.filter( stack => usedStacks.indexOf(stack.id) !== -1 );
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


    setAxisOption() {
        const axis = this.valueAxis;
        const config = this.widget.query.settings.axes && this.widget.query.settings.axes.y1 ?
                            this.widget.query.settings.axes.y1 : <Axis>{};
        const oUnit = this.unit.getDetails(config.unit);
        axis.type = !config.scale || config.scale === 'linear' ? 'linear' : 'logarithmic';
        axis.ticks = {};
        if ( !isNaN( config.min ) && config.min ) {
            axis.ticks.min = oUnit ? config.min * oUnit.m : config.min;
        }
        if ( !isNaN( config.max ) && config.max ) {
            console.log("comes here", config.max, (oUnit ? config.max * oUnit.m : config.max));
            axis.ticks.max = oUnit ? config.max * oUnit.m : config.max;
        }
        const label = config.label ? config.label.trim() : '';
        const decimals = !config.decimals || config.decimals.toString().trim() === 'auto' ? 2 : config.decimals;
        axis.scaleLabel = label ? { labelString: label, display: true } : {};
        axis.ticks.format = { unit: config.unit, precision: decimals, unitDisplay: config.unit ? true : false };
        console.log("setAxes", config, axis);
    }

    setStackedBarVisualization(gIndex, configs) {
        console.log("setStackedBarVisualization", gIndex, configs);
        configs.forEach( (config, i) => {
            this.widget.query.groups[gIndex].queries[i].settings.visual = { ...this.widget.query.groups[gIndex].queries[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setBarVisualization( gIndex, configs ) {
        configs.forEach( (config, i) => {
            this.widget.query.groups[gIndex].queries[i].settings.visual = { ...this.widget.query.groups[gIndex].queries[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setAlertOption() {
        const thresholds = this.widget.query.settings.thresholds || {};
        const axis = this.widget.query.settings.axes && this.widget.query.settings.axes.y1 ? this.widget.query.settings.axes.y1 : <Axis>{};
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
        this.setAxisOption();
        this.setAlertOption();
        this.options = {...this.options};
    }

    updateAlertValue(nConfig) {
        const oConfig = this.widget.query.settings.axes && this.widget.query.settings.axes.y1 ? this.widget.query.settings.axes.y1 : <Axis>{};
        const oUnit = this.unit.getDetails(oConfig.unit);
        const nUnit = this.unit.getDetails(nConfig.unit);
        const thresholds = this.widget.query.settings.thresholds || {};
        for ( let i in thresholds ) {
            thresholds[i].value = oUnit ? thresholds[i].value * oUnit.m : thresholds[i].value;
            thresholds[i].value = nUnit ? thresholds[i].value / nUnit.m : thresholds[i].value;
        }
    }

    setStackedBarLabels(gConfigs) {
        const labels = [];
        const labelUntitled = 'untitled group';
        let labelIndex = 1;
        gConfigs.forEach( (config, i ) => {
            let label = config.label;
            if ( label === '' ) {
                label = labelUntitled + (labelIndex === 1 ? '' : ' ' + labelIndex);
                labelIndex++;
            }
            this.widget.query.groups[i].title = label;
            labels.push( label );
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

    toggleGroup(gIndex) {
        this.widget.query.groups[gIndex].settings.visual.visible = !this.widget.query.groups[gIndex].settings.visual.visible;
        for (let i = 0; i < this.widget.query.groups[gIndex].queries.length; i++) {
            this.widget.query.groups[gIndex].queries[i].settings.visual.visible =
            this.widget.query.groups[gIndex].settings.visual.visible;
        }
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
        console.log(this.widget.query.groups[gIndex].queries, "gindex", gIndex, index);
        this.refreshData();
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

export class StackedBarchartWidgetComponent extends BarchartWidgetComponent  {
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;
    isStackedGraph = true;
}

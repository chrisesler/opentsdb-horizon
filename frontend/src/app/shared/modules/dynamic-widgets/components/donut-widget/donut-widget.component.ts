import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';

// import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';


import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from '../../../../../../../node_modules/rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'donut-widget',
    templateUrl: './donut-widget.component.html',
    styleUrls: ['./donut-widget.component.scss']
})

export class DonutWidgetComponent implements OnInit, OnChanges, OnDestroy {
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

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        private util: UtilsService
    ) { }

    ngOnInit() {
        this.type$ = new BehaviorSubject(this.widget.query.settings.visual.type || 'doughnut');
        this.typeSub = this.type$.subscribe( type => {
            this.widget.query.settings.visual.type = type;
            this.type = type === 'doughnut' ? 'doughnut' : 'pie';
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
                            this.isDataLoaded = true;
                            this.options.labels = [];
                            this.data = [];
                        }
                        this.setOptions();
                        this.data = this.dataTransformer.yamasToChartJS('donut', this.options, this.widget.query, this.data, message.payload.rawdata);
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
            case 'SetLegend':
                this.widget.query.settings.legend = message.payload.data;
                this.setLegendOption();
                this.options = {...this.options};
                break;
            case 'ChangeVisualization':
                this.type$.next(message.payload.type);
                break;
            case 'SetVisualization':
                this.setVisualization(message.payload.data);
                break;
            case 'ToggleQuery':
                this.toggleQuery(message.payload.index);
                break;
            case 'ToggleGroup':
                this.toggleGroup(message.payload.index);
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.payload.index);
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
            visible: true,
            aggregator: 'sum'
        };

        for (const metric of gConfig.queries ) {
            metric.settings.visual = {...dVisaul, ...metric.settings.visual };
            metric.settings.visual.stackLabel = 'section-' + ( prevTotal + i) ;
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

    setVisualization( mconfigs ) {
        mconfigs.forEach( (config, i) => {
            this.widget.query.groups[0].queries[i].settings.visual = { ...this.widget.query.groups[0].queries[i].settings.visual, ...config };
        });
        this.refreshData(false);
    }

    setOptions() {
        this.setLegendOption();
        this.setLablesOption();
    }

    setLegendOption() {
        this.options.legend = {...this.widget.query.settings.legend};
        this.options.plugins.labels = this.options.legend.showPercentages ? {
            render: 'percentage',
            precision: 2,
            fontColor: 'black'
        } : false;
    }

    setLablesOption() {
        this.options.labels = [];

        const gConfig = this.widget.query.groups[0];
        const mConfigs = gConfig.queries;

        for ( let i = 0; i < mConfigs.length; i++ ) {
            const metric = mConfigs[i].metric;
            const vConfig = mConfigs[i].settings.visual;
            let label = vConfig.stackLabel ? vConfig.stackLabel : metric;
            if ( vConfig.visible ) {
                label = label.length <= 20 ? label : label.substr(0, 17) + '..';
                this.options.labels.push( label );
            }
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

    toggleQuery(index) {
        const gIndex = 0;
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

    toggleGroup(gIndex) {
        this.widget.query.groups[gIndex].settings.visual.visible = !this.widget.query.groups[gIndex].settings.visual.visible;
        for (let i = 0; i < this.widget.query.groups[gIndex].queries.length; i++) {
            this.widget.query.groups[gIndex].queries[i].settings.visual.visible =
            this.widget.query.groups[gIndex].settings.visual.visible;
        }
        this.refreshData(false);
    }

    deleteQuery(index) {
        const gIndex = 0;
        this.widget.query.groups[gIndex].queries.splice(index, 1);
        console.log(this.widget.query.groups[gIndex].queries, "gindex", gIndex, index);
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

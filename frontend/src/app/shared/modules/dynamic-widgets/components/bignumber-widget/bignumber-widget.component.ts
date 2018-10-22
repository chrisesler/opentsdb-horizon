import { Component, OnInit, HostBinding, Input, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
import {
    WidgetConfigAlertsComponent,
    WidgetConfigAxesComponent,
    WidgetConfigGeneralComponent,
    WidgetConfigLegendComponent,
    WidgetConfigMetricQueriesComponent,
    WidgetConfigQueryInspectorComponent,
    WidgetConfigTimeComponent
} from '../../../sharedcomponents/components';
import { UnitNormalizerService, IBigNum } from '../../services/unit-normalizer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription } from 'rxjs/Subscription';
import { LEFT_ARROW } from '@angular/cdk/keycodes';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'bignumber-widget',
    templateUrl: './bignumber-widget.component.html',
    styleUrls: []
})

export class BignumberWidgetComponent implements OnInit {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.bignumber-widget') private _componentClass = true;

    /** Inputs */
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    // tslint:disable:no-inferrable-types
    // tslint:disable:prefer-const
    private listenSub: Subscription;
    private isDataLoaded: boolean = false;

    metrics: any; // cache all the metrics that we get from tsdb
    selectedMetric: any; // used for macros
    tags: any; // to display tags of currently selected metric
    bigNumber: number;
    changeIndicatorCompareValue: number;

    fontSizePercent: number;
    contentFillPercent: number = 0.75; // how much % content should take up widget
    contentFillPercentWithNoCaption: number = 0.60; // how much % content should take up widget
    maxCaptionLength: number = 36;
    maxLabelLength: number = 10; // postfix, prefix, unit

    widgetWidth: number;
    widgetHeight: number;

    @ViewChild('contentContainer') contentContainer: ElementRef;

    constructor(private interCom: IntercomService, public util: UtilsService, public UN: UnitNormalizerService) { }

    ngOnInit() {

        // TODO: Remove
        if (!this.widget.query.settings.visual) {
            let bigNumberVisual: IBigNumberVisual = {
                queryID: '0',

                prefix: '',
                prefixSize: 's', // s m l
                prefixAlignment: 'top', // top middle bottom

                widgetWidth: 420, // only needed when first loading widget
                widgetHeight: 160, // only needed when first loading widget
                fontSizePercent: 200, // only needed when first loading widget

                postfix: '',
                postfixSize: 's',
                postfixAlignment: 'top',

                unit: 'ms', // auto
                unitSize: 'm',
                unitAlignment: 'top',

                caption: 'Latency',
                precision: 3,

                textColor: '#ffffff',
                backgroundColor: '#400080',

                sparkLineEnabled: false,
                changedIndicatorEnabled: false,
            };
            this.widget.query.settings.visual = bigNumberVisual;
        }

        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

            if (message.action === 'resizeWidget') {
                if (!this.metrics) { // 1. If no metrics, only set the widget width and height.
                    this.widgetWidth = message.payload.width * this.widget.gridPos.w - 20;
                    this.widgetHeight = message.payload.height * this.widget.gridPos.h - 60;

                } else { // 3. Given the metric, set all the new widths and heights.

                    const newWidgetWidth: number = message.payload.width * this.widget.gridPos.w - 20;
                    const newWidgetHeight: number = message.payload.height * this.widget.gridPos.h - 60;

                    const contentWidth: number = this.contentContainer.nativeElement.clientWidth;
                    const contentHeight: number = this.contentContainer.nativeElement.clientHeight;

                    let percentWidthChange: number;
                    let percentHeightChange: number;

                    if (this.widget.query.settings.visual['caption']) {
                        percentWidthChange = (newWidgetWidth * this.contentFillPercent) / contentWidth;
                        percentHeightChange = (newWidgetHeight * this.contentFillPercent) / contentHeight;
                    } else {
                        percentWidthChange = (newWidgetWidth * this.contentFillPercentWithNoCaption) / contentWidth;
                        percentHeightChange = (newWidgetHeight * this.contentFillPercentWithNoCaption) / contentHeight;
                    }

                    const percentChange: number =  Math.min(percentHeightChange, percentWidthChange);

                    if (percentChange > 1.01 || percentChange < 0.99) {
                        this.fontSizePercent = percentChange * this.fontSizePercent;
                        this.widget.query.settings.visual['fontSizePercent'] = this.fontSizePercent;
                        this.widget.query.settings.visual['widgetWidth'] = newWidgetWidth;
                        this.widget.query.settings.visual['widgetHeight'] = newWidgetHeight;
                    }
                }
            }
            if ( message.action === 'reQueryData' ) {
                this.refreshData();
            }
            if (message && (message.id === this.widget.id)) { // 2. Get and set the metric
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.isDataLoaded = true;
                        const gid = Object.keys(message.payload.rawdata)[0];
                        this.metrics = gid !== 'error' ? message.payload.rawdata[gid].results : [];
                        this.setBigNumber(this.widget.query.settings.visual.queryID);
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                        break;
                }
            }
        });

        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        if (!this.editMode) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
    }

    getMetric(queryID: string): any {
        let metric = {};
        queryID = queryID.toString();
        for ( let i = 0; this.metrics && i < this.metrics.length; i++ ) {
            const mid = this.metrics[i].source.split(':')[1];
            const configIndex = mid.replace('m', '');
            if ( configIndex === queryID ) {
                metric = this.metrics[i].data[0];
                break;
            }
        }
        return metric;
    }

    setBigNumber(queryId: string) {
        let metric = this.getMetric(queryId);

        if (!metric) {
            this.bigNumber = 0;
            this.changeIndicatorCompareValue = 0;
            this.tags = null;
            this.selectedMetric.metric = '';
            this.widget.query.settings.visual.prefix = '';
            this.widget.query.settings.visual.postfix = '';
            this.widget.query.settings.visual.unit = '';
            this.widget.query.settings.visual.caption = '';
            this.widget.query.settings.visual.sparkLineEnabled = false;
            this.widget.query.settings.visual.changedIndicatorEnabled = false;
            return;
        }

        let queryIndex = parseInt(queryId, 10);

        let currentValue: number = 0;
        let lastValue: number = 0;

        const aggs = metric.NumericSummaryType.aggregations;
        const key = Object.keys(metric.NumericSummaryType.data[0])[0];
        const aggData = metric.NumericSummaryType.data[0][key];

        const aggrIndex = aggs.indexOf(this.widget.query.groups[0].queries[queryIndex].settings.visual.aggregator);
        const aggregateValue =  aggData[aggrIndex];

        lastValue = aggData[aggs.indexOf('first')];
        currentValue = aggData[aggs.indexOf('last')];

        // SET LOCAL VARIABLES
        this.bigNumber = aggregateValue;
        this.changeIndicatorCompareValue = currentValue - lastValue;
        this.selectedMetric = metric;

        // get array of 'tags'
        if (metric['tags']) {
            this.tags = this.transform(metric['tags']);
        } else {
            this.tags = null;
        }

        this.fontSizePercent = this.calcFontSizePercent(this.widget.query.settings.visual['fontSizePercent'],
            this.widget.query.settings.visual['widgetWidth'], this.widget.query.settings.visual['widgetHeight'],
            this.widgetWidth, this.widgetHeight);
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

    transform(map: Map<any, any>): any[] {
        let ret = [];

        Object.keys(map).forEach(function (key) {
            ret.push({
                key: key.toString(),
                value: map[key].toString()});

        });
        return ret;
    }

    bigNumToChangeIndicatorValue(bigNum: IBigNum): string {
        if (bigNum.changeIndicatorHasUnit) {
            return bigNum.num + bigNum.unit;
        } else {
            return bigNum.num;
        }
    }

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: { editMode: false, widgetId: ''}
        });
    }

    calcFontSizePercent(percent: number, originalWidth: number, originalHeight: number, newWidth: number, newHeight: number): number {
        const percentChangeWidth: number = newWidth / originalWidth;
        const percentChangeHeight: number = newHeight / originalHeight;
        const percentChange: number = Math.min(percentChangeWidth, percentChangeHeight);
        return percent * percentChange;
    }

    // we have this method so that a caption or other labels will not make the big number really small
    shortenString(str: string, maxChars: number): string {
        if ( str && str.length > maxChars) {
            return str.substr(0, maxChars) + '...';
        }
        return str;
    }

    updateConfig(message) {
        switch ( message.action ) {
            case 'AddMetricsToGroup':
                this.addMetricsToGroup(message.payload.data);
                this.refreshData();
            break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                break;
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetVisualization':
                this.setVisualization(message.payload.data);
                this.refreshData(false);
                break;
            case 'ToggleQuery':
                this.toggleQuery(message.payload.index);
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.payload.index);
                break;
            case 'SetSelectedQuery':
                this.setSelectedQuery(message.payload.data);
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

        const dVisaul = {
            aggregator: 'sum'
        };

        for (const metric of gConfig.queries ) {
            metric.settings.visual = {...dVisaul, ...metric.settings.visual };
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

    setVisualization( vconfigs ) {
        this.widget.query.settings.visual = vconfigs;
        // mconfigs.forEach( (config, i) => {
        //     // tslint:disable-next-line:max-line-length
        //     this.widget.query.groups[0].queries[i].settings.visual = { ...this.widget.query.groups[0].queries[i].settings.visual, ...config };
        // });
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
        // tslint:disable-next-line:max-line-length
        this.widget.query.groups[gIndex].queries[index].settings.visual.visible = !this.widget.query.groups[gIndex].queries[index].settings.visual.visible;
        console.log('toggleQuery', this.widget.query.groups[gIndex].queries);
        // this.refreshData(false);
    }

    deleteQuery(index) {
        const gIndex = 0;

        let selectedQueryIndex = parseInt(this.widget.query.settings.visual.queryID, 10);
        if (index === selectedQueryIndex ) { // set 0th index if deleting currently selected query
            this.widget.query.settings.visual.queryID = (0).toString();
        } else if (index < selectedQueryIndex) { // shift index by 1 if deleting before selected query
            this.widget.query.settings.visual.queryID = (selectedQueryIndex - 1).toString();
        }

        this.widget.query.groups[gIndex].queries.splice(index, 1);

        const source = 'summarizer:m' + index;
        const metricIndex = this.metrics.findIndex( item => item.source === source );
        if (metricIndex !== -1 ) {
            this.metrics.splice(metricIndex, 1);
        }
        this.setBigNumber(this.widget.query.settings.visual.queryID );

        // this.refreshData(false);
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setSelectedQuery(queryID: string) {
        this.widget.query.settings.visual.queryID = queryID;

        let metric = this.getMetric(queryID);
        if (metric) {
            this.setBigNumber(queryID);
        } else {
            this.refreshData();
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

}

interface IBigNumberVisual {

    queryID: string;
    comparedTo?: number;

    fontSizePercent: number;
    widgetWidth: number;
    widgetHeight: number;

    prefix?: string;
    prefixSize?: string;
    prefixAlignment?: string;

    postfix?: string;
    postfixSize?: string;
    postfixAlignment?: string;

    unit: string;
    unitSize: string;
    unitAlignment: string;

    caption?: string;

    precision: number;

    textColor: string;
    backgroundColor: string;

    sparkLineEnabled: boolean;
    changedIndicatorEnabled?: boolean;
    // changeIndicatorCompareOperator: string;
}

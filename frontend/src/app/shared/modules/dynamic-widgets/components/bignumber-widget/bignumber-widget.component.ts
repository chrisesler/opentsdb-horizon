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
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';

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
    @Input() widget: any;

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
    editQueryId = null;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;

    @ViewChild('contentContainer') contentContainer: ElementRef;

    constructor(
        private interCom: IntercomService,
        public dialog: MatDialog,
        public util: UtilsService,
        public UN: UnitNormalizerService) { }

    ngOnInit() {

        this.setDefaultVisualization();

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

                    if (this.widget.settings.visual['caption']) {
                        percentWidthChange = (newWidgetWidth * this.contentFillPercent) / contentWidth;
                        percentHeightChange = (newWidgetHeight * this.contentFillPercent) / contentHeight;
                    } else {
                        percentWidthChange = (newWidgetWidth * this.contentFillPercentWithNoCaption) / contentWidth;
                        percentHeightChange = (newWidgetHeight * this.contentFillPercentWithNoCaption) / contentHeight;
                    }

                    const percentChange: number =  Math.min(percentHeightChange, percentWidthChange);

                    if (percentChange > 1.01 || percentChange < 0.99) {
                        this.fontSizePercent = percentChange * this.fontSizePercent;
                        this.widget.settings.visual['fontSizePercent'] = this.fontSizePercent;
                        this.widget.settings.visual['widgetWidth'] = newWidgetWidth;
                        this.widget.settings.visual['widgetHeight'] = newWidgetHeight;
                    }
                }
            }
            if ( message.action === 'reQueryData' ) {
                this.refreshData();
            }
            if (message && (message.id === this.widget.id)) { // 2. Get and set the metric
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        this.isDataLoaded = true;
                        if (message && message.payload && message.payload.rawdata) {
                            const gid = Object.keys(message.payload.rawdata)[0];
                            this.metrics = gid !== 'error' ? message.payload.rawdata[gid].results : [];
                            console.log(this.widget, "visual");
                            this.setBigNumber(this.widget.settings.visual.queryID);
                        }
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
        console.log("setBignumber", queryId)
        let metric = this.getMetric(queryId);
        let queryIndex = parseInt(queryId, 10);
        let currentValue: number = 0;
        let lastValue: number = 0;

        if (metric && metric.NumericSummaryType) {

            const aggs = metric.NumericSummaryType.aggregations;
            const key = Object.keys(metric.NumericSummaryType.data[0])[0];
            const aggData = metric.NumericSummaryType.data[0][key];
            const aggregator = this.widget.queries[0].metrics[queryIndex].settings.visual.aggregator || 'sum';

            const aggrIndex = aggs.indexOf(aggregator);
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

            this.fontSizePercent = this.calcFontSizePercent(this.widget.settings.visual['fontSizePercent'],
                this.widget.settings.visual['widgetWidth'], this.widget.settings.visual['widgetHeight'],
                this.widgetWidth, this.widgetHeight);
        } else {
            this.selectedMetric = {};
            this.selectedMetric.metric = '';
            this.bigNumber = 0;
            this.changeIndicatorCompareValue = 0;
            this.tags = null;
        }
    }

   requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = this.widget.queries.length;
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
        }
    }


    updateQuery( payload ) {
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex !== -1 ) {
            this.widget.queries[qindex] = query;
        }

        console.log("bignumber updateQuery", qindex, this.widget.queries);
    }


    setVisualization( vconfigs ) {
        this.widget.settings.visual = { ...vconfigs};
        // mconfigs.forEach( (config, i) => {
        //     // tslint:disable-next-line:max-line-length
        //     this.widget.query.groups[0].queries[i].settings.visual = { ...this.widget.query.groups[0].queries[i].settings.visual, ...config };
        // });
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

    toggleQuery(index) {
        const qIndex = 0;
        // tslint:disable-next-line:max-line-length
        this.widget.queries[qIndex].metrics[index].settings.visual.visible = !this.widget.queries[qIndex].metrics[index].settings.visual.visible;
    }

    deleteQuery(index) {
        const gIndex = 0;

        let selectedQueryIndex = parseInt(this.widget.settings.visual.queryID, 10);
        if (index === selectedQueryIndex ) { // set 0th index if deleting currently selected query
            this.widget.settings.visual.queryID = (0).toString();
        } else if (index < selectedQueryIndex) { // shift index by 1 if deleting before selected query
            this.widget.settings.visual.queryID = (selectedQueryIndex - 1).toString();
        }
        this.widget.query.groups[gIndex].queries.splice(index, 1);

        const source = 'summarizer:m' + index;
        const metricIndex = this.metrics.findIndex( item => item.source === source );
        if (metricIndex !== -1 ) {
            this.metrics.splice(metricIndex, 1);
        }
        this.setBigNumber(this.widget.settings.visual.queryID );

        // this.refreshData(false);
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
    }

    setSelectedQuery(queryID: string) {
        this.widget.settings.visual.queryID = queryID;

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

    showError() {
        console.log('%cErrorDialog', 'background: purple; color: white;', this.error);
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

    applyConfig() {
        const cloneWidget = { ...this.widget };
        cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
        this.interCom.requestSend({
            action: 'updateWidgetConfig',
            payload: cloneWidget
        });
        this.closeViewEditMode();
    }

    setDefaultVisualization() {
        this.widget.settings.visual.prefix = this.widget.settings.visual.prefix || '';
        this.widget.settings.visual.postfix = this.widget.settings.visual.postfix || '';
        this.widget.settings.visual.unit = this.widget.settings.visual.unit || '';

        this.widget.settings.visual.prefixAlignment = this.widget.settings.visual.prefixAlignment || 'bottom';
        this.widget.settings.visual.postfixAlignment = this.widget.settings.visual.postfixAlignment || 'bottom';
        this.widget.settings.visual.unitAlignment = this.widget.settings.visual.unitAlignment || 'bottom';

        this.widget.settings.visual.prefixSize = this.widget.settings.visual.prefixSize || 's';
        this.widget.settings.visual.postfixSize = this.widget.settings.visual.postfixSize || 's';
        this.widget.settings.visual.unitSize = this.widget.settings.visual.unitSize || 's';

        this.widget.settings.visual.caption = this.widget.settings.visual.caption || '';
        this.widget.settings.visual.precision = this.widget.settings.visual.precision || '';
        this.widget.settings.visual.backgroundColor = this.widget.settings.visual.backgroundColor || '#0B5ED2';
        this.widget.settings.visual.textColor = this.widget.settings.visual.textColor || '#FFFFFF';
        this.widget.settings.visual.sparkLineEnabled = this.widget.settings.visual.sparkLineEnabled || false;
        this.widget.settings.visual.changedIndicatorEnabled = this.widget.settings.visual.changedIndicatorEnabled || false;
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

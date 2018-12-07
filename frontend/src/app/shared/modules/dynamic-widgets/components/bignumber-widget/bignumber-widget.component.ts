import { Component, OnInit, HostBinding, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { UnitNormalizerService, IBigNum } from '../../services/unit-normalizer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'bignumber-widget',
    templateUrl: './bignumber-widget.component.html',
    styleUrls: []
})

export class BignumberWidgetComponent implements OnInit, OnDestroy {

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
    changeValue: number;
    changePct: number;
    changeThreshold: number = 0.01; // hard coding this for now, needs to be configurable
    aggregators: string[] = [];
    aggregatorValues: any[] = [];
    widgetWidth: number;
    widgetHeight: number;

    // Auto-scaling
    fontSizePercent: number = 100;  // how much to scale
    contentFillPercent: number = 0.8; // how much % content should take up widget
    contentFillPercentWithNoCaption: number = 0.8; // how much % content should take up widget
    defaultFont: string = 'Ubuntu';
    defaultFontSize: number = 14;
    captionFontSizeMultiplier: number = 1.2;
    mediumFontSizeMultiplier: number = 2;
    largeFontSizeMultiplier: number = 3;
    defaultFontWeight: number = 400;
    defaultBigNumberFontWeight: number = 600;
    defaultCaptionFontWeight: number = 500;
    heightOfLargeFont: number = 47;
    heightOfSmallFont: number = 15;
    heightOfMarginAboveCaption: number = 5;

    maxCaptionLength: number = 36;
    maxLabelLength: number = 10; // postfix, prefix, unit

    editQueryId = null;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    shadowInitialized: boolean = false;

    @ViewChild('myCanvas') myCanvas: ElementRef;
    public context: CanvasRenderingContext2D;

    constructor(
        private interCom: IntercomService,
        public dialog: MatDialog,
        public util: UtilsService,
        public UN: UnitNormalizerService
        ) { }

    ngOnInit() {

        this.setDefaultVisualization();

        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            console.log('message', message);

            if (message.action === 'resizeWidget') {

                this.widgetWidth = message.payload.width * this.widget.gridPos.w - 12;
                this.widgetHeight = message.payload.height * this.widget.gridPos.h - 40;

                if (this.metrics) {
                    this.determineFontSizePercent(this.widgetWidth, this.widgetHeight);
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

                        if ( message.payload.error ) {
                            this.error = message.payload.error;
                        }

                        if (message && message.payload && message.payload.rawdata) {
                            const gid = Object.keys(message.payload.rawdata)[0];
                            this.metrics = gid !== 'error' ? message.payload.rawdata[gid].results : [];

                            this.setBigNumber(this.widget.settings.visual.queryID);
                        }
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                        break;
                    case 'getUpdatedWidgetConfig':
                        if (this.widget.id === message.id) {
                            this.widget = message.payload;
                            this.setBigNumber(this.widget.settings.visual.queryID);
                        }
                        break;
                }
            }        });

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

    isNumber(value: string | number): boolean {
        return !isNaN(Number(value.toString()));
    }

    setBigNumber(queryId: string) {
        let metric = this.getMetric(queryId);
        let queryIndex = parseInt(queryId, 10);
        let currentValue: number = 0;
        let lastValue: number = 0;

        if (metric && metric.NumericSummaryType) {
            const responseAggregators = metric.NumericSummaryType.aggregations;
            const key = Object.keys(metric.NumericSummaryType.data[0])[0];
            const responseAggregatorValues = metric.NumericSummaryType.data[0][key];
            const configuredAggregators = this.widget.queries[0].metrics[queryIndex].settings.visual.aggregator || ['avg'];

            this.aggregators = [];
            this.aggregatorValues = [];
            for (let agg of configuredAggregators) {
                let index = responseAggregators.indexOf(agg);
                this.aggregatorValues.push(responseAggregatorValues[index]);
                this.aggregators.push(agg);
            }

            lastValue = responseAggregatorValues[responseAggregators.indexOf('first')];
            currentValue = responseAggregatorValues[responseAggregators.indexOf('last')];

            // SET LOCAL VARIABLES
            this.changeValue = currentValue - lastValue;
            this.changePct = (this.changeValue / lastValue) * 100;
            this.selectedMetric = metric;

            // get array of 'tags'
            if (metric['tags']) {
                this.tags = this.transform(metric['tags']);
            } else {
                this.tags = null;
            }

            this.determineFontSizePercent(this.widgetWidth, this.widgetHeight);

        } else {
            this.selectedMetric = {};
            this.selectedMetric.metric = '';
            this.bigNumber = 0;
            this.changeValue = 0;
            this.changePct = 0;
            this.aggregators = [];
            this.aggregatorValues = [];
            this.tags = null;
        }
    }

    // Auto Scaling
    determineWidthOfBigNumber(): number {

        let bigNumberWithOtherLabelsWidth: number = 0;
        let captionLabelWidth: number = 0;
        let i: number = 0;

        for (let agg of this.aggregators) {
            if (this.isNumber(this.aggregatorValues[i])) {

                // tslint:disable:max-line-length
                let prefixWidth = this.getWidthOfText(this.shortenString(this.widget.settings.visual.prefix, this.maxLabelLength), this.widget.settings.visual.prefixSize);
                let unitWidth = this.getWidthOfText(this.shortenString(this.UN.getBigNumber(this.aggregatorValues[i], this.widget.settings.visual.unit, this.widget.settings.visual.precision).unit, this.maxLabelLength), this.widget.settings.visual.unitSize);
                let postfixWidth = this.getWidthOfText(this.shortenString(this.widget.settings.visual.postfix, this.maxLabelLength), this.widget.settings.visual.postfixSize);
                let bigNumberWidth = this.getWidthOfText(' ' + this.UN.getBigNumber(this.aggregatorValues[i], this.widget.settings.visual.unit, this.widget.settings.visual.precision).num + ' ', 'l', this.defaultBigNumberFontWeight);

                let changeIndicatorWidth = 0;
                if (this.widget.settings.visual.changedIndicatorEnabled) {
                    if (this.changePct >= this.changeThreshold) {
                        changeIndicatorWidth = this.getWidthOfText( '↑ ' + this.bigNumToChangeIndicatorValue(this.UN.getBigNumber(this.changeValue, this.widget.settings.visual.unit, this.widget.settings.visual.precision)));
                    } else if (this.changePct <= -1 * this.changeThreshold) {
                        changeIndicatorWidth = this.getWidthOfText( '↓ ' + this.bigNumToChangeIndicatorValue(this.UN.getBigNumber(this.changeValue, this.widget.settings.visual.unit, this.widget.settings.visual.precision)));
                    } else {
                        changeIndicatorWidth = this.getWidthOfText('↔');
                    }
                }

                let aggregatorWidth = 0;
                if (this.aggregators.length > 1) {
                    aggregatorWidth = this.getWidthOfText(agg);
                }

                let tmpBigNumberWithOtherLabelsWidth: number = prefixWidth + unitWidth + postfixWidth + bigNumberWidth + changeIndicatorWidth + aggregatorWidth;
                let tmpCaptionWidth = this.getWidthOfText(this.shortenString(this.widget.settings.visual.caption, this.maxCaptionLength), 'c', this.defaultCaptionFontWeight);

                // assign if largest width
                if (tmpBigNumberWithOtherLabelsWidth >  bigNumberWithOtherLabelsWidth) {
                    bigNumberWithOtherLabelsWidth = tmpBigNumberWithOtherLabelsWidth;
                }

                if (tmpCaptionWidth > captionLabelWidth ) {
                    captionLabelWidth = tmpCaptionWidth;
                }
            }
            i++;
        }
        return Math.max(bigNumberWithOtherLabelsWidth, captionLabelWidth);
    }


    determineHeightofBigNumber(): number {
        return this.widget.settings.visual['caption'].trim() ?
            this.heightOfLargeFont * this.aggregators.length + this.heightOfSmallFont + this.heightOfMarginAboveCaption :
            this.heightOfLargeFont * this.aggregators.length;
    }

    determineFontSizePercent(width: number, height: number) {

        if (this.editMode) {
            if (this.aggregators.length > 4) {
                this.fontSizePercent = 75;
            } else {
                this.fontSizePercent = 100;
            }
            return;
        }

        let fillPercent: number = this.widget.settings.visual['caption'] ? this.contentFillPercent : this.contentFillPercentWithNoCaption;

        let maxWidth: number = width * fillPercent;
        let maxHeight: number = height * fillPercent;
        let contentHeight: number = this.determineHeightofBigNumber();
        let contentWidth: number = this.determineWidthOfBigNumber();

        let percentWidth = (maxWidth / contentWidth) * 100;
        let percentHeight = (maxHeight / contentHeight) * 100;
        let fontSizePercent: number = Math.min(percentHeight, percentWidth);

        this.fontSizePercent = fontSizePercent + 0.1 * Math.random(); // random so we always redraw
    }

    getWidthOfText(text: string, size?: string, weight?: number): number {
        if (!text ||  text.trim() === '') {
            return 0;
        }

        let fontsize: number = this.defaultFontSize;
        if (size && size.toLowerCase() === 'm') {
            fontsize = this.mediumFontSizeMultiplier * fontsize;
        } else if (size && size.toLowerCase() === 'l') {
            fontsize = this.largeFontSizeMultiplier * fontsize;
        } else if (size && size.toLowerCase() === 'c') {
            fontsize = this.captionFontSizeMultiplier * fontsize;
        }

        let fontWeight: number = this.defaultFontWeight;
        if (weight) {
            fontWeight = weight;
        }

        this.context = (<HTMLCanvasElement>this.myCanvas.nativeElement).getContext('2d');
        let fullFont: string = fontWeight + ' ' + fontsize + 'px ' + this.defaultFont;
        this.context.font = fullFont;

        return this.context.measureText(text.toUpperCase()).width;
    }

   requestData() {
        if (!this.isDataLoaded) {
            this.nQueryDataLoading = this.widget.queries.length;
            this.error = null;
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
            case 'ToggleQueryMetricVisibility':
                this.toggleQueryMetricVisibility(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
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
        if ( qindex !== -1 ) {
            this.widget.queries[qindex] = query;
        }

        console.log('bignumber updateQuery', qindex, this.widget.queries);
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

    closeViewEditMode() {
        this.interCom.requestSend({
            action: 'closeViewEditMode',
            payload: 'dashboard'
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

        this.widget.settings.visual.prefixAlignment = this.widget.settings.visual.prefixAlignment || 'middle';
        this.widget.settings.visual.postfixAlignment = this.widget.settings.visual.postfixAlignment || 'middle';
        this.widget.settings.visual.unitAlignment = this.widget.settings.visual.unitAlignment || 'middle';

        this.widget.settings.visual.prefixSize = this.widget.settings.visual.prefixSize || 'm';
        this.widget.settings.visual.postfixSize = this.widget.settings.visual.postfixSize || 'm';
        this.widget.settings.visual.unitSize = this.widget.settings.visual.unitSize || 'm';

        this.widget.settings.visual.caption = this.widget.settings.visual.caption || '';
        this.widget.settings.visual.precision = this.widget.settings.visual.precision || 2;
        this.widget.settings.visual.backgroundColor = this.widget.settings.visual.backgroundColor || '#0B5ED2';
        this.widget.settings.visual.textColor = this.widget.settings.visual.textColor || '#FFFFFF';
        this.widget.settings.visual.sparkLineEnabled = this.widget.settings.visual.sparkLineEnabled || false;
        this.widget.settings.visual.changedIndicatorEnabled = this.widget.settings.visual.changedIndicatorEnabled || false;
    }

    toggleQueryMetricVisibility(qid, mid) {
        // toggle the individual query metric
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);

        for (let metric of this.widget.queries[0].metrics) {
            metric.settings.visual.visible = false;
        }
        this.widget.queries[0].metrics[mindex].settings.visual.visible = true;
        this.widget.settings.visual.queryID = mindex;
        this.refreshData(false);
    }

    deleteQueryMetric(qid, mid) {
        // toggle the individual query
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics.splice(mindex, 1);

        // only reindex visibility if there are metrics AND deleted metric is before visible metric
        if (mindex <= this.widget.settings.visual.queryID && this.widget.queries[qindex].metrics.length !== 0) {
             for (let metric of this.widget.queries[0].metrics) {
                 metric.settings.visual.visible = false;
             }
             this.widget.queries[0].metrics[this.widget.settings.visual.queryID].settings.visual.visible = true;
         }
    }

    deleteQueryFilter(qid, findex) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].filters.splice(findex, 1);
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
        // this.typeSub.unsubscribe();
    }

}

interface IBigNumberVisual {
    queryID: string;
    comparedTo?: number;

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
}

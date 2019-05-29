import { Component, OnInit, HostBinding, Input, ViewChild, ElementRef, OnDestroy,  AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { UnitNormalizerService, IBigNum } from '../../services/unit-normalizer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ElementQueries, ResizeSensor } from 'css-element-queries';
import { MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'bignumber-widget',
    templateUrl: './bignumber-widget.component.html',
    styleUrls: []
})

export class BignumberWidgetComponent implements OnInit, OnDestroy, AfterViewInit {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.bignumber-widget') private _componentClass = true;

    /** Inputs */
    @Input() editMode: boolean;
    @Input() widget: any;
    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;
    // tslint:disable:no-inferrable-types
    // tslint:disable:prefer-const
    private listenSub: Subscription;
    private isDataLoaded: boolean = false;

    data: any; // cache all the metrics that we get from tsdb
    selectedMetric: any; // used for macros
    tags: any; // to display tags of currently selected metric
    bigNumber: number;
    changeValue: number;
    changePct: number;
    readonly changeThreshold: number = 0.01; // hard coding this for now, needs to be configurable
    aggregators: string[] = [];
    aggregatorValues: any[] = [];
    widgetWidth: number;
    widgetHeight: number;
    noDataText: string = 'No Data';
    backgroundColor: string;
    textColor: string;

    // Auto-scaling
    fontSizePercent: number = 100;  // initial value of how much to scale
    readonly contentFillPercent: number = 0.8; // how much % content should take up widget
    readonly contentFillPercentWithNoCaption: number = 0.8; // how much % content should take up widget

    // NOTE: FONT settings have been coded here for text size calculation purposes.
    //      CHANGE ME if CSS style changes. Yes, we know this is sub-optimal.
    //      Please submit a PR if you find a better solution.
    readonly defaultFont: string = 'Ubuntu';
    readonly defaultFontSize: number = 14;
    readonly captionFontSizeMultiplier: number = 1.2;
    readonly mediumFontSizeMultiplier: number = 2;
    readonly largeFontSizeMultiplier: number = 3;
    readonly defaultFontWeight: number = 400;
    readonly defaultBigNumberFontWeight: number = 600;
    readonly defaultCaptionFontWeight: number = 500;
    readonly heightOfLargeFont: number = 47;
    readonly heightOfSmallFont: number = 15;
    readonly heightOfMarginAboveCaption: number = 5;

    readonly maxCaptionLength: number = 36;
    readonly maxLabelLength: number = 10; // postfix, prefix, unit

    editQueryId = null;
    needRequery = false;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    shadowInitialized: boolean = false;

    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;

    @ViewChild('myCanvas') myCanvas: ElementRef;
    public context: CanvasRenderingContext2D;

    constructor(
        private interCom: IntercomService,
        public dialog: MatDialog,
        public util: UtilsService,
        public UN: UnitNormalizerService,
        private cdRef: ChangeDetectorRef
        ) { }

    ngOnInit() {

        this.disableAnyRemainingGroupBys();
        this.setDefaultVisualization();

        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

            if ( message.action === 'reQueryData' ) {
                this.refreshData();
            }
            if (message && (message.id === this.widget.id)) { // 2. Get and set the metric
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        this.isDataLoaded = true;

                        if (message.payload && message.payload.error) {
                            this.error = message.payload.error;
                        } else if (message.payload && message.payload.rawdata) {
                            this.data = message.payload.rawdata.results || [];
                            this.setBigNumber(this.widget.settings.visual.queryID);
                        } else { // no data, so get some
                            this.refreshData();
                        }
                        this.cdRef.detectChanges();
                        break;
                    case 'getUpdatedWidgetConfig':
                        if (this.widget.id === message.id) {
                            this.widget = message.payload.widget;
                            this.setBigNumber(this.widget.settings.visual.queryID);
                            this.refreshData(message.payload.needRefresh);
                        }
                        break;
                }
            }        });
        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        setTimeout(() => {
            if (!this.editMode) {
                this.requestData();
            } else {
                this.requestCachedData();
            }
        }, 0);
    }
  ngAfterViewInit() {
    this.setSize();
    this.setBigNumber(this.widget.settings.visual.queryID);
        // this event will happend on resize the #widgetoutput element,
        // in bar chart we don't need to pass the dimension to it.
        // Dimension will be picked up by parent node which is #container
        ElementQueries.listen();
        ElementQueries.init();
        let initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.pipe(
            debounceTime(100)
        ).subscribe(size => {
            this.setSize();
        });

        // tslint:disable-next-line:no-unused-expression
        new ResizeSensor(this.widgetOutputElement.nativeElement, () => {
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }

    // for first time and call.
    setSize() {
        // if edit mode, use the widgetOutputEl. If in dashboard mode, go up out of the component,
        // and read the size of the first element above the componentHostEl
        // tslint:disable-next-line:max-line-length
        const nativeEl = (this.editMode) ? this.widgetOutputElement.nativeElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

        const outputSize = nativeEl.getBoundingClientRect();
        this.widgetWidth = outputSize.width;
        this.widgetHeight = outputSize.height;

        if (this.data) {
            this.determineFontSizePercent(this.widgetWidth, this.widgetHeight);
        }
    }

    getMetric(queryID: string): any {
        let metric = {};
        queryID = queryID.toString();
        for ( let i = 0; this.data && i < this.data.length; i++ ) {
            const mid = this.data[i].source.split(':')[1]; // example: summarizer:m-0-1
            let configIndex = mid.replace(/[^0-9]+/g, ''); // remove any non-digits. ex: 01
            configIndex = parseInt(configIndex, 10).toString(); // remove leading zeroes. ex: 1
            if ( configIndex === queryID ) {
                metric = this.data[i].data[0];
                break;
            }
        }
        return metric;
    }

    isNumber(value: string | number): boolean {
        if (value === 0) {
            return true;
        } else {
            return value ? parseInt(value.toString(), 10) !== NaN : false;
        }
    }

    setBigNumber(queryId: string) {
        let metric = this.getMetric(queryId);
        let queryIndex = parseInt(queryId, 10);

        if (metric && metric.NumericSummaryType && this.widget.queries[0] && this.widget.queries[0].metrics[queryIndex]) {
            const responseAggregators = metric.NumericSummaryType.aggregations;
            const key = Object.keys(metric.NumericSummaryType.data[0])[0];
            const responseAggregatorValues = metric.NumericSummaryType.data[0][key];
            // tslint:disable-next-line:max-line-length
            let summarizer = this.widget.queries[0].metrics[queryIndex].summarizer ? this.widget.queries[0].metrics[queryIndex].summarizer : 'avg';
            this.aggregatorValues = [responseAggregatorValues[responseAggregators.indexOf(summarizer)]];

            // SET LOCAL VARIABLES
            // lastValue = responseAggregatorValues[responseAggregators.indexOf('first')];
            // currentValue = responseAggregatorValues[responseAggregators.indexOf('last')];
            // this.changeValue = currentValue - lastValue;
            // this.changePct = (this.changeValue / lastValue) * 100;

            this.selectedMetric = metric;

            // get array of 'tags'
            if (metric['tags']) {
                this.tags = this.transform(metric['tags']);
            } else {
                this.tags = null;
            }
            this.cdRef.detectChanges();

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
        this.determineFontSizePercent(this.widgetWidth, this.widgetHeight);
        this.determineTextAndBackgroundColors();
    }

    determineTextAndBackgroundColors() {
        this.textColor = this.widget.settings.visual.textColor;
        this.backgroundColor = this.widget.settings.visual.backgroundColor;
        if (this.isNumber(this.aggregatorValues[0]) && this.widget.settings.visual.conditions) {
            let rawValue = this.aggregatorValues[0];
            for (let condition of this.widget.settings.visual.conditions) {
                if (this.isNumber(condition.value) && this.conditionApplies(rawValue, condition)) {
                    this.backgroundColor = condition.color;
                }
            }
        }
    }

    conditionApplies(rawValue, condition): boolean {
        let applicable = false;
        if (condition.operator.toLowerCase() === 'gt') {
            applicable = rawValue > condition.value;
        } else if (condition.operator.toLowerCase() === 'ge') {
            applicable = rawValue >= condition.value;
        } else if (condition.operator.toLowerCase() === 'lt') {
            applicable = rawValue < condition.value;
        } else if (condition.operator.toLowerCase() === 'le') {
            applicable = rawValue <= condition.value;
        }
        return applicable;
    }

    // Auto Scaling
    determineWidthOfBigNumber(): number {

        let bigNumberWithOtherLabelsWidth: number = 0;
        let captionLabelWidth: number = 0;
        let i: number = 0;

        // tslint:disable:max-line-length
        let prefixWidth = this.getWidthOfText(this.shortenString(this.widget.settings.visual.prefix, this.maxLabelLength), this.widget.settings.visual.prefixSize);
        let unitWidth = this.getWidthOfText(this.shortenString(this.UN.getBigNumber(this.aggregatorValues[i], this.widget.settings.visual.unit, this.widget.settings.visual.precision).unit, this.maxLabelLength), this.widget.settings.visual.unitSize);

        let bigNumberWidth;

        if (this.isNumber(this.UN.getBigNumber(this.aggregatorValues[i], this.widget.settings.visual.unit, this.widget.settings.visual.precision).num)) {
            bigNumberWidth = this.getWidthOfText(' ' + this.UN.getBigNumber(this.aggregatorValues[i], this.widget.settings.visual.unit, this.widget.settings.visual.precision).num + ' ', 'l', this.defaultBigNumberFontWeight);
        } else {
            bigNumberWidth = this.getWidthOfText(' ' + this.noDataText + ' ', 'l', this.defaultBigNumberFontWeight);
        }

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

        let tmpBigNumberWithOtherLabelsWidth: number = prefixWidth + unitWidth + bigNumberWidth + changeIndicatorWidth;
        let tmpCaptionWidth = this.getWidthOfText(this.shortenString(this.widget.settings.visual.caption, this.maxCaptionLength), 'c', this.defaultCaptionFontWeight);

        // assign if largest width
        if (tmpBigNumberWithOtherLabelsWidth >  bigNumberWithOtherLabelsWidth) {
            bigNumberWithOtherLabelsWidth = tmpBigNumberWithOtherLabelsWidth;
        }

        if (tmpCaptionWidth > captionLabelWidth ) {
            captionLabelWidth = tmpCaptionWidth;
        }

        return Math.max(bigNumberWithOtherLabelsWidth, captionLabelWidth);
    }


    determineHeightofBigNumber(): number {
        return this.widget.settings.visual['caption'].trim() ?
            this.heightOfLargeFont + this.heightOfSmallFont + this.heightOfMarginAboveCaption :
            this.heightOfLargeFont;
    }

    determineFontSizePercent(width: number, height: number) {

        if (this.editMode) {
            this.fontSizePercent = 100;
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
        this.cdRef.detectChanges();
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

        // return this.context.measureText(text.toUpperCase()).width;
        return this.context.measureText(text).width;
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
            this.cdRef.detectChanges();
        }
    }

    requestCachedData() {
        this.nQueryDataLoading = this.widget.queries.length;
        this.error = null;
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'getWidgetCachedData',
            payload: this.widget
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
                this.needRequery = true;
                break;
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetVisualization':
                this.setVisualization(message.payload.data);
                this.refreshData(false);
                break;
            case 'SetSelectedQuery':
                this.setSelectedQuery(message.payload.data);
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.refreshData();
                this.needRequery = true;
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
            case 'SummarizerChange':
                this.setBigNumber(this.widget.settings.visual.queryID);
                break;
            case 'DeleteQueryMetric':
                this.deleteQueryMetric(message.id, message.payload.mid);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.refreshData();
                this.needRequery = true;
                break;
            case 'DeleteQueryFilter':
                this.deleteQueryFilter(message.id, message.payload.findex);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.refreshData();
                this.needRequery = true;
                break;
        }
    }

    updateQuery( payload ) {
        const query = payload.query;
        const qindex = query.id ? this.widget.queries.findIndex(q => q.id === query.id ) : -1;
        if ( qindex !== -1 ) {
            this.widget.queries[qindex] = query;
        }

        let index = 0;
        for (let metric of this.widget.queries[0].metrics) {
            if (this.widget.settings.visual.queryID === index) {
                metric.settings.visual.visible = true;
            } else {
                metric.settings.visual.visible = false;
            }
            index++;
        }
    }


    setVisualization( vconfigs ) {
        this.widget.settings.visual = { ...vconfigs};
        this.determineTextAndBackgroundColors();
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
        // console.log('%cErrorDialog', 'background: purple; color: white;', this.error);
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
            id: cloneWidget.id,
            payload: { widget: cloneWidget, needRequery: this.needRequery }
        });
        this.closeViewEditMode();
    }

    setDefaultVisualization() {
        this.widget.settings.visual.prefix = this.widget.settings.visual.prefix || '';
        this.widget.settings.visual.unit = this.widget.settings.visual.unit || '';
        this.widget.settings.visual.prefixAlignment = this.widget.settings.visual.prefixAlignment || 'middle';
        this.widget.settings.visual.unitAlignment = this.widget.settings.visual.unitAlignment || 'middle';
        this.widget.settings.visual.prefixSize = this.widget.settings.visual.prefixSize || 'm';
        this.widget.settings.visual.unitSize = this.widget.settings.visual.unitSize || 'm';

        this.widget.settings.visual.caption = this.widget.settings.visual.caption || '';
        this.widget.settings.visual.precision = this.widget.settings.visual.precision || 2;
        this.widget.settings.visual.backgroundColor = this.widget.settings.visual.backgroundColor || '#0B5ED2';
        this.widget.settings.visual.textColor = this.widget.settings.visual.textColor || '#FFFFFF';
        this.widget.settings.visual.sparkLineEnabled = this.widget.settings.visual.sparkLineEnabled || false;
        this.widget.settings.visual.changedIndicatorEnabled = this.widget.settings.visual.changedIndicatorEnabled || false;

        this.textColor = this.widget.settings.visual.textColor;
        this.backgroundColor = this.widget.settings.visual.backgroundColor;
    }

    disableAnyRemainingGroupBys() {
        // this is in-case anyone previously set group-by for big number
        if (this.widget && this.widget.queries[0] && this.widget.queries[0].metrics) {
            for (let metric of this.widget.queries[0].metrics) {
                if (metric.groupByTags && metric.groupByTags.length) {
                    metric.groupByTags = [];
                }
            }
        }
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
        this.setBigNumber(this.widget.settings.visual.queryID);
    }

    deleteQueryMetric(qid, mid) {
        // toggle the individual query
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        this.widget.queries[qindex].metrics.splice(mindex, 1);

        // only reindex visibility if there are metrics AND deleted metric is visible metric
        if (mindex === this.widget.settings.visual.queryID && this.widget.queries[qindex].metrics.length !== 0) {
            this.widget.queries[0].metrics[0].settings.visual.visible = true;
            this.widget.settings.visual.queryID = 0;
        }

        if (this.widget.queries[qindex].metrics.length === 1) {
            this.widget.queries[0].metrics[0].settings.visual.visible = true;
            this.widget.settings.visual.queryID = 0;
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
    }

}

interface IBigNumberVisual {
    queryID: string;
    comparedTo?: number;

    prefix?: string;
    prefixSize?: string;
    prefixAlignment?: string;

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

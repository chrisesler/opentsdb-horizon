import { Component, OnInit, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription, BehaviorSubject} from 'rxjs';
import { ElementQueries, ResizeSensor } from 'css-element-queries';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-topn-widget',
  templateUrl: './topn-widget.component.html',
  styleUrls: ['./topn-widget.component.scss']
})

export class TopnWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.topnchart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: any;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;
    @ViewChild('container') private container: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types

    options: any  = {
        data: [],
        format: { unit: '', precision: 2 , precisionStrict: true}
    };
    width = '100%';
    height = '100%';
    size: any = { width: 0, height: 0 };
    newSize$: BehaviorSubject<any>;
    newSizeSub: Subscription;
    doRefreshData$: BehaviorSubject<boolean>;
    doRefreshDataSub: Subscription;
    legendWidth = 0;
    editQueryId = null;
    nQueryDataLoading = 0;
    error: any;
    errorDialog: MatDialogRef < ErrorDialogComponent > | null;
    needRequery = false;

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        public dialog: MatDialog,
        private util: UtilsService,
        private cdRef: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.doRefreshData$ = new BehaviorSubject(false);
        this.doRefreshDataSub = this.doRefreshData$
            .pipe(
                debounceTime(1000)
            )
            .subscribe(trigger => {
                if (trigger) {
                    this.refreshData();
                }
            });

        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            switch ( message.action ) {
                case 'TimeChanged':
                case 'reQueryData':
                case 'ZoomDateRange':
                    this.refreshData();
                    break;
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        this.nQueryDataLoading--;
                        if ( !this.isDataLoaded ) {
                            this.isDataLoaded = true;
                            this.options.data = [];
                        }
                        if ( message.payload.error ) {
                            this.error = message.payload.error;
                        }
                        this.setOptions();
                        this.options = this.dataTransformer.yamasToD3Bar(this.options, this.widget, message.payload.rawdata);
                        this.cdRef.detectChanges();
                        break;
                    case 'getUpdatedWidgetConfig':
                        this.widget = message.payload.widget;
                        this.refreshData(message.payload.needRefresh);
                        break;
                    case 'WidgetQueryLoading':
                        this.nQueryDataLoading = 1;
                        this.cdRef.detectChanges();
                        break;
                }
            }
        });

        // first time when displaying chart
        if (!this.widget.settings.sorting) {
            this.widget.settings.sorting = { limit: 10, order: 'top' };
        }

        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        setTimeout(() => this.refreshData(this.editMode ? false : true), 0);
    }

    ngAfterViewInit() {
        // this event will happend on resize the #widgetoutput element,
        // in  chartjs we don't need to pass the dimension to it.
        // Dimension will be picked up by parent node which is #container
        ElementQueries.listen();
        ElementQueries.init();
        const initSize = {
            width: this.widgetOutputElement.nativeElement.clientWidth,
            height: this.widgetOutputElement.nativeElement.clientHeight
        };
        this.newSize$ = new BehaviorSubject(initSize);

        this.newSizeSub = this.newSize$.subscribe(size => {
            this.setSize(size);
        });
        const resizeSensor = new ResizeSensor(this.widgetOutputElement.nativeElement, () => {
             const newSize = {
                width: this.widgetOutputElement.nativeElement.clientWidth,
                height: this.widgetOutputElement.nativeElement.clientHeight
            };
            this.newSize$.next(newSize);
        });
    }

    setOptions() {
        this.options.format.unit = this.widget.settings.visual.unit;
    }
    setSize(newSize) {
        this.size = { width: newSize.width, height: newSize.height - 3 };
        this.cdRef.detectChanges();
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

    updateConfig(message) {
        switch ( message.action ) {
            case 'SetMetaData':
                this.setMetaData(message.payload.data);
                break;
            case 'SetTimeConfiguration':
                this.setTimeConfiguration(message.payload.data);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'SetVisualization':
                this.setVisualization(message.payload.data);
                this.refreshData(false);
                break;
            case 'SetVisualConditions':
                this.setVisualConditions(message.payload.data);
                this.refreshData(false);
                break;
            case 'SetUnit':
                this.setUnit(message.payload.data);
                this.refreshData(false);
                break;
            case 'SetSorting':
                this.setSorting(message.payload);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'UpdateQuery':
                this.updateQuery(message.payload);
                this.widget.queries = [...this.widget.queries];
                this.doRefreshData$.next(true);
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
                this.refreshData(false);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                break;
            case 'DeleteQueryMetric':
                this.deleteQueryMetric(message.id, message.payload.mid);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'DeleteQueryFilter':
                this.deleteQueryFilter(message.id, message.payload.findex);
                this.widget.queries = this.util.deepClone(this.widget.queries);
                this.doRefreshData$.next(true);
                this.needRequery = true;
                break;
            case 'ToggleQueryVisibility':
                this.toggleQueryVisibility(message.id);
                this.refreshData(false);
                this.needRequery = false;
                break;
            case 'CloneQuery':
                this.cloneQuery(message.id);
                this.refreshData();
                this.needRequery = true;
                break;
            case 'DeleteQuery':
                this.deleteQuery(message.id);
                this.refreshData();
                this.widget = {...this.widget};
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
        let visibleIndex = 0;
        for (let i = 0; i < this.widget.queries[0].metrics.length; i++ ) {
            if ( this.widget.queries[0].metrics[i].settings.visual.visible ) {
                visibleIndex = i;
                break;
            }
        }
        // default metric visibility is false. so make first metric visible
        for (let i = 0; i < this.widget.queries[0].metrics.length; i++ ) {
            this.widget.queries[0].metrics[i].settings.visual.visible = visibleIndex === i ? true : false;
        }
    }

    setVisualization( mconfigs ) {
        mconfigs.forEach( (config, i) => {
            this.widget.queries[0].metrics[i].settings.visual = { ...this.widget.queries[0].metrics[i].settings.visual, ...config };
        });
    }

    setUnit(unit) {
        this.widget.settings.visual.unit = unit;
    }

    setVisualConditions( vConditions ) {
        this.widget.settings.visual.conditions = vConditions;
        // console.log("setVisualConditions", this.widget.settings.visual);
    }

    setMetaData(config) {
        this.widget.settings = {...this.widget.settings, ...config};
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
    }

    setSorting(sConfig) {
        this.widget.settings.sorting = { order: sConfig.order, limit: sConfig.limit };
    }

    refreshData(reload = true) {
        this.isDataLoaded = false;
        if ( reload ) {
            this.requestData();
        } else {
            this.requestCachedData();
        }
    }

    toggleQueryMetricVisibility(qid, mid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[0].metrics.findIndex(d => d.id === mid);
        for (const metric of this.widget.queries[0].metrics) {
            metric.settings.visual.visible = false;
        }
        this.widget.queries[qindex].metrics[mindex].settings.visual.visible = true;
    }

    deleteQueryMetric(qid, mid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const mindex = this.widget.queries[qindex].metrics.findIndex(d => d.id === mid);
        const delMetricVisibility = this.widget.queries[qindex].metrics[mindex].settings.visual.visible;
        this.widget.queries[qindex].metrics.splice(mindex, 1);
        if ( delMetricVisibility && this.widget.queries[qindex].metrics.length ) {
            this.widget.queries[0].metrics[0].settings.visual.visible = true;
        }
    }

    deleteQueryFilter(qid, findex) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].filters.splice(findex, 1);
    }

    toggleQueryVisibility(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        this.widget.queries[qindex].settings.visual.visible = !this.widget.queries[qindex].settings.visual.visible;
    }

    cloneQuery(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        if ( qindex !== -1 ) {
            const query = this.util.getQueryClone(this.widget.queries, qindex);
            query.metrics.map(d => { d.settings.visual.visible = false; } );
            this.widget.queries.splice(qindex + 1, 0, query);
        }
    }

    deleteQuery(qid) {
        const qindex = this.widget.queries.findIndex(d => d.id === qid);
        const hasSelectedMetric = this.widget.queries[qindex].metrics.findIndex( d => d.settings.visual.visible );
        this.widget.queries.splice(qindex, 1);
        if ( hasSelectedMetric !== -1 && this.widget.queries.length && this.widget.queries[0].metrics.length  ) {
            this.widget.queries[0].metrics[0].settings.visual.visible = true;
        }
    }

    showError() {
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
        this.interCom.requestSend(<IMessage>{
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

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.newSizeSub.unsubscribe();
        this.doRefreshDataSub.unsubscribe();
    }
}


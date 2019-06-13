import {
  Component, OnInit, HostBinding, Input,
  OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, AfterViewInit
} from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { UnitConverterService } from '../../../../../core/services/unit-converter.service';
import { Subscription } from 'rxjs';
import { WidgetModel, Axis } from '../../../../../dashboard/state/widgets.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';
import { ErrorDialogComponent } from '../../../sharedcomponents/components/error-dialog/error-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { ElementQueries, ResizeSensor} from 'css-element-queries';
import heatmapPlotter from '../../../../dygraphs/plotters';

@Component({
  selector: 'heatmap-widget',
  templateUrl: './heatmap-widget.component.html',
  styleUrls: ['./heatmap-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class HeatmapWidgetComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.heatmap-widget') private _componentClass = true;

  @Input() editMode: boolean;
  @Input() widget: WidgetModel;

  @ViewChild('widgetOutputContainer') private widgetOutputContainer: ElementRef;
  @ViewChild('widgetTitle') private widgetTitle: ElementRef;
  @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;
  @ViewChild('graphLegend') private dygraphLegend: ElementRef;
  @ViewChild('dygraph') private dygraph: ElementRef;

  private listenSub: Subscription;
  private isDataLoaded = false;
  private isStackedGraph = false;
  chartType = 'line';

  options: IDygraphOptions = {
      labels: ['x'],
      labelsUTC: false,
      labelsKMB: true,
      connectSeparatedPoints: false,
      drawPoints: false,
      //  labelsDivWidth: 0,
      legend: 'follow',
      logscale: false,
      digitsAfterDecimal: 2,
      stackedGraph: this.isStackedGraph,
      strokeWidth: 0,
      strokeBorderWidth: this.isStackedGraph ? 0 : 0,
      highlightSeriesBackgroundAlpha: 1,
      highlightCircleSize: 0,
      highlightSeriesOpts: {
          strokeWidth: 0,
          highlightCircleSize: 0
      },
      xlabel: '',
      ylabel: '',
      y2label: '',
      axisLineWidth: 0,
      axisLineColor: '#fff',
      axes: {
          x: {},
          y: {
              valueRange: [0, 30],
              tickFormat: {},
          }
      },
      drawGrid: true,
      series: {},
      gridLineColor: '#ccc',
      plotter: heatmapPlotter,
      pointSize: 0,
      heatmap: {
          buckets: 30,
          nseries: 0,
          x: []
      },
      xAxisHeight: 12
  };
  data: any = { ts: [[0]] };
  size: any = { width: 120, height: 75};
  newSize$: BehaviorSubject<any>;
  newSizeSub: Subscription;
  nQueryDataLoading: number;
  error: any;
  errorDialog: MatDialogRef < ErrorDialogComponent > | null;
  editQueryId = null;
  needRequery = false;
  constructor(
      private cdRef: ChangeDetectorRef,
      private interCom: IntercomService,
      public dialog: MatDialog,
      private dataTransformer: DatatranformerService,
      private util: UtilsService,
      private elRef: ElementRef,
      private unit: UnitConverterService
  ) { }

  ngOnInit() {
      // subscribe to event stream
      this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
          switch (message.action) {
              case 'reQueryData':
              case 'ZoomDateRange':
                  this.refreshData();
                  break;
              case 'TimezoneChanged':
                  this.setTimezone(message.payload.zone);
                  this.options = { ...this.options };
                  break;
          }

          if (message && (message.id === this.widget.id)) {
              switch (message.action) {
                  case 'updatedWidgetGroup':
                      this.nQueryDataLoading--;
                      if (!this.isDataLoaded) {
                          this.isDataLoaded = true;
                          this.resetChart();
                      }
                      if (message.payload.error) {
                          this.error = message.payload.error;
                      } else {
                          const rawdata = message.payload.rawdata;
                          this.setTimezone(message.payload.timezone);
                          this.data.ts = this.dataTransformer.yamasToHeatmap(this.widget, this.options, this.data.ts, rawdata);
                          this.data = { ...this.data };
                          setTimeout(() => this.setSize());
                      }
                      break;
                  case 'getUpdatedWidgetConfig':
                      this.widget = message.payload.widget;
                      this.setOptions();
                      this.refreshData(message.payload.needRefresh);
                      break;
              }
          }
      });
      // when the widget first loaded in dashboard, we request to get data
      // when in edit mode first time, we request to get cached raw data.
      setTimeout(() => this.refreshData(this.editMode ? false : true), 0);
      this.setOptions();
  }

  ngAfterViewInit() {
      ElementQueries.listen();
      ElementQueries.init();
      const initSize = {
          width: this.widgetOutputElement.nativeElement.clientWidth,
          height: this.widgetOutputElement.nativeElement.clientHeight
      };
      this.newSize$ = new BehaviorSubject(initSize);

      this.newSizeSub = this.newSize$.subscribe(size => {
          this.setSize();
          // this.newSize = size;
      });
      const resizeSensor = new ResizeSensor(this.widgetOutputElement.nativeElement, () => {
           const newSize = {
              width: this.widgetOutputElement.nativeElement.clientWidth,
              height: this.widgetOutputElement.nativeElement.clientHeight
          };
          this.newSize$.next(newSize);
      });
  }

  updateConfig(message) {
    switch ( message.action ) {
        case 'SetMetaData':
            this.setMetaData(message.payload.data);
            break;
        case 'SetTimeConfiguration':
            this.setTimeConfiguration(message.payload.data);
            this.refreshData();
            this.needRequery = true; // set flag to requery if apply to dashboard
            break;
        case 'SetVisualization':
            this.setVisualization(message.payload.data);
            this.refreshData(false);
            break;
        case 'SetUnit':
            this.setUnit(message.payload.data);
            this.setAxisOption();
            this.refreshData(false);
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
            this.refreshData(false);
            this.widget.queries = this.util.deepClone(this.widget.queries);
            break;
        case 'DeleteQueryMetric':
            this.deleteQueryMetric(message.id, message.payload.mid);
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

  setTimezone(timezone) {
      this.options.labelsUTC = timezone === 'utc' ? true : false;
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

  setMetaData(config) {
      this.widget.settings = {...this.widget.settings, ...config};
  }


  requestData() {
      if (!this.isDataLoaded) {
          this.nQueryDataLoading = 1;
          this.error = null;
          this.interCom.requestSend({
              id: this.widget.id,
              action: 'getQueryData',
              payload: this.widget,
          });
          this.cdRef.detectChanges();
      }
  }

  toggleQueryMetricVisibility(qid, mid) {
    const mindex = this.widget.queries[0].metrics.findIndex(d => d.id === mid);
    for (const metric of this.widget.queries[0].metrics) {
        metric.settings.visual.visible = false;
    }
    this.widget.queries[0].metrics[mindex].settings.visual.visible = true;
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

  setOptions() {
    this.setLegendDiv();
    this.setAxisOption();
  }

  setLegendDiv() {
    this.options.labelsDiv = this.dygraphLegend.nativeElement;
  }

  setAxisOption() {
    const decimals = 2;
    const unit = this.widget.settings.visual.unit ? this.widget.settings.visual.unit : 'auto';
    this.options.axes.y.tickFormat = { unit: unit, precision: decimals, unitDisplay: true };
  }

  resetChart() {
    this.options = {...this.options, labels: ['x']};
    this.data = { ts: [[0]] };
  }

  setSize() {
       const nativeEl = (this.editMode) ?
          this.widgetOutputElement.nativeElement.parentElement : this.widgetOutputElement.nativeElement.closest('.mat-card-content');

       const newSize = nativeEl.getBoundingClientRect();
      // let newSize = outputSize;
      let nWidth, nHeight, padding;


      const widthOffset = 0;
      const heightOffset = 0;


      if (this.editMode) {
          let titleSize = {width: 0, height: 0};
          if (this.widgetTitle) {
              titleSize = this.widgetTitle.nativeElement.getBoundingClientRect();
          }
          padding = 8; // 8px top and bottom
          nHeight = newSize.height - heightOffset - titleSize.height - (padding * 2);
          nWidth = newSize.width - widthOffset  - (padding * 2) - 30;
      } else {
          padding = 10; // 10px on the top
          nHeight = newSize.height - heightOffset - (padding * 2);
          nWidth = newSize.width - widthOffset  - (padding * 2);
      }

      const xAxisMinHeight = 15;
      this.options.xAxisHeight = xAxisMinHeight  + (nHeight - xAxisMinHeight)  % this.options.heatmap.buckets;
      this.options.xRangePad = this.options.heatmap.x.length ? nWidth / (this.options.heatmap.x.length * 2) : 0;
      this.size = {width: nWidth, height: nHeight };
      this.cdRef.detectChanges();
  }

  requestCachedData() {
    this.nQueryDataLoading = 1;
    this.error = null;
    this.interCom.requestSend({
        id: this.widget.id,
        action: 'getWidgetCachedData',
        payload: this.widget
    });
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
      const parentPos = this.elRef.nativeElement.getBoundingClientRect();
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
  // request send to update state to close edit mode
  closeViewEditMode() {
      this.interCom.requestSend({
          action: 'closeViewEditMode',
          payload: 'dashboard'
      });
  }

  // apply config from editing
  applyConfig() {
      this.closeViewEditMode();
      const cloneWidget = JSON.parse(JSON.stringify(this.widget));
      cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
      this.interCom.requestSend({
          action: 'updateWidgetConfig',
          id: cloneWidget.id,
          payload: { widget: cloneWidget, needRequery: this.needRequery }
      });
  }

  ngOnDestroy() {
      this.listenSub.unsubscribe();
      this.newSizeSub.unsubscribe();
  }

}


import { Component, OnInit, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { of } from 'rxjs';
// tslint:disable:max-line-length

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-details-metric-period-over-period-preview',
  templateUrl: './alert-details-metric-period-over-period-preview.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodPreviewComponent implements OnInit, OnChanges {
  @HostBinding('class.period-over-period-preview') private _hostClass = true;

  constructor() { }

  @Input('chartData')
  set chartData(value: any) {
    this._chartData = value;
    if (this.options && this.options.series) {
      this.observedOptions = {...this.getObservedOptions()};
    }
  }
  get chartData(): any {
    return this._chartData;
  }

  @Input() size;
  @Input() nQueryDataLoading;
  @Input() options;

  @Input('thresholdConfig')
  set thresholdConfig(value: any) {
    this._thresholdConfig = value;
    if (this.timeseriesIndex >= 0 && this.thresholdConfig && this.thresholdConfig.singleMetric && this.thresholdData) {
      this.thresholdData = this.getThresholdData(this.chartData.ts, this.timeseriesIndex);
    }
  }

  get thresholdConfig(): any {
    return this._thresholdConfig;
  }

  _chartData: any = {};
  _thresholdConfig: any = {};
  thresholdData: any = {};
  observedOptions: any = {};
  thresholdOptions: any = {};
  timeseriesIndex = -1;

  // zoom out data
  chartDataZoomedOut: any = {};
  thresholdDataZoomedOut: any = {};

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {

    // new data
    if (changes.chartData && changes.nQueryDataLoading && changes.nQueryDataLoading.currentValue === 0 && this.timeseriesIndex !== -1) {
      this.chartDataZoomedOut = {};
      this.thresholdDataZoomedOut = {};
      this.reloadPreview();
    } else if (changes.chartData) { // selected metric changed
      this.thresholdData = {};
      this.timeseriesIndex = -1;
    }

  }

  extractZoomedTimeseries(zConfig, data) {
    const n = data.ts.length;
    const startTime = new Date(data.ts[0][0]).getTime() / 1000;
    const endTime = new Date(data.ts[n - 1][0]).getTime() / 1000;
    zConfig.start = Math.floor(zConfig.start) <= startTime ? -1 : Math.floor(zConfig.start);
    zConfig.end = Math.ceil(zConfig.end) >= endTime ? -1 : Math.floor(zConfig.end);

    // extract out in-range timeseries
    const zoomedTS = [];
    for (const ts of data.ts) {
      if (ts[0].getTime() / 1000 > zConfig.start && ts[0].getTime() / 1000 < zConfig.end) {
        zoomedTS.push(ts);
      }
    }

    return {ts: zoomedTS};
  }

   isChartDataZoomedOutEmpty() {
    return Object.entries(this.chartDataZoomedOut).length === 0;
  }

  isThresholdDataZoomedOutEmpty() {
    return Object.entries(this.thresholdDataZoomedOut).length === 0;
  }

  handleZoomQuery(zConfig) {
    const n = this.chartData.ts.length;
    if (zConfig.isZoomed && n > 0) {  // zoomed in
      // cache zoomed-out data
      if (this.isChartDataZoomedOutEmpty()) {
        this.chartDataZoomedOut = {...this.chartData};
      }
      // get zoome-in data
      this.chartData = this.extractZoomedTimeseries(zConfig, this.chartData);
    } else if (!this.isChartDataZoomedOutEmpty()) {  // zoomed out
      this.chartData = {...this.chartDataZoomedOut};
      this.chartDataZoomedOut = {};
    }
  }

  handleZoomThreshold(zConfig) {
    const n = this.thresholdData.ts.length;
    if (zConfig.isZoomed && n > 0) {  // zoomed in
      // cache zoomed-out data
      if (this.isChartDataZoomedOutEmpty()) {
        this.thresholdDataZoomedOut = {...this.thresholdData};
      }
      // get zoome-in data
      this.thresholdData = this.extractZoomedTimeseries(zConfig, this.thresholdData);
    } else if (!this.isThresholdDataZoomedOutEmpty()) {  // zoomed out
      this.thresholdData = {...this.thresholdDataZoomedOut};
      this.thresholdDataZoomedOut = {};
    }
  }

  reloadPreview() {
    this.timeSeriesClicked({timeSeries: this.timeseriesIndex.toString()});
  }

  timeSeriesClicked(e) {
    this.timeseriesIndex = parseInt(e.timeSeries, 10);
    this.thresholdOptions = {...this.options};
    // this.thresholdOptions.labels = ['x', e.timeSeries, 'observed', 'lowerBad', 'lowerWarning', 'upperWarning', 'upperBad'];
    this.thresholdOptions.labels = ['x', '1', '2', '3', '4', '5', '6'];
    this.thresholdOptions.thresholds = [];
    this.thresholdOptions.visibility = ['true', 'true', 'true', 'true', 'true', 'true', 'true'];
    this.thresholdOptions.series = this.getSeriesOptions(this.options.series[this.timeseriesIndex]);

    if (this.isChartDataZoomedOutEmpty()) {
      this.thresholdData = this.getThresholdData(this.chartData.ts, this.timeseriesIndex);
    } else {
      this.thresholdData = this.getThresholdData(this.chartDataZoomedOut.ts, this.timeseriesIndex);
    }
  }

  getSeriesOptions(selectedTimeSeriesOption) {
    const series = {};
    const baseOption = {...selectedTimeSeriesOption};

    series[1] = {...selectedTimeSeriesOption};
    series[2] = this.setLabelAndColor(baseOption, 'Expected Value', '#000000', 'light');
    series[3] = this.setLabelAndColor(baseOption, 'Upper Bad Threshold', '#ff0000', 'dashed');
    series[4] = this.setLabelAndColor(baseOption, 'Upper Warning Threshold', '#ffa500', 'dashed');
    series[5] = this.setLabelAndColor(baseOption, 'Lower Warning Threshold', '#ffa500', 'dashed');
    series[6] = this.setLabelAndColor(baseOption, 'Lower Bad Threshold', '#ff0000', 'dashed');
    return series;
  }

  setLabelAndColor(option, label: string, color: string, style: string = '') {
    const optionCopy = {...option};

    if (style === 'light') {
      optionCopy.strokePattern = [1, 3];
    }
    if (style === 'dashed') {
      optionCopy.strokePattern = [4, 4];
    }
    if (style === 'dotted') {
      optionCopy.strokePattern = [2, 3];
    }

    optionCopy.tags = {metric: label};
    optionCopy.label = label;
    optionCopy.metric = label;
    optionCopy.hash = label;
    optionCopy.color = color;
    return optionCopy;
  }

  getObservedOptions() {
    const observedOptions = {... this.options};
    const visibilityHash = {};
    const visibility = [];

    const originalSeries = {...this.options.series};
    const _series = Object.keys(originalSeries);

    for (const serie of _series) {
      if (originalSeries[serie].metric.endsWith('prediction')) {
        visibilityHash[originalSeries[serie].metric] = false;
        visibility.push(false);
      } else {
        visibilityHash[originalSeries[serie].metric] = true;
        visibility.push(true);
      }
    }
    observedOptions.visibility = visibility;
    observedOptions.visibilityHash = visibilityHash;

    return observedOptions;
  }

  getThresholdData(allTimeSeries, timeSeriesIndex: number) {
    const data = [];
    const selectedTimeseries: any[] = this.getTimeSeriesFromIndex(allTimeSeries, timeSeriesIndex);
    const expectedTimeSeries: any[] = this.getExpectedTimeSeries(allTimeSeries, timeSeriesIndex, this.options);
    const upperBadTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.badUpperThreshold), this.thresholdConfig.singleMetric.upperThresholdType, 'above');
    const upperWarningTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.warnUpperThreshold), this.thresholdConfig.singleMetric.upperThresholdType, 'above');
    const lowerWarningTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.warnLowerThreshold), this.thresholdConfig.singleMetric.lowerThresholdType, 'below');
    const lowerBadTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.badLowerThreshold), this.thresholdConfig.singleMetric.lowerThresholdType, 'below');

    let index = 0;
    for (const timePoints of allTimeSeries) {
      const timePointsArray = [];
      // add time, selected ts, expected ts, and threshold ts
      timePointsArray.push(timePoints[0]);
      timePointsArray.push(selectedTimeseries[index]);
      timePointsArray.push(expectedTimeSeries[index]);
      timePointsArray.push(upperBadTimeSeries[index]);
      timePointsArray.push(upperWarningTimeSeries[index]);
      timePointsArray.push(lowerWarningTimeSeries[index]);
      timePointsArray.push(lowerBadTimeSeries[index]);

      data.push(timePointsArray);
      index++;
    }
    return {ts: data};
  }

  getTimeSeriesFromIndex(timeseries, timeseriesIndex: number) {
    const extractedTimeSeries: any[] = [];
    for (const timePoints of timeseries) {
      extractedTimeSeries.push(timePoints[timeseriesIndex]);
    }
    return extractedTimeSeries;
  }

  getExpectedTimeSeries(allTimeSeries, timeseriesIndex: number, options) {
    // get metric name from index
    let metricName = '';
    const _series = Object.keys(options.series);
    for (const serie of _series) {
      if (parseInt(serie, 10) === timeseriesIndex) {
        metricName = options.series[serie].metric;
        break;
      }
    }

    // get index of prediction metric name
    let predictedIndex = -1;
    for (const serie of _series) {
      if (options.series[serie].metric === metricName + '.prediction') {
        predictedIndex = parseInt(serie, 10);
        break;
      }
    }
    return this.getTimeSeriesFromIndex(allTimeSeries, predictedIndex);
  }

  getThresholdTimeSeries(timeseries: number[], thresholdValue: number, thresholdType: string, thresholdDirection: string): number[] {
    const thresholdTimeSeries: any[] = [];
    for (const dataPoint of timeseries) {
      if (thresholdType === 'value' && thresholdDirection === 'above') {
        thresholdTimeSeries.push(dataPoint + thresholdValue);
      } else if (thresholdType === 'value' && thresholdDirection === 'below') {
        thresholdTimeSeries.push(dataPoint - thresholdValue);
      } else if (thresholdType === 'percent' && thresholdDirection === 'above') {
        thresholdTimeSeries.push( dataPoint * (1 + thresholdValue / 100));
      } else if (thresholdType === 'percent' && thresholdDirection === 'below') {
        thresholdTimeSeries.push( dataPoint * (1 - thresholdValue / 100));
      } else {
        thresholdTimeSeries.push(NaN);
      }
    }
    return thresholdTimeSeries;
  }

}

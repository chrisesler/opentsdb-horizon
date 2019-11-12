import { Component, OnInit, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-details-metric-period-over-period-preview',
  templateUrl: './alert-details-metric-period-over-period-preview.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodPreviewComponent implements OnInit, OnChanges {
  @HostBinding('class.period-over-period-preview') private _hostClass = true;

  constructor() { }

  @Input() chartData;
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

  _thresholdConfig: any = {};
  thresholdData: any = {};
  thresholdOptions: any = {};
  timeseriesIndex = -1;

  // zoom out data
  chartDataZoomedOut: any = {};

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {

    // new data
    if (changes.chartData && changes.nQueryDataLoading && changes.nQueryDataLoading.currentValue === 0 && this.timeseriesIndex !== -1) {
      this.chartDataZoomedOut = {};
      this.reloadPreview();
    } else if (changes.chartData) { // selected metric changed
      this.thresholdData = {};
      this.timeseriesIndex = -1;
    }

  }

  handleZoomQuery(zConfig) {
    const n = this.chartData.ts.length;
    if (zConfig.isZoomed && n > 0) {  // zoomed in
      const startTime = new Date(this.chartData.ts[0][0]).getTime() / 1000;
      const endTime = new Date(this.chartData.ts[n - 1][0]).getTime() / 1000;
      zConfig.start = Math.floor(zConfig.start) <= startTime ? -1 : Math.floor(zConfig.start);
      zConfig.end = Math.ceil(zConfig.end) >= endTime ? -1 : Math.floor(zConfig.end);

      // cache zoomed-out data
      if (this.isChartDataZoomedOutEmpty()) {
        this.chartDataZoomedOut = {...this.chartData};
      }

      // extract out in-range timeseries
      const zoomedTS = [];
      for (const ts of this.chartData.ts) {
        if (ts[0].getTime() / 1000 > zConfig.start && ts[0].getTime() / 1000 < zConfig.end) {
          zoomedTS.push(ts);
        }
      }

      // set chartData
      this.chartData = {ts: zoomedTS};

    } else if (!this.isChartDataZoomedOutEmpty()) {  // zoomed out
      this.chartData = {...this.chartDataZoomedOut};
      this.chartDataZoomedOut = {};
    }
  }

  isChartDataZoomedOutEmpty() {
    return Object.entries(this.chartDataZoomedOut).length === 0;
  }

  handleZoomThreshold(e) { }

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
    series[2] = this.setLabelAndColor(baseOption, 'Expected Value', '#000000');
    series[3] = this.setLabelAndColor(baseOption, 'Upper Bad Threshold', '#ff0000');
    series[4] = this.setLabelAndColor(baseOption, 'Upper Warning Threshold', '#ffa500');
    series[5] = this.setLabelAndColor(baseOption, 'Lower Warning Threshold', '#ffa500');
    series[6] = this.setLabelAndColor(baseOption, 'Lower Bad Threshold', '#ff0000');
    return series;
  }

  setLabelAndColor(option, label: string, color: string) {
    const optionCopy = {...option};
    optionCopy.tags = {metric: label};
    optionCopy.label = label;
    optionCopy.metric = label;
    optionCopy.hash = label;
    optionCopy.color = color;
    return optionCopy;
  }

  getThresholdData(allTimeSeries, timeSeriesIndex) {
    const data = [];
    const selectedTimeseries: any[] = this.getSelectedTimeSeries(allTimeSeries, timeSeriesIndex);
    const expectedTimeSeries: any[] = this.getExpectedTimeSeries(selectedTimeseries);
    // tslint:disable:max-line-length
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

  getSelectedTimeSeries(timeseries, timeseriesIndex) {
    const extractedTimeSeries: any[] = [];
    for (const timePoints of timeseries) {
      extractedTimeSeries.push(timePoints[timeseriesIndex]);
    }
    return extractedTimeSeries;
  }

  getExpectedTimeSeries(timeseries) {
    const expectedValues = [];
    const expectedValue = this.getMockExpectedValue(timeseries); // todo - remove
    for (const timePoints of timeseries) {
      expectedValues.push(expectedValue);
    }
    return expectedValues;
  }

  // todo - remove
  getMockExpectedValue(timeseries) {
    let summ = 0;
    let count = 0;
    for (const timePoints of timeseries) {
      if (!Number.isNaN(timePoints)) {
        summ = summ + timePoints;
        count++;
      }
    }
    return summ / count;
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

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
  @Input() thresholdConfig;

  thresholdData: any = {};
  thresholdOptions: any = {};
  timeseriesIndex: number = -1;

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.timeseriesIndex >= 0 && this.thresholdConfig && this.thresholdConfig.singleMetric && this.thresholdData) {
      this.thresholdData = this.getThresholdData(this.chartData.ts, this.timeseriesIndex);
    }
  }

  handleZoomQuery(e) { }

  handleZoomThreshold(e) { }

  timeSeriesClicked(e) {
    this.timeseriesIndex = parseInt(e.timeSeries, 10);
    this.thresholdOptions = {...this.options};
    this.thresholdOptions.labels = ['x', e.timeSeries, 'observed', 'lowerBad', 'lowerWarning', 'upperWarning', 'upperBad'];
    this.thresholdOptions.thresholds = [];
    this.thresholdOptions.visibility = ['true', 'true', 'true', 'true', 'true', 'true', 'true'];
  }

  getThresholdData(allTimeSeries, timeSeriesIndex) {
    const data = [];
    const selectedTimeseries: any[] = this.getSelectedTimeSeries(allTimeSeries, timeSeriesIndex);
    const expectedTimeSeries: any[] = this.getExpectedTimeSeries(selectedTimeseries);
    // tslint:disable:max-line-length
    const lowerBadTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.badLowerThreshold), this.thresholdConfig.singleMetric.lowerThresholdType, 'below');
    const lowerWarningTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.warnLowerThreshold), this.thresholdConfig.singleMetric.lowerThresholdType, 'below');
    const upperWarningTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.warnUpperThreshold), this.thresholdConfig.singleMetric.upperThresholdType, 'above');
    const upperBadTimeSeries: any[] = this.getThresholdTimeSeries(expectedTimeSeries, parseFloat(this.thresholdConfig.singleMetric.badUpperThreshold), this.thresholdConfig.singleMetric.upperThresholdType, 'above');

    let index = 0;
    for (const timePoints of allTimeSeries) {
      const timePointsArray = [];
      // add time, selected ts, expected ts, and threshold ts
      timePointsArray.push(timePoints[0]);
      timePointsArray.push(selectedTimeseries[index]);
      timePointsArray.push(expectedTimeSeries[index]);
      timePointsArray.push(lowerBadTimeSeries[index]);
      timePointsArray.push(lowerWarningTimeSeries[index]);
      timePointsArray.push(upperWarningTimeSeries[index]);
      timePointsArray.push(upperBadTimeSeries[index]);

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

import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-details-metric-period-over-period-preview',
  templateUrl: './alert-details-metric-period-over-period-preview.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodPreviewComponent implements OnInit {
  @HostBinding('class.period-over-period-preview') private _hostClass = true;

  constructor() { }

  @Input() chartData;
  @Input() size;
  @Input() nQueryDataLoading;
  @Input() options;

  thresholdData: any = {};
  thresholdOptions: any = {};

  ngOnInit() { }

  handleZoomQuery(e) { }

  handleZoomThreshold(e) { }

  timeSeriesClicked(e) {
    this.thresholdData = this.getThresholdData(this.chartData.ts, parseInt(e.timeSeries, 10));
    this.thresholdOptions = {...this.options};
    this.thresholdOptions.labels = ['x', e.timeSeries, 'observed'];
    this.thresholdOptions.thresholds = [];
  }

  getThresholdData(allTimeSeries, timeSeriesIndex) {
    const thresholdData = [];
    const selectedTimeseries: any[] = this.getSelectedTimeSeries(allTimeSeries, timeSeriesIndex);
    const expectedTimeSeries: any[] = this.getExpectedTimeSeries(selectedTimeseries);
    const lowerBadTimeSeries: any[] = this.getThresholdTimeSeries(selectedTimeseries, '', '');
    const lowerWarningTimeSeries: any[] = this.getThresholdTimeSeries(selectedTimeseries, '', '');
    const upperWarningTimeSeries: any[] = this.getThresholdTimeSeries(selectedTimeseries, '', '');
    const upperBadTimeSeries: any[] = this.getThresholdTimeSeries(selectedTimeseries, '', '');

    let index = 0;
    for (const timePoints of allTimeSeries) {
      const timePointsArray = [];
      // add time, selected ts, expected ts, and threshold ts
      timePointsArray.push(timePoints[0]);
      timePointsArray.push(selectedTimeseries[index]);
      timePointsArray.push(expectedTimeSeries[index]);
      // timePointsArray.push(lowerBadTimeSeries[index]);
      // timePointsArray.push(lowerWarningTimeSeries[index]);
      // timePointsArray.push(upperWarningTimeSeries[index]);
      // timePointsArray.push(upperBadTimeSeries[index]);

      thresholdData.push(timePointsArray);
      index++;
    }
    return {ts: thresholdData};
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

  getThresholdTimeSeries(timeseries, threshold, thresholdType): any[] {
    return [];
  }

}

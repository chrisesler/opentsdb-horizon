import { Component, OnInit, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';

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

  ngOnInit() { }

  handleZoomQuery(e) { }

  handleZoomThreshold(e) { }

  timeSeriesClicked(e) {
    this.timeseriesIndex = parseInt(e.timeSeries, 10);
    this.thresholdOptions = {...this.options};
    // this.thresholdOptions.labels = ['x', e.timeSeries, 'observed', 'lowerBad', 'lowerWarning', 'upperWarning', 'upperBad'];
    this.thresholdOptions.labels = ['x', '1', '2', '3', '4', '5', '6'];
    this.thresholdOptions.thresholds = [];
    this.thresholdOptions.visibility = ['true', 'true', 'true', 'true', 'true', 'true', 'true'];
    this.thresholdOptions.series = this.getSeriesOptions(this.options.series[this.timeseriesIndex]);
    this.thresholdData = this.getThresholdData(this.chartData.ts, this.timeseriesIndex);
  }

  getSeriesOptions(selectedTimeSeriesOption) {
    const series = {};
    const baseOption = {...selectedTimeSeriesOption};

    series[1] = {...selectedTimeSeriesOption};
    series[2] = this.setLabelAndColor(baseOption, 'Expected_Value', '#000000');
    series[3] = this.setLabelAndColor(baseOption, 'Upper_Bad_Threshold', '#ff0000');
    series[4] = this.setLabelAndColor(baseOption, 'Upper_Warning_Threshold', '#ffa500');
    series[5] = this.setLabelAndColor(baseOption, 'Lower_Warning_Threshold', '#ffa500');
    series[6] = this.setLabelAndColor(baseOption, 'Lower_Bad_Threshold', '#ff0000');
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

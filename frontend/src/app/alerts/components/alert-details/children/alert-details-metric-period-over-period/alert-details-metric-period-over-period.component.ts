import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'alert-details-metric-period-over-period',
  templateUrl: './alert-details-metric-period-over-period.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() queries: any[];
  @Input() viewMode: boolean;
  @Input() config: any;
  @Output() configChange = new EventEmitter();

  showThresholdAdvanced = false; // toggle in threshold form
  slidingWindowPresets = [60, 300, 600, 900, 3600, 3600 * 6, 3600 * 24];
  periodPresets = [3600, 3600 * 24, 3600 * 24 * 7];
  maxSlidingWindow = 3600 * 24; // 1 day

  ngOnInit() {
    if (this.viewMode) {
      this.showThresholdAdvanced = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setDefaultConfig();
  }

  setDefaultConfig() {
    if (!this.config) {
      this.config = {};
    }
    if (!this.config.singleMetric) {
      this.config.singleMetric = {};
    }

    this.config.subType = this.config.subType || 'period-over-period';
    this.config.delayEvaluation = this.config.delayEvaluation || '0';
    this.config.singleMetric.queryIndex = this.config.singleMetric.queryIndex || '0';
    this.config.singleMetric.queryType = this.config.singleMetric.queryType || 'tsdb';
    this.config.singleMetric.metricId = this.config.singleMetric.metricId || 'q1_m1_groupby';
    this.config.singleMetric.slidingWindow = this.config.singleMetric.slidingWindow || '300';
    this.config.singleMetric.period = this.config.singleMetric.period || '3600';
    this.config.singleMetric.lookbacks = this.config.singleMetric.lookbacks || '6';
    this.config.singleMetric.badUpperThreshold = this.config.singleMetric.badUpperThreshold || '';
    this.config.singleMetric.warnUpperThreshold = this.config.singleMetric.warnUpperThreshold || '';
    this.config.singleMetric.badLowerThreshold = this.config.singleMetric.badLowerThreshold || '';
    this.config.singleMetric.warnLowerThreshold = this.config.singleMetric.warnLowerThreshold || '';
    this.config.singleMetric.upperThresholdType = this.config.singleMetric.upperThresholdType || 'value';
    this.config.singleMetric.lowerThresholdType = this.config.singleMetric.lowerThresholdType || 'value';
    this.config.singleMetric.highestOutliersToRemove = this.config.singleMetric.highestOutliersToRemove || '1';
    this.config.singleMetric.lowestOutliersToRemove = this.config.singleMetric.lowestOutliersToRemove || '1';
    this.config.singleMetric.algorithm = this.config.singleMetric.algorithm || 'simple-average';

    this.configChange.emit(this.config);
  }
  // getDefaultConfig() {
  //   return {
  //       'subType': 'period-over-period',
  //       'delayEvaluation': '0',
  //       'singleMetric': {
  //         'queryIndex': '0',
  //         'queryType': 'tsdb',
  //         'metricId': 'q1_m1_groupby',
  //         'slidingWindow': '300',
  //         'period': '3600',
  //         'lookbacks': '6',
  //         'badUpperThreshold': '',
  //         'warnUpperThreshold': '',
  //         'badLowerThreshold': '',
  //         'warnLowerThreshold': '',
  //         'upperThresholdType': 'value',
  //         'lowerThresholdType': 'value',
  //         'highestOutliersToRemove': '1',
  //         'lowestOutliersToRemove': '1',
  //         'algorithm' : 'simple-average'
  //       },
  //   };
  // }

  updateConfig(prop, val) {
    if (prop === 'delayEvaluation') {
      this.config[prop] = val;
    } else {
      this.config.singleMetric[prop] = val;
    }
    this.configChange.emit(this.config);
  }

}

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'alert-details-metric-period-over-period',
  templateUrl: './alert-details-metric-period-over-period.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodComponent implements OnInit {

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
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
        'subType': 'period-over-period',
        'delayEvaluation': '0',
        'singleMetric': {
          'queryIndex': '0',
          'queryType': 'tsdb',
          'metricId': 'q1_m1_groupby',
          'slidingWindow': '300',
          'period': '3600',
          'lookbacks': '6',
          'badUpperThreshold': '',
          'warnUpperThreshold': '',
          'badLowerThreshold': '',
          'warnLowerThreshold': '',
          'upperThresholdType': 'value',
          'lowerThresholdType': 'value',
          'highestOutliersToRemove': '1',
          'lowestOutliersToRemove': '1',
          'algorithm' : 'simple-average'
        },
    };
  }

  updateConfig(prop, val) {
    if (prop === 'delayEvaluation') {
      this.config[prop] = val;
    } else {
      this.config.singleMetric[prop] = val;
    }

    this.configChange.emit(this.config);
  }

}

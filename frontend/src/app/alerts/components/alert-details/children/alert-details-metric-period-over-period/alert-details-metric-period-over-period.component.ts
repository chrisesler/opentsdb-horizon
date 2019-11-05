import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  selector: 'alert-details-metric-period-over-period',
  templateUrl: './alert-details-metric-period-over-period.component.html',
  styleUrls: []
})
export class AlertDetailsMetricPeriodOverPeriodComponent implements OnInit {

  constructor(
    public utils: UtilsService
  ) { }

  @Input() queries: any[];
  @Input() viewMode: boolean;
  @Input() config: any;

  @Output() configChange = new EventEmitter();
  @Output() configIsValid = new EventEmitter();

  showThresholdAdvanced = false; // toggle in threshold form
  slidingWindowPresets = [60, 300, 600, 900, 3600, 3600 * 6, 3600 * 24];
  periodPresets = [3600, 3600 * 24, 3600 * 24 * 7];
  maxSlidingWindow = 3600 * 24; // 1 day

  ngOnInit() {
    if (this.viewMode) {
      this.showThresholdAdvanced = true;
    }

    if (!this.config || !this.config.singleMetric) {
      this.setDefaultConfig();
      this.configChange.emit({thresholdChanged: false, config: {...this.config}});
    } else {
      this.configIsValid.emit(true);
    }
  }

  setDefaultConfig() {
    if (!this.config) {
      this.config = {};
    }
    if (!this.config.singleMetric) {
      this.config.singleMetric = {};
    }

    this.config.subType = this.config.subType || 'periodOverPeriod';
    this.config.delayEvaluation = this.config.delayEvaluation || '0';
    // this.config.singleMetric.queryIndex = this.config.singleMetric.queryIndex || '0';
    this.config.singleMetric.queryType = this.config.singleMetric.queryType || 'tsdb';
    // this.config.singleMetric.metricId = this.config.singleMetric.metricId || 'q1_m1_groupby';
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

  }

  updateConfig(prop, val) {
    let thresholdChanged = false;
    if (prop === 'delayEvaluation') {
      this.config[prop] = val;
    } else {
      this.config.singleMetric[prop] = val;
    }
    if (prop === 'badUpperThreshold' || prop === 'warnUpperThreshold' || prop === 'badLowerThreshold' || prop === 'warnLowerThreshold') {
      thresholdChanged = true;
      this.configIsValid.emit(true);
    }
    this.configChange.emit({thresholdChanged, config: {...this.config}});
  }

}

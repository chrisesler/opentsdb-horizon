import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';
import { FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';

// tslint:disable:max-line-length
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

  thresholdChanged = false;

  // form control
  lookbacks = new FormControl('');
  badUpperThreshold = new FormControl('');
  warnUpperThreshold = new FormControl('');
  badLowerThreshold = new FormControl('');
  warnLowerThreshold = new FormControl('');

  get anyErrors(): boolean {
    if (this.lookbacks.errors) {
        return true;
    } else if (this.badUpperThreshold.errors) {
      return true;
    } else if (this.warnUpperThreshold.errors) {
      return true;
    } else if (this.badLowerThreshold.errors) {
      return true;
    } else if (this.warnLowerThreshold.errors) {
      return true;
    } else if (!this.atleastOneThresholdSet()) {
      return true;
    }
    return false;
}

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
    if (prop === 'badUpperThreshold' || prop === 'warnUpperThreshold' || prop === 'badLowerThreshold' || prop === 'warnLowerThreshold') {
      this.thresholdChanged = true;
      // this.configIsValid.emit(true);
    }
    if (prop === 'delayEvaluation') {
      this.config[prop] = val;
    } else {
      this.config.singleMetric[prop] = val;
    }

    this.updateValidators();

    if (!this.anyErrors) {
      this.configChange.emit({ thresholdChanged: this.thresholdChanged, config: {...this.config}});
      this.thresholdChanged = false;
    }
  }

  updateValidators() {
    this.lookbacks = new FormControl(this.config.singleMetric['lookbacks'], [Validators.max(10), Validators.min(1)]);
    this.badUpperThreshold = new FormControl(this.config.singleMetric['badUpperThreshold'],   [Validators.min(0), this.thresholdValidator('warnUpperThreshold')]);
    this.warnUpperThreshold = new FormControl(this.config.singleMetric['warnUpperThreshold'], [Validators.min(0), this.thresholdValidator('badUpperThreshold')]);
    this.badLowerThreshold = new FormControl(this.config.singleMetric['badLowerThreshold'],   [Validators.min(0), this.thresholdValidator('warnLowerThreshold')]);
    this.warnLowerThreshold = new FormControl(this.config.singleMetric['warnLowerThreshold'], [Validators.min(0), this.thresholdValidator('badLowerThreshold')]);
  }

  thresholdValidator(thresholdToCompare: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        let forbidden;
        if (control.value === '') {
          forbidden = false;
        } else if (thresholdToCompare.includes('bad')) { // compare warn value to bad threshold
          forbidden = this.isValueLargerThanThreshold(thresholdToCompare, control.value);
        } else { // compare bad value to warn threshold
          forbidden = !this.isValueLargerThanThreshold(thresholdToCompare, control.value);
        }
        return forbidden ? { 'forbiddenValue': { value: control.value } } : null;
    };
  }

  isValueLargerThanThreshold(threshold: string, value: string): boolean {
    return Number(value) > Number(this.config.singleMetric[threshold]);
  }

  atleastOneThresholdSet() {
    return this.config.singleMetric['badUpperThreshold'] ||
           this.config.singleMetric['warnUpperThreshold'] ||
           this.config.singleMetric['warnLowerThreshold'] ||
           this.config.singleMetric['badLowerThreshold'];
  }

}

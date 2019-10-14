import { Component, OnInit, Input } from '@angular/core';
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

  showThresholdAdvanced: boolean = false; // toggle in threshold form


  ngOnInit() {
    if (this.viewMode) {
      this.showThresholdAdvanced = true;
    }
  }

}

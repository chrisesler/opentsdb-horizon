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

  ngOnInit() {
  }

  handleZoom(e) {

  }

}

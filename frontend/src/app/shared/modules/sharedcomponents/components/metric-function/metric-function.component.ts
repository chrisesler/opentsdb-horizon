import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'metric-function',
  templateUrl: './metric-function.component.html',
  styleUrls: []
})
export class MetricFunctionComponent implements OnInit {
  @HostBinding('class.metric-function-component') private _hostClass = true;
  
  constructor() { }

  ngOnInit() {
  }

}

import { Component, OnInit, Input, Output, HostBinding, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-widget-base',
  templateUrl: './widgetbase.component.html',
  styleUrls: ['./widgetbase.component.scss']
})
export class WidgetbaseComponent implements OnInit {
  @HostBinding('class.widget-panel-content') private hostClass = true;

  @Input() widget: any;

  constructor() { }

  ngOnInit() {
  }

}

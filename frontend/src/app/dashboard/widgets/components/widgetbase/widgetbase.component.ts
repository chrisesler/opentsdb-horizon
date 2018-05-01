import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-widget-base',
  templateUrl: './widgetbase.component.html',
  styleUrls: ['./widgetbase.component.scss']
})
export class WidgetbaseComponent implements OnInit {
  @Input() config: any;

  constructor() { }

  ngOnInit() {
  }

}

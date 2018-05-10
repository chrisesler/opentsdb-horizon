import { Component, OnInit, Input, Output, HostBinding, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-wsample',
  templateUrl: './wsample.component.html',
  styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit {
  @HostBinding('class.widget-panel-content') private hostClass = true;

  @Input() config: any;

  constructor() { }

  ngOnInit() {
  }


}

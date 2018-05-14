import { Component, OnInit, Input, Output, HostBinding, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { locateHostElement } from '@angular/core/src/render3/instructions';

@Component({
  selector: 'app-wsample',
  templateUrl: './wsample.component.html',
  styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit, OnChanges {
  @HostBinding('class.widget-panel-content') private hostClass = true;

  @Input() widget: any;

  constructor() { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    console.log(this.widget.id + ' => ' + changes);    
  }
}

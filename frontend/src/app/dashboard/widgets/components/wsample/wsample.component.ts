import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  HostBinding,
  EventEmitter,
  SimpleChanges
} from '@angular/core';

import { locateHostElement } from '@angular/core/src/render3/instructions';

@Component({
  selector: 'app-wsample',
  templateUrl: './wsample.component.html',
  styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit, OnChanges {
  @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.widget-edit-mode') private _editMode = false;

  @Input() editMode: any = { 'showConfig': false } ;
  @Input() widget: any;

  constructor() { }

  ngOnInit() {
    console.log('WSAMPLE :: onInit', this);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('***** CHANGES *******', changes);
  }


}

import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'metric-function',
  templateUrl: './metric-function.component.html',
  styleUrls: []
})
export class MetricFunctionComponent implements OnInit {

  @HostBinding('class.metric-function-component') private _hostClass = true;
  @Input() function: any = { id: '123', functionCall: 'CounterToRate', val: 'enter val'};
  @Output() fxOut = new EventEmitter;
  inputVal: FormControl;
  isEdit: boolean;
  constructor() { }

  ngOnInit() {
    this.isEdit = false;
    this.inputVal = new FormControl(this.function.val);
  }

  saveInput() {
    this.function.val = this.inputVal.value;
    this.isEdit = false;
  }

  editInput() {
    this.isEdit = true;
    this.inputVal.setValue(this.function.val);
  }
}

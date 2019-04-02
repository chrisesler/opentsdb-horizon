import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'metric-function',
  templateUrl: './metric-function.component.html',
  styleUrls: []
})
export class MetricFunctionComponent implements OnInit {

  @HostBinding('class.metric-function-component') private _hostClass = true;

  @Input() fx: any; // { id: '123', fxCall: 'CounterToRate', val: 'enter val'};
  @Output() fxOut = new EventEmitter;
  @Output() fxDel = new EventEmitter;
  inputVal: FormControl;
  isEdit: boolean = false;
  constructor() { }

  ngOnInit() {
    this.isEdit = this.fx.val === '' ? true : false;
    this.inputVal = new FormControl(this.fx.val);
  }

  saveInput() {
    this.fx.val = this.inputVal.value;
    this.isEdit = false;
    this.fxOut.emit(this.fx);
  }

  editInput() {
    this.isEdit = true;
    this.inputVal.setValue(this.fx.val);
  }

  delFx(funcId: string) {
   this.fxDel.emit(funcId);
  }
}

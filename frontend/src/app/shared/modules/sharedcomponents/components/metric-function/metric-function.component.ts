import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ValidatorFn, AbstractControl } from '@angular/forms';

@Component({
  selector: 'metric-function',
  templateUrl: './metric-function.component.html',
  styleUrls: []
})
export class MetricFunctionComponent implements OnInit {

  @HostBinding('class.metric-function-component') private _hostClass = true;

  @Input() fx: any; // { id: '123', fxCall: 'CounterToRate', val: 'enter val'};
  @Input() metricId: string; // metric that contains these functions
  @Input() errorMessage: string;  // OPTIONAL
  @Input() regexValidator: RegExp; // OPTIONAL
  @Output() fxOut = new EventEmitter;
  @Output() fxDel = new EventEmitter;
  inputVal: FormControl;
  isEdit: boolean = false;
  constructor() { }

  ngOnInit() {
    this.isEdit = false;
    // this.isEdit = this.fx.val === '' ? true : false;
    // for now set the default value to rate function
    // we can set default value by fx type later
    if (this.fx.val === '') {
      this.fx.val = '1s';
    }
    if (!this.errorMessage) {
      this.errorMessage = 'Error';
    }
    this.inputVal = new FormControl(this.fx.val);
  }

  saveInput() {
    if (!this.inputVal.errors) {
      this.isEdit = false;
      this.fx.val = this.inputVal.value;
      this.fxOut.emit({metricId: this.metricId, fx: this.fx});
    }
  }

  editInput() {
    this.isEdit = true;
    this.updateValidators();
  }

  delFx(funcId: string) {
   this.fxDel.emit({metricId: this.metricId, funcId});
  }

  getErrorMessage() {
    return this.errorMessage;
  }
   forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        let forbidden = false;
        if (this.regexValidator && !this.regexValidator.test(control.value)) {
          forbidden = true;
        }
        return forbidden ? { 'forbiddenName': { value: control.value } } : null;
    };
  }
   updateValidators() {
    this.inputVal = new FormControl(this.inputVal.value, [this.forbiddenNameValidator()]);
  }
}

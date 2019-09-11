import { Component, OnInit, ElementRef, ViewChild, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'time-selector',
  templateUrl: './time-selector.component.html',
  styleUrls: []
})


export class TimeSelectorComponent implements OnInit {

  constructor() { }

  @HostBinding('class.time-selector-component') private _hostClass = true;
  @ViewChild('customTime') customTimeInput: ElementRef;
  @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

  @Input() timeInSeconds: number;
  @Output() newTimeInSeconds = new EventEmitter();

  presetIntervalSizes = [60, 300, 600, 900, 1800, 3600, 3600 * 2, 3600 * 6, 3600 * 12, 3600 * 24];
  regexValidator = /^\d+\s*(sec|min|h|d)$/i;
  inputVal: FormControl;

  ngOnInit() {
    if (this.timeInSeconds === undefined) {
      this.timeInSeconds = 300;
    }
    this.inputVal = new FormControl();
  }

  menuOpened() {
    if (!this.presetIntervalSizes.includes(this.timeInSeconds)) {
      this.inputVal = new FormControl(this.secondsToLabel(this.timeInSeconds));
    } else {
      this.inputVal = new FormControl();
    }
  }

  selectedPreset(num: number) {
    this.timeInSeconds = num;
    this.newTimeInSeconds.emit(this.timeInSeconds);
  }

  validateTimeWindow(input) {
    return this.regexValidator.test(input);
  }

  keyedOnUnitInputBox(value: string) {
    this.customTimeInput.nativeElement.focus();
    this.updateValidators();

    if (!this.inputVal.errors) {
      this.timeInSeconds = this.labelToSeconds(value);
      this.newTimeInSeconds.emit(this.timeInSeconds);
    }
  }

  customTimeEntered() {
    if (!this.inputVal.errors) {
      this.menuTrigger.closeMenu();
    }
  }

  secondsToLabel(numInSeconds: number) {
    const minute = 60;
    const hour = 60 * 60;
    const day = 60 * 60 * 24;
    if (numInSeconds % day === 0 && numInSeconds !== day) {
        return (numInSeconds / day) + ' d';
    } else if (numInSeconds % hour === 0) {
        return (numInSeconds / hour) + ' h';
    } else if (numInSeconds % minute === 0) {
        return (numInSeconds / minute) + ' min';
    } else {
        return numInSeconds + ' sec';
    }
  }

  labelToSeconds(label: string) {
    let numOfSeconds = 0;
    const minute = 60;
    const hour = 60 * 60;
    const day = 60 * 60 * 24;
    const timeAmountRegEx = /\d+/;
    const timeUnitRegEx = /[a-zA-Z]/;
    const timeAmount = parseInt(label.match(timeAmountRegEx)[0], 10);
    const timeUnit = label.match(timeUnitRegEx)[0].toLowerCase();
    if (timeUnit === 'd') {
        numOfSeconds = timeAmount * day;
    } else if (timeUnit === 'h') {
        numOfSeconds = timeAmount * hour;
    } else if (timeUnit === 'm') {
        numOfSeconds = timeAmount * minute;
    } else { // timeUnit === 's'
        numOfSeconds = timeAmount;
    }
    return numOfSeconds;
  }

  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        let forbidden = false;
        if (!this.regexValidator.test(control.value)) {
          forbidden = true;
        }
        return forbidden ? { 'forbiddenName': { value: control.value } } : null;
    };
  }

   updateValidators() {
    this.inputVal = new FormControl(this.inputVal.value, [this.forbiddenNameValidator()]);
  }
}

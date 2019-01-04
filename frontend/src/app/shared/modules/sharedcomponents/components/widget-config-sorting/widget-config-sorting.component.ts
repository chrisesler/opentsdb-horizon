import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { FormGroup , FormBuilder, Validators, ValidatorFn, AbstractControl, FormControl} from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'widget-config-sorting',
  templateUrl: './widget-config-sorting.component.html',
  styleUrls: ['./widget-config-sorting.component.scss']
})
export class WidgetConfigSortingComponent implements OnInit {

  @HostBinding('class') private _hostClass = true;

  /** Inputs */
  @Input() widget: any;

  /** Outputs */
  @Output() widgetChange = new EventEmitter;

  limitForm: FormGroup;
  searchField: FormControl;
  order: string;
  limit: number;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.limitForm = this.formBuilder.group({
      limitInput: ['', [ Validators.min(1), Validators.max(1000), Validators.required, this.integerValidator()]],
    });

    this.limitForm.setValue( {limitInput: 25});

    this.order = 'top';

  }

  // convenience getter for easy access to form fields
  get formFields() { return this.limitForm.controls; }

  limitInputChanged() {
    if (!this.formFields.limitInput.errors) {
      this.limit = this.limitForm.value.limitInput;
    }
  }

  integerValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
        let forbidden: boolean = true;
        if (Number.isInteger(control.value)) {
            forbidden = false;
        }
        return forbidden ? {'format': {value: control.value}} : null;
    };
  }
}

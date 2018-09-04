import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';


@Component({
  selector: 'dropdown-line-type',
  templateUrl: './dropdown-line-type.component.html',
  styleUrls: ['./dropdown-line-type.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownLineTypeComponent),
      multi: true,
    }]
})
export class DropdownLineTypeComponent implements OnInit, OnDestroy, ControlValueAccessor {

    @Input() value;

    @Output()
    valueChange = new EventEmitter<string>();

    lineTypeOptions: Array<object> = [
        {
            label: 'Solid',
            value: 'solid'
        },
        {
            label: 'Dotted',
            value: 'dotted'
        },
        {
            label: 'Dashed',
            value: 'dashed'
        },
        {
            label: 'Dot-Dashed',
            value: 'dot-dashed'
        }
    ];

    lineTypeControl: FormControl;
    defaultLineType = 'solid';

    subscription: Subscription;

    constructor() { }

    // the method set in registerOnChange to emit changes back to the form
    propagateChange = ( _: any ) => {};

    public writeValue(v: any) {
        if (v) {
            this.lineTypeControl.setValue(v);
        }
    }

    public registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    public registerOnTouched() { }

    ngOnInit() {
        if ( !this.value ) {
            this.value = this.defaultLineType;
            this.propagateChange(this.value);
        }
        this.lineTypeControl = new FormControl( this.value );
        this.subscription = this.lineTypeControl.valueChanges.subscribe( data => {
            this.propagateChange(data);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

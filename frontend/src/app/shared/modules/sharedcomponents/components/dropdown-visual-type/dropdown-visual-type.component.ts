import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'dropdown-visual-type',
  templateUrl: './dropdown-visual-type.component.html',
  styleUrls: ['./dropdown-visual-type.component.scss'],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownVisualTypeComponent),
      multi: true,
    }]
})
export class DropdownVisualTypeComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() value;

    @Output()
    valueChange = new EventEmitter<string>();

    visualTypeOptions: Array<object> = [
        {
            label: 'Line',
            value: 'line'
        },
        {
            label: 'Bar',
            value: 'bar'
        }
    ];

    visualTypeControl: FormControl;
    defaultVisualType = 'line';

    subscription: Subscription;

    constructor() { }

    // the method set in registerOnChange to emit changes back to the form
    propagateChange = ( _: any ) => {};

    public writeValue(v: any) {
        if (v) {
            this.visualTypeControl.setValue(v);
        }
    }

    public registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    public registerOnTouched() { }

    ngOnInit() {
        if ( !this.value ) {
            this.value = this.defaultVisualType;
            this.propagateChange(this.value);
        }
        this.visualTypeControl = new FormControl( this.value );
        this.subscription = this.visualTypeControl.valueChanges.subscribe( data => {
            this.propagateChange(data);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

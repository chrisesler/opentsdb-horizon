import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'dropdown-aggregators',
  templateUrl: './dropdown-aggregators.component.html',
  styleUrls: [],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownAggregatorsComponent),
    multi: true,
  }]
})
export class DropdownAggregatorsComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() value;

    @Output()
    change = new EventEmitter<string>();

    aggregatorOptions: Array<object> = [
        {
            label: 'AVG',
            value: 'avg'
        },
        {
            label: 'MIN',
            value: 'min'
        },
        {
            label: 'MAX',
            value: 'max'
        },
        {
            label: 'SUM',
            value: 'sum'
        }
    ];

    aggregatorControl: FormControl;
    defaultAggregator = 'sum';

    subscription: Subscription;

    constructor() { }

    // the method set in registerOnChange to emit changes back to the form
    propagateChange = ( _: any ) => {};

    public writeValue(v: any) {
        if (v) {
            this.aggregatorControl.setValue(v);
        }
    }

    public registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    public registerOnTouched() { }

    ngOnInit() {
        if ( !this.value ) {
            this.value = this.defaultAggregator;
            this.propagateChange(this.value);
        }
        this.aggregatorControl = new FormControl( this.value );
        this.subscription = this.aggregatorControl.valueChanges.subscribe( data => {
            this.propagateChange(data);
            this.change.emit(data);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

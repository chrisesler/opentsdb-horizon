import { Component, OnInit, OnDestroy, HostBinding, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'dropdown-visual-type',
  templateUrl: './dropdown-visual-type.component.html',
  styleUrls: [],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownVisualTypeComponent),
      multi: true,
    }]
})
export class DropdownVisualTypeComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @HostBinding('class.dropdown-visual-type') private _hostClass = true;

    @Input() value;

    @Output()
    valueChange = new EventEmitter<string>();

    visualTypeOptions: Array<object> = [
        {
            label: 'Line',
            value: 'line',
            icon: 'd-chart-line'
        },
        {
            label: 'Bar',
            value: 'bar',
            icon: 'd-chart-bar-vertical'
        }
    ];

    visualTypeControl: FormControl;
    defaultVisualType = 'line';

    subscription: Subscription;

    get triggerIcon(): string {
        const val: string = this.visualTypeControl.value;
        const obj: any = this.visualTypeOptions.filter(function(opt: any) {
            return opt.value === val;
        });
        return obj[0].icon;
    }

    get triggerLabel(): string {
        const val: string = this.visualTypeControl.value;
        const obj: any = this.visualTypeOptions.filter(function(opt: any) {
            return opt.value === val;
        });
        return obj[0].label;
    }

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

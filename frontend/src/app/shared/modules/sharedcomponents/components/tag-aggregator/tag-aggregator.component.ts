import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'tag-aggregator',
  templateUrl: './tag-aggregator.component.html',
  styleUrls: ['./tag-aggregator.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TagAggregatorComponent),
    multi: true,
  }]
})
export class TagAggregatorComponent implements OnInit {
    @Input() value;
    @Input() exclude = [];

    @Output()
    change = new EventEmitter<string>();

    aggregatorOptions: Array<any> = [
        {
            value: 'unmerge',
            icon : 'unmerge'
        },
        {
            value: 'avg',
            icon : 'avg'
        },
        {
            value: 'min',
            icon: 'min'
        },
        {
            value: 'max',
            icon: 'max'
        },
        {
            value: 'sum',
            icon: 'sum'
        }
    ];

    aggregatorControl: FormControl;
    defaultAggregator = 'um';
    selectedIndex = -1;

    subscription: Subscription;

    constructor() { }

    ngOnInit() {
        if ( !this.value ) {
            this.value = this.defaultAggregator;
        }
        if ( this.exclude.length ) {
            this.aggregatorOptions = this.aggregatorOptions.filter( item => this.exclude.indexOf(item.value) === -1);
        }
        this.setSelectedIndex();
    }

    selectOption(value) {
        this.value = value;
        this.setSelectedIndex();
        this.change.emit(this.value);
    }

    setSelectedIndex() {
        this.selectedIndex = this.aggregatorOptions.findIndex(item => item.value === this.value);
    }
}

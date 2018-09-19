import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

@Component({
  selector: 'dropdown-stacks',
  templateUrl: './dropdown-stacks.component.html',
  styleUrls: ['./dropdown-stacks.component.scss']
})
export class DropdownStacksComponent implements OnInit, OnChanges  {

    @Input() stacks: any[];
    @Input() value;

    @Output()
    change = new EventEmitter<string>();

    oStacks: any = {};

    constructor() { }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges ) {
        if (changes.stacks) {
            for ( let i = 0; i < this.stacks.length; i++ ) {
                const o = this.stacks[i];
                this.oStacks[o.id] = o;
            }
        }

    }

    updateValue(e) {
        this.change.emit(e.value);
    }

}

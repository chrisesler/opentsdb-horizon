import { Component, OnInit, HostBinding, Output, EventEmitter, Input } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'keypad',
    templateUrl: './keypad.component.html',
    styleUrls: []
})
export class KeypadComponent implements OnInit {
    @HostBinding('class.dtp-keypad') private _hostClass = true;

    @Output() amountSelected = new EventEmitter<String>();
    // tslint:disable-next-line:no-inferrable-types
    @Input() disableHighKeys: boolean = true;

    constructor() { }

    ngOnInit() {
    }

    clicked(amount: string) {
        // if(this.disableHighKeys )
        this.amountSelected.emit(amount);
    }
}

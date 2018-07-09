import { Component, OnInit, HostBinding, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'keypad',
  templateUrl: './keypad.component.html',
  styleUrls: []
})
export class KeypadComponent implements OnInit {
  @HostBinding('class.dtp-keypad') private _hostClass = true;
  constructor() { }

  ngOnInit() {
  }

  @Output() amountSelected = new EventEmitter<String>();
  @Input() disableHighKeys: boolean = true;

  clicked(amount: string){
    // if(this.disableHighKeys )
    this.amountSelected.emit(amount);
  }
}

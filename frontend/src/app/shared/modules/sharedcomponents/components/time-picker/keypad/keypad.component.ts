import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'keypad',
  templateUrl: './keypad.component.html',
  styleUrls: ['./keypad.component.scss']
})
export class KeypadComponent implements OnInit {

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

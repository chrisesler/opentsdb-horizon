import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';



@Component({
  selector: 'tag-groupby',
  templateUrl: './tag-groupby.component.html',
  styleUrls: ['./tag-groupby.component.scss']
})
export class TagGroupbyComponent implements OnInit {
  @Input() value;

  @Output()
  change = new EventEmitter<string>();

  groupByOptions: Array<any> = [
      {
        value: true,
        icon : 'unmerge',
        label: 'Un Merge'
      },
      {
        value: false,
        icon : 'merge',
        label: 'Merge'
      }
  ];

  aggregatorControl: FormControl;
  groupBy = false;
  selectedIndex = -1;

  subscription: Subscription;

  constructor() { }

  ngOnInit() {
      if ( !this.value ) {
          this.value = this.groupBy;
      }
      this.setSelectedIndex();
  }

  selectOption(value) {
      this.value = value;
      this.setSelectedIndex();
      this.change.emit(this.value);
  }

  setSelectedIndex() {
      this.selectedIndex = this.groupByOptions.findIndex(item => item.value === this.value);
  }
}

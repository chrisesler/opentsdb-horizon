import { Component, ViewChild, Input, Output, EventEmitter, HostBinding } from '@angular/core';

import { MatMenu, MatMenuTrigger } from '@angular/material';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss']
})
export class ThemePickerComponent {

  @HostBinding('class.app-themepicker') hostClass = true;

  @ViewChild( MatMenuTrigger ) trigger: MatMenuTrigger;

  @Input() theme: string;
  @Output() themeChange = new EventEmitter<string>();

  themeOptions: Array<object> = [
    {
      label: 'Light',
      value: 'default' // light theme
    },
    {
      label: 'Dark',
      value: 'dark'
    },
    {
      label: 'Crazy',
      value: 'crazy'
    }
  ];

  constructor() { }

  selectTheme(item) {
    this.themeChange.emit(item.value);
  }

}

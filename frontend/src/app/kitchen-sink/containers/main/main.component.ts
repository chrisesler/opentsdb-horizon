import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ks-main',
  templateUrl: './main.component.html',
  styleUrls: []
})
export class KSMainComponent implements OnInit {

  @HostBinding('class.ks-main') private hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

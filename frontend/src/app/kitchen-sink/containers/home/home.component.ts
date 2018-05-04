import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ks-home',
  templateUrl: './home.component.html',
  styleUrls: []
})
export class KSHomeComponent implements OnInit {

  @HostBinding('class.ks-home') private hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

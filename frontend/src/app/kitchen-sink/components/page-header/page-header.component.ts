import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ks-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class KSPageHeaderComponent implements OnInit {

  @HostBinding('class.ks-page-header') private hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

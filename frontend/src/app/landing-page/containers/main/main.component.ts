import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'app-landing-page-main',
  templateUrl: './main.component.html',
  styleUrls: []
})
export class LandingPageMainComponent implements OnInit {
  @HostBinding('class.landing-page-main') private _hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

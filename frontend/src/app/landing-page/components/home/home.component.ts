import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'app-landing-page-home',
  templateUrl: './home.component.html',
  styleUrls: []
})
export class LandingPageHomeComponent implements OnInit {
  @HostBinding('class.landing-page-home') private _hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss'
  ]
})
export class AppComponent implements OnInit {
  @HostBinding('class.app-root') hostClass = true;

  title = 'app';

  constructor() {}

  ngOnInit() {
    // TODO: USER THEME PREFERENCE
    // - need to set up some sort of service for user preferences
    // - need to set global theme-class FIRST to avoid flickering of theme change
    //   before theme-picker can set it. Theme-picker may not be best place to
    //   affect the change.
  }

}

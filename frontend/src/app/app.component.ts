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

  ngOnInit() {}

}

import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'ks-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class KSMainComponent implements OnInit {

  @HostBinding('class.ks-main') private hostClass = true;

  constructor() { }

  ngOnInit() {
  }

}

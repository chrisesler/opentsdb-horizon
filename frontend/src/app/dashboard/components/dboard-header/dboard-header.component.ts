import { Component, OnInit, Output, EventEmitter, HostBinding } from '@angular/core';

@Component({
  selector: 'app-dboard-header',
  templateUrl: './dboard-header.component.html',
  styleUrls: ['./dboard-header.component.scss']
})
export class DboardHeaderComponent implements OnInit {
  @HostBinding('class.dashboard-header') private hostClass: Boolean = true;

  @Output() addWidget = new EventEmitter;

  constructor() { }

  ngOnInit() {
  }

  addNewWidget() {
    this.addWidget.emit();
  }

}

import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dboard-header',
  templateUrl: './dboard-header.component.html',
  styleUrls: ['./dboard-header.component.scss']
})
export class DboardHeaderComponent implements OnInit {

  @Output() addWidget = new EventEmitter;

  constructor() { }

  ngOnInit() {
  }

  addNewWidget() {
    this.addWidget.emit();
  }

}


import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-wsample',
  templateUrl: './wsample.component.html',
  styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit {
  @Input() config: any;
  constructor() { }

  ngOnInit() {
  }

}

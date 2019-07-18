import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  selector: 'event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {

  constructor(private util: UtilsService) { }
  @HostBinding('class.event-list') private _componentClass = true;

  @Input() events: any[];
  @Input() timezone: string;
  @Input() startTime: number;
  @Input() endTime: number;

  ngOnInit() {

    if (!this.events) {
      this.events = [];
    }
    if (!this.timezone) {
      this.timezone = 'local';
    }
    if (!this.startTime) {
      this.startTime = 1;
    }
    if (!this.endTime) {
      this.endTime = 1;
    }
  }

}

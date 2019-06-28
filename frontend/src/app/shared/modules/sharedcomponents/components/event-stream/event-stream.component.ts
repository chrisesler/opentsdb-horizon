import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Moment } from 'moment';
import * as moment from 'moment';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'event-stream',
  templateUrl: './event-stream.component.html',
  styleUrls: ['./event-stream.component.scss']
})
export class EventStreamComponent implements OnInit, OnChanges {

  // @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.event-stream') private _componentClass = true;

  @Input() buckets: any[];
  @Input() show: boolean;
  // @Output() updatedFilters: EventEmitter<any> = new EventEmitter();
  @Output() updatedShowing: EventEmitter<boolean> = new EventEmitter();

  constructor(private util: UtilsService) { }

  ngOnInit() {
    if (!this.buckets) {
      this.buckets = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // this.groupEvents();
  }

  hide() {
    this.show = false;
    this.updatedShowing.emit(this.show);
  }

  buildTimeStamp(timestamp: number): string {
    const _moment: Moment = moment(timestamp);
    return _moment.format('YYYY-MM-DD-HH:mm');
  }

  // sortGroupedEvents() {
  //   // sort by timeIntervals
  //   this.groupedEvents.sort(function(a, b) { return b.timeInterval - a.timeInterval; });

  //   // [ {timeInterval: 1, comments: [[]], sdJobs: []}, {timeInterval: 2, sdJobs: []}]
  //   // sort within time intervals
  //   let numberOfGroups = this.groupedEvents.length;
  //   for (let i = 0; i < numberOfGroups; i++) {
  //     for (const [eventType] of Object.entries(this.groupedEvents[i])) {
  //       let _values = this.groupedEvents[i][eventType];
  //       if (eventType.toLowerCase().trim() !== 'timeinterval') {
  //         if (eventType.toLowerCase().trim() === 'comments') {
  //           // TODO - verify this works
  //           _values.sort(function(a, b) { return b.time - a.time; });
  //           this.groupedEvents[i][eventType] = _values;
  //         } else {
  //           _values.sort(function(a, b) { return a.time - b.time; });
  //           this.groupedEvents[i][eventType] = _values;
  //         }
  //       }
  //     }
  //   }
  // }

}

import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Moment } from 'moment';
import * as moment from 'moment';
import { debug } from 'util';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'event-stream',
  templateUrl: './event-stream.component.html',
  styleUrls: ['./event-stream.component.scss']
})
export class EventStreamComponent implements OnInit, OnChanges {

  // @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.event-stream') private _componentClass = true;

  @Input() data: any; // events
  @Input() filters: any;
  @Input() timeInterval: number; // in seconds
  @Input() show: boolean;
  @Output() updatedFilters: EventEmitter<any> = new EventEmitter();
  @Output() updatedShowing: EventEmitter<boolean> = new EventEmitter();

  groupedEvents: any = []; // [ {timeInterval: 1, comments: [[]], sdJobs: []}, {timeInterval: 2, sdJobs: []}]
  // timeIntervalToHumanReadableTimeInterval = {};

  constructor() { }

  ngOnInit() {
    // console.log('**events', this.data);
    // console.log('**grouped events', this.groupedEvents);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.groupEvents();
  }

  showCommentsChanged(comments: boolean) {
    this.filters.showComments = comments;
    this.updatedFilters.emit(this.filters);
  }

  showSDJobsChanged(sdJobs: boolean) {
    this.filters.showSDJobs = sdJobs;
    this.updatedFilters.emit(this.filters);
  }

  hide() {
    this.show = false;
    this.updatedShowing.emit(this.show);
  }


  groupEvents() {
    this.groupedEvents = [];
    // tslint:disable-next-line:prefer-const
    for (let comment of this.data.comments) {
      this.addCommentToGroupedEvents(comment);
    }

    // tslint:disable-next-line:prefer-const
    for (let sdJob of this.data.sdJobs) {
      this.addSDEventToGroupedEvents(sdJob);
    }

    this.sortGroupedEvents();
  }

  buildTimeStamp(timestamp: number): string {
    // tslint:disable-next-line:prefer-const
    let _moment: Moment = moment(timestamp);
    // TODO: moment().startOf()

    if (this.timeInterval >= 60) {
      return _moment.format('YYYYMMDDHHmm');
    } else if (this.timeInterval < 60) {
      return _moment.format('YYYYMMDDHHmmss');
    }
  }

  addSDEventToGroupedEvents(event: any ) {
    this.addEventToGroupedEvents(event, 'sdJobs');
  }

  addCommentToGroupedEvents(event: any) {
    this.addEventToGroupedEvents(event, 'comments');
  }

  addEventToGroupedEvents(event: any, eventType: string) {
    // tslint:disable:prefer-const
    let isComment = (eventType.toLowerCase().trim() === 'comments');
    let eventTimeStamp: number;

    if (isComment) {
      eventTimeStamp = event.originalCommentTime;
    } else {
      eventTimeStamp = event.time;
    }

    // event should be in bounds
    if (eventTimeStamp >= this.filters.startTime && eventTimeStamp <= this.filters.endTime) {

      if (isComment) {
        let timeInterval = this.buildTimeStamp(event.originalCommentTime);
        let timeIndex = this.indexOfTimeInterval(timeInterval);

        if (timeIndex < 0) { // timeInterval does not exist
          this.groupedEvents.push({timeInterval: timeInterval, [eventType]: [[event]]});
        } else { // timeInterval exists
          if (this.groupedEvents[timeIndex][eventType]) { // event type exists => append to existing array
            let threadIndex = - 1;
            let numberOfThreads = this.groupedEvents[timeIndex][eventType].length;

            for (let i = 0; i < numberOfThreads; i++) {
              if (this.groupedEvents[timeIndex][eventType][i].threadId === event.threadId) {
                threadIndex = i;
                break;
              }
              if (threadIndex < 0) { // thread does not exist
                this.groupedEvents[timeIndex][eventType][numberOfThreads] = [event];
              } else { // thread exists
                this.groupedEvents[timeIndex][eventType][threadIndex].push(event);
              }
            }
          } else {  // event type does not exist
            this.groupedEvents[timeIndex][eventType] = [[event]];
          }
        }
      } else { // Event not a comment
        let timeInterval = this.buildTimeStamp(event.time);
        let timeIndex = this.indexOfTimeInterval(timeInterval);

        if (timeIndex < 0) { // timeInterval does not exist
          this.groupedEvents.push({timeInterval: timeInterval, [eventType]: [event]});
        } else { // timeInterval exists
          if (this.groupedEvents[timeIndex][eventType]) { // event type exists => append to existing array
            this.groupedEvents[timeIndex][eventType].push(event);
          } else {  // event type does not exist
            this.groupedEvents[timeIndex][eventType] = [event];
          }
        }
      }
    }
  }

  sortGroupedEvents() {
    // sort by timeIntervals
    this.groupedEvents.sort(function(a, b) { return b.timeInterval - a.timeInterval; });

    // [ {timeInterval: 1, comments: [[]], sdJobs: []}, {timeInterval: 2, sdJobs: []}]
    // sort within time intervals
    let numberOfGroups = this.groupedEvents.length;
    for (let i = 0; i < numberOfGroups; i++) {
      for (const [eventType] of Object.entries(this.groupedEvents[i])) {
        let _values = this.groupedEvents[i][eventType];
        if (eventType.toLowerCase().trim() !== 'timeinterval') {
          if (eventType.toLowerCase().trim() === 'comments') {
            // TODO - verify this works
            _values.sort(function(a, b) { return b.time - a.time; });
            this.groupedEvents[i][eventType] = _values;
          } else {
            _values.sort(function(a, b) { return a.time - b.time; });
            this.groupedEvents[i][eventType] = _values;
          }
        }
      }
    }
  }

  indexOfTimeInterval(timeInterval) {
    let index = -1;
    this.groupedEvents.forEach(function (value, i) {
      if (value.timeInterval.trim() === timeInterval.trim()) {
        index = i;
      }
    });
    return index;
  }

  // TODO sort grouped events

}

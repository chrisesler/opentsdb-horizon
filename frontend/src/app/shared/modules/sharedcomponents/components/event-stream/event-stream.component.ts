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
  @HostBinding('class.event-stream') private _componentClass = true;

  @Input() buckets: any[];
  @Input() show: boolean;
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

}

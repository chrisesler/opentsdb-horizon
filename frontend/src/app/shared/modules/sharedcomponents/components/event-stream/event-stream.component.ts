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
  @Input() startTime: number;  // in milliseconds
  @Input() endTime: number;    // in miliseconds
  @Input() timezone: string;
  @Input() expandedBucketIndex: number;
  @Output() updatedShowing: EventEmitter<boolean> = new EventEmitter();

  bucketPanelState: boolean[] = [];

  constructor(private util: UtilsService) { }

  ngOnInit() {
    if (!this.buckets) {
      this.buckets = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.buckets && changes.buckets.currentValue.length !== this.bucketPanelState.length) {
      this.initializeAndCollapsePanels();
    }
    if (changes && changes.expandedBucketIndex) {
      this.initializeAndCollapsePanels();
      this.updateExpansion(this.expandedBucketIndex, true);
    }
  }

  hide() {
    this.initializeAndCollapsePanels();
    this.show = false;
    this.updatedShowing.emit(this.show);
  }

  updateExpansion(index, expanded) {
    this.bucketPanelState[index] = expanded;
  }

  initializeAndCollapsePanels() {
    for (let i = 0; i < this.buckets.length; i++) {
      this.bucketPanelState[i] = false;
    }
  }

}

import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
  @Input() endTime: number;    // in milliseconds
  @Input() timezone: string;
  @Input() expandedBucketIndex: number;

  @Output() updatedShowing: EventEmitter<boolean> = new EventEmitter();
  @Output() updatedExpandedBucketIndex: EventEmitter<number> = new EventEmitter();

  constructor(private util: UtilsService) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    // tslint:disable-next-line:max-line-length
    if (changes && changes.buckets
      && changes.buckets.currentValue && changes.buckets.previousValue
      && changes.buckets.previousValue.length !== changes.buckets.currentValue.length) {
      this.collapseExpansion();
    }
    if (changes && changes.expandedBucketIndex && changes.expandedBucketIndex.currentValue !== this.expandedBucketIndex) {
      this.openExpansion(this.expandedBucketIndex);
    }
  }

  hide() {
    this.collapseExpansion();
    this.show = false;
    this.updatedShowing.emit(this.show);
  }

  openExpansion(index) {
    this.expandedBucketIndex = index;
    this.updatedExpandedBucketIndex.emit(this.expandedBucketIndex);
  }

  collapseExpansion(index: number = -1) {
    // an expansion panel can call collapse after a different panel has been opened
    if (index === -1 || index === this.expandedBucketIndex) {
      this.expandedBucketIndex = -1;
      this.updatedExpandedBucketIndex.emit(this.expandedBucketIndex);
    }
  }

}

import { Component, OnInit, ViewChild, ElementRef, HostBinding, Input, Output, EventEmitter,
  OnChanges, SimpleChanges } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'event-timeline',
  templateUrl: './event-timeline.component.html',
  styleUrls: ['./event-timeline.component.scss']
})

export class EventTimelineComponent implements OnInit, OnChanges {
  @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.event-timeline') private _componentClass = true;

  // @Input() editMode: boolean;
  // @Input() widget: WidgetModel;

  @Input() startTime: number;
  @Input() endTime: number;
  @Input() width: number;
  @Input() events: any;
  @Input() toolTipHeightFromTop: any; // pixels from top of widget
  @Input() timezone: string;

  @Output() canvasClicked: EventEmitter<any> = new EventEmitter();
  @Output() timeInterval: EventEmitter<number> = new EventEmitter();
  @Output() newBuckets: EventEmitter<any[]> = new EventEmitter();
  @Output() bucketClicked: EventEmitter<any> = new EventEmitter();

  @ViewChild('eventsOverlayCanvas') eventsOverlayCanvas: ElementRef;
  context: CanvasRenderingContext2D;

  eventLocations: any = [];
  iconWidth = 10.1; // pixels
  buckets = [];
  toolTipData: any = {};
  maxTooltipSourceSummaries = 3;

  constructor(private util: UtilsService) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.drawEvents();
    if (changes['width'] || changes['startTime'] || changes['endTime']) {
      let num = this.endTime - this.startTime;
      num = num / this.width;
      this.timeInterval.emit(num);
    }
  }

  drawEvents() {
    // manually set width
    (<HTMLCanvasElement>this.eventsOverlayCanvas.nativeElement).width = this.width;

    this.context = (<HTMLCanvasElement>this.eventsOverlayCanvas.nativeElement).getContext('2d');
    this.eventLocations = [];

    if (this.events) {
      this.buckets = this.util.getEventBuckets(this.startTime, this.endTime, this.width / this.iconWidth, this.events);

      // tslint:disable:prefer-const
      for (let i = 0; i < this.buckets.length; i++) {
        if (this.buckets[i].startTime >= this.startTime && this.buckets[i].startTime <= this.endTime) {
          let xStart = (this.buckets[i].endTime - this.startTime) * this.getEventResolution();
          if (i === 0) { // if last bucket, take start + interval - remember that first bucket is latest time
            xStart = (this.buckets[i].startTime + this.buckets[i].width - this.startTime) * this.getEventResolution();
          }
          this.drawEvent(xStart, 'lightblue', this.buckets[i]);
        }
      }
      this.newBuckets.emit(this.buckets);
    }
  }

  getPlaceholderText(bucket) {
    let placeholder = '';
    for (let event of bucket.events) {
      placeholder = placeholder + event.title + '\n';
    }
    placeholder = placeholder.trim();
    return placeholder;
  }

  getBucketSummary(bucket): any[] {
    let summaries = []; // [[source, count]]
    let sourceToCount = new Map();

    // get the counts per source
    for (let event of bucket.events) {
      if (sourceToCount.has(event.source)) {
        let count = sourceToCount.get(event.source) + 1;
        sourceToCount.set(event.source, count);
      } else {
        sourceToCount.set(event.source, 1);
      }
    }

    // order the map by count, put in array
    let sortedSourceAndCount = Array.from(sourceToCount).sort((a, b) => {
      // a[0], b[0] is the key of the map
      return a[0] - b[0];
    });

    // fill up summaries
    let i = 0;
    while (i < this.maxTooltipSourceSummaries - 1 && i < sortedSourceAndCount.length) {
      summaries.push(sortedSourceAndCount[i]);
      i++;
    }

    // determine if 'more' bucket is needed
    if (sortedSourceAndCount.length < this.maxTooltipSourceSummaries) {
      // do nothing
    } else if (sortedSourceAndCount.length === this.maxTooltipSourceSummaries) {
      summaries.push(sortedSourceAndCount[i]);
    } else {
      let count = 0;
      for (i; i < sortedSourceAndCount.length; i++ ) {
        count = sortedSourceAndCount[i][1] + count;
      }
      summaries.push(['more', count]);
    }

    return summaries;
  }

  getEventResolution() {
    return this.width / (this.endTime - this.startTime);
  }

  drawEvent(xStart, color, bucket) {
    const count = bucket.events.length;
    this.context.beginPath();
    this.context.strokeStyle = color;
    this.context.fillStyle = 'lightblue';
    this.context.fillRect(xStart - 5, 0, 10, 10);
    this.context.stroke();
    this.eventLocations.push({xStart: (xStart - 5), xEnd: (xStart - 5) + 10 + 5, yStart: 5 - 5, yEnd: 5 + 10 + 5,
      bucket: bucket });
    if (count > 1) { // draw number in box
      this.context.fillStyle = 'black';
      this.context.fillText(count.toString(), (xStart - 2), 9);
    }
  }

  canvasEnter(event: any) {
    this.drawEvents();
    let xCoord = event.offsetX;
    let yCoord = event.offsetY;
    let hoveredOverIcon = false;

    // send event for tooltip
    for (let eventLocation of this.eventLocations) {
      if (xCoord >= eventLocation.xStart &&
        xCoord <= eventLocation.xEnd &&
        yCoord >= eventLocation.yStart &&
        yCoord <= eventLocation.yEnd) {
          this.toolTipData = {bucket: eventLocation.bucket, xCoord: xCoord + 45 + 'px', yCoord: yCoord };
          hoveredOverIcon = true;
          break;
      }
    }
    if (!hoveredOverIcon) {
      this.toolTipData = {bucket: null, xCoord: null, yCoord: null };
    }
  }

  canvasLeave(event: any) {
    this.toolTipData = {bucket: null, xCoord: null, yCoord: null };
    this.drawEvents();
  }

  receivedDateWindow(dateWindow: any) {
    this.startTime = dateWindow.startTime;
    this.endTime = dateWindow.endTime;
    // this.drawEvents();
  }

  clicked(event: any) {
    // todo: enable at later time (when it makes sense to click on event stream, but not an event)
    // this.canvasClicked.emit();

    let xCoord = event.offsetX;
    let yCoord = event.offsetY;

    // send event for tooltip
    let index = 0;
    for (let eventLocation of this.eventLocations) {
      if (xCoord >= eventLocation.xStart &&
        xCoord <= eventLocation.xEnd &&
        yCoord >= eventLocation.yStart &&
        yCoord <= eventLocation.yEnd) {
          this.bucketClicked.emit(index);
          break;
      }
      index++;
    }


  }

}

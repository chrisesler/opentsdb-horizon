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

  @Output() canvasClicked: EventEmitter<any> = new EventEmitter();
  @Output() timeInterval: EventEmitter<number> = new EventEmitter();
  @Output() newBuckets: EventEmitter<any[]> = new EventEmitter();

  @ViewChild('eventsOverlayCanvas') eventsOverlayCanvas: ElementRef;
  context: CanvasRenderingContext2D;

  eventLocations: any = [];
  showComments = true;
  showSDJobs = false;
  iconWidth = 10.1; // pixels
  buckets = [];

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
    this.buckets = this.util.getEventBuckets(this.startTime, this.endTime, this.width / this.iconWidth, this.events);

    // tslint:disable:prefer-const
    for (let i = 0; i < this.buckets.length; i++) {
      if (this.buckets[i].startTime >= this.startTime && this.buckets[i].startTime <= this.endTime) {
        let xStart = (this.buckets[i].endTime - this.startTime) * this.getEventResolution();
        if (i === 0) { // if last bucket, take start + interval - remember that first bucket is latest time
          xStart = (this.buckets[i].startTime + this.buckets[i].width - this.startTime) * this.getEventResolution();
        }
        this.drawEvent(xStart, 'lightblue', this.buckets[i].events.length, this.getPlaceholderText(this.buckets[i]));
      }
    }
    this.newBuckets.emit(this.buckets);
  }

  getPlaceholderText(bucket) {
    let placeholder = '';
    for (let event of bucket.events) {
      placeholder = placeholder + event.title + ' ';
    }
    return placeholder;
  }

  getEventResolution() {
    return this.width / (this.endTime - this.startTime);
  }

  drawEvent(xStart, color, count, placeholder) {
    this.context.beginPath();
    this.context.strokeStyle = color;
    this.context.fillStyle = 'lightblue';
    this.context.fillRect(xStart - 5, 0, 10, 10);
    this.context.stroke();
    this.eventLocations.push({xStart: (xStart - 5 - 5), xEnd: (xStart - 5) + 10 + 5, yStart: 5 - 5, yEnd: 5 + 10 + 5,
      placeholder: placeholder });
    if (count > 1) { // draw number in box
      this.context.fillStyle = 'black';
      this.context.fillText(count.toString(), (xStart - 2), 9);
    }
  }

  canvasEnter(event: any) {
    this.drawEvents();
    let xCoord = event.offsetX;
    let yCoord = event.offsetY;

    // add tooltip
    for (let eventLocation of this.eventLocations) {
      if (xCoord >= eventLocation.xStart &&
        xCoord <= eventLocation.xEnd &&
        yCoord >= eventLocation.yStart &&
        yCoord <= eventLocation.yEnd) {
          this.context.fillStyle = 'black';
          this.context.fillText(eventLocation.placeholder, eventLocation.xStart + 20, 15);
          break;
      }
    }
  }

  canvasLeave(event: any) {
    this.drawEvents();
  }

  receivedDateWindow(dateWindow: any) {
    this.startTime = dateWindow.startTime;
    this.endTime = dateWindow.endTime;
    // this.drawEvents();
  }

  clicked() {
    this.canvasClicked.emit();
  }

}

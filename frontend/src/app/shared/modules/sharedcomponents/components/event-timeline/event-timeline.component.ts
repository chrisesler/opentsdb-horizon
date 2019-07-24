import {
    Component, OnInit, ViewChild, ElementRef, HostBinding, Input, Output, EventEmitter,
    OnChanges, SimpleChanges
} from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';
import * as deepEqual from 'deep-equal';

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
    iconWidth = 25; // pixels
    buckets = [];
    toolTipData: any = {};
    maxTooltipSourceSummaries = 3;
    iconColor = '#44BCB7';
    eventRunnerColor = '#E1E5E5';

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

        this.context.beginPath();
        this.context.strokeStyle = this.eventRunnerColor;
        this.context.fillStyle = this.eventRunnerColor;
        this.context.fillRect(0, 5, this.width, 10);
        this.context.stroke();

        if (this.events) {
            const oldBuckets = { ...this.buckets };
            this.buckets = this.util.getEventBuckets(this.startTime, this.endTime, this.width / this.iconWidth, this.events);

            // tslint:disable:prefer-const
            for (let i = 0; i < this.buckets.length; i++) {
                if (this.buckets[i].startTime >= this.startTime && this.buckets[i].startTime <= this.endTime) {
                    let xStart = (this.buckets[i].endTime - this.startTime) * this.getEventResolution();
                    if (i === 0) { // if last bucket, take start + interval - remember that first bucket is latest time
                        xStart = (this.buckets[i].startTime + this.buckets[i].width - this.startTime) * this.getEventResolution();
                    }
                    this.drawEvent(xStart, this.iconColor, this.buckets[i]);
                }
            }

            if (!deepEqual(oldBuckets, this.buckets)) {
                this.newBuckets.emit(this.buckets);
            }
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
            for (i; i < sortedSourceAndCount.length; i++) {
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
        this.context.arc(xStart, 10, 10, 0, 2 * Math.PI);
        this.context.fillStyle = this.iconColor;
        this.context.fill();
        // this.context.fillRect(xStart - 10, 0, 20, 20); // icons 20px squares
        this.context.stroke();
        this.eventLocations.push({
            xStart: (xStart - 10), xEnd: (xStart + 10), yStart: 0, yEnd: 20,
            bucket: bucket
        });
        // draw number in box
        this.context.fillStyle = 'black';
        if (count.toString().length === 2) {
            this.context.fillText(count.toString(), xStart - 6, 12);
        } else if (count.toString().length > 2) {
            this.context.fillText('*', xStart - 3, 12);
        } else { // center single digit
            this.context.fillText(count.toString(), xStart - 3, 12);
        }
    }

    canvasEnter(event: any) {
        let xCoord = event.offsetX;
        let yCoord = event.offsetY;
        let hoveredOverIcon = false;

        // send event for tooltip
        for (let eventLocation of this.eventLocations) {
            if (xCoord >= eventLocation.xStart &&
                xCoord <= eventLocation.xEnd &&
                yCoord >= eventLocation.yStart &&
                yCoord <= eventLocation.yEnd) {
                this.toolTipData = { bucket: eventLocation.bucket, xCoord: xCoord + 45 + 'px', yCoord: yCoord };
                hoveredOverIcon = true;
                break;
            }
        }
        if (!hoveredOverIcon) {
            this.toolTipData = { bucket: null, xCoord: null, yCoord: null };
        }
    }

    canvasLeave(event: any) {
        this.toolTipData = { bucket: null, xCoord: null, yCoord: null };
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

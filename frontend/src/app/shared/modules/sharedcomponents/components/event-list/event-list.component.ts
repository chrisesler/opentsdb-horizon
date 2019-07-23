import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'event-list',
    templateUrl: './event-list.component.html',
    styleUrls: []
})
export class EventListComponent implements OnInit {
    @HostBinding('class.event-list') private _componentClass = true;

    @Input() events: any[];
    @Input() timezone: string;
    @Input() startTime: number;
    @Input() endTime: number;
    @Input() previewLimit: number;

    constructor(
        private util: UtilsService
    ) { }

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

    slicedList() {
        if (Number.isInteger(this.previewLimit) && this.events.length - 1 > this.previewLimit ) {
            return this.events.slice(0, this.previewLimit);
        } else {
            return this.events;
         }
      }
}

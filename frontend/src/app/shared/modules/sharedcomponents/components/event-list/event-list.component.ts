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
    @Input() loading: boolean;
    @Input() error: string;

    expandedBucketIndex = -1;

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
        if (Number.isInteger(this.previewLimit) && this.events.length - 1 > this.previewLimit && this.previewLimit > 0 ) {
            return this.events.slice(0, this.previewLimit);
        } else {
            return this.events;
         }
      }

    openExpansion(index) {
        this.expandedBucketIndex = index;
    }

    // accodion closes
    collapseExpansion(index: number = -1) {
        // an expansion panel can call collapse after a different panel has been opened
        if (index === -1 || index === this.expandedBucketIndex) {
            this.expandedBucketIndex = -1;
        }
    }

    getTags(tags) {
        const arr = this.util.transformTagMapToArray(tags);
        const sArr = arr.sort(function(a, b) {
            if (a['key'] > b['key']) {
                return 1;
            } else if (b['key'] > a['key']) {
                return -1;
            } else {
                return 0;
            }
        });
        return sArr;
    }
}

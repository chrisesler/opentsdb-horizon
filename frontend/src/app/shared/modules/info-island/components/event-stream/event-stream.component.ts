import { Component, OnInit, HostBinding, Input, OnChanges, SimpleChanges, OnDestroy, Inject } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

import { Subscription } from 'rxjs';
// import { LoggerService } from '../../../../../core/services/logger.service';
import { IntercomService } from '../../../../../core/services/intercom.service';
import { ISLAND_DATA } from '../../info-island.tokens';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'event-stream',
    templateUrl: './event-stream.component.html',
    styleUrls: ['./event-stream.component.scss']
})
export class EventStreamComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.event-stream') private _componentClass = true;

    @Input() buckets: any[] = [];
    // @Input() show: boolean;
    @Input() startTime: number;  // in milliseconds
    @Input() endTime: number;    // in milliseconds
    @Input() timezone: string;
    @Input() expandedBucketIndex: number;

    // @Output() updatedShowing: EventEmitter<boolean> = new EventEmitter();
    // @Output() updatedExpandedBucketIndex: EventEmitter<number> = new EventEmitter();

    expandedEventId = -1;  // for expanding details

    private subscription: Subscription = new Subscription();

    constructor(
        private util: UtilsService,
        // private logger: LoggerService,
        private interCom: IntercomService,
        @Inject(ISLAND_DATA) private _data: any
    ) {

        this.subscription.add(_data.data.buckets$.pipe(distinctUntilChanged()).subscribe( buckets => {
            // this.logger.log('BUCKETS RECEIVED', {buckets});
            this.buckets = buckets;
        }));

        this.subscription.add(_data.data.expandedBucketIndex$.pipe(distinctUntilChanged()).subscribe( index => {
            // this.logger.log('SELECTED BUCKET INDEX RECEIVED', {index});
            this.expandedBucketIndex = index;
        }));

        this.subscription.add(_data.data.timeRange$.subscribe( time => {
            // this.logger.log('TIME RANGE RECEIVED', {time});
            this.startTime = time.startTime;
            this.endTime = time.endTime;
        }));

        this.subscription.add(_data.data.timezone$.subscribe( timezone => {
            // this.logger.log('TIME ZONE RECEIVED', {timezone});
            this.timezone = timezone;
        }));
    }

    ngOnInit() { }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

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

    /*hide() {
        this.collapseExpansion();
        this.show = false;
        this.updatedShowing.emit(this.show);
    }*/

    // Accordion opens
    openExpansion(index) {
        // this.expandedBucketIndex = index;
        // this.updatedExpandedBucketIndex.emit(this.expandedBucketIndex);
        this.interCom.responsePut({
            action: 'UpdateExpandedBucketIndex',
            id: this._data.originId,
            payload: {
                index
            }
        });
    }

    // accodion closes
    collapseExpansion(index: number = -1) {
        // an expansion panel can call collapse after a different panel has been opened
        if (index === -1 || index === this.expandedBucketIndex) {
            // this.expandedBucketIndex = -1;
            // this.updatedExpandedBucketIndex.emit(this.expandedBucketIndex);

            this.interCom.responsePut({
                action: 'UpdateExpandedBucketIndex',
                id: this._data.originId,
                payload: {
                    index: -1
                }
            });
        }
    }

    openDetails(id) {
        this.expandedEventId = id;
    }

    closeDetails(id: number = -1) {
        if (id === -1 || id === this.expandedEventId) {
            this.expandedEventId = -1;
        }
    }

}

import { Component, OnInit , HostBinding, Input, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { Subscription, Observable } from 'rxjs';
import { Store, Select } from '@ngxs/store';
import { UtilsService } from '../../../../../core/services/utils.service';
import { DateUtilsService } from '../../../../../core/services/dateutils.service';

@Component({
  selector: 'app-events-widget',
  templateUrl: './events-widget.component.html',
  styleUrls: ['./events-widget.component.scss']
})
export class EventsWidgetComponent implements OnInit, OnDestroy, OnChanges {
  @HostBinding('class.events-widget') private _componentClass = true;

  constructor(  private interCom: IntercomService,
                private store: Store,
                private util: UtilsService,
                private dateUtil: DateUtilsService,
                private cdRef: ChangeDetectorRef) {  }

  /** Inputs */
  @Input() editMode: boolean;
  @Input() widget: any; // includes query

  /** Local Variables */
  events: any[];
  startTime: number;
  endTime: number;
  timezone: string;

  // state control
  isDataRefreshRequired = false;
  private listenSub: Subscription;

  ngOnInit() {

    this.widget = {... this.util.setDefaultEventsConfig(this.widget, true)};
    this.getEvents();

    this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
      console.log('&', message, this.widget.id);

      switch ( message.action ) {
        case 'TimeChanged':
          this.getEvents();
          break;
      }

      if (message && (message.id === this.widget.id)) {
        switch (message.action) {
          case 'getUpdatedWidgetConfig': // called when switching to presentation view
            this.widget = message.payload.widget;
            break;
          case 'updatedEvents':
            this.events = message.payload.events;
            this.timezone = message.payload.time.zone;
            this.startTime = this.dateUtil.timeToMoment(message.payload.time.start, this.timezone).unix() * 1000;
            this.endTime = this.dateUtil.timeToMoment(message.payload.time.end, this.timezone).unix() * 1000;
            break;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes) {
    //   this.store.dispatch(new GetEvents(this.widget.query));
    // }
  }

  textChanged(txt: string) {
    this.widget.eventQuery = txt;
    this.getEvents();
  }

  getEvents() {
      this.interCom.requestSend({
        id: this.widget.id,
        action: 'getEventData',
        payload: this.widget
    });
  }

  applyConfig() {
    const cloneWidget = { ...this.widget };
    cloneWidget.id = cloneWidget.id.replace('__EDIT__', '');
    this.interCom.requestSend({
        action: 'updateWidgetConfig',
        id: cloneWidget.id,
        payload: { widget: cloneWidget, isDataRefreshRequired: this.isDataRefreshRequired }
    });
    this.closeViewEditMode();
  }

  closeViewEditMode() {
    this.interCom.requestSend({
        action: 'closeViewEditMode',
        payload: 'dashboard'
    });
  }

  ngOnDestroy() {
    this.listenSub.unsubscribe();
  }

  updateConfig(message) {
    switch ( message.action ) {
        // case 'SetMetaData':
        //     this.setMetaData(message.payload.data);
        //     break;
    }
}

}

import { Component, OnInit , HostBinding, Input, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { Subscription, Observable } from 'rxjs';
import { EventsState, GetEvents } from '../../../../../dashboard/state/events.state';
import { Store, Select } from '@ngxs/store';

@Component({
  selector: 'app-events-widget',
  templateUrl: './events-widget.component.html',
  styleUrls: ['./events-widget.component.scss']
})
export class EventsWidgetComponent implements OnInit, OnDestroy, OnChanges {
  @HostBinding('class.events-widget') private _componentClass = true;

  constructor( private interCom: IntercomService, private store: Store) {  }
  /** Inputs */
  @Input() editMode: boolean;
  @Input() widget: any; // includes query
  events: any[];

  isDataRefreshRequired = false;
  private listenSub: Subscription;

  // state control
  private eventsSub: Subscription;
  // private lastUpdatedEventsSub: Subscription;
  @Select(EventsState.GetEvents) _events$: Observable<any>;
  // @Select(RecipientsState.GetLastUpdated) _recipientLastUpdated$: Observable<any>;

  ngOnInit() {

    if (!this.widget.eventQuery) {
      this.widget.eventQuery = 'namespace = *';
    }
    this.store.dispatch(new GetEvents(this.widget.eventQuery));
    this.eventsSub = this._events$.subscribe(data => {
      if (data) {
        this.events = [];
        const _data = JSON.parse(JSON.stringify(data));
        this.events = _data.events;
      }
  });

    this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
      if (message && (message.id === this.widget.id)) {
        switch (message.action) {
          case 'getUpdatedWidgetConfig': // called when switching to presentation view
                this.widget = message.payload.widget;
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
    this.store.dispatch(new GetEvents(this.widget.eventQuery));
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
    this.eventsSub.unsubscribe();
  }

  updateConfig(message) {
    console.log(message);
    switch ( message.action ) {
        // case 'SetMetaData':
        //     this.setMetaData(message.payload.data);
        //     break;
    }
}

}

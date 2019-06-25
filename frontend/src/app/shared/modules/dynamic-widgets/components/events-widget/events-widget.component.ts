import { Component, OnInit , HostBinding, Input, OnDestroy} from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-events-widget',
  templateUrl: './events-widget.component.html',
  styleUrls: ['./events-widget.component.scss']
})
export class EventsWidgetComponent implements OnInit, OnDestroy {
  @HostBinding('class.events-widget') private _componentClass = true;

  constructor( private interCom: IntercomService) {  }
  /** Inputs */
  @Input() editMode: boolean;
  @Input() widget: any;
  data: any;

  // query

  isDataRefreshRequired = false;
  private listenSub: Subscription;

  events = [
    {
      title: 'Event 1'
    },
    {
      title: 'Event 2'
     },
    {
      title: 'Event 3'
    }];

  ngOnInit() {

    if (!this.widget.query) {
      this.widget.query = 'namespace = *';
    }

    console.log(this.widget);

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

  textChanged(txt: string) {
    this.widget.query = txt;
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

}

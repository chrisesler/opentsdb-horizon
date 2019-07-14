import { Component, OnInit, OnDestroy, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'widget-config-events',
  templateUrl: './widget-config-events.component.html',
  styleUrls: ['./widget-config-events.component.scss']
})
export class WidgetConfigEventsComponent implements OnInit {

  @HostBinding('class.widget-config-events') private _hostClass = true;


  constructor() { }

      /** Inputs */
      @Input() widget: any;

      /** Outputs */
      @Output() widgetChange = new EventEmitter;

      /** Local variables */
      formGroups: FormGroup;
      formGroupSub: Subscription;

  ngOnInit() {

    if (!this.widget.eventQueries) {
      this.widget.eventQueries = [];
      this.widget.eventQueries[0] = {
        namespace: 'Yamas',
        search: 'priority:high'
      };
    }

    if (this.widget.settings.visual.showEvents === undefined) {
      this.widget.settings.visual.showEvents = false;
    }

    console.log(this.widget);

    // if (!this.widget.eventQuery) {
    //   this.widget.eventQuery = [{namespace: 'Yamas', search: 'priority:high'}];
    // }
  }

  eventQueryChanged(txt: string) {
    this.widget.eventQueries[0].search = txt;
    // this.store.dispatch(new GetEvents(this.widget.eventQuery));
    // this.widgetChange.emit( {action: 'SetEventQuery', payload: [{namespace: this.order, search: this.limit}] );
  }

  showEventsChanged(events: boolean) {
    this.widget.settings.visual.showEvents = events;
    // todo dispatch
  }

// todo unsubscribe

}

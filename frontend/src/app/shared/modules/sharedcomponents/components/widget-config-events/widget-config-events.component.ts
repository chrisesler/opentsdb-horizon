import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

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
      @Input() allowEventToggling: boolean;

      /** Outputs */
      @Output() widgetChange = new EventEmitter;

  ngOnInit() {

    if (this.allowEventToggling === undefined) {
      this.allowEventToggling = true;
    }

    if (!this.widget.eventQueries) {
      this.widget.eventQueries = [];
      this.widget.eventQueries[0] = {
        namespace: '',
        search: ''
      };
    }

    if (!this.widget.eventQueries[0].namespace && this.widget.queries && this.widget.queries[0] && this.widget.queries[0].namespace) {
      this.widget.eventQueries[0].namespace = this.widget.queries[0].namespace;
    }

    if (this.widget.settings.visual.showEvents === undefined) {
      this.widget.settings.visual.showEvents = false;
    }

  }

  eventQueryChanged(txt: string) {
    this.widget.eventQueries[0].search = txt;
    this.widgetChange.emit( {action: 'SetEventQuery', payload: {eventQueries: this.widget.eventQueries}});
  }

  showEventsChanged(events: boolean) {
    this.widget.settings.visual.showEvents = events;
    this.widgetChange.emit( {action: 'SetShowEvents', payload: {showEvents: events} } );
  }

  saveNamespace(namespace) {
    this.widget.eventQueries[0].namespace = namespace;
    this.widgetChange.emit( {action: 'SetEventQuery', payload: {eventQueries: this.widget.eventQueries}});
  }

  cancelSaveNamespace(event) {
    // console.log(event);
  }

}

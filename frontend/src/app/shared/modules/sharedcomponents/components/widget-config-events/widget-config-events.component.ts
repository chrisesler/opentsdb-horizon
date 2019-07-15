import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'widget-config-events',
  templateUrl: './widget-config-events.component.html',
  styleUrls: ['./widget-config-events.component.scss']
})
export class WidgetConfigEventsComponent implements OnInit {

  @HostBinding('class.widget-config-events') private _hostClass = true;


  constructor( private util: UtilsService) { }
      /** Inputs */
      @Input() widget: any;
      @Input() allowEventToggling: boolean;

      /** Outputs */
      @Output() widgetChange = new EventEmitter;

  ngOnInit() {

    if (this.allowEventToggling === undefined) {
      this.allowEventToggling = true;
    }

    this.widget = this.util.setDefaultEventsConfig(this.widget, false);

    if (!this.widget.eventQueries[0].namespace && this.widget.queries && this.widget.queries[0] && this.widget.queries[0].namespace) {
      this.widget.eventQueries[0].namespace = this.widget.queries[0].namespace;
    }

    if (this.widget.settings.visual.showEvents === undefined) {
      this.widget.settings.visual.showEvents = false;
    }

  }

  eventQueryChanged(search: string) {
    this.widgetChange.emit( {action: 'SetEventQuerySearch', payload: {search: search}});
  }

  showEventsChanged(events: boolean) {
    this.widgetChange.emit( {action: 'SetShowEvents', payload: {showEvents: events} } );
  }

  saveNamespace(namespace: string) {
    this.widgetChange.emit( {action: 'SetEventQueryNamespace', payload: {namespace: namespace}});
  }

  cancelSaveNamespace(event) {
    // console.log(event);
  }

}

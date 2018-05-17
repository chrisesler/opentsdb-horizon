import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  HostBinding,
  EventEmitter,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-widget-base',
  templateUrl: './widgetbase.component.html',
  styleUrls: ['./widgetbase.component.scss']
})
export class WidgetbaseComponent implements OnInit, OnChanges {
  @HostBinding('class.widget-panel-content') private _hostClass = true;

  @Input() editMode: boolean;
  @Input() widget: any;

  constructor() { }

  ngOnInit() {
    console.log('WBASE :: onInit', this.widget);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('***** CHANGES *******', changes);
  }

}

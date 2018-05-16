import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  KeyValueDiffers,
  ElementRef,
  Input,
  Output,
  HostBinding,
  EventEmitter,
  SimpleChanges
} from '@angular/core';

import { ChartBase } from './chartbase';
import { IntercomService, IMessage } from '../../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'line-chart',
  templateUrl: './chartbase.component.html',
  styleUrls: ['./chartbase.component.scss']
})
export class LineChartComponent extends ChartBase implements OnInit, OnDestroy, OnChanges {
  @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.widget-edit-mode') private _editMode = false;

  @Input() editMode: any = { 'showConfig': false } ;
  @Input() widget: any;

  listenSub: Subscription;
  lineDefaultOptions: object = {
    elements: {
      line: {
        tension: 0,
        borderWidth: 1,
        bezierCurve: false,
        fill: false
      },
      point: {
        radius: 0,
        borderWidth: 0
      }
    },
    zoom: {
      mode: 'x|y',
      enabled: true
    },
    scales: {
      xAxes: [{
        type: 'time',
        display: true
      }],
      yAxes: [{
        type: 'linear',
        position: 'left',
      }]
    }
  };

  constructor(element: ElementRef, differs: KeyValueDiffers, private interCom: IntercomService) {
    super(element, differs);
    this.type = 'line';
    this.defaultOptions = Object.assign(this.defaultOptions, this.lineDefaultOptions);
  }

  ngOnInit() {
    super.ngOnInit();

    this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
      console.log('message', message, this.widget);

      if (message && message.id === this.widget.id) {
        switch (message.action) {
          case 'resizeWidget':
            this.setSize(message.payload.width - 30 + 'px', message.payload.height - 60 + 'px');
            return;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('widget chanages', changes);
  }

  ngOnDestroy() {
    this.listenSub.unsubscribe();
  }
}

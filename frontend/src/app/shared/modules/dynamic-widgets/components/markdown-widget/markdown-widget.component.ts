import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { IntercomService } from '../../../../../core/services/intercom.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'markdown-widget',
  templateUrl: './markdown-widget.component.html',
  styleUrls: []
})
export class MarkdownWidgetComponent implements OnInit {
  @HostBinding('class.markdown-widget') private _hostClass = true;

  constructor( private interCom: IntercomService) {  }
  /** Inputs */
  @Input() editMode: boolean;
  @Input() widget: any;

  markedText: string = '[Im an inline-style link](https://www.google.com)';
  isDataRefreshRequired = false;

  ngOnInit() {
  }

  textChanged(txt: string) {
    this.markedText = txt;
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
}

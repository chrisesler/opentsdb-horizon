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

  markedText: string = ''; // = '[Im an inline-style link](https://www.google.com)';
  isDataRefreshRequired = false;

  ngOnInit() {
    if (this.widget.settings.visual.text) {
      this.markedText = this.widget.settings.visual.text;
    }

    if (!this.widget.settings.visual.backgroundColor) {
      this.widget.settings.visual.backgroundColor = '#FFFFFF';
    }

    if (!this.widget.settings.visual.font) {
      this.widget.settings.visual.font = 'default';
    }

  }

  textChanged(txt: string) {
    this.markedText = txt;
    this.widget.settings.visual.text = txt;
  }

  updateConfig(message) {
    switch ( message.action ) {
        // case 'SetTimeConfiguration':
        //     this.setTimeConfiguration(message.payload.data);
        //     this.isDataRefreshRequired = true;
        //     break;
        // case 'SetMetaData':
        //     this.setMetaData(message.payload.data);
        //     break;
        case 'SetVisualization':
            this.setVisualization(message.payload.data);
            // this.refreshData(false);
            break;
        // case 'SetSelectedQuery':
        //     this.setSelectedQuery(message.payload.data);
        //     break;
        // case 'UpdateQuery':
        //     this.updateQuery(message.payload);
        //     this.widget.queries = [...this.widget.queries];
        //     this.refreshData();
        //     this.isDataRefreshRequired = true;
        //     break;
        // case 'SetQueryEditMode':
        //     this.editQueryId = message.payload.id;
        //     break;
        // case 'CloseQueryEditMode':
        //     this.editQueryId = null;
        //     break;
        // case 'ToggleQueryMetricVisibility':
        //     this.toggleQueryMetricVisibility(message.id, message.payload.mid);
        //     this.widget.queries = this.util.deepClone(this.widget.queries);
        //     break;
        // case 'DeleteQueryMetric':
        //     this.deleteQueryMetric(message.id, message.payload.mid);
        //     this.widget.queries = this.util.deepClone(this.widget.queries);
        //     this.refreshData();
        //     this.isDataRefreshRequired = true;
        //     break;
        // case 'DeleteQueryFilter':
        //     this.deleteQueryFilter(message.id, message.payload.findex);
        //     this.widget.queries = this.util.deepClone(this.widget.queries);
        //     this.refreshData();
        //     this.isDataRefreshRequired = true;
        //     break;
    }
}

setVisualization( vconfigs ) {
  this.widget.settings.visual = { ...vconfigs};
  console.log('new vis', this.widget.settings.visual);
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

import { Component, OnInit, Input, HostBinding } from '@angular/core';

import { IntercomService, IMessage } from '../../../dashboard/services/intercom.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'close-edit-view',
  templateUrl: './close-edit-view.component.html',
  styleUrls: []
})
export class CloseEditViewComponent implements OnInit {
  @HostBinding('class.nav-close-edit-view') private _hostClass = true;

  constructor(private interCom: IntercomService) {
  }

  ngOnInit() {
  }

  closeViewEditMode() {
    this.interCom.requestSend(<IMessage>{
      action: 'viewEditMode',
      payload: false
    });
  }

}

import { Component, OnInit, HostBinding } from '@angular/core';
import { IntercomService, IMessage } from '../../../dashboard/services/intercom.service';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'add-new-panel',
  templateUrl: './add-new-panel.component.html',
  styleUrls: []
})
export class AddNewPanelComponent implements OnInit {
  @HostBinding('class.nav-add-new-panel') private _hostClass = true;

  constructor(private interCom: IntercomService) { }

  ngOnInit() {
  }

  insertDashboardPanel() {
    console.log('CLICK::INSERT DASHBOARD PANEL');
    this.interCom.requestSend(<IMessage>{
      action: 'addNewWidget',
      payload: true
    });
  }

}

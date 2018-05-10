import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef  } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;

  @ViewChild('testTmpl') testTmpl: TemplateRef<any>;

  listenSub: Subscription;
  dashboard: any;
  // widgets: Array<any>;
  viewEditMode = false;
  // hasHeader: boolean;
  rerender: any = {'reload': false};


  constructor(
    private interCom: IntercomService,
    private dbService: DashboardService,
    private cdkService: CdkService
  ) { }

  ngOnInit() {
      // this.hasHeader = true;
      this.dashboard = this.dbService.dashboard;
      console.log('dash', this.dashboard);
      // this.widgets = this.dashboard.widgets;
      // ready to handle request from children of DashboardModule
      this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
        console.log('listen to: ', JSON.stringify(message));

        if (message.action === 'viewEditMode') {
          // this.hasHeader = !message.payload;
          this.viewEditMode = message.payload;
        }
        if (message.action === 'addNewWidget') {
          this.addNewWidget();
        }
      });

      this.cdkService.setNavbarPortal(new TemplatePortal(this.testTmpl, undefined, {}));

   }

   addNewWidget() {
     this.dbService.addNewWidget();
     this.rerender = {'reload': true};
   }

   ngOnDestroy() {
     this.listenSub.unsubscribe();
   }

   /*dashboardHasHeaderChange(value: any) {
      this.hasHeader = value;
   }*/

   cdkTest() {
     console.log('CDK TEST');
     this.cdkService.setNavbarPortal(null);
     //this.cdkService.setNavbarPortal(new TemplatePortal(this.testTmpl, undefined, {}));

     
   }

}

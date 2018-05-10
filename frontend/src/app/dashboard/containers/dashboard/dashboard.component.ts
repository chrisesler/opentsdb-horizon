import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectionStrategy  } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LoadDashboard } from '../../state/dashboard.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;

  // @Select((state: any) => state.dashboardState.widgets)
  // widgets$: Observable<any[]>;
  @ViewChild('testTmpl') testTmpl: TemplateRef<any>;

  listenSub: Subscription;
  widgets$: Observable<any>;
  viewEditMode = false;
  rerender: any = {'reload': false};
  constructor(
      private store: Store, 
      private interCom: IntercomService, 
      private dbService: DashboardService,
      private cdkService: CdkService
  ) { 
    this.widgets$ = this.store.select(state => state.dashboardState.widgets);
  }

  ngOnInit() {
    console.log('snapshot', this.store.snapshot());
    
      // this.hasHeader = true;
      // this.dashboard = this.dbService.dashboard;
      // console.log('dash', this.dashboard);
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
      this.store.dispatch(new LoadDashboard('xyz'));
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

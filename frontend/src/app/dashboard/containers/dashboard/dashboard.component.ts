import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectionStrategy  } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { DashboardState } from '../../state/dashboard.state';
import { Observable } from 'rxjs';
import * as dashboardActions from '../../state/dashboard.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;
  @ViewChild('testTmpl') testTmpl: TemplateRef<any>;

  //@Select(DashboardState.getWidgets) widgets$: Observable<any>;
  @Select(state => state.dashboardState.widgets) widgets$: Observable<any>;

  listenSub: Subscription;
  viewEditMode = false;
  rerender: any = {'reload': false};
  // need this?
  widgets: any[] = [];
  constructor(
      private store: Store, 
      private interCom: IntercomService, 
      private dbService: DashboardService,
      private cdkService: CdkService
  ) {}

  ngOnInit() {
    console.log('snapshot', this.store.snapshot());
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
      this.store.dispatch(new dashboardActions.LoadDashboard('xyz'));
      this.widgets$.subscribe(widgets => { 
        this.widgets = widgets;       
      });
      this.cdkService.setNavbarPortal(new TemplatePortal(this.testTmpl, undefined, {}));

   }

   // this will call based on gridster reflow and size changes
   widgetsLayoutUpdate(widgets: any[]) {
     this.store.dispatch(new dashboardActions.UpdateWidgetsLayout({widgets}));
     // we the broadcast new dimention down to them for resizing
     for (let i = 0; i < widgets.length; i++) {
      this.interCom.responsePut({ 
        id: widgets[i].id,
        action: "resizeWidget",
        payload: widgets[i].clientSize}
      );
     }
   }

   addNewWidget() {
     this.widgets = this.dbService.addNewWidget(this.widgets);
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

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
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;

  // portal templates
  @ViewChild('addDashboardPanelTmpl') addDashboardPanelTmpl: TemplateRef<any>;
  @ViewChild('editViewModeTmpl') editViewModeTmpl: TemplateRef<any>;

  // portal placeholders
  addDashboardPanelPortal: TemplatePortal;
  editViewModePortal: TemplatePortal;

  //
  listenSub: Subscription;
  widgets$: Observable<any>;
  viewEditMode: any = {'visible': false};
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
      // setup portals
      this.addDashboardPanelPortal = new TemplatePortal(this.addDashboardPanelTmpl, undefined, {});
      this.cdkService.setAddNewDashboardPanelPortal(this.addDashboardPanelPortal);

      this.editViewModePortal = new TemplatePortal(this.editViewModeTmpl, undefined, {});
      this.cdkService.setEditViewModePortal(this.editViewModePortal);

      // ready to handle request from children of DashboardModule
      this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
      //  console.log('listen to: ', JSON.stringify(message));

        switch (message.action) {
            case 'viewEditMode':
              this.viewEditMode = message.payload;
              break;
            case 'addNewWidget':
              this.addNewWidget();
              break;
            default:
              break;
        }
      });

      this.store.dispatch(new LoadDashboard('xyz'));
   }

   ngOnDestroy() {
     this.listenSub.unsubscribe();
   }

  // navbar portal item behaviors
  addNewWidget() {
    this.dbService.addNewWidget();
    this.rerender = { 'reload': true };
  }

  closeViewEditMode() {
    this.viewEditMode = {'visible': false};
  }

}

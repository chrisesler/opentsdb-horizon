import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { DashboardState } from '../../state/dashboard.state';
import { AuthState } from '../../../shared/state/auth.state';
import { Observable } from 'rxjs';
import * as dashboardActions from '../../state/dashboard.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;
  // @Select(state => state.dashboardState.widgets) widgets$: Observable<any>;
  @Select(DashboardState.getWidgets) widgets$: Observable<any>;
  @Select(DashboardState.setViewEditMode) viewEditMode$: Observable<boolean>;
  @Select(AuthState.getAuth) auth$: Observable<string>;

  // portal templates
  @ViewChild('dashboardNameTmpl') dashboardNameTmpl: TemplateRef<any>;
  @ViewChild('addDashboardPanelTmpl') addDashboardPanelTmpl: TemplateRef<any>;
  @ViewChild('editViewModeTmpl') editViewModeTmpl: TemplateRef<any>;

  // portal placeholders
  dashboardNamePortal: TemplatePortal;
  addDashboardPanelPortal: TemplatePortal;
  editViewModePortal: TemplatePortal;

  // other variables
  listenSub: Subscription;
  rerender: any = { 'reload': false }; // -> make gridster re-render correctly
  widgets: any[] = [];

  constructor(
    private store: Store,
    private interCom: IntercomService,
    private dbService: DashboardService,
    private cdkService: CdkService
  ) { }

  ngOnInit() {
    // setup portals
    this.dashboardNamePortal = new TemplatePortal(this.dashboardNameTmpl, undefined, {});
    this.cdkService.setDashboardNamePortal(this.dashboardNamePortal);

    this.addDashboardPanelPortal = new TemplatePortal(this.addDashboardPanelTmpl, undefined, {});
    this.cdkService.setAddNewDashboardPanelPortal(this.addDashboardPanelPortal);

    this.editViewModePortal = new TemplatePortal(this.editViewModeTmpl, undefined, {});
    this.cdkService.setEditViewModePortal(this.editViewModePortal);

    // ready to handle request from children of DashboardModule
    this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
      //  console.log('listen to: ', JSON.stringify(message));
      switch (message.action) {
        case 'viewEditMode':
          this.store.dispatch(new dashboardActions.SetViewEditMode(message.payload));
          break;
        case 'addNewWidget':
          this.addNewWidget();
          break;
        default:
          break;
      }
    });
    this.store.dispatch(new dashboardActions.LoadDashboard('xyz'));
    this.widgets$.subscribe(widgets => {
      this.widgets = widgets;
    });
    this.auth$.subscribe(auth => {
        console.log("auth=", auth);
        if (auth === "invalid") {
            console.log("open auth dialog");
        }
    });
  }

  // this will call based on gridster reflow and size changes
  widgetsLayoutUpdate(widgets: any[]) {
    this.store.dispatch(new dashboardActions.UpdateWidgetsLayout({ widgets }));
    // we the broadcast new dimention down to them for resizing
    for (let i = 0; i < widgets.length; i++) {
      this.interCom.responsePut({
        id: widgets[i].id,
        action: 'resizeWidget',
        payload: widgets[i].clientSize
      }
      );
    }
  }

  addNewWidget() {
    this.widgets = this.dbService.addNewWidget(this.widgets);
    this.rerender = { 'reload': true };
  }

  closeViewEditMode() {
    this.store.dispatch(new dashboardActions.SetViewEditMode(false));
    this.rerender = { 'reload': true };
  }

  ngOnDestroy() {
    this.listenSub.unsubscribe();
  }
}

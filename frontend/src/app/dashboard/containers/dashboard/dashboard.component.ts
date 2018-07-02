import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
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
    @Select(DashboardState.setViewEditMode) viewEditMode$: Observable<any>;
    @Select(AuthState.getAuth) auth$: Observable<string>;
    @Select(DashboardState.getUpdatedWidgetId) updatedWidgetId$: Observable<string>;

    // portal templates
    @ViewChild('dashboardNavbarTmpl') dashboardNavbarTmpl: TemplateRef<any>;

    // portal placeholders
    dashboardNavbarPortal: TemplatePortal;

    // other variables
    listenSub: Subscription;
    rerender: any = { 'reload': false }; // -> make gridster re-render correctly
    widgets: any[] = [];
    viewEditMode: boolean = false;

    constructor(
        private store: Store,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private cdkService: CdkService
    ) { }

    ngOnInit() {
        // setup navbar portal
        this.dashboardNavbarPortal = new TemplatePortal(this.dashboardNavbarTmpl, undefined, {});
        this.cdkService.setNavbarPortal(this.dashboardNavbarPortal);

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
                case 'removeWidget':
                    this.store.dispatch(new dashboardActions.RemoveWidget(message.payload));
                    break;
                case 'closeViewEditMode':
                    this.closeViewEditMode(message.payload);
                    break;
                case 'getQueryData':
                    this.store.dispatch(new dashboardActions.GetQueryData(message.id, message.payload));
                    break;
                default:
                    break;
            }
        });
        // passing dashboard to load
        this.store.dispatch(new dashboardActions.LoadDashboard('xyz'));
        // after success loaded dashboard, assigned widgets
        this.widgets$.subscribe(widgets => {
            this.widgets = widgets;
        });
        // when an widget is updated by getting raw data, based on its component type
        // we need to transform data to its data format to required format of wdget visualization to render
        // transormation can be done here in dashboad service and passing back to data.
        // or should it be done when setting state?
        this.updatedWidgetId$.subscribe(wid => {
            for (let i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].id === wid) {
                    this.interCom.responsePut({
                        id: wid,
                        action: 'updatedWidget',
                        payload: this.widgets[i]
                    });
                    break;
                }
            }
        });
        // sending down view edit mode to handle size
        this.viewEditMode$.subscribe(payload => {            
            this.viewEditMode = payload.editMode;
                this.interCom.responsePut({
                id: payload.widgetId,
                action: 'viewEditWidgetMode',
                payload: payload
                
            });
        });

        this.auth$.subscribe(auth => {
            console.log('auth=', auth);
            if (auth === 'invalid') {
                console.log('open auth dialog');
            }
        });
    }

    // this will call based on gridster reflow and size changes event
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

    closeViewEditMode(payload) {
        this.store.dispatch(new dashboardActions.SetViewEditMode(payload));
        this.rerender = { 'reload': true };
    }

    // save dashboard name
    saveDashboardName(event: any) {
        console.log('dashboard name save', event);
        
    }

    ngOnDestroy() {
        this.listenSub.unsubscribe();
    }
}

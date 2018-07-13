import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { DashboardState } from '../../state/dashboard.state';
import { AuthState } from '../../../shared/state/auth.state';
import { Observable } from 'rxjs';
import { ISelectedTime } from '../../../shared/modules/date-time-picker/models/models';
import * as dashboardActions from '../../state/dashboard.actions';

import { MatMenu, MatMenuTrigger } from '@angular/material';

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

    // dashboard action menu trigger
    @ViewChild(MatMenuTrigger) actionMenuTrigger: MatMenuTrigger;

    // portal templates
    @ViewChild('dashboardNavbarTmpl') dashboardNavbarTmpl: TemplateRef<any>;

    // portal placeholders
    dashboardNavbarPortal: TemplatePortal;

    // other variables
    listenSub: Subscription;
    private routeSub: Subscription;
    dbid: string; // passing dashboard id
    wid: string; // passing widget id
    rerender: any = { 'reload': false }; // -> make gridster re-render correctly
    widgets: any[] = [];
    // tslint:disable-next-line:no-inferrable-types
    viewEditMode: boolean = false;
    hexColor: string = "#000000" //"20,50,70";

    constructor(
        private store: Store,
        private route: ActivatedRoute,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private cdkService: CdkService
    ) { }

    ngOnInit() {
        // handle route
        this.routeSub = this.route.params.subscribe(params => {
            // route to indicate create a new dashboard
            if (params['dbid']) {
                this.dbid = params['dbid'];
                if (this.dbid === '_new_') {
                    console.log('creating a new dashboard...');
                    const newdboard = this.dbService.getDashboardPrototype();
                    this.store.dispatch(new dashboardActions.CreateNewDashboard(newdboard));
                } else {
                    // load provided dashboard id, and need to handdle not found too
                    this.store.dispatch(new dashboardActions.LoadDashboard(this.dbid));
                }
            }
        });
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
                case 'removeWidget':
                    this.store.dispatch(new dashboardActions.RemoveWidget(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'closeViewEditMode':
                    this.store.dispatch(new dashboardActions.SetViewEditMode(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'getQueryData':
                    this.store.dispatch(new dashboardActions.GetQueryData(message.id, message.payload));
                    break;
                default:
                    break;
            }
        });

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

    /**
     * Behaviors
     */

    // event emit to add new widget from dashboard header
    addNewWidget() {
        const payload = { widget: this.dbService.getWidgetPrototype() };
        this.store.dispatch(new dashboardActions.AddWidget(payload));
        // trigger Update Widget layout event
        this.rerender = { 'reload': true };
    }

    // save dashboard name
    saveDashboardName(event: any) {
        console.log('dashboard name save', event);
    }

    timeUpdated(selectedTime: ISelectedTime) {
        console.log(selectedTime);
    }

    click_cloneDashboard(event: any) {
        console.log('EVT: CLONE DASHBOARD', event);
    }

    click_shareDashboard(event: any) {
        console.log('EVT: SHARE DASHBOARD', event);
    }

    click_deleteDashboard(event: any) {
        console.log('EVT: DELETE DASHBOARD', event);
    }

    /**
     * On Destroy
     */

    clickedOut(event) {
        console.log(event);
    }

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.routeSub.unsubscribe();
    }
}

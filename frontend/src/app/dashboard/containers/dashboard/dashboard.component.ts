import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';
import { QueryService } from '../../../core/services/query.service';

import * as moment from 'moment';
import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { AuthState } from '../../../shared/state/auth.state';
import { Observable } from 'rxjs';
import { ISelectedTime } from '../../../shared/modules/date-time-picker/models/models';
import { DateUtilsService } from '../../../core/services/dateutils.service';
import { DBState, LoadDashboard } from '../../state/dashboard.state';
import { WidgetsState, LoadWidgets, UpdateGridPos, UpdateWidget, WidgetModel} from '../../state/widgets.state';
import { WidgetsRawdataState, GetQueryDataByGroup } from '../../state/widgets-data.state';
import { ClientSizeState, UpdateGridsterUnitSize } from '../../state/clientsize.state';
import {
    DBSettingsState,
    UpdateMode,
    UpdateDashboardTime,
    LoadDashboardSettings,
    UpdateDashboardTimeZone
} from '../../state/settings.state';

import { MatMenu, MatMenuTrigger, MenuPositionX, MenuPositionY } from '@angular/material';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

    @HostBinding('class.app-dashboard') private hostClass = true;

    @Select(AuthState.getAuth) auth$: Observable<string>;
    // new state
    @Select(DBState.getLoadedDB) loadedRawDB$: Observable<any>;
    @Select(DBSettingsState.getDashboardTime) dbTime$: Observable<any>;
    @Select(WidgetsState.getWigets) widgets$: Observable<WidgetModel[]>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdata) widgetRawData$: Observable<any>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdataByGroup) widgetGroupRawData$: Observable<any>;
    @Select(ClientSizeState.getUpdatedGridsterUnitSize) gridsterUnitSize$: Observable<any>;
    @Select(DBSettingsState.GetDashboardMode) dashboardMode$: Observable<string>;

    // available widgets menu trigger
    @ViewChild('availableWidgetsMenuTrigger', {read: MatMenuTrigger}) availableWidgetsMenuTrigger: MatMenuTrigger;

    get availableWidgetsMenuIsOpen(): boolean {
        if (this.availableWidgetsMenuTrigger) {
            return this.availableWidgetsMenuTrigger.menuOpen;
        }
        return false;
    }

    // dashboard action menu trigger
    /*@ViewChild('actionMenuTrigger', {read: MatMenuTrigger}) actionMenuTrigger: MatMenuTrigger;

    get actionMenuIsOpen(): boolean {
        if (this.actionMenuTrigger) {
            return this.actionMenuTrigger.menuOpen;
        }
        return false;
    }*/

    // portal templates
    @ViewChild('dashboardNavbarTmpl') dashboardNavbarTmpl: TemplateRef<any>;

    // portal placeholders
    dashboardNavbarPortal: TemplatePortal;

    menuXAlignValue: MenuPositionX = 'before';

    // Available Widget Types
    /**
     *  NOTE: at some point we might want to think about adding this to some config setup
     * */
    availableWidgetTypes: Array<object> = [
        {
            label: 'Bar Graph',
            type: 'WidgetBarGraphComponent',
            iconClass: 'widget-icon-bar-graph'
        },
        {
            label: 'Area Graph',
            type: 'WidgetAreaGraphComponent',
            iconClass: 'widget-icon-area-graph'
        },
        {
            label: 'Line Chart',
            type: 'LineChartComponent',
            iconClass: 'widget-icon-line-chart'
        },
        {
            label: 'Big Number',
            type: 'WidgetBigNumberComponent',
            iconClass: 'widget-icon-big-number'
        },
        {
            label: 'Donut Chart',
            type: 'WidgetDonutChartComponent',
            iconClass: 'widget-icon-donut-chart'
        },
        {
            label: 'Statuses',
            type: 'WidgetStatusComponent',
            iconClass: 'widget-icon-statuses'
        }
    ];

    // other variables
    dbTime: any;
    listenSub: Subscription;
    private routeSub: Subscription;
    dbid: string; // passing dashboard id
    wid: string; // passing widget id
    rerender: any = { 'reload': false }; // -> make gridster re-render correctly
    widgets: any[] = [];
    // tslint:disable-next-line:no-inferrable-types
    viewEditMode: boolean = false;

    constructor(
        private store: Store,
        private route: ActivatedRoute,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private cdkService: CdkService,
        private queryService: QueryService,
        private dateUtil: DateUtilsService
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
                    const settings = {
                                        title: 'untitled dashboard',
                                        mode: 'dashboard',
                                        time: { start: '1h', end: 'now', zone: 'local' }
                                    };
                    this.store.dispatch(new LoadDashboardSettings(settings));
                    // this.store.dispatch(new dashboardActions.CreateNewDashboard(newdboard));
                } else {
                    // load provided dashboard id, and need to handdle not found too
                    // this.store.dispatch(new dashboardActions.LoadDashboard(this.dbid));
                    this.store.dispatch(new LoadDashboard(this.dbid));
                }
            }
        });
        // setup navbar portal
        this.dashboardNavbarPortal = new TemplatePortal(this.dashboardNavbarTmpl, undefined, {});
        this.cdkService.setNavbarPortal(this.dashboardNavbarPortal);

        // ready to handle request from children of DashboardModule
        this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
            switch (message.action) {
                case 'getWidgetCachedData':
                    // taking the cached raw data
                    // we suffix original widget id with __EDIT__ (8 chars)
                    const wid = message.id.substring(8, message.id.length);
                    const widgetCachedData = this.store.selectSnapshot(WidgetsRawdataState.getWidgetRawdataByID(wid));
                    this.updateWidgetGroup(message.id, widgetCachedData);
                    break;
                case 'updateDashboardMode':
                    // when click on view/edit mode, update db setting state of the mode
                    this.store.dispatch(new UpdateMode(message.payload));
                    break;
                case 'removeWidget':
                    // this.store.dispatch(new dashboardActions.RemoveWidget(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'closeViewEditMode':
                    this.store.dispatch(new UpdateMode(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'getQueryData':
                    console.log('the query: ', message.payload);
                    // payload needs to break into group to send in
                    this.handleQueryPayload(message);
                    break;
                case 'updateWidgetConfig':
                    this.store.dispatch(new UpdateWidget(message.payload));
                    // many way to handle this, but we should do with the way
                    // store suppose to work.
                    // const updatedWidget = this.store.selectSnapshot(WidgetsState.getUpdatedWidget(message.payload.id));
                    // console.log('getting updated widget', message.payload, updatedWidget);

                    this.interCom.responsePut({
                        id: message.payload.id,
                        action: 'getUpdatedWidgetConfig',
                        payload: message.payload
                    });
                    break;
                default:
                    break;
            }
        });

        this.loadedRawDB$.subscribe( db => {
            this.store.dispatch(new LoadDashboardSettings(db.settings));
            // update WidgetsState
            this.store.dispatch(new LoadWidgets(db.widgets));
        });

        this.dbTime$.subscribe ( t => {
            console.log('___DBTIME___', JSON.stringify(this.dbTime), JSON.stringify(t));

            if ( this.dbTime && this.dbTime.zone !== t.zone ) {
                this.interCom.responsePut({
                    action: 'TimezoneChanged',
                    payload: t
                });
            } else {
                this.interCom.responsePut({
                    action: 'reQueryData',
                    payload: t
                });
            }
            this.dbTime = t;
        });


        this.widgetRawData$.subscribe(result => {

        });

        this.widgetGroupRawData$.subscribe(result => {
            if (result !== undefined) {
                const grawdata = {};
                grawdata[result.gid] = result.rawdata;
                this.updateWidgetGroup(result.wid, grawdata);
            }
        });

        // all widgets should update their own size
        this.gridsterUnitSize$.subscribe( unitSize => {
            this.interCom.responsePut({
                action: 'resizeWidget',
                payload: unitSize
            });
        });

        this.auth$.subscribe(auth => {
            console.log('auth$ calling', auth);
            if (auth === 'invalid') {
                console.log('open auth dialog');
            }
        });
    }

    // to passing raw data to widget
    updateWidgetGroup(wid, rawdata) {
        this.interCom.responsePut({
            id: wid,
            action: 'updatedWidgetGroup',
            payload: {
                        rawdata: rawdata,
                        timezone: this.dbTime.zone
                    }
        });
    }

    // dispatch payload query by group
    handleQueryPayload(message: any) {

        console.log('query message', message);

        let groupid = '';
        const payload = message.payload;
        const dt = this.getDashboardDateRange();

        // sending each group to get data.
        for (let i = 0; i < payload.query.groups.length; i++) {
            const group: any = payload.query.groups[i];
            groupid = group.id;

            const query = this.queryService.buildQuery(payload, dt, group.queries);
            console.log('the group query', query);
            const gquery = {
                wid: message.id,
                gid: groupid,
                query: query
            };
            // now dispatch request
            this.store.dispatch(new GetQueryDataByGroup(gquery));
        }
    }

    getDashboardDateRange() {
        const dbSettings = this.store.selectSnapshot(DBSettingsState);
        const startTime = this.dateUtil.timeToMoment(dbSettings.time.start, dbSettings.time.zone);
        const endTime = this.dateUtil.timeToMoment(dbSettings.time.end, dbSettings.time.zone);

        return {start: startTime.valueOf() , end: endTime.valueOf()};
    }

    // this will call based on gridster reflow and size changes event
    widgetsLayoutUpdate(gridLayout: any) {
        if (gridLayout.clientSize) {
            this.store.dispatch(new UpdateGridsterUnitSize(gridLayout.clientSize));
        }
        if (gridLayout.wgridPos) {
            this.store.dispatch(new UpdateGridPos(gridLayout.wgridPos));
        }
    }

    // event emit to add new widget from dashboard header
    addNewWidget(selectedWidget: any) {
        console.log('%cADD NEW WIDGET', 'color: white; background-color: blue; font-weight: bold;', selectedWidget);
        const payload = { widget: this.dbService.getWidgetPrototype() };
        // this.store.dispatch(new dashboardActions.AddWidget(payload));
        // trigger Update Widget layout event
        this.rerender = { 'reload': true };
    }

    onDateChange(date: any) {
        console.log(date);
    }

    // save dashboard name
    saveDashboardName(event: any) {
        console.log('dashboard name save', event);
    }

    setDateRange(e: any) {
        this.store.dispatch(new UpdateDashboardTime({start: e.startTimeDisplay, end: e.endTimeDisplay}));
    }

    setTimezone(e) {
        this.store.dispatch(new UpdateDashboardTimeZone(e));
    }

    /*click_cloneDashboard(event: any) {
        console.log('EVT: CLONE DASHBOARD', event);
    }

    click_shareDashboard(event: any) {
        console.log('EVT: SHARE DASHBOARD', event);
    }

    click_deleteDashboard(event: any) {
        console.log('EVT: DELETE DASHBOARD', event);
    }*/

    receiveDashboardAction(event: any) {
        console.log('%cNAVBAR:DashboardAction', 'color: #ffffff; background-color: purple; padding: 2px 4px;', event);
    }

    click_availableWidgetsTrigger() {
        console.log('EVT: AVAILABLE WIDGETS TRIGGER', this.availableWidgetsMenuTrigger);
    }

    click_refreshDashboard() {
        console.log('EVT: REFRESH DASHBOARD');
    }

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.routeSub.unsubscribe();
        // we need to clear dashboard state
        // this.store.dispatch(new dashboardActions.ResetDashboardState);
    }
}

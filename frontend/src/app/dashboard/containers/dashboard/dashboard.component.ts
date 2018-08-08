import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { AuthState } from '../../../shared/state/auth.state';
import { Observable } from 'rxjs';
import { ISelectedTime } from '../../../shared/modules/date-time-picker/models/models';

import { DBState, LoadDashboard } from '../../state/dashboard.state';
import { WidgetsState, LoadWidgets, UpdateGridPos, WidgetModel} from '../../state/widgets.state';
import { WidgetsRawdataState, GetQueryDataByGroup } from '../../state/widgets-data.state';
import { ClientSizeState, UpdateGridsterUnitSize } from '../../state/clientsize.state';
import { DBSettingsState, UpdateMode} from '../../state/settings.state';

import { MatMenu, MatMenuTrigger } from '@angular/material';

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
    @Select(WidgetsState.getWigets) widgets$: Observable<WidgetModel[]>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdata) widgetRawData$: Observable<any>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdataByGroup) widgetGroupRawData$: Observable<any>;
    @Select(ClientSizeState.getUpdatedGridsterUnitSize) gridsterUnitSize$: Observable<any>;
    @Select(DBSettingsState.GetDashboardMode) dashboardMode$: Observable<string>;
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
                    //this.store.dispatch(new dashboardActions.CreateNewDashboard(newdboard));
                } else {
                    // load provided dashboard id, and need to handdle not found too
                    //this.store.dispatch(new dashboardActions.LoadDashboard(this.dbid));
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
                    let wid = message.id.substring(8, message.id.length);
                    let widgetCachedData = this.store.selectSnapshot(WidgetsRawdataState.getWidgetRawdataByID(wid));
                    this.updateWidgetGroup(message.id, widgetCachedData);              
                    break;
                case 'updateDashboardMode':
                    // when click on view/edit mode, update db setting state of the mode
                    this.store.dispatch(new UpdateMode(message.payload));
                    break;
                case 'removeWidget':
                    //this.store.dispatch(new dashboardActions.RemoveWidget(message.payload));
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
                default:
                    break;
            }
        });
        
        this.loadedRawDB$.subscribe( db => {
            // update WidgetsState
            this.store.dispatch(new LoadWidgets(db.widgets));
        });

        this.widgetRawData$.subscribe(result => {
    
                   
        });

        this.widgetGroupRawData$.subscribe(result => {
            if (result !== undefined) {
                let grawdata = {};
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
            payload: rawdata
        });
    }

    // dispatch payload query by group
    handleQueryPayload(message: any) {
        let groupid = '';
        let payload = message.payload;
        
        for (let i = 0; i < payload.groups.length; i++) {
            let group: any = payload.groups[i];            
            groupid = group.id;
            // format for opentsdb query
            let query: any = {
                start: payload.start,
                end: payload.end,
                downsample: payload.downsample,
                queries: group.queries
            };
            console.log('the group query', query);   
            let gquery = {
                wid: message.id,
                gid: groupid,
                query: query
            };       
            // now dispatch request
            this.store.dispatch(new GetQueryDataByGroup(gquery));
        }
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
    addNewWidget() {
        const payload = { widget: this.dbService.getWidgetPrototype() };
        //this.store.dispatch(new dashboardActions.AddWidget(payload));
        // trigger Update Widget layout event
        this.rerender = { 'reload': true };
    }

    // save dashboard name
    saveDashboardName(event: any) {
        console.log('dashboard name save', event);
    }

    eventTriggered(event: any) {
        console.log(event);
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

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.routeSub.unsubscribe();
        // we need to clear dashboard state
        //this.store.dispatch(new dashboardActions.ResetDashboardState);    
    }
}

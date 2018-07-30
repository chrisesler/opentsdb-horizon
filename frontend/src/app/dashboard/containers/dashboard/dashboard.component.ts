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
            //  console.log('listen to: ', JSON.stringify(message));
            switch (message.action) {
                case 'viewEditMode':
                    //this.store.dispatch(new dashboardActions.SetViewEditMode(message.payload));
                    break;
                case 'removeWidget':
                    //this.store.dispatch(new dashboardActions.RemoveWidget(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'closeViewEditMode':
                    //this.store.dispatch(new dashboardActions.SetViewEditMode(message.payload));
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
                this.interCom.responsePut({
                    id: result.wid,
                    action: 'updatedWidgetGroup',
                    payload: { 
                        gid: result.gid, 
                        rawdata: result.rawdata
                    }
                }); 
            }           
        });

        // all widgets should update their own size
        this.gridsterUnitSize$.subscribe( unitSize => {
            this.interCom.responsePut({
                action: 'resizeWidget',
                payload: unitSize
            });
        });

        // after success loaded dashboard, assigned widgets
        /*
        this.widgets$.subscribe(widgets => {
            console.log('widgets$ is calling');   
            this.widgets = widgets;
        });
        */
        // when an widget is updated by getting raw data, based on its component type
        // we need to transform data to its data format to required format of wdget visualization to render
        // transormation can be done here in dashboad service and passing back to data.
        // or should it be done when setting state?
        /*
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
        */
       // when the data is updated, store will update, we use this selector to listen to
       // update from store after getting data for each group, at this point return rawdata
       // is already added to state
       /*
       this.updatedWidgetGroup$.subscribe(wg => {
            console.log('updateWidgetGroup$ calling', wg);
           // only ask widget to tranform data if they not did it yes
           if (wg.widgetId && wg.widgetId !== '' && wg.groupId && wg.groupId !== '') {
            for (let i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].id === wg.widgetId) {
                    this.interCom.responsePut({
                     id: wg.widgetId,
                     action: 'updatedWidgetGroup',
                     payload: wg.groupId
                    });
                    break;
                }
            }
           }
       });
       */
        // sending down view edit mode to handle size
        /*
        this.viewEditMode$.subscribe(payload => {
            console.log('viewEditMode$ calling', payload);
            this.viewEditMode = payload.editMode;
                this.interCom.responsePut({
                id: payload.widgetId,
                action: 'viewEditWidgetMode',
                payload: payload
            });
        });
        */
        this.auth$.subscribe(auth => {
            console.log('auth$ calling', auth);
            if (auth === 'invalid') {
                console.log('open auth dialog');
            }
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

    ngOnDestroy() {
        this.listenSub.unsubscribe();
        this.routeSub.unsubscribe();
        // we need to clear dashboard state
        //this.store.dispatch(new dashboardActions.ResetDashboardState);    
    }
}

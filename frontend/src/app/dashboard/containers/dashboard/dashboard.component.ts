import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectorRef, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplatePortal } from '@angular/cdk/portal';

import { CdkService } from '../../../core/services/cdk.service';
import { QueryService } from '../../../core/services/query.service';

import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { Store, Select } from '@ngxs/store';
import { AuthState } from '../../../shared/state/auth.state';
import { skip } from 'rxjs/operators';
import { Observable, Subscription, of, Subject } from 'rxjs';
import { UtilsService } from '../../../core/services/utils.service';
import { DateUtilsService } from '../../../core/services/dateutils.service';
import { DBState, LoadDashboard, SaveDashboard, DeleteDashboard } from '../../state/dashboard.state';
import { LoadUserNamespaces, LoadUserFolderData, UserSettingsState } from '../../state/user.settings.state';
import { WidgetsState, UpdateWidgets, UpdateGridPos, UpdateWidget, DeleteWidget, WidgetModel } from '../../state/widgets.state';
import {
    WidgetsRawdataState,
    GetQueryDataByGroup,
    SetQueryDataByGroup,
    ClearQueryData,
    CopyWidgetData,
    ClearWidgetsData
} from '../../state/widgets-data.state';
import { ClientSizeState, UpdateGridsterUnitSize } from '../../state/clientsize.state';
import {
    DBSettingsState,
    UpdateMode,
    UpdateDashboardTime,
    LoadDashboardSettings,
    UpdateDashboardTimeZone,
    UpdateDashboardTitle,
    UpdateVariables,
    UpdateMeta
} from '../../state/settings.state';
import { AppShellState, NavigatorState } from '../../../app-shell/state';
import { MatMenuTrigger, MenuPositionX, MatSnackBar } from '@angular/material';
import {
    SearchMetricsDialogComponent
} from '../../../shared/modules/sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import { DashboardDeleteDialogComponent } from '../../components/dashboard-delete-dialog/dashboard-delete-dialog.component';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

import { LoggerService } from '../../../core/services/logger.service';
import { HttpService } from '../../../core/http/http.service';


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

    @HostBinding('class.app-dashboard') private hostClass = true;

    @Select(AuthState.getAuth) auth$: Observable<string>;
    @Select(DBSettingsState.getDashboardSettings) dbSettings$: Observable<any>;
    @Select(UserSettingsState.GetUserNamespaces) userNamespaces$: Observable<string>;
    @Select(UserSettingsState.GetPersonalFolders) userPersonalFolders$: Observable<string>;
    @Select(UserSettingsState.GetNamespaceFolders) userNamespaceFolders$: Observable<string>;
    @Select(DBState.getDashboardFriendlyPath) dbPath$: Observable<string>;
    @Select(DBState.getLoadedDB) loadedRawDB$: Observable<any>;
    @Select(DBState.getDashboardStatus) dbStatus$: Observable<string>;
    @Select(DBState.getDashboardError) dbError$: Observable<any>;
    @Select(DBSettingsState.getDashboardTime) dbTime$: Observable<any>;
    @Select(DBSettingsState.getMeta) meta$: Observable<any>;
    @Select(DBSettingsState.getTplVariables) tplVariables$: Observable<any>;
    @Select(WidgetsState.getWigets) widgets$: Observable<WidgetModel[]>;
    @Select(WidgetsState.lastUpdated) lastUpdated$: Observable<any>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdataByGroup) widgetGroupRawData$: Observable<any>;
    @Select(AppShellState.getCurrentMediaQuery) mediaQuery$: Observable<string>;
    @Select(DBSettingsState.GetDashboardMode) dashboardMode$: Observable<string>;
    @Select(NavigatorState.getDrawerOpen) drawerOpen$: Observable<any>;

    // available widgets menu trigger
    @ViewChild('availableWidgetsMenuTrigger', { read: MatMenuTrigger }) availableWidgetsMenuTrigger: MatMenuTrigger;

    get availableWidgetsMenuIsOpen(): boolean {
        if (this.availableWidgetsMenuTrigger) {
            return this.availableWidgetsMenuTrigger.menuOpen;
        }
        return false;
    }

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
            type: 'BarchartWidgetComponent',
            iconClass: 'widget-icon-bar-graph'
        },
        /*{
            label: 'Area Graph',
            type: 'WidgetAreaGraphComponent',
            iconClass: 'widget-icon-area-graph'
        },*/
        {
            label: 'Line Chart',
            type: 'LinechartWidgetComponent',
            iconClass: 'widget-icon-line-chart'
        },
        {
            label: 'Big Number',
            type: 'BignumberWidgetComponent',
            iconClass: 'widget-icon-big-number'
        },
        {
            label: 'Donut Chart',
            type: 'DonutWidgetComponent',
            iconClass: 'widget-icon-donut-chart'
        },
        {
            label: 'Top N',
            type: 'TopnWidgetComponent',
            iconClass: 'widget-icon-topn-chart'
        },
        {
            label: 'Notes',
            type: 'MarkdownWidgetComponent',
            iconClass: 'widget-icon-notes'
        }/*,
        {
            label: 'Statuses',
            type: 'WidgetStatusComponent',
            iconClass: 'widget-icon-statuses'
        }*/
    ];
    // other variables
    dbSettings: any;
    dbTime: any;
    meta: any;
    // variables: any;
    dbTags: any;
    dbid: string; // passing dashboard id
    wid: string; // passing widget id
    rerender: any = { 'reload': false }; // -> make gridster re-render correctly
    widgets: any[] = [];
    tplVariables: any[] = [];
    variablePanelMode = 'view';
    userNamespaces: any = [];
    viewEditMode = false;
    newWidget: any; // setup new widget based on type from top bar
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    dashboardDeleteDialog: MatDialogRef<DashboardDeleteDialogComponent> | null;
    activeMediaQuery = '';
    gridsterUnitSize: any = {};
    lastWidgetUpdated: any;
    private subscription: Subscription = new Subscription();
    wdTags: any = {};
    dashboardTags: string[] = [];
    widgetTagLoaded$ = new Subject();
    widgetTagLoaded = false;

    constructor(
        private store: Store,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private location: Location,
        private interCom: IntercomService,
        private dbService: DashboardService,
        private cdkService: CdkService,
        private queryService: QueryService,
        private utilService: UtilsService,
        private dateUtil: DateUtilsService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private cdRef: ChangeDetectorRef,
        private elRef: ElementRef,
        private logger: LoggerService,
        private httpService: HttpService
    ) { }
    ngOnInit() {
        // handle route for dashboardModule
        this.subscription.add(this.activatedRoute.url.subscribe(url => {
            this.widgets = [];
            this.store.dispatch(new ClearWidgetsData());
            if (url.length === 1 && url[0].path === '_new_') {
                this.dbid = '_new_';
                this.store.dispatch(new LoadDashboard(this.dbid));
            } else {
                this.store.dispatch(new LoadDashboard(url[0].path));
            }
        }));
        // setup navbar portal
        this.dashboardNavbarPortal = new TemplatePortal(this.dashboardNavbarTmpl, undefined, {});
        this.cdkService.setNavbarPortal(this.dashboardNavbarPortal);

        // ready to handle request from children of DashboardModule
        // let widgets;
        this.subscription.add(this.interCom.requestListen().subscribe((message: IMessage) => {
            switch (message.action) {
                case 'getWidgetCachedData':
                    const widgetCachedData = this.store.selectSnapshot(WidgetsRawdataState.getWidgetRawdataByID(message.id));
                    let hasQueryError = false;
                    if (widgetCachedData) {
                        for (const qid in widgetCachedData) {
                            if (!widgetCachedData[qid] || widgetCachedData[qid]['error'] !== undefined) {
                                hasQueryError = true;
                            }
                        }
                    }
                    // requery if cachedData has error or data not fetched yet
                    if (!widgetCachedData || hasQueryError) {
                        this.handleQueryPayload(message);
                    } else {
                        this.updateWidgetGroup(message.id, widgetCachedData);
                    }
                    break;

                case 'setDashboardEditMode':
                    // copy the widget data to editing widget
                    if (message.id) {
                        this.store.dispatch(new CopyWidgetData(message.id, '__EDIT__' + message.id));
                    }
                    // when click on view/edit mode, update db setting state of the mode
                    // need to setTimeout for next tick to change the mode
                    setTimeout(() => {
                        this.store.dispatch(new UpdateMode('edit'));
                    });
                    break;
                case 'removeWidget':
                    this.store.dispatch(new DeleteWidget(message.payload.widgetId));
                    this.rerender = { 'reload': true };
                    break;
                case 'cloneWidget':
                    // widgets = this.widgets;
                    const cloneWidget = JSON.parse(JSON.stringify(message.payload));
                    cloneWidget.id = this.utilService.generateId();
                    cloneWidget.gridPos.x = cloneWidget.gridPos.x;
                    cloneWidget.gridPos.y = cloneWidget.gridPos.y + cloneWidget.gridPos.h;
                    for (let i = 0; i < this.widgets.length; i++) {
                        if (this.widgets[i].gridPos.y >= cloneWidget.gridPos.y) {
                            this.widgets[i].gridPos.y += cloneWidget.gridPos.h;
                        }
                    }
                    this.widgets.push(cloneWidget);
                    console.log('this widgets aftger clone', this.widgets);
                    // update the state with new widgets
                    // const copyWidgets = this.utilService.deepClone(this.widgets);
                    this.store.dispatch(new UpdateWidgets(this.widgets));
                    this.rerender = { 'reload': true };
                    const gridsterContainerEl = this.elRef.nativeElement.querySelector('.is-scroller');
                    const cloneWidgetEndPos = (cloneWidget.gridPos.y + cloneWidget.gridPos.h) * this.gridsterUnitSize.height;
                    const containerPos = gridsterContainerEl.getBoundingClientRect();
                    if (cloneWidgetEndPos > containerPos.height) {
                        setTimeout(() => {
                            gridsterContainerEl.scrollTop = cloneWidgetEndPos - containerPos.height;
                        }, 100);
                    }
                    break;
                case 'closeViewEditMode':
                    this.store.dispatch(new UpdateMode(message.payload));
                    this.rerender = { 'reload': true };
                    break;
                case 'getQueryData':
                    // payload needs to break into group to send in
                    this.handleQueryPayload(message);
                    break;
                case 'updateWidgetConfig':
                    const mIndex = this.widgets.findIndex(w => w.id === message.id);
                    if (mIndex === -1) {
                        // update position to put new on on top
                        const newWidgetY = message.payload.widget.gridPos.h;
                        this.widgets = this.dbService.positionWidgetY(this.widgets, newWidgetY);
                        // change name to fist metric if name is not change
                        if (message.payload.widget.settings.component_type !== 'MarkdownWidgetComponent') {
                            if (message.payload.widget.settings.title === 'my widget') {
                                message.payload.widget.settings.title = message.payload.widget.queries[0].metrics[0].name;
                            }
                        }
                        // this is the newly adding widget
                        if (this.widgets.length === 1 && this.widgets[0].settings.component_type === 'PlaceholderWidgetComponent') {
                            this.widgets[0] = message.payload.widget;
                        } else {
                            this.widgets.unshift(message.payload.widget);
                        }
                        this.store.dispatch(new UpdateWidgets(this.widgets));
                    } else {
                        // check the component type is PlaceholderWidgetComponent.
                        // If yes, it needs to be replaced with new component
                        if (this.widgets[mIndex].settings.component_type === 'PlaceholderWidgetComponent') {
                            this.widgets[mIndex] = message.payload.widget;
                            // change name to fist metric if name is not change
                            if (message.payload.widget.settings.component_type !== 'MarkdownWidgetComponent') {
                                if (message.payload.widget.settings.title === 'my widget') {
                                    message.payload.widget.settings.title = message.payload.widget.queries[0].metrics[0].name;
                                }
                            }
                            this.store.dispatch(new UpdateWidgets(this.widgets));
                        } else {
                            // editing an existing widget
                            this.store.dispatch(new UpdateWidget({
                                id: message.id,
                                needRequery: message.payload.needRequery,
                                widget: message.payload.widget
                            }));
                        }
                    }
                    break;
                case 'dashboardSaveRequest':
                    // DashboardSaveRequest comes from the save button
                    // we just need to update the title of dashboard
                    if (message.payload.updateFirst === true) {
                        this.store.dispatch(new UpdateDashboardTitle(message.payload.name));
                    }
                    const dbcontent = this.dbService.getStorableFormatFromDBState(this.store.selectSnapshot(DBState));
                    const payload: any = {
                        'name': dbcontent.settings.meta.title,
                        'content': dbcontent
                    };
                    if (message.payload.parentPath) {
                        payload.parentPath = message.payload.parentPath;
                    }
                    if (message.payload.parentId) {
                        payload.parentId = message.payload.parentId;
                    }
                    if (this.dbid !== '_new_') {
                        payload.id = this.dbid;
                    }

                    this.store.dispatch(new SaveDashboard(this.dbid, payload));
                    console.log('dashboardSaveRequest', this.dbid, payload);
                    break;
                case 'getDashboardTags':
                    this.getDashboardTagKeys();
                    break;
                case 'updateDashboardSettings':
                    if (message.payload.meta) {
                        this.store.dispatch(new UpdateMeta(message.payload.meta));
                    }
                    if (message.payload.variables) {
                        // console.log('updateVariables: ', message.payload.variables);
                        this.store.dispatch(new UpdateVariables(message.payload.variables));
                    }
                    break;
                case 'getTagValues': // tag template variables call
                    this.getDashboardTagValues(message.payload.tag);
                    break;
                case 'getUserNamespaces':
                    // console.log('getUserNamespaces');
                    this.store.dispatch(new LoadUserNamespaces());
                    break;
                case 'getUserFolderData':
                    // console.log('getUserFolderData');
                    this.store.dispatch(new LoadUserFolderData());
                    break;
                default:
                    break;
            }
        }));

        // only this widget need to update config, and flag to requery or not
        this.subscription.add(this.lastUpdated$.subscribe(lastUpdated => {
            this.interCom.responsePut({
                id: lastUpdated.id,
                action: 'getUpdatedWidgetConfig',
                payload: this.utilService.deepClone(lastUpdated)
            });
        }));

        this.subscription.add(this.mediaQuery$.subscribe(currentMediaQuery => {
            this.activeMediaQuery = currentMediaQuery;
        }));

        this.subscription.add(this.loadedRawDB$.subscribe(db => {
            const dbstate = this.store.selectSnapshot(DBState);
            if (dbstate.loaded) {
                // this.widgetTagLoaded = false;
                // need to carry new loaded dashboard id from confdb
                this.dbid = db.id;
                this.store.dispatch(new LoadDashboardSettings(db.content.settings)).subscribe(() => {
                    // update WidgetsState after settings state sucessfully loaded
                    this.store.dispatch(new UpdateWidgets(db.content.widgets));
                });
            }
        }));

        this.subscription.add(this.dbPath$.subscribe(path => {
            // we only need to check of path returned from configdb is not _new_,
            // the router url will point to previous path of clone dashboard
            // this.logger.log('dbPathSub', { currentLocation: this.location.path(), newPath: '/d' + path, rawPath: path});
            if (path !== '_new_' && path !== undefined) {
                this.location.replaceState('/d' + path);
            }
        }));

        this.subscription.add(this.dbStatus$.subscribe(status => {
            switch (status) {
                case 'save-success':
                    this.snackBar.open('Dashboard has been saved.', '', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        duration: 5000,
                        panelClass: 'info'
                    });
                    break;
                case 'delete-success':
                    this.router.navigate(['/home'], { queryParams: { 'db-delete': true } });
                    break;
            }
        }));

        this.subscription.add(this.dbError$.subscribe(error => {
            if (Object.keys(error).length > 0) {
                console.error(error);
            }
        }));

        // tslint:disable-next-line: no-shadowed-variable
        this.subscription.add(this.widgets$.subscribe((widgets) => {
            const dbstate = this.store.selectSnapshot(DBState);
            if (dbstate.loaded) {
                this.widgets = this.utilService.deepClone(widgets);
            }
        }));

        this.subscription.add(this.dashboardMode$.subscribe(mode => {
            this.viewEditMode = mode === 'dashboard' ? false : true;
        }));

        this.subscription.add(this.dbTime$.subscribe(t => {
            this.dbTime = this.utilService.deepClone(t);
            // do not intercom if widgets are still loading
            if (!this.widgets.length) {
                return;
            }
            if (this.dbTime && this.dbTime.zone !== t.zone) {
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
        }));

        this.subscription.add(this.dbSettings$.subscribe(settings => {
            this.dbSettings = this.utilService.deepClone(settings);
        }));
        /* 
        this.subscription.add(this.meta$.subscribe(t => {
            this.meta = this.utilService.deepClone(t);
        }));

        this.subscription.add(this.tplVariables$.subscribe(tvars => {
            this.tplVariables = this.utilService.deepClone(tvars);
        }));
        */
        this.subscription.add(this.widgetGroupRawData$.subscribe(result => {
            let error = null;
            const grawdata = {};
            if (result !== undefined) {
                if (result.rawdata !== undefined && !result.rawdata.error) {
                    grawdata[result.gid] = result.rawdata;
                } else if (result.rawdata !== undefined) {
                    grawdata[result.gid] = {};
                    error = result.rawdata.error;
                }
                this.updateWidgetGroup(result.wid, grawdata, error);
            }
        }));

        this.subscription.add(this.userNamespaces$.subscribe(result => {
            this.userNamespaces = result;
            this.interCom.responsePut({
                action: 'UserNamespaces',
                payload: result
            });
        }));

        this.subscription.add(this.userPersonalFolders$.subscribe(folders => {
            this.interCom.responsePut({
                action: 'UserPersonalFolders',
                payload: folders
            });
        }));

        this.subscription.add(this.userNamespaceFolders$.subscribe(folders => {
            this.interCom.responsePut({
                action: 'UserNamespaceFolders',
                payload: folders
            });
        }));

        this.subscription.add(this.auth$.subscribe(auth => {
            // console.log('auth$ calling', auth);
            if (auth === 'invalid') {
                // console.log('open auth dialog');
            }
        }));

        // skip the first time this drawer loaded
        this.subscription.add(this.drawerOpen$.pipe(skip(1)).subscribe(sideNav => {
            setTimeout(() => {
                this.rerender = { 'reload': true };
            }, 300);
        }));
    }

    /* requeryData(payload) {
        this.variables = payload;
        this.interCom.responsePut({
            action: 'reQueryData',
            payload: payload
        });
    } */

    // to passing raw data to widget
    updateWidgetGroup(wid, rawdata, error = null) {
        const clientSize = this.store.selectSnapshot(ClientSizeState);
        this.interCom.responsePut({
            id: wid,
            action: 'updatedWidgetGroup',
            payload: {
                rawdata: rawdata,
                error: error,
                timezone: this.dbTime.zone,
                gridSize: clientSize
            }
        });
    }

    getDashboardTagValues(tag: any) {
        const metrics = this.dbService.getMetricsFromWidgets(this.widgets);
        const query = { metrics, tag }; // unique metrics
        return this.httpService.getTagValues(query).subscribe(values => {
            this.interCom.responsePut({
                action: 'dashboardTagValues',
                payload: values
            });
        });
    }

    getDashboardTagKeys() {
        this.httpService.getTagKeysForQueries(this.widgets).subscribe( (res: any ) => {
            console.log('getdashboardtag res', res);
            this.wdTags = {};
            this.dashboardTags = [];
            for ( let i = 0; res && i < res.results.length; i++ ) {
                const [wid, qid ] =  res.results[i].id ? res.results[i].id.split(":") : [null, null]; 
                if ( !wid ) { continue; }
                const keys = res.results[i].tagKeys.map(d => d.name);
                if ( !this.wdTags[wid] ) {
                    this.wdTags[wid] = {};
                }
                this.wdTags[wid][qid] = keys;
                this.dashboardTags = [...this.dashboardTags,
                    ...keys.filter(k => this.dashboardTags.indexOf(k) < 0)];
            }
            this.dashboardTags.sort(this.utilService.sortAlphaNum);
            console.log('dashboard tag', this.wdTags, this.dashboardTags);
            // this.widgetTagLoaded = true;
            // this.widgetTagLoaded$.next(true);
        },
        error => {
            this.widgetTagLoaded = true;
            this.widgetTagLoaded$.next(true);

        });
    }
    checkWidgetTagsLoaded(): Observable<any> {
        if ( !this.widgetTagLoaded ) {
          return this.widgetTagLoaded$;
        } else {
          return of(true);
        }
    }

    // dispatch payload query by group
    handleQueryPayload(message: any) {
        let groupid = '';
        const payload = message.payload;
        const dt = this.getDashboardDateRange();
        // this.checkWidgetTagsLoaded().subscribe(loaded => {
            if ( payload.queries.length ) {
                // sending each group to get data.
                for (let i = 0; i < payload.queries.length; i++) {
                    let query: any = JSON.parse(JSON.stringify(payload.queries[i]));
                    groupid = query.id;
                    const gquery: any = {
                        wid: message.id,
                        gid: groupid,
                        isEditMode: this.viewEditMode
                    };
                    if (query.namespace && query.metrics.length) {
                        // filter only visible metrics
                        // query = this.dbService.filterMetrics(query);
                        // let overrideFilters = this.variables.enabled ? this.variables.tplVariables : [];
                        // get only enabled filters
                        // overrideFilters = overrideFilters.filter(d => d.enabled);
                        // query = overrideFilters.length ?
                        //    this.dbService.overrideQueryFilters(query, overrideFilters, this.wdTags[message.id] ?
                        //       this.wdTags[message.id][groupid] : []) : query;
                        query = this.queryService.buildQuery(payload, dt, query);
                        // console.log('the group query-2', query, JSON.stringify(query));
                        gquery.query = query;
                        // now dispatch request
                        this.store.dispatch(new GetQueryDataByGroup(gquery));
                    } else {
                        gquery.data = {};
                        this.store.dispatch(new SetQueryDataByGroup(gquery));
                    }
                }
            } else {
                this.store.dispatch(new ClearQueryData({ wid: message.id }));
            }
        // });
    }

    getDashboardDateRange() {
        const dbSettings = this.store.selectSnapshot(DBSettingsState);
        const startTime = this.dateUtil.timeToMoment(dbSettings.time.start, dbSettings.time.zone);
        const endTime = this.dateUtil.timeToMoment(dbSettings.time.end, dbSettings.time.zone);

        return { start: startTime.valueOf(), end: endTime.valueOf() };
    }

    // this will call based on gridster reflow and size changes event
    widgetsLayoutUpdate(gridLayout: any) {
        this.gridsterUnitSize = gridLayout.clientSize;
        if (gridLayout.clientSize) {
            this.store.dispatch(new UpdateGridsterUnitSize(gridLayout.clientSize));
        }
        if (gridLayout.wgridPos) {
            this.store.dispatch(new UpdateGridPos(gridLayout.wgridPos));
        }
    }

    // setup the new widget type and using as input to dashboard-content to load edting it.
    addNewWidget(selectedWidget: any) {
        this.newWidget = this.dbService.getWidgetPrototype(selectedWidget.type);
    }

    openTimeSeriesMetricDialog(widget: any) {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'search-metrics-dialog-backdrop';
        dialogConf.panelClass = 'search-metrics-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.data = { mgroupId: widget.query.groups[0].id };

        this.searchMetricsDialog = this.dialog.open(SearchMetricsDialogComponent, dialogConf);

        this.searchMetricsDialog.updatePosition({ top: '48px' });
        this.searchMetricsDialog.afterClosed().subscribe((dialog_out: any) => {
            let widgets = [...this.widgets];
            const group = dialog_out.mgroup;
            widget.query.groups[0].queries = group.queries;
            widgets = this.dbService.positionWidgetY(widgets, widget.gridPos.h);
            widgets.unshift(widget);
            this.store.dispatch(new UpdateWidgets(widgets));
            this.rerender = { 'reload': true };
        });
    }

    setDateRange(e: any) {
        this.store.dispatch(new UpdateDashboardTime({ start: e.startTimeDisplay, end: e.endTimeDisplay }));
    }

    setTimezone(e: any) {
        this.store.dispatch(new UpdateDashboardTimeZone(e));
    }

    setTitle(e: any) {
        this.store.dispatch(new UpdateDashboardTitle(e));
    }

    receiveDashboardAction(event: any) {
        // console.log('%cNAVBAR:DashboardAction', 'color: #ffffff; background-color: purple; padding: 2px 4px;', event);
        switch (event.action) {
            case 'clone':
                this.dbid = '_new_';
                const newTitle = 'Clone of ' + this.meta.title;
                this.setTitle(newTitle);
                this.location.replaceState('/d/' + this.dbid);
                break;
            case 'delete':
                this.openDashboardDeleteDialog();
                break;
        }
    }

    openDashboardDeleteDialog() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.backdropClass = 'dashboard-delete-dialog-backdrop';
        dialogConf.hasBackdrop = true;
        dialogConf.panelClass = 'dashboard-delete-dialog-panel';

        dialogConf.autoFocus = true;
        dialogConf.data = {};
        this.dashboardDeleteDialog = this.dialog.open(DashboardDeleteDialogComponent, dialogConf);
        this.dashboardDeleteDialog.afterClosed().subscribe((dialog_out: any) => {
            // console.log('delete dialog confirm', dialog_out);
            if (dialog_out && dialog_out.delete) {
                this.store.dispatch(new DeleteDashboard(this.dbid));
            }
        });
    }

    arrayToString(array: any[]): string {
        if (array) {
            return array.sort().toString();
        } else {
            return '';
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

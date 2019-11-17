import { Component, OnInit, OnDestroy, HostBinding, ViewChild, TemplateRef, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
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
import { DBState, LoadDashboard, SaveDashboard, DeleteDashboardSuccess, DeleteDashboardFail, SetDashboardStatus } from '../../state/dashboard.state';
import { LoadUserNamespaces, LoadUserFolderData, UserSettingsState } from '../../state/user.settings.state';
import { WidgetsState,
    UpdateWidgets, UpdateGridPos, UpdateWidget,
    DeleteWidget, WidgetModel } from '../../state/widgets.state';
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
    UpdateDashboardAutoRefresh,
    LoadDashboardSettings,
    UpdateDashboardTimeZone,
    UpdateDashboardTitle,
    UpdateVariables,
    UpdateMeta,
    UpdateDashboardTimeOnZoom,
    UpdateDashboardTimeOnZoomOut
} from '../../state/settings.state';
import { AppShellState, NavigatorState, DbfsLoadTopFolder, DbfsLoadSubfolder, DbfsDeleteDashboard, DbfsResourcesState } from '../../../app-shell/state';
import { MatMenuTrigger, MenuPositionX, MatSnackBar } from '@angular/material';
import {
    SearchMetricsDialogComponent
} from '../../../shared/modules/sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import { DashboardDeleteDialogComponent } from '../../components/dashboard-delete-dialog/dashboard-delete-dialog.component';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

import { LoggerService } from '../../../core/services/logger.service';
import { HttpService } from '../../../core/http/http.service';
import { ICommand, CmdManager } from '../../../core/services/CmdManager';
import { DbfsUtilsService } from '../../../app-shell/services/dbfs-utils.service';
import { EventsState, GetEvents } from '../../../dashboard/state/events.state';
import { URLOverrideService } from '../../services/urlOverride.service';
import * as deepEqual from 'fast-deep-equal';

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
    @Select(UserSettingsState.GetPersonalFolders) userPersonalFolders$: Observable<any>;
    @Select(UserSettingsState.GetNamespaceFolders) userNamespaceFolders$: Observable<string>;
    @Select(DBState.getDashboardFriendlyPath) dbPath$: Observable<string>;
    @Select(DBState.getLoadedDB) loadedRawDB$: Observable<any>;
    @Select(DBState.getDashboardStatus) dbStatus$: Observable<string>;
    @Select(DBState.getDashboardError) dbError$: Observable<any>;
    @Select(DBSettingsState.getDashboardTime) dbTime$: Observable<any>;
    @Select(DBSettingsState.getDashboardAutoRefresh) refresh$: Observable<any>;
    @Select(DBSettingsState.getMeta) meta$: Observable<any>;
    @Select(DBSettingsState.getTplVariables) tplVariables$: Observable<any>;
    @Select(WidgetsState.getWigets) widgets$: Observable<WidgetModel[]>;
    @Select(WidgetsState.lastUpdated) lastUpdated$: Observable<any>;
    @Select(WidgetsRawdataState.getLastModifiedWidgetRawdataByGroup) widgetGroupRawData$: Observable<any>;
    @Select(AppShellState.getCurrentMediaQuery) mediaQuery$: Observable<string>;
    @Select(DBSettingsState.GetDashboardMode) dashboardMode$: Observable<string>;
    @Select(NavigatorState.getDrawerOpen) drawerOpen$: Observable<any>;
    @Select(EventsState.GetEvents) events$: Observable<any>;

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
            label: 'Heatmap',
            type: 'HeatmapWidgetComponent',
            iconClass: 'widget-icon-heatmap'
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
        },
        {
            label: 'Events',
            type: 'EventsWidgetComponent',
            iconClass: 'widget-icon-events'
        },

        /*,
        {
            label: 'Statuses',
            type: 'WidgetStatusComponent',
            iconClass: 'widget-icon-statuses'
        }*/
    ];
    // other variables
    dbSettings: any;
    dbTime: any = {};
    meta: any = {};
    // variables: any;
    dbTags: any;
    dbid: string; // passing dashboard id
    wid: string; // passing widget id
    rerender: any = { 'reload': false }; // -> make gridster re-render correctly
    widgets: any[] = [];
    // tplVariables: any[];
    tplVariables: any = { editTplVariables: [], viewTplVariables: []};
    variablePanelMode: any = { view : true };
    userNamespaces: any = [];
    viewEditMode = false;
    newWidget: any; // setup new widget based on type from top bar
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    dashboardDeleteDialog: MatDialogRef<DashboardDeleteDialogComponent> | null;
    activeMediaQuery = '';
    gridsterUnitSize: any = {};
    lastWidgetUpdated: any;
    private subscription: Subscription = new Subscription();
    dashboardTags = {
        rawDbTags: {},
        totalQueries: 0,
        tags: []
    };
    dashboardNamespaces = [];
    isDbTagsLoaded$ = new Subject();
    isDbTagsLoaded = false;
    eWidgets: any = {}; // to whole eligible widgets with custom dashboard tags
    // showDBTagFilters = false;

    // used for unsaved changes warning message
    oldMeta = {};
    oldWidgets = [];

    // used to determine db write access (and display popup for unsaved changes)
    dbOwner: string = ''; // /namespace/yamas
    user: string = '';    // /user/zb
    writeSpaces: string[] = [];

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
        private httpService: HttpService,
        private dbfsUtils: DbfsUtilsService,
        private urlOverrideService: URLOverrideService
    ) { }

    ngOnInit() {
        // load the namespaces user has access to
        this.store.dispatch(new LoadUserNamespaces());

        // handle route for dashboardModule
        this.subscription.add(this.activatedRoute.url.subscribe(url => {
            this.widgets = [];
            this.meta = {};
            this.isDbTagsLoaded = false;
            this.variablePanelMode = { view: true };
            this.store.dispatch(new ClearWidgetsData());
            if (url.length === 1 && url[0].path === '_new_') {
                this.dbid = '_new_';
                this.store.dispatch(new LoadDashboard(this.dbid));
            } else {
                this.store.dispatch(new LoadDashboard(url[0].path));
            }
            // remove system messages - TODO: when adding more apps, put this in app-shell and listen for router change.
            this.interCom.requestSend({
                action: 'clearSystemMessage',
                payload: {}
            });
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
                    this.getDashboardTagKeys(false);
                    break;
                case 'cloneWidget':
                    // widgets = this.widgets;
                    const cloneWidget = JSON.parse(JSON.stringify(message.payload));
                    cloneWidget.id = this.utilService.generateId(6, this.utilService.getIDs(this.widgets));
                    cloneWidget.gridPos.yMd = cloneWidget.gridPos.yMd + cloneWidget.gridPos.h;
                    for (let i = 0; i < this.widgets.length; i++) {
                        if (this.widgets[i].gridPos.yMd >= cloneWidget.gridPos.yMd) {
                            this.widgets[i].gridPos.yMd += cloneWidget.gridPos.h;
                        }
                    }
                    this.widgets.push(cloneWidget);
                    // update the state with new widgets
                    // const copyWidgets = this.utilService.deepClone(this.widgets);
                    this.store.dispatch(new UpdateWidgets(this.widgets));
                    this.getDashboardTagKeys(false);
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
                    this.handleQueryPayload(message);
                    break;
                case 'getEventData':
                    this.handleEventQueryPayload(message);
                    break;
                case 'updateWidgetConfig':
                    let mIndex = this.widgets.findIndex(w => w.id === message.id);
                    if (mIndex === -1) {
                        // do not save if no metrics added
                        // update position to put new on on top
                        const newWidgetY = message.payload.widget.gridPos.h;
                        this.widgets = this.dbService.positionWidgetY(this.widgets, newWidgetY);
                        // change name to first metric if name is not changed
                        if (message.payload.widget.settings.component_type !== 'MarkdownWidgetComponent' &&
                        message.payload.widget.settings.component_type !== 'EventsWidgetComponent') {
                            if (message.payload.widget.settings.title === 'my widget' && message.payload.widget.queries[0].metrics.length) {
                                message.payload.widget.settings.title = message.payload.widget.queries[0].metrics[0].name;
                            }
                        }
                        // this is the newly added widget
                        if (this.widgets.length === 1 && this.widgets[0].settings.component_type === 'PlaceholderWidgetComponent') {
                            this.widgets[0] = message.payload.widget;
                        } else {
                            this.widgets.unshift(message.payload.widget);
                        }
                        mIndex = 0;
                        this.store.dispatch(new UpdateWidgets(this.widgets));
                    } else {
                        // check the component type is PlaceholderWidgetComponent.
                        // If yes, it needs to be replaced with new component
                        if (this.widgets[mIndex].settings.component_type === 'PlaceholderWidgetComponent') {
                            this.widgets[mIndex] = message.payload.widget;
                            // change name to fist metric if name is not change
                            if (message.payload.widget.settings.component_type !== 'MarkdownWidgetComponent' &&
                                message.payload.widget.settings.component_type !== 'EventsWidgetComponent') {
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
                    // case that widget is updated we need to get new set of dashboard tags
                    this.getDashboardTagKeys(false);
                    // this.handleQueryPayload({ id: message.id, payload: this.widgets[mIndex] });
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

                    break;
                case 'updateTemplateVariables':
                    this.store.dispatch(new UpdateVariables(message.payload));
                    break;
                case 'ApplyTplVarValue':
                    console.log('hill - this passing tag to ApplyTplVarValue', message.payload);
                    this.applyTplVarValue(message.payload);
                    break;
                case 'UpdateTplAlias':
                    this.updateTplAlias(message.payload);
                    break;
                case 'RemoveCustomTagFilter':
                    this.removeCustomTagFilter(message.payload);
                    break;
                case 'updateDashboardSettings':
                    if (message.payload.meta) {
                        this.store.dispatch(new UpdateMeta(message.payload.meta));
                    }
                    break;
                case 'GetTplVariables':
                    // this is request for inline-tag-filters to display
                    // custom tag to select.
                    this.interCom.responsePut({
                        action: 'TplVariables',
                        payload: {
                            tplVariables: this.tplVariables,
                            mode: this.variablePanelMode.view ? 'view' : 'edit'
                        }
                    });
                    break;
                case 'getUserNamespaces':
                    this.store.dispatch(new LoadUserNamespaces());
                    break;
                case 'getUserFolderData':
                    this.store.dispatch(new LoadUserFolderData());
                    break;
                case 'SetZoomDateRange':
                    if ( message.payload.isZoomed ) {
                        // tslint:disable:max-line-length
                        message.payload.start = message.payload.start !== -1 ? message.payload.start : this.dateUtil.timeToMoment(this.dbTime.start, this.dbTime.zone).unix();
                        message.payload.end = message.payload.end !== -1 ? message.payload.end : this.dateUtil.timeToMoment(this.dbTime.end, this.dbTime.zone).unix();
                        this.dbTime.start = this.dateUtil.timestampToTime(message.payload.start, this.dbTime.zone);
                        this.dbTime.end = this.dateUtil.timestampToTime(message.payload.end, this.dbTime.zone);
                        message.payload = this.dbTime;
                        this.store.dispatch(new UpdateDashboardTimeOnZoom({start: this.dbTime.start, end: this.dbTime.end}));
                    }  else { // zoomed out
                        const dbSettings = this.store.selectSnapshot(DBSettingsState);
                        this.dbTime = this.utilService.hasInitialZoomTimeSet(dbSettings.initialZoomTime) ? {...dbSettings.initialZoomTime} : {...dbSettings.time};
                        console.log('***', this.dbTime);
                        message.payload = this.dbTime;
                        this.store.dispatch(new UpdateDashboardTimeOnZoomOut());
                    }

                    this.interCom.responsePut({
                        action: 'ZoomDateRange',
                        payload: { zoomingWid: message.id, date: message.payload }
                    });
                    this.updateURLParams(message.payload);

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

            // reset when loading new dashboard
            if  (this.dbid !== db.id) {
                this.oldWidgets = [];
                this.oldMeta = {};
            }

            if (db && db.fullPath) {
                this.dbOwner = this.getOwnerFromPath(db.fullPath);
            }

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

            if (path && path.startsWith('/_new_')) {
                this.dbOwner = this.user;
            }

            // we only need to check of path returned from configdb is not _new_,
            // the router url will point to previous path of clone dashboard
            // this.logger.log('dbPathSub', { currentLocation: this.location.path(), newPath: '/d' + path, rawPath: path});
            if (path !== '_new_' && path !== undefined) {
                let fullPath = this.location.path();
                let urlParts = fullPath.split('?');
                if (urlParts.length > 1) {
                    this.location.replaceState('/d' + path, urlParts[1]);
                } else {
                    this.location.replaceState('/d' + path);
                }

                // possibly need to update the dbid
                // necessary after saving a _new_ dashboard, so save dialog will not prompt again
                if (this.dbid === '_new_') {

                    const dbstate = this.store.selectSnapshot(DBState);
                    this.dbid = dbstate.id;

                    // if the save was on a NEW dashboard, lets tell the navigator to update
                    if (path !== '/_new_' && path !== undefined) {
                        const fullPath = '/' + path.split('/').slice(2).join('/'); // strip off the id part of the url
                        const details = this.dbfsUtils.detailsByFullPath(fullPath);
                        const parentDetails = this.dbfsUtils.detailsByFullPath(details.parentPath);
                        if (parentDetails.topFolder) {
                            this.store.dispatch(new DbfsLoadTopFolder(parentDetails.type, parentDetails.typeKey, {}));
                        } else {
                            this.store.dispatch(new DbfsLoadSubfolder(parentDetails.fullPath, {}));
                        }
                    }
                }
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
                    // reset state for save pop-up
                    this.oldMeta = {...this.meta};
                    this.oldWidgets = [... this.widgets];
                    break;
                case 'delete-success':
                    this.snackBar.open('Dashboard has been moved to trash folder.', '', {
                      horizontalPosition: 'center',
                      verticalPosition: 'top',
                      duration: 5000,
                      panelClass: 'info'
                    });
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
                // sort widget by grid row, then assign
                let sortWidgets = this.utilService.deepClone(widgets);
                sortWidgets.sort((a,b) => a.gridPos.y - b.gridPos.y || a.gridPos.x - b.gridPos.x);
                this.widgets = this.utilService.deepClone(sortWidgets);

                // set oldWidgets when widgets is not empty and oldWidgets is empty
                if (this.widgets.length && this.oldWidgets.length === 0) {
                    this.oldWidgets = [...this.widgets];
                }

                // only get dashboard tag key when they already set it up.
                if (this.tplVariables.editTplVariables.length > 0 && !this.isDbTagsLoaded) {
                    this.getDashboardTagKeys();
                }
                // check to see if we can display variable template panel or not
                // comment this out, since we now do allow user to set the dashboard tag filters
                // even without any metrics
                // this.showDBTagFilters = this.dbService.havingDBMetrics(this.widgets);
            }
        }));

        this.subscription.add(this.dashboardMode$.subscribe(mode => {
            this.viewEditMode = mode === 'dashboard' ? false : true;
        }));

        this.subscription.add(this.dbTime$.subscribe(t => {

            const timeZoneChanged = (this.dbTime && this.dbTime.zone !== t.zone);
            this.dbTime = {...t};

            // do not intercom if widgets are still loading
            if (!this.widgets.length) {
                return;
            }

            if (timeZoneChanged) {
                this.interCom.responsePut({
                    action: 'TimezoneChanged',
                    payload: t
                });
            } else {
                this.interCom.responsePut({
                    action: 'TimeChanged',
                    payload: t
                });
            }
            this.updateURLParams(t);
        }));

        this.subscription.add(this.dbSettings$.subscribe(settings => {
            // title in settings is used in various places. Need to keep this
            this.dbSettings = this.utilService.deepClone(settings);
        }));
        this.subscription.add(this.meta$.subscribe(t => {
            this.meta = this.utilService.deepClone(t);
            if (Object.keys(this.meta).length && this.meta.title && Object.keys(this.oldMeta).length === 0) {
                this.oldMeta = {... this.meta};
            }
            if (this.meta.title) {
                this.utilService.setTabTitle(this.meta.title);
            }
        }));
        this.subscription.add(this.tplVariables$.subscribe(tvars => {
            // whenever tplVariables$ trigger, we save to view too.
            console.log('hill - tvars once the state is updated', tvars);
            if (tvars) {
                this.tplVariables = {...this.tplVariables,
                    editTplVariables: this.utilService.deepClone(tvars),
                    viewTplVariables: this.utilService.deepClone(tvars)
                };
            }
            console.log('hill - updated this.tplVariables', this.tplVariables);
        }));
        this.subscription.add(this.widgetGroupRawData$.subscribe(result => {
            let error = null;
            let grawdata = {};
            if (result !== undefined) {
                if (result.rawdata !== undefined && !result.rawdata.error) {
                    grawdata = this.utilService.deepClone(result.rawdata);
                } else if (result.rawdata !== undefined) {
                    error = result.rawdata.error;
                }
                this.updateWidgetGroup(result.wid, grawdata, error);
            }
        }));

        this.subscription.add(this.userNamespaces$.subscribe(result => {
            this.userNamespaces = result;
            this.setWriteSpaces();
            this.interCom.responsePut({
                action: 'UserNamespaces',
                payload: result
            });
        }));

        this.subscription.add(this.userPersonalFolders$.subscribe(folders => {

            if (folders && folders[0] && folders[0].fullPath) {
                this.user = this.getOwnerFromPath(folders[0].fullPath);
                this.setWriteSpaces();
            }

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

        this.subscription.add(this.events$.subscribe(result => {
            const time = this.dbTime;
            let error = null;
            let grawdata = {};
            if (result !== undefined) {
                if (result.events !== undefined && !result.events.error) {
                    grawdata = result.events;
                } else if (result.events !== undefined) {
                    error = result.events.error;
                }
                this.updateEvents(result.wid, grawdata, time, error);
            }
        }));
    }

    updateURLParams(p) {
        this.urlOverrideService.applyParamstoURL(p);
    }
    // apply when custom tag value is changed
    // should only trigger widgets that are affected by this change.  
    applyTplVarValue(tvar: any) {
       // update url params
       const tplVars = this.variablePanelMode.view ? this.tplVariables.viewTplVariables.tvars : this.tplVariables.editTplVariables.tvars;
       this.updateURLParams(tplVars);
       
       for (let i = 0; i < this.widgets.length; i++) {
            const queries = this.widgets[i].queries;
            for (let j = 0; j < queries.length; j++) {
                const idx = queries[j].filters.findIndex(f => f.customFilter && f.customFilter.includes('[' + tvar.alias + ']'));            
                if (idx > -1) {
                    this.handleQueryPayload({
                        id: this.widgets[i].id,
                        payload: this.widgets[i]
                    });
                    break;
                }
            }
       }
       /*for (let i = 0; i < this.widgets.length; i++) {
           // put condition to not event send in.
           if (!this.widgets[i].settings.hasOwnProperty('useDBFilter') || this.widgets[i].settings.useDBFilter) {
               this.handleQueryPayload({id: this.widgets[i].id, payload: this.widgets[i]});
               this.checkDbTagsLoaded().subscribe(loaded => {
                   const tplVars = this.variablePanelMode.view ? this.tplVariables.viewTplVariables : this.tplVariables.editTplVariables;
                   this.updateURLParams({ tags: tplVars });
               });
           }
       }
       */
    }
    // when delete a dashboard custom tag
    removeCustomTagFilter(payload: any) {
        const vartag = payload.vartag;
        for (let i = 0; i < this.widgets.length; i++) {
            const widget = this.widgets[i];
            for (let j = 0; j < widget.queries.length; j++) {
                const filters = widget.queries[j].filters;
                const fIndex = filters.findIndex(f => f.tagk === vartag.tagk);
                if (fIndex > -1) {
                    if (filters[fIndex].customFilter && filters[fIndex].customFilter.length) {
                        const cFilterIndex = filters[fIndex].customFilter.indexOf('[' + vartag.alias + ']');
                        if (cFilterIndex > -1) {
                            filters[fIndex].customFilter.splice(cFilterIndex, 1);
                            // requery if the remove custom tag has value
                            this.store.dispatch(new UpdateWidget({
                                id: widget.id,
                                needRequery: false,
                                widget: widget
                            }));
                        }

                    }
                }
            }
        }
        // if they remove everything, then make sure we clean once it's lock before.
        if (this.tplVariables.editTplVariables.length === 0) {
            let flag = false;
            for (let i = 0; i < this.widgets.length; i++) {
                const widget = this.widgets[i];
                if (widget.settings.hasOwnProperty('useDBFilter') && !widget.settings.useDBFilter) {
                    widget.settings.useDBFilter = true;
                    flag = true;
                    // let the widget know to update it lock
                    this.interCom.responsePut({
                        id: widget.id,
                        action: 'ResetUseDBFilter'
                    });
                }
            }
            if (flag) {
                this.store.dispatch(new UpdateWidgets(this.widgets));
            }
        }
    }
    // this will do the insert or update the name/alias if the widget is eligible.
    updateTplAlias(payload: any) {
        console.log('hill - updateTplAlias', payload);
        this.checkDbTagsLoaded().subscribe(loaded => {
            for (let i = 0; i < this.widgets.length; i++) {
                const widget = this.widgets[i];
                // we will insert or modify based on insert flag
                const isModify = this.dbService.applytDBFilterToWidget(widget, payload, this.dashboardTags.rawDbTags);
                if (isModify) {
                    console.log('hill - widget state update', widget);
                    this.store.dispatch(new UpdateWidget({
                        id: widget.id,
                        needRequery: false,
                        widget: widget
                    }));
                }
            }
        });
    }

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
    // get all dashboard tags, use to check eligible for when apply db filter 
    // to widget.
    getDashboardTagKeys(reloadData: boolean = true) {
        this.isDbTagsLoaded = false;
        this.httpService.getTagKeysForQueries(this.widgets).subscribe((res: any) => {
            this.dashboardTags = { rawDbTags: {}, totalQueries: 0, tags: [] };
            for (let i = 0; res && i < res.results.length; i++) {
                const [wid, qid] = res.results[i].id ? res.results[i].id.split(':') : [null, null];
                if (!wid) { continue; }
                const keys = res.results[i].tagKeys.map(d => d.name);
                if (!this.dashboardTags.rawDbTags[wid]) {
                    this.dashboardTags.rawDbTags[wid] = {};
                }
                this.dashboardTags.rawDbTags[wid][qid] = keys;
                this.dashboardTags.totalQueries++;
                this.dashboardTags.tags = [...this.dashboardTags.tags,
                ...keys.filter(k => this.dashboardTags.tags.indexOf(k) < 0)];
            }
            this.dashboardTags.tags.sort(this.utilService.sortAlphaNum);
            this.isDbTagsLoaded = true;
            this.isDbTagsLoaded$.next(reloadData);
        },
            error => {
                this.isDbTagsLoaded = false;
                this.isDbTagsLoaded$.next(reloadData);
            });
    }

    // check if DBTags is loaded or not, 
    checkDbTagsLoaded(): Observable<any> {
        if (this.tplVariables.editTplVariables.tvars.length > 0) {
            if (!this.isDbTagsLoaded) {
                return this.isDbTagsLoaded$;
            } else {
                return of(true);
            }
        } else {
            return of(true);
        }
    }

    changeVarPanelMode(mode: any) {
        if ( !mode.view ) {
            this.dashboardNamespaces = this.dbService.getNamespacesFromWidgets(this.widgets);
            if ( !this.isDbTagsLoaded ) {
                this.getDashboardTagKeys();
            }
        }
        this.variablePanelMode = {...mode};
    }
    // dispatch payload query by group
    handleQueryPayload(message: any) {
        let groupid = '';
        // make sure we modify the copy for tsdb query
        const payload = this.utilService.deepClone(message.payload);
        // tslint:disable-next-line:max-line-length
        // const groupby = payload.settings.multigraph ? payload.settings.multigraph.chart.filter(d=> d.key !== 'metric_group' && d.displayAs !== 'g').map(d => d.key) : [];
        const groupby = payload.settings.multigraph ?
            payload.settings.multigraph.chart.filter(d=> d.key !== 'metric_group').map(d => d.key) : [];
        const dt = this.getDashboardDateRange();
        // const subs = this.checkDbTagsLoaded().subscribe(loaded => {
            if (payload.queries.length) {
                // should we modify the widget if using dashboard tag filter
                const tplVars = this.variablePanelMode.view ? this.tplVariables.viewTplVariables.tvars : this.tplVariables.editTplVariables.tvars;
                console.log('hill - tplVars', tplVars);
                /*
                if ((!payload.settings.hasOwnProperty('useDBFilter') || payload.settings.useDBFilter)
                    && tplVars.length > 0) {
                    // modify query if needed
                    this.dbService.applyWidgetDBFilter(payload, tplVars, this.dashboardTags.rawDbTags);
                } */
                // sending each group to get data.
                const queries = {};
                for (let i = 0; i < payload.queries.length; i++) {
                    let query: any = JSON.parse(JSON.stringify(payload.queries[i]));
                    groupid = query.id;
                    if (query.namespace && query.metrics.length) {
                        // filter only visible metrics, disable it now since it will break the expression
                        // query = this.dbService.filterMetrics(query);
                        // here we need to resolve template variables
                        if (tplVars.length > 0) {
                            console.log('hill - check condition', query.filters.findIndex(f => f.customFilter !== undefined));
                            if (query.filters.findIndex(f => f.customFilter !== undefined) > -1) {
                                query = this.dbService.resolveTplVar(query, tplVars);
                            }
                        }
                        // override the multigraph groupby config
                        for ( let j = 0; j < query.metrics.length; j++ ) {
                            // console.log("payload1", query.metrics[j].groupByTags.concat(groupby))
                            const metricGroupBy = query.metrics[j].groupByTags || [];
                            query.metrics[j].groupByTags = this.utilService.arrayUnique(metricGroupBy.concat(groupby));
                        }
                        queries[i] = query;
                    }
                }
                const gquery: any = {
                    wid: message.id,
                    isEditMode: this.viewEditMode,
                    dbid: this.dbid
                };
                if (Object.keys(queries).length) {
                    const query = this.queryService.buildQuery(payload, dt, queries);
                    gquery.query = query;
                    // console.debug("****** DSHBID: " + this.dbid + "  WID: " + gquery.wid);
                    // ask widget to loading signal
                    this.interCom.responsePut({
                        id: payload.id,
                        payload: {
                            storeQuery: query
                        },
                        action: 'WidgetQueryLoading'
                    });
                    // now dispatch request
                    this.store.dispatch(new GetQueryDataByGroup(gquery));
                } else {
                    gquery.data = {};
                    this.store.dispatch(new SetQueryDataByGroup(gquery));
                }
            } else {
                this.store.dispatch(new ClearQueryData({ wid: message.id }));
            }
            // very important to unsubscribe
            //if (subs) {
            //    subs.unsubscribe();
            //}
        //});
    }

    handleEventQueryPayload(message: any) {
        if ( message.payload.eventQueries[0].namespace) {
            const dbTime = this.getDashboardDateRange();
            this.store.dispatch(new GetEvents(
                {   start: dbTime.start,
                    end: dbTime.end
                },
                message.payload.eventQueries,
                message.id,
                message.payload.limit));
        }
    }

    updateEvents(wid, rawdata, time, error = null) {
        // const clientSize = this.store.selectSnapshot(ClientSizeState);
        this.interCom.responsePut({
            id: wid,
            action: 'updatedEvents',
            payload: {
                events: rawdata,
                time: time,
                error: error
            }
        });
    }

    getDashboardDateRange() {
        const startTime = this.dateUtil.timeToMoment(this.dbTime.start, this.dbTime.zone);
        const endTime = this.dateUtil.timeToMoment(this.dbTime.end, this.dbTime.zone);
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
        this.newWidget = this.dbService.getWidgetPrototype(selectedWidget.type, this.widgets);
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

    refresh() {
        this.interCom.responsePut({
            action: 'reQueryData',
            payload: {}
        });
    }

    handleTimePickerChanges(message) {
        switch ( message.action  ) {
            case 'SetDateRange':
                this.setDateRange(message.payload.newTime);
                break;
            case 'SetAutoRefreshConfig':
                this.setAutoRefresh(message.payload);
                break;
            case 'RefreshDashboard':
                this.refresh();
                break;
        }
    }

    setDateRange(e: any) {
        this.store.dispatch(new UpdateDashboardTime({ start: e.startTimeDisplay, end: e.endTimeDisplay }));
    }

    setAutoRefresh(refresh) {
        this.store.dispatch(new UpdateDashboardAutoRefresh(refresh));
    }

    setTimezone(e: any) {
        this.store.dispatch(new UpdateDashboardTimeZone(e));
    }

    setTitle(e: any) {
        this.store.dispatch(new UpdateDashboardTitle(e));
    }

    receiveDashboardAction(event: any) {
        switch (event.action) {
            case 'clone':
                this.dbid = '_new_';
                const newTitle = 'Clone of ' + this.meta.title;
                this.setTitle(newTitle);
                this.location.replaceState('/d/' + this.dbid);
                this.dbOwner = this.user;
                break;
            case 'delete':
                this.openDashboardDeleteDialog();
                break;
        }
    }

    getOwnerFromPath(fullPath: string) {
        // ex path: /user/zb || /namespace/yamas/save-test2
        if (fullPath && fullPath.length) {
            const split = fullPath.split('/');
            if (split.length >= 3 && split[0] === '') {
                return '/' + split[1].toLowerCase() + '/' + split[2].toLowerCase();
                // return /user/zb || /namespace/yamas
            }
        }
        return '';
    }

    setWriteSpaces() {
        const writeSpaces = [];
        for (const ns of this.userNamespaces) {
            writeSpaces.push('/namespace/' + ns.name.toLowerCase());
        }
        writeSpaces.push(this.user);
        this.writeSpaces = writeSpaces;
    }

    doesUserHaveWriteAccess() {
        if (this.dbOwner && this.dbOwner.length) {
            return this.writeSpaces.includes(this.dbOwner);
        } else {
            return true;
        }
    }

    isDashboardDirty() {
        let widgetChange = !deepEqual(this.widgets, this.oldWidgets);
        let metaChange = !deepEqual(this.meta, this.oldMeta);

        // sometimes current dashboard is not loaded before loading new db
        if (this.widgets.length === 0 && Object.entries(this.meta).length === 0 && this.dbid !== '_new_') {
            widgetChange = false;
            metaChange = false;
        }

        const writeAccess = this.doesUserHaveWriteAccess();
        return (writeAccess && (widgetChange || metaChange));
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
        if (this.isDashboardDirty()) {
            $event.returnValue = true;
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
            if (dialog_out && dialog_out.delete) {
                // this does not work... calls non-existant api endpoint
                // this.store.dispatch(new DeleteDashboard(this.dbid));

                // Going to use a patchwork of calls to DBFS first (which has correct endpoints)
                // it will also update navigator cache in the process
                // THEN, make calls to Dashboard state

                // get the fullPath. We pass this to DBFS Resources for delete action
                const dbFullPath = this.store.selectSnapshot(DBState.getDashboardFullPath);
                // tell dashboard state we are starting delete process
                this.store.dispatch(new SetDashboardStatus('delete-progress', true));
                // start delete process from DBFS. This will update navigator data as well
                this.store.dispatch(new DbfsDeleteDashboard(dbFullPath, {})).subscribe( value => {
                    // delete was successful
                    // grab updated file record from DBFS cache, and pass to dashboard state
                    const details = this.store.selectSnapshot(DbfsResourcesState.getFileById(this.dbid));
                    // tell dashboard state it was success, passing updated file detail
                    this.store.dispatch(new DeleteDashboardSuccess(details));
                    this.location.replaceState('/d/' + this.dbid + details.fullPath);
                },
                err => {
                    // there was a problem, need to notify dashboard state
                    this.store.dispatch(new DeleteDashboardFail(err));
                },
                () => {
                    // console.log('COMPLETE');
                });
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.utilService.setTabTitle();
    }
}

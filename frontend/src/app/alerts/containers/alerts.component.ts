import {
    Component,
    ElementRef,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild,
    TemplateRef,
    Input,
    ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { Location } from '@angular/common';
import {
    MatMenuTrigger,
    MatPaginator,
    MatTableDataSource,
    MatSort,
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
    DialogPosition,
    MatSnackBar
} from '@angular/material';


import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpService } from '../../core/http/http.service';

import { Select, Store } from '@ngxs/store';


import {
    AlertsState,
    AlertModel,
    ASgenerateFakeAlerts,
    ASloadUserNamespaces,
    ASsetSelectedNamespace,
    ASsetAlertTypeFilter,
    LoadAlerts,
    DeleteAlerts,
    ToggleAlerts,
    SaveAlerts
} from '../state/alerts.state';
import { AlertState, SaveAlert } from '../state/alert.state';

import { SnoozeAlertDialogComponent } from '../components/snooze-alert-dialog/snooze-alert-dialog.component';
import { AlertConfigurationDialogComponent } from '../components/alert-configuration-dialog/alert-configuration-dialog.component';

@Component({
    selector: 'app-alerts',
    templateUrl: './alerts.component.html',
    styleUrls: []
})
export class AlertsComponent implements OnInit, OnDestroy {

    @HostBinding('class.alerts-container-component') private _hostClass = true;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) dataSourceSort: MatSort;

    @ViewChild('confirmDeleteDialog', {read: TemplateRef}) confirmDeleteDialogRef: TemplateRef<any>;

    @Input() response;

    // STATE
    private stateSubs = {};

    @Select(AlertsState.getLoaded) asLoaded$: Observable<any>;
    stateLoaded: any = {};

    @Select(AlertsState.getSelectedNamespace) asSelectedNamespace$: Observable<any>;
    // tslint:disable-next-line:no-inferrable-types
    selectedNamespace: string = '';

    @Select(AlertsState.getUserNamespaces) asUserNamespaces$: Observable<any[]>;
    userNamespaces: any[] = [];

    @Select(AlertsState.getAlertTypeFilter) asAlertTypeFilter$: Observable<string>;
    alertTypeFilter: any = false;

    @Select(AlertsState.getAlertTypeCounts) asAlertTypeCounts$: Observable<any>;
    alertTypeCounts: any = {};

    @Select(AlertState.getAlertDetails) alertDetail$: Observable<any>;

    // this gets dynamically selected depending on the tab filter.
    // see this.stateSubs['asActionResponse']
    // under the case 'setAlertTypeFilterSuccess'
    @Select(AlertsState.getAlerts) asAlerts$: Observable<any[]>;
    alerts: AlertModel[] = [];

    @Select(AlertsState.getActionStatus) status$: Observable<string>;

    // for the table datasource
    alertsDataSource; // dynamically gets reassigned after new alerts state is subscribed
    displayedColumns: string[] = [
        'select',
        'name',
        'alertGroupingRules',
        'contacts',
        'modified',
        'counts.bad',
        'counts.warn',
        'counts.good',
        'counts.snoozed',
        'sparkline',
        'actions'
    ];

    // for batch selection
    selection = new SelectionModel<AlertModel>(true, []);

    @Select(AlertsState.getActionResponse) asActionResponse$: Observable<any>;


    private _guid: any = false;
    get guid(): string {
        if (!this._guid) {
            this._guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                // tslint:disable-next-line:no-bitwise
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
                return v.toString(16);
            });
        }
        return this._guid;
    }

    // ALL namespaces are retrieved from somewhere else
    namespaces: any[] = [];

    alertFilterTypes = ['all', 'alerting', 'snoozed', 'disabled'];

    // SNOOZE dialog
    snoozeAlertDialog: MatDialogRef<SnoozeAlertDialogComponent> | null;

    createAlertDialog: MatDialogRef<AlertConfigurationDialogComponent> | null;

    // confirmDelete Dialog
    confirmDeleteDialog: MatDialogRef<TemplateRef<any>> | null;

    private routeSub: Subscription;

    constructor(
        private store: Store,
        private dialog: MatDialog,
        private httpService: HttpService,
        private snackBar: MatSnackBar,
        private  activatedRoute: ActivatedRoute,
        private router: Router,
        private cdRef: ChangeDetectorRef,
        private location: Location
    ) { }

    ngOnInit() {

        const self = this;

          // handle route for dashboardModule
          this.routeSub = this.activatedRoute.url.subscribe(url => {
            //console.log('current path', url);
            if (url.length === 2 && url[1].path === '_new_') {
                this.selectedNamespace = url[0].path;
                this.createAlert('metric', this.selectedNamespace);
            } else if (url.length > 2) {
                // load alert to edit
                this.httpService.getAlertDetailsById(url[0].path).subscribe(data=>{
                    this.openCreateAlertDialog(data);
                });                
            }
        });    

        this.stateSubs['asLoaded'] = this.asLoaded$.subscribe( data => {
            self.stateLoaded = data;
            if (!self.stateLoaded.userNamespaces) {
                self.store.dispatch(
                    new ASloadUserNamespaces({
                        guid: this.guid,
                        responseRequested: true
                    })
                );
            }
        });

        /*
        this.stateSubs['asSelectedNamespace'] = this.asSelectedNamespace$.subscribe( data => {
            self.selectedNamespace = data;
        });
        */

        this.stateSubs['asUserNamespaces'] = this.asUserNamespaces$.subscribe( data => {
            self.userNamespaces = data;
            //console.log("user naemspaces=", data);
            if ( data.length ) {
                this.loadAlerts(data[0].name);
            } else {
                this.alerts = [];
            }
            
        });

        this.stateSubs['asAlerts'] = this.asAlerts$.subscribe( alerts => {
            this.alerts = alerts;
            this.setTableDataSource();
        });

        this.stateSubs['status'] = this.status$.subscribe( status => {
            let message = '';
            switch( status ) {
                case 'add-success': 
                case 'update-success':
                    message = 'Alert has been ' + (status === 'add-success' ? 'created' : 'updated') + '.';
                    this.createAlertDialog.close();
                    break;
                case 'enable-success':
                    message = 'Alert has been enabled.';
                    break;
                case 'disable-success':
                    message = 'Alert has been disabled.';
                    break;
                case 'delete-success':
                    message = 'Alert has been deleted.';
                    break;
            }
            if ( message !== '') {
                this.snackBar.open(message, '', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    duration: 5000,
                    panelClass: 'info'
                });
            }
        });
        this.stateSubs['alert'] = this.alertDetail$.subscribe( alert => {
            //console.log("alert details", alert);
        });
    }

    loadAlerts(namespace) {
        this.selectedNamespace = namespace;
        this.store.dispatch(
            new LoadAlerts({namespace: namespace})
        );
    }

    ngOnDestroy() {
        this.stateSubs['asLoaded'].unsubscribe();
        //this.stateSubs['asSelectedNamespace'].unsubscribe();
        this.stateSubs['asUserNamespaces'].unsubscribe();
        //this.stateSubs['asAlertTypeFilter'].unsubscribe();
        //this.stateSubs['asAlertTypeCounts'].unsubscribe();
        this.stateSubs['asAlerts'].unsubscribe();
        this.stateSubs['status'].unsubscribe();
        //this.stateSubs['asActionResponse'].unsubscribe();
        this.stateSubs['alert'].unsubscribe();
        this.routeSub.unsubscribe();
    }

    /** privates */
    private setTableDataSource() {
        this.alertsDataSource = new MatTableDataSource<AlertModel>(this.alerts);
        this.alertsDataSource.paginator = this.paginator;
        this.alertsDataSource.sort = this.dataSourceSort;

        // console.log('DATA SOURCE', this.alertsDataSource);
    }

    /* Utilities */
    ensureMenuWidth(element: any) {
        // console.log('ENSURE WIDTH', element);
        element = <ElementRef>element._elementRef;
        return `${element.nativeElement.clientWidth}px`;
    }

    /** batch selection tools */

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.alertsDataSource.data.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.alertsDataSource.data.forEach(row => this.selection.select(row));
    }

    /** events */

    alertTabIndexChanged(event: any) {
        // console.log('ALERT TAB INDEX CHANGED', event);
        this.store.dispatch(
            new ASsetAlertTypeFilter(this.alertFilterTypes[event], {
                guid: this.guid,
                responseRequested: true
            })
        );
    }

    /** actions */

    /*
    openSnoozeAlertDialog(alertObj: any) {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        // dialogConf.width = '100%';
        // dialogConf.maxWidth = '600px';
        // dialogConf.height = 'auto';
        // dialogConf.hasBackdrop = true;
        // dialogConf.direction = 'ltr';
        // dialogConf.backdropClass = 'snooze-alert-dialog-backdrop';
        dialogConf.panelClass = 'snooze-alert-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.data = { alert: alertObj };

        this.snoozeAlertDialog = this.dialog.open(SnoozeAlertDialogComponent, dialogConf);
        // this.snoozeAlertDialog.updatePosition({ top: '48px' });
        this.snoozeAlertDialog.afterClosed().subscribe((dialog_out: any) => {
            // console.log('SNOOZE ALERT DIALOG [afterClosed]', dialog_out);
        });
    }
    */

    toggleAlert(alertObj: any) {
        this.store.dispatch(new ToggleAlerts(this.selectedNamespace, { data: [ { id: alertObj.id, enabled: !alertObj.enabled } ]}));
    }

    deleteAlert(alertObj: any) {
        this.confirmDeleteDialog = this.dialog.open(this.confirmDeleteDialogRef, {data: alertObj});
        this.confirmDeleteDialog.afterClosed().subscribe(event => {
            //console.log('CONFIRM DELETE DIALOG [afterClosed]', event);
            if ( event.deleted ) {
                this.store.dispatch(new DeleteAlerts(this.selectedNamespace, { data:[ alertObj.id ] }))
            }
        });
    }

    confirmAlertDelete(alertObj: any) {
        // do some delete logic here?
        this.confirmDeleteDialog.close({deleted: true});
    }

    editAlert(element: any) {
        this.location.go('a/'+element.id+'/'+element.naemspaces+'/'+element.name);
        this.httpService.getAlertDetailsById(element.id).subscribe(data=>{
            this.openCreateAlertDialog(data);
        });
    }

    createAlert(type: string, namespace: string) {
        const data = {
            alertType: type,
            namespace: namespace, 
            name: 'Untitled Alert' 
        }
        this.openCreateAlertDialog(data);
        this.location.go('a/'+namespace+'/_new_');
    }

    /* open create alert dialog */
    openCreateAlertDialog(data:any) {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = '100%';
        dialogConf.hasBackdrop = false;
        // dialogConf.direction = 'ltr';
        // dialogConf.backdropClass = 'snooze-alert-dialog-backdrop';
        dialogConf.panelClass = 'alert-configuration-dialog-panel';
        dialogConf.data = data;

        this.createAlertDialog = this.dialog.open(AlertConfigurationDialogComponent, dialogConf);
        // this.createAlertDialog.componentInstance.data = { action: "QueryData", data: {}};

        const sub = this.createAlertDialog.componentInstance.request.subscribe((message:any) => {
            switch ( message.action ) {
                case 'SaveAlert':
                    this.store.dispatch(new SaveAlerts(data.namespace, message.payload));
                    this.router.navigate(['a']);
                    break;
            }
        });
        // this.snoozeAlertDialog.updatePosition({ top: '48px' });
        this.createAlertDialog.afterClosed().subscribe((dialog_out: any) => {
            // this is when dialog is closed to return to summary page
            this.location.go('a');
        });
    }

}

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
    LoadUserNamespaces,
    LoadAlerts,
    DeleteAlerts,
    ToggleAlerts,
    SaveAlerts,
    SetNamespace
} from '../state/alerts.state';
import { AlertState, GetAlertDetailsById } from '../state/alert.state';

import { SnoozeAlertDialogComponent } from '../components/snooze-alert-dialog/snooze-alert-dialog.component';
import { AlertConfigurationDialogComponent } from '../components/alert-configuration-dialog/alert-configuration-dialog.component';

import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { RecipientType } from '../components/alert-configuration-dialog/children/recipients-manager/models';

import * as _moment from 'moment';
const moment = _moment;

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

    @Select(AlertsState.getLoaded) loaded$: Observable<any>;
    stateLoaded: any = {};

    @Select(AlertsState.getSelectedNamespace) selectedNamespace$: Observable<any>;
    // tslint:disable-next-line:no-inferrable-types
    selectedNamespace: string = '';

    @Select(AlertsState.getUserNamespaces) userNamespaces$: Observable<any[]>;
    userNamespaces: any[] = [];

    @Select(AlertState.getAlertDetails) alertDetail$: Observable<any>;

    // this gets dynamically selected depending on the tab filter.
    // see this.stateSubs['asActionResponse']
    // under the case 'setAlertTypeFilterSuccess'
    @Select(AlertsState.getAlerts) alerts$: Observable<any[]>;
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
        // 'sparkline' // hidden for now
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

    // tslint:disable-next-line:no-inferrable-types
    sparklineMenuOpen: boolean = false;
    sparklineDisplay: any = { label: '', value: ''};
    sparklineDisplayMenuOptions: any[] = [
        {
            label: '1 HR',
            value: '1HR'
        },
        {
            label: '2 HR',
            value: '2HR'
        },
        {
            label: '3 HR',
            value: '3HR'
        },
        {
            label: '6 HR',
            value: '6HR'
        },
        {
            label: '12 HR',
            value: '12HR'
        },
        {
            label: '24 HR',
            value: '24HR'
        }
    ];

    // tslint:disable-next-line:no-inferrable-types
    namespaceDropMenuOpen: boolean = false;

    constructor(
        private store: Store,
        private dialog: MatDialog,
        private httpService: HttpService,
        private snackBar: MatSnackBar,
        private  activatedRoute: ActivatedRoute,
        private router: Router,
        private cdRef: ChangeDetectorRef,
        private location: Location,
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer
    ) {
        this.sparklineDisplay = this.sparklineDisplayMenuOptions[0];

        // icons
        const svgIcons = ['email', 'http', 'oc', 'opsgenie', 'slack'];

        // add icons to registry... url has to be trusted
        for (const type of svgIcons) {
            matIconRegistry.addSvgIcon(
                type + '_contact',
                domSanitizer.bypassSecurityTrustResourceUrl('assets/' + type + '-contact.svg')
            );
        }
    }

    ngOnInit() {

        const self = this;

        this.stateSubs['loaded'] = this.loaded$.subscribe( data => {
            self.stateLoaded = data;
            if (!self.stateLoaded.userNamespaces) {
                self.store.dispatch(
                    new LoadUserNamespaces({
                        guid: this.guid,
                        responseRequested: true
                    })
                );
            }
        });

        this.stateSubs['selectedNamespace'] = this.selectedNamespace$.subscribe( data => {
            this.selectedNamespace = data;
            if ( this.selectedNamespace ) {
                this.store.dispatch(new LoadAlerts({namespace: this.selectedNamespace}));
            } else {
                this.alerts = [];
            }
        });

        this.stateSubs['userNamespaces'] = this.userNamespaces$.subscribe( data => {
            this.userNamespaces = data;
            if ( !this.selectedNamespace && data.length ) {
                this.store.dispatch(new SetNamespace(data[0].name));
            }
        });

        this.stateSubs['alerts'] = this.alerts$.subscribe( alerts => {
            this.alerts = alerts;
            this.setTableDataSource();
        });

        this.stateSubs['status'] = this.status$.subscribe( status => {
            let message = '';
            switch ( status ) {
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

        // edit alert
        this.stateSubs['alert'] = this.alertDetail$.subscribe( data => {
            const alertState = this.store.selectSnapshot(AlertState);
            if ( alertState.loaded ) {
                this.openAlertDialog(data);
            }
        });

        // handle route for dashboardModule
        this.routeSub = this.activatedRoute.url.subscribe(url => {
            if (url.length === 1 ) {
                this.store.dispatch(new SetNamespace(url[0].path));
            } else if (url.length === 2 && url[1].path === '_new_') {
                this.store.dispatch(new SetNamespace(url[0].path));
                // settimeout avoids angular expression check error
                setTimeout(() => this.createAlert('metric'));
            } else if (url.length > 2) {
                // load alert to edit
                // tslint:disable-next-line:radix
                this.store.dispatch(new GetAlertDetailsById(parseInt(url[0].path)));
            }
        });
    }

    loadAlerts(namespace) {
        this.store.dispatch(new SetNamespace(namespace));
    }

    ngOnDestroy() {
        this.stateSubs['loaded'].unsubscribe();
        this.stateSubs['selectedNamespace'].unsubscribe();
        this.stateSubs['userNamespaces'].unsubscribe();
        this.stateSubs['alerts'].unsubscribe();
        this.stateSubs['status'].unsubscribe();
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

    bulkDisableAlerts() {
        console.log('BULK DISABLE ALERTS');
        // BULK DISABLE
    }

    bulkDeleteAlerts() {
        console.log('BULK DELETE ALERTS');
        // BULK DELETE
    }

    toggleAlert(alertObj: any) {
        this.store.dispatch(new ToggleAlerts(this.selectedNamespace, { data: [ { id: alertObj.id, enabled: !alertObj.enabled } ]}));
    }

    confirmAlertDelete(alertObj: any) {
        this.confirmDeleteDialog.close({deleted: true});
    }

    deleteAlert(alertObj: any) {
        this.confirmDeleteDialog = this.dialog.open(this.confirmDeleteDialogRef, {data: alertObj});
        this.confirmDeleteDialog.afterClosed().subscribe(event => {
            // console.log('CONFIRM DELETE DIALOG [afterClosed]', event);
            if ( event.deleted ) {
                this.store.dispatch(new DeleteAlerts(this.selectedNamespace, { data: [ alertObj.id ] }));
            }
        });
    }

    editAlert(element: any) {
        this.location.go('a/' + element.id + '/' + element.namespace + '/' + element.slug);
        this.store.dispatch(new GetAlertDetailsById(element.id));
    }

    createAlert(type: string) {
        const data = {
            alertType: type,
            namespace: this.selectedNamespace,
            name: 'Untitled Alert'
        };
        this.openAlertDialog(data);
        this.location.go('a/' + this.selectedNamespace + '/_new_');
    }

    openAlertDialog(data: any) {
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

        const sub = this.createAlertDialog.componentInstance.request.subscribe((message: any) => {
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

    selectSparklineDisplayOption(option: any) {
        this.sparklineDisplay = option;
    }

    setNamespaceMenuOpened(opened: boolean) {
        this.namespaceDropMenuOpen = opened;
    }

    showAllNamespacesInMenu($event: any) {
        $event.stopPropagation();
        // set some flag
        // then change values of menu
    }

    setSparklineMenuOpened(opened: boolean) {
        this.sparklineMenuOpen = opened;
    }

    formatAlertTimeModified(element: any) {
        const time = moment(element.updatedTime);
        return time.format('YYYY-MM-DD HH:mm');
    }

    getRecipientKeys(element: any) {
        return Object.keys(element.recipients);
    }

    typeToDisplayName(type: string) {
        if (type === RecipientType.opsgenie) {
            return 'OpsGenie';
        } else if (type === RecipientType.slack) {
            return 'Slack';
        } else if (type === RecipientType.http) {
            return 'HTTP';
        } else if (type === RecipientType.oc) {
            return 'OC';
        } else if (type === RecipientType.email) {
            return 'Email';
        }
        return '';
    }

    contactMenuEsc($event: any) {
        console.log('contactMenuEsc', $event);
    }

}

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
    MatPaginator,
    MatTableDataSource,
    MatSort,
    MatDialog,
    MatDialogRef,
    MatSnackBar
} from '@angular/material';


import { Observable, Subscription, Subject } from 'rxjs';
import {  delayWhen, filter, skip, distinctUntilChanged } from 'rxjs/operators';
import { HttpService } from '../../core/http/http.service';

import { Select, Store } from '@ngxs/store';

import {
    AlertsState,
    AlertModel,
    LoadNamespaces,
    CheckWriteAccess,
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

import { CdkService } from '../../core/services/cdk.service';

import * as _moment from 'moment';
import { TemplatePortal } from '@angular/cdk/portal';
import { IntercomService } from '../../core/services/intercom.service';
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

    private subscription: Subscription = new Subscription();

    @Select(AlertsState.getLoaded) loaded$: Observable<any>;
    stateLoaded: any = {};

    @Select(AlertsState.getSelectedNamespace) selectedNamespace$: Observable<any>;
    selectedNamespace = '';

    hasNamespaceWriteAcess = false;

    @Select(AlertsState.getUserNamespaces) userNamespaces$: Observable<any[]>;
    userNamespaces: any[] = [];

    @Select(AlertsState.getAllNamespaces) allNamespaces$: Observable<any[]>;
    allNamespaces: any[] = [];

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
    @Select(AlertsState.getEditItem) editItem$: Observable<any>;
    @Select(AlertsState.getError) error$: Observable<any>;
    @Select(AlertsState.getSaveError) saveError$: Observable<any>;

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

    @ViewChild(AlertConfigurationDialogComponent) createAlertDialog: AlertConfigurationDialogComponent;
    editMode = false;
    configurationEditData: any = {};

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
    configLoaded$  = new Subject();

    error:any ;

    // portal templates
    @ViewChild('alertspageNavbarTmpl') alertspageNavbarTmpl: TemplateRef<any>;

    // portal placeholders
    alertspageNavbarPortal: TemplatePortal;

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
        private domSanitizer: DomSanitizer,
        private cdkService: CdkService,
        private interCom: IntercomService
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

        // setup navbar portal
        this.alertspageNavbarPortal = new TemplatePortal(this.alertspageNavbarTmpl, undefined, {});
        this.cdkService.setNavbarPortal(this.alertspageNavbarPortal);

        this.subscription.add(this.loaded$.subscribe( data => {
            this.stateLoaded = JSON.parse(JSON.stringify(data));
            if (!this.stateLoaded.userNamespaces) {
                this.store.dispatch(
                    new LoadNamespaces({
                        guid: this.guid,
                        responseRequested: true
                    })
                );
            }
        }));

        this.subscription.add(this.selectedNamespace$.subscribe( data => {
            this.selectedNamespace = data;
            if ( this.selectedNamespace ) {
                this.hasNamespaceWriteAcess = this.userNamespaces.find(d => d.name === this.selectedNamespace ) ? true : false;
                this.store.dispatch(new LoadAlerts({namespace: this.selectedNamespace}));
            } else {
                this.hasNamespaceWriteAcess = false;
                this.alerts = [];
            }
        }));

        this.subscription.add(this.allNamespaces$.subscribe( data => {
            this.allNamespaces = data;
        }));

        this.subscription.add(this.userNamespaces$.subscribe( data => {
             this.userNamespaces = data;
            if ( this.stateLoaded.userNamespaces ) {
                this.configLoaded$.next(true);
                this.configLoaded$.complete();
            }
        }));

        this.subscription.add(this.alerts$.pipe(skip(1)).subscribe( alerts => {
            this.stateLoaded.alerts = true;
            this.alerts = JSON.parse(JSON.stringify(alerts));
            this.setTableDataSource();
        }));

        this.subscription.add(this.status$.subscribe( status => {
            let message = '';
            switch ( status ) {
                case 'add-success':
                case 'update-success':
                    message = 'Alert has been ' + (status === 'add-success' ? 'created' : 'updated') + '.';
                    this.editMode = false;
                    this.router.navigate(['a']);
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
        }));

        this.subscription.add(this.editItem$.pipe(filter(data => Object.keys(data).length !== 0), distinctUntilChanged())
        .subscribe(data => {
            const _data = JSON.parse(JSON.stringify(data));
            if ( _data.id === '_new_' ) {
                const o = {
                    alertType: 'metric',
                    namespace: data.namespace,
                    name: 'Untitled Alert'
                }
                this.openAlertEditMode(o);
            } else {
                // set the namespace if the user comes directly from edit url
                if ( !this.selectedNamespace ) {
                    this.setNamespace(_data.namespace);
                }
                this.openAlertEditMode(_data);
            }
        }));

        this.subscription.add(this.error$.subscribe(error => {
            this.error = error;
            // maybe intercom error for messaging bar?
        }));

        this.subscription.add(this.saveError$.subscribe(error => {
            if (this.createAlertDialog ) {
                this.createAlertDialog.data.error = error;
            }
        }));


        // handle route for alerts
        this.subscription.add(this.activatedRoute.url.pipe(delayWhen(() => this.configLoaded$)).subscribe(url => {
            if (url.length === 1 ) {
                this.setNamespace(url[0].path);
            } else if (url.length === 2 && url[1].path === '_new_') {
                this.setNamespace(url[0].path);
                this.store.dispatch(new CheckWriteAccess({ namespace: url[0].path, id: '_new_'}));
            } else if (url.length > 2) {
                // load alert the alert
                this.store.dispatch(new GetAlertDetailsById(parseInt(url[0].path, 10)));
            } else if ( this.userNamespaces.length || this.allNamespaces.length ) {
                this.setNamespace( this.userNamespaces.length ? this.userNamespaces[0].name : this.allNamespaces[0].name);
            }
        }));

        // check the edit access. skips the first time with default value
        this.subscription.add(this.alertDetail$.pipe(skip(1)).subscribe( data => {
            this.store.dispatch(new CheckWriteAccess( data ));
        }));

    }

    setNamespace( namespace ) {
        if ( this.selectedNamespace !== namespace ) {
            this.store.dispatch(new SetNamespace(namespace));
        }
    }

    loadAlerts(namespace) {
        this.setNamespace(namespace);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    /** privates */
    private setTableDataSource() {
        this.alertsDataSource = new MatTableDataSource<AlertModel>(this.alerts);
        this.alertsDataSource.paginator = this.paginator;
        this.alertsDataSource.sort = this.dataSourceSort;
    }

    /* Utilities */
    ensureMenuWidth(element: any) {
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
    

    bulkDisableAlerts() {
        // BULK DISABLE
    }

    bulkDeleteAlerts() {
        // BULK DELETE
    }*/

    toggleAlert(alertObj: any) {
        this.store.dispatch(new ToggleAlerts(this.selectedNamespace, { data: [ { id: alertObj.id, enabled: !alertObj.enabled } ]}));
    }

    confirmAlertDelete(alertObj: any) {
        this.confirmDeleteDialog.close({deleted: true});
    }

    deleteAlert(alertObj: any) {
        this.confirmDeleteDialog = this.dialog.open(this.confirmDeleteDialogRef, {data: alertObj});
        this.confirmDeleteDialog.afterClosed().subscribe(event => {
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
        this.openAlertEditMode(data);
        this.location.go('a/' + this.selectedNamespace + '/_new_');
    }

    openAlertEditMode(data: any) {

        this.configurationEditData = data;
        this.editMode = true;

    }

    configurationEdit_change(message: any) {
        switch ( message.action ) {
            case 'SaveAlert':
                // lets save this thing
                this.store.dispatch(new SaveAlerts(message.namespace, message.payload));
                break;
            case 'CancelEdit':
            default:
                // this is when dialog is closed to return to summary page
                this.location.go('a');
                this.editMode = false;
                break;
        }
    }

    selectSparklineDisplayOption(option: any) {
        this.sparklineDisplay = option;
    }

    setNamespaceMenuOpened(opened: boolean) {
        this.namespaceDropMenuOpen = opened;
    }

    showAllNamespacesInMenu($event: any) {
        // $event.stopPropagation();
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
        // extract keys
        const objKeys = Object.keys(element.recipients);
        // need to filter out junk entries
        const validKeys = objKeys.filter( val => RecipientType[val] !== undefined );
        // return values
        return validKeys;
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
        // console.log('contactMenuEsc', $event);
    }

}

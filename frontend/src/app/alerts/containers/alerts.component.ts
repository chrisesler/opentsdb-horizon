import {
    Component,
    ElementRef,
    HostBinding,
    OnDestroy,
    OnInit,
    ViewChild
} from '@angular/core';

import {
    MatMenuTrigger,
    MatPaginator,
    MatTableDataSource,
    MatSort
} from '@angular/material';

import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
    Select,
    Store
} from '@ngxs/store';

import {
    AlertsState,
    AlertModel,
    ASgenerateFakeAlerts,
    ASloadUserNamespaces,
    ASsetSelectedNamespace,
    ASsetAlertTypeFilter
} from '../state/alerts.state';

@Component({
    selector: 'app-alerts',
    templateUrl: './alerts.component.html',
    styleUrls: []
})
export class AlertsComponent implements OnInit, OnDestroy {

    @HostBinding('class.alerts-container-component') private _hostClass = true;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) dataSourceSort: MatSort;

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


    // @Select(AlertsState.getAlerts('all')) asAlerts$: Observable<any[]>;
    asAlerts$: Observable<any[]>;
    alerts: AlertModel[] = [];

    // for the table
    // alertsDataSource = [];

    alertsDataSource;
    displayedColumns: string[] = ['counts.bad', 'counts.warn', 'counts.good', 'counts.snoozed', 'name'];

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

    constructor(
        private store: Store
    ) { }

    ngOnInit() {

        const self = this;

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

        this.stateSubs['asSelectedNamespace'] = this.asSelectedNamespace$.subscribe( data => {
            self.selectedNamespace = data;
        });

        this.stateSubs['asUserNamespaces'] = this.asUserNamespaces$.subscribe( data => {
            self.userNamespaces = data;
        });

        this.stateSubs['asAlertTypeFilter'] = this.asAlertTypeFilter$.subscribe( data => {
            // console.log('ALERTS FILTER CHANGED', data);

            self.alertTypeFilter = data;

        });

        this.stateSubs['asAlertTypeCounts'] = this.asAlertTypeCounts$.subscribe( data => {
            // console.log('ALERTS TYPE COUNTS CHANGED', data);
            self.alertTypeCounts = data;
        });

        this.asAlerts$ = this.store.select(AlertsState.getAlerts('all'));
        this.stateSubs['asAlerts'] = this.asAlerts$.subscribe( alerts => {
            // console.log('ALERTS CHANGED', alerts);
            self.alerts = alerts;
            self.setTableDataSource();
        });

        this.stateSubs['asActionResponse'] = this.asActionResponse$.subscribe( event => {
            // console.log('************************* ACTION RESPONSE *************************', event);
            if (event.guid && event.guid === this.guid) {
                switch (event.action) {
                    case 'loadUserNamespacesSuccess':
                        self.store.dispatch(
                            new ASgenerateFakeAlerts()
                        );
                        break;
                    case 'setAlertTypeFilterSuccess':
                        if (self.stateSubs['asAlerts']) {
                            self.stateSubs['asAlerts'].unsubscribe();
                        }
                        self.asAlerts$ = self.store.select(AlertsState.getAlerts(self.alertTypeFilter));
                        self.stateSubs['asAlerts'] = self.asAlerts$.subscribe( alerts => {
                            // console.log('ALERTS CHANGED', alerts);
                            self.alerts = alerts;
                            self.setTableDataSource();
                        });
                        break;
                    default:
                        break;
                }
            }
        });
    }

    ngOnDestroy() {
        this.stateSubs['asLoaded'].unsubscribe();
        this.stateSubs['asSelectedNamespace'].unsubscribe();
        this.stateSubs['asUserNamespaces'].unsubscribe();
        this.stateSubs['asAlertTypeFilter'].unsubscribe();
        this.stateSubs['asAlertTypeCounts'].unsubscribe();
        this.stateSubs['asAlerts'].unsubscribe();
        this.stateSubs['asActionResponse'].unsubscribe();
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

}

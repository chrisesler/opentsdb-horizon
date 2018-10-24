import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    ViewChild
} from '@angular/core';

import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
    DialogPosition,
    MatMenuTrigger
} from '@angular/material';

import { DashboardSaveDialogComponent } from '../dashboard-save-dialog/dashboard-save-dialog.component';

import { Subscription } from 'rxjs';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'navbar-dashboard-actions-menu',
    templateUrl: './navbar-dashboard-actions-menu.component.html',
    styleUrls: []
})
export class NavbarDashboardActionsMenuComponent implements OnInit {

    @HostBinding('class.navbar-dashboard-actions-menu') private _hostClass = true;

    @Input() dbSettingsMeta: any = {};

    // dashboard action menu trigger
    @ViewChild('actionMenuTrigger', {read: MatMenuTrigger}) actionMenuTrigger: MatMenuTrigger;

    get actionMenuIsOpen(): boolean {
        if (this.actionMenuTrigger) {
            return this.actionMenuTrigger.menuOpen;
        }
        return false;
    }

    @Output() dashboardAction: any = new EventEmitter();

    /** Dialogs */
    dashboardSaveDialog: MatDialogRef<DashboardSaveDialogComponent> | null;

    // NOTE: change this bool back to false
    // tslint:disable-next-line:no-inferrable-types
    @Input() needsSaving: boolean = true; // false default, true triggers visibility

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
    }

    // NOTE:: these three click actions should probably intercom the dashboard container instead of emitting
    click_cloneDashboard(event: any) {
        this.dashboardAction.emit({
            action: 'clone'
        });
    }

    click_shareDashboard(event: any) {
        this.dashboardAction.emit({
            action: 'share'
        });
    }

    click_deleteDashboard(event: any) {
        this.dashboardAction.emit({
            action: 'delete'
        });
    }

    /** SAVE DASHBOARD */

    click_saveDashboard(event: any) {
        console.log('%cCLICK SAVE BUTTON [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;', event);
        // save dashboard

        // check if first time saving

        // if first time saving, prompt first save dialog
        this.showFirstSaveDialog();
        // if not first time, then just save it
        // this.triggerSaveAction();
    }

    private showFirstSaveDialog() {

        // do something
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.backdropClass = 'dashboard-save-dialog-backdrop';
        dialogConf.hasBackdrop = true;
        dialogConf.panelClass = 'dashboard-save-dialog-panel';

        dialogConf.autoFocus = true;

        // NOTE: this needs to be wired to the dasboard JSON/Config
        // should be the dashboard.settings piece
        dialogConf.data = this.dbSettingsMeta;

        this.dashboardSaveDialog = this.dialog.open(DashboardSaveDialogComponent, dialogConf);
        // this.dashboardSaveDialog.updatePosition({top: '48px'});

        // getting data passing out from dialog
        this.dashboardSaveDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('%cSAVE DIALOG CLOSED [EVENT]', 'color: #ffffff; background-color: blue; padding: 2px 4px;', dialog_out);

            // save the dashboard now
            // intercom to dashboard container
            this.triggerSaveAction(dialog_out);
        });
    }

    private triggerSaveAction(data?: any) {
        const payload = { updateFirst: false };

        if (data) {
            payload.updateFirst = true;
            payload['meta'] = data;
        }

        this.interCom.requestSend(<IMessage> {
            id: 'saveButton',
            action: 'dashboardSaveRequest',
            payload: payload
        });

    }



}

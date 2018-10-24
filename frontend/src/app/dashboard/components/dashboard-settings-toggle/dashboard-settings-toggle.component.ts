import {
    Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';

import {
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { DashboardSettingsDialogComponent } from '../dashboard-settings-dialog/dashboard-settings-dialog.component';

import { Subscription } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-settings-toggle',
    templateUrl: './dashboard-settings-toggle.component.html',
    styleUrls: []
})
export class DashboardSettingsToggleComponent implements OnInit {

    @HostBinding('class.dashboard-settings-toggle') private _hostClass = true;

    /** Dialogs */
    dashboardSettingsDialog: MatDialogRef<DashboardSettingsDialogComponent> | null;
    dashboardSettingsDialogSub: Subscription;

    constructor(
        public dialog: MatDialog
    ) { }

    ngOnInit() {
    }

    showDashboardSettingsDialog() {
        console.log('SHOW DASHBOARD SETTINGS DIALOG');
        // do something
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'dashboad-settings-dialog-backdrop';
        dialogConf.panelClass = 'dashboard-settings-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.autoFocus = false;

        this.dashboardSettingsDialog = this.dialog.open(DashboardSettingsDialogComponent, dialogConf);
        this.dashboardSettingsDialog.updatePosition({top: '48px'});

        // getting data passing out from dialog
        this.dashboardSettingsDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('return', dialog_out);
        });
    }

}

import { Component, Inject, OnInit, HostBinding } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition, MatSort, MatTableDataSource } from '@angular/material';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dashboard-settings-dialog',
    templateUrl: './dashboard-settings-dialog.component.html',
    styleUrls: []
})
export class DashboardSettingsDialogComponent implements OnInit {
    @HostBinding('class.dashboard-settings-dialog') private _hostClass = true;

    /** local variables */
    selectedSettingPanel: any = 0; // 0-4 are array indexes from array below, 'admin' is special case

    // NOTE: admin is a special case that has to check if user is dashboard owner. So it will not be in the list.

    // navigation panel options, index is used for determining which nav item is opened
    panelSections: Array<any> = [
        {
            label: 'General',
            tab: 'general',
            idx: 0
        },
        {
            label: 'Annotations',
            tab: 'annotations',
            idx: 1
        },
        {
            label: 'Variables',
            tab: 'variables',
            idx: 2
        },
        {
            label: 'Permissions',
            tab: 'permissions',
            idx: 3
        },
        {
            label: 'View JSON',
            tab: 'view-json',
            idx: 4
        }
    ];

    constructor(
        public dialogRef: MatDialogRef<DashboardSettingsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog_data: any
    ) { }

    ngOnInit() {
    }

    /**
     * Behaviors
     */

    selectSettingPanel(panelId: any) {
        this.selectedSettingPanel = panelId;
    }

    // handle when clicked on cancel
    onClick_Cancel(): void {
        this.dialogRef.close();
    }

    // handle when clicked on apply
    onClick_Apply(): any {
        // NOTE: Not sure emit is needed. Might be ok to just pass data from the close action.
        // this.onDialogApply.emit({
        //    action: 'applyDialog',
        //    data: this.dialog_data
        // });
        this.dialogRef.close({});
    }

}

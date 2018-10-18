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
            label: 'Meta data',
            tab: 'meta',
            idx: 0
        },
        {
            label: 'Variables',
            tab: 'variables',
            idx: 1
        },
        {
            label: 'JSON',
            tab: 'json',
            idx: 2
        }
    ];

    constructor(
        public dialogRef: MatDialogRef<DashboardSettingsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dbData: any
    ) {}

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


    settingsDataUpdated(e: any) {
        // SETTINGS UPDATED
        console.log('SETTINGS UPDATED', e);
    }

}

import {
    Component,
    OnInit,
    OnDestroy,
    Inject,
    HostBinding,
    ViewChild,
    ElementRef,
    AfterViewInit
} from '@angular/core';

import { FormControl } from '@angular/forms';

import {
    MatDialog,
    MatDialogConfig,
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material';

import { Subscription, Observable } from 'rxjs';

import { NameAlertDialogComponent } from '../name-alert-dialog/name-alert-dialog.component';

@Component({
    selector: 'app-alert-configuration-dialog',
    templateUrl: './alert-configuration-dialog.component.html',
    styleUrls: []
})
export class AlertConfigurationDialogComponent implements OnInit, OnDestroy, AfterViewInit {


    @HostBinding('class.alert-configuration-dialog-component') private _hostClass = true;

    nameAlertDialog: MatDialogRef<NameAlertDialogComponent> | null;

    data: any = {
        namespace: 'UDB',
        alertName: 'Untitled Alert',
        queries: []
    };

    // TODO: remove this
    fakeQuery: any = {
        namespace: 'udb',
        metrics: [
            {
                name: 'udb.metricThing.someMetric'
            },
            {
                name: 'udb.metricThing.someMetricThing'
            },
            {
                name: 'udb.metricThing.someMetricOverThere'
            }
        ],
        filters: [],
        settings: {
            visual: {
                visible: true
            }
        }
    };

    // tslint:disable-next-line:no-inferrable-types
    selectedThresholdType: string = 'simple';

    alertName: FormControl = new FormControl('');

    subs: any = {};

    // tslint:disable-next-line:no-inferrable-types
    activeTabIndex: number = 0;

    constructor(
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<AlertConfigurationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any
    ) {
        this.data = dialogData;
        if (this.data.alertName) {
            this.alertName.setValue(this.data.alertName);
        }
    }

    ngOnInit() {
        if (!this.data.alertName || this.data.alertName === '') {
            // have to use setTimeout due to some issue when opening mat-dialog from a lifecycle hook.
            // see: https://github.com/angular/material2/issues/5268
            // setTimeout(() => this.openAlertNameDialog());
        }
    }

    ngOnDestroy() {
        this.subs.alertName.unscubscribe();
    }

    ngAfterViewInit() {
        // this.measureDetailForBalancer();
    }

    /** Events */
    /*configTabChange(index: any) {
        console.log('CONFIG TAB CHANGE', index);
        this.activeTabIndex = index;
    }*/

    changeThresholdType(thresholdType: string) {
        this.selectedThresholdType = thresholdType;
    }

    /** Privates */

    private openAlertNameDialog() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        dialogConf.width = '300px';
        // dialogConf.maxWidth = '600px';
        // dialogConf.height = 'auto';
        // dialogConf.hasBackdrop = true;
        // dialogConf.direction = 'ltr';
        // dialogConf.backdropClass = 'snooze-alert-dialog-backdrop';
        dialogConf.panelClass = 'name-alert-dialog-panel';
        /*dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };*/

        this.nameAlertDialog = this.dialog.open(NameAlertDialogComponent, dialogConf);
        // this.snoozeAlertDialog.updatePosition({ top: '48px' });
        this.nameAlertDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('NAME ALERT DIALOG [afterClosed]', dialog_out);
            if (dialog_out && dialog_out.alertName) {
                this.data.alertName = dialog_out.alertName;
                this.alertName.setValue(this.data.alertName);
            } else {
                this.dialogRef.close();
            }
        });
    }

}

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

import { FormBuilder, FormGroup, FormArray, FormControl, Validators, FormsModule, NgForm } from '@angular/forms';

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material';

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

    // tslint:disable-next-line:no-inferrable-types
    showThresholdAdvanced: boolean = false;

    // FORM STUFF
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    alertForm: FormGroup;
    alertFormSub: Subscription;

    // SUBSCRIPTIONS HOLDER
    subs: any = {};

    // tslint:disable-next-line:no-inferrable-types
    activeTabIndex: number = 0;

    constructor(
        private fb: FormBuilder,
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<AlertConfigurationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any
    ) {
        this.data = dialogData;
        if (this.data.alertName) {
            this.alertName.setValue(this.data.alertName);
        }
        this.setupForm();
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

    setupForm() {
        // TODO: need to check if there is something in this.data
        this.alertForm = this.fb.group({
            queries: this.fb.group({
                groupingRules: this.fb.array([])
            }),
            threshold: this.fb.group({
                type: 'simple',
                query: '',
                badStateValue: '',
                warningStateValue: '',
                recoveryNotification: 'minimum', // minimum or specific
                recoveryStateValue: '', // if recoveryNotification is 'specific'
                nagInterval: 'disabled',
                missingData: 'doNotNotify',
                slidingWindow: this.fb.group({
                    direction: 'above',
                    interval: 1,
                    windowSize: '5 min'
                })
            }),
            notification: this.fb.group({
                notifyWhen: new FormControl([]),
                recipients: this.fb.array([]),
                subject: '',
                message: '',
                labels: this.fb.array([]),
                runbookId: ''
            })
        });

        this.alertFormSub = this.alertForm.valueChanges.subscribe( val => {
            console.log('FORM CHANGE', val);
        });

    }

    get thresholdControls() {
        return this.alertForm['controls'].threshold['controls'];
    }

    get thresholdType() {
        return this.thresholdControls.type.value;
    }

    get thresholdRecoveryNotification() {
        return this.alertForm.get('threshold').get('recoveryNotification').value;
    }

    get groupRulesLabelValues() {
        return this.alertForm['controls'].queries.get('groupingRules');
    }

    get notificationLabelValues() {
        return this.alertForm['controls'].notification.get('labels');
    }

    get alertStateDirection() {
        return this.alertForm.get('threshold').get('slidingWindow').get('direction').value;
    }

    get recoveryStateDirection() {
        const valCheck = this.alertForm.get('threshold').get('slidingWindow').get('direction').value;
        if (valCheck === 'above') {
            return 'below';
        }
        return 'above';
    }

    /** Events */

    removeNotificationLabelValue(i: number) {
        const control = <FormArray>this.notificationLabelValues;
        control.removeAt(i);
    }

    addNotificationLabelValue(event: MatChipInputEvent) {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            const control = <FormArray>this.notificationLabelValues;
            control.push(new FormControl(value.trim()));
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }

    removeQueryGroupRuleValue(i: number) {
        const control = <FormArray>this.groupRulesLabelValues;
        control.removeAt(i);
    }

    addQueryGroupRuleValue(event: MatChipInputEvent) {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            const control = <FormArray>this.groupRulesLabelValues;
            control.push(new FormControl(value.trim()));
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }

    recoveryNotificationChange(event: any) {
        const control = <FormControl>this.alertForm.get('threshold')['controls'].recoveryNotification;
        control.setValue(event.value);
    }

    /** Privates */

    private openAlertNameDialog() {
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.autoFocus = false;
        dialogConf.width = '300px';
        dialogConf.panelClass = 'name-alert-dialog-panel';

        this.nameAlertDialog = this.dialog.open(NameAlertDialogComponent, dialogConf);

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

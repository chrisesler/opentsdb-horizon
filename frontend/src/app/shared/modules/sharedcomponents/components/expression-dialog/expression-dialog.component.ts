import {
    Component, Inject, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy
} from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';

import {
    MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogConfig, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

import { Subscription } from 'rxjs';

import { HttpService } from '../../../../../core/http/http.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'expression-dialog',
    templateUrl: './expression-dialog.component.html',
    styleUrls: []
})
export class ExpressionDialogComponent implements OnInit, OnDestroy {
    @HostBinding('class.metric-expression-dialog') private _hostClass = true;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: Subscription;

    /** Local variables */
    modGroup: any; // current group that is adding metric
    mgroupId = undefined;

    /** Form Group */
    metricExpressionForm: FormGroup;

    // subscriptions
    metricExpressionForm_Sub: Subscription;

    // form values
    expressionName: string;
    expressionValue: string;

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService,
        public dialogRef: MatDialogRef<SearchMetricsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog_data: any,
        private httpService: HttpService,
        private dataTransformerService: DatatranformerService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.createForm();
        console.log('%cDIALOG DATA', 'background: lime; color: white;', this.dialog_data.groupQueries.metrics);
    }

    ngOnDestroy() {
        // destroy any subscriptions
        this.metricExpressionForm_Sub.unsubscribe();
    }

    createForm() {
        this.metricExpressionForm = this.fb.group({
            expressionName:     new FormControl('untitled expression'),
            expressionValue:    new FormControl('')
        });

        // JUST CHECKING VALUES
        this.metricExpressionForm_Sub = this.metricExpressionForm.valueChanges.subscribe(function(data) {
            console.log('METRIC EXPRESSION CHANGES', data, this.widgetConfigAxes);
        }.bind(this));
    }

    /**
     * Services
     */


    /**
     * Dialogs
     */

    // opens the dialog window to search and add metrics
    openTimeSeriesMetricDialog(mgroupId: string) {
        // do something
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'search-metrics-dialog-backdrop';
        dialogConf.panelClass = 'search-metrics-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.data = { mgroupId };

        this.searchMetricsDialog = this.dialog.open(SearchMetricsDialogComponent, dialogConf);
        this.searchMetricsDialog.updatePosition({top: '48px'});
        // custom emit event on the dialog, comment out but dont delete
        // this.searchDialogSub = this.searchMetricsDialog.componentInstance.onDialogApply.subscribe((data: any) => {
        //    console.log('SUBSCRIPTION DATA', data);
        // });
        // getting data passing out from dialog
        this.searchMetricsDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('searchMetricsDialog::afterClosed', dialog_out);
        });
    }

    /**
     * Behaviors
     */

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
        this.dialogRef.close({ mgroup: 'NEEDED TO BE RETURNED' });
    }

     /**
     * Individual Events
     */

     /**
     * Batch Events
     */

     /**
     * Other
     */

}

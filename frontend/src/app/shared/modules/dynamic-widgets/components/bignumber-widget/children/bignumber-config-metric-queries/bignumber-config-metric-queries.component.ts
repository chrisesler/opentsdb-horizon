import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';

import {MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';

import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
// tslint:disable-next-line:max-line-length
import {SearchMetricsDialogComponent} from '../../../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import {ExpressionDialogComponent} from '../../../../../sharedcomponents/components/expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';

@Component({
  selector: 'bignumber-config-metric-queries',
  templateUrl: './bignumber-config-metric-queries.component.html',
  styleUrls: ['./bignumber-config-metric-queries.component.scss']
})
export class BignumberConfigMetricQueriesComponent  implements OnInit, OnDestroy {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.bignumber-config-metric-queries-configuration') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: Subscription;

    // expression
    metricExpressionDialog: MatDialogRef<ExpressionDialogComponent> | null;
    metricExpressionDialogSub: Subscription;

    /** Local variables */

    modGroup: any; // current group that is adding metric
    mgroupId = undefined;

    selectAllToggle: String = 'none'; // none/all/some

    constructor(public dialog: MatDialog) { }

    ngOnInit() {
    }
    /*
    ngOnChanges( changes: SimpleChanges) {
        if (changes.widget) {
            if (this.gForms) {
                this.subscription.unsubscribe();
                this.gForms.setControl('0', this.createFormArray(changes.widget.currentValue.query.groups[0].queries));

            } else {
                this.gForms = new FormGroup({});
                this.gForms.addControl('0', this.createFormArray(changes.widget.currentValue.query.groups[0].queries));
            }
            this.subscribeFormChanges();
        }
    }

    subscribeFormChanges() {
        setTimeout(() => {
            this.subscription = this.gForms.valueChanges.subscribe(data => {
                const gid = this.widget.query.groups[0].id;
                this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: 0, data: data[0] }});
            });
         }, 100);
    }
    */

    setAggregator( index, value ) {
        const visuals = [];
        const gIndex = 0;
        const queries = this.widget.query.groups[gIndex].queries;
        for ( let i = 0; i < queries.length; i++ ) {
            visuals.push( {...queries[i].settings.visual} );
        }
        visuals[index].aggregator = value;
        this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: 0, data: visuals }});
    }

    deleteQuery( index ) {
        this.widgetChange.emit( {'action': 'DeleteQuery', payload: { index: index }});
    }

    toggleQuery( index ) {
        this.widgetChange.emit( {'action': 'ToggleQuery', payload: { index: index }});
    }

    openTimeSeriesMetricDialog() {
        const mgroupId = this.widget.query.groups.length ? this.widget.query.groups[0].id : 'new';
        // console.log('%cMGROUP', 'background: purple; color: white;', mgroupId);
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
            this.modGroup = dialog_out.mgroup;
            this.widgetChange.emit({action: 'AddMetricsToGroup', payload: { data: this.modGroup }});
            console.log('return dialog', dialog_out );
        });
    }

    createFormArray(queries): FormArray {
        return new FormArray(queries.map(item => new FormGroup({
            aggregator: new FormControl(item.settings.visual.aggregator)
        })));
    }

    querySelected(queryId: string) {
        this.widgetChange.emit({action: 'SetSelectedQuery', payload: { data: queryId }});
    }

    ngOnDestroy() {
    }
}

import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';

import {MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';

import {SearchMetricsDialogComponent} from '../../../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import {ExpressionDialogComponent} from '../../../../../sharedcomponents/components/expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';

@Component({
  selector: 'barchart-config-metric-queries',
  templateUrl: './barchart-config-metric-queries.component.html',
  styleUrls: ['./barchart-config-metric-queries.component.scss']
})
export class BarchartConfigMetricQueriesComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.barchart-config-metric-queries-configuration') private _tabClass = true;

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

    // lookup table for selected icons
    // primarily for checkboxes that have intermediate states
    selectedToggleIcon: any = {
        'none': 'check_box_outline_blank',
        'all': 'check_box',
        'some': 'indeterminate_check_box'
    };
    selectAllToggle: String = 'none'; // none/all/some


    constructor(public dialog: MatDialog) { }

    ngOnInit() {
    }

    ngOnChanges( changes: SimpleChanges) {
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
            // console.log('return dialog', dialog_out );
        });
    }

    setAggregator(index, value) {
        const visuals = [];
        const gIndex = 0;
        const queries = this.widget.query.groups[gIndex].queries;
        for ( let i = 0; i < queries.length; i++ ) {
            visuals.push( {...queries[i].settings.visual} );
        }
        visuals[index].aggregator = value;
        this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: gIndex, data: visuals }});
    }

    deleteQuery( index ) {
        this.widgetChange.emit( {'action': 'DeleteGroupQuery', payload: { gIndex: 0, index: index }});
    }

    toggleQuery( gIndex, index ) {
        this.widgetChange.emit( {'action': 'ToggleGroupQuery', payload: { gIndex: gIndex, index: index }});
    }

    toggleGroup ( gIndex, index ) {
        this.widgetChange.emit( {'action': 'ToggleGroup', payload: { gIndex: gIndex }});
    }

    ngOnDestroy() {
    }

}

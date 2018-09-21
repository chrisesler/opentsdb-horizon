import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';

import {MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';

import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import {SearchMetricsDialogComponent} from '../../../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import {ExpressionDialogComponent} from '../../../../../sharedcomponents/components/expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';
import { group } from '../../../../../../../../../node_modules/@angular/animations';
import { UtilsService } from '../../../../../../../core/services/utils.service';

@Component({
  selector: 'stacked-barchart-config-metric-queries',
  templateUrl: './stacked-barchart-config-metric-queries.component.html',
  styleUrls: ['./stacked-barchart-config-metric-queries.component.scss']
})
export class StackedBarchartConfigMetricQueriesComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.stacked-barchart-config-metric-queries-configuration') private _tabClass = true;

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

    gStackForm: FormGroup;
    stackSubs: Subscription;
    showColorPickerIndex = -1;
    stacks: any = {};

    constructor(public dialog: MatDialog, private fb: FormBuilder, private util: UtilsService) { }

    ngOnInit() {
    }

    ngOnChanges( changes: SimpleChanges) {
        if (changes.widget) {
            if (this.gStackForm) {
                this.gStackForm.setControl( '0', this.createStackFormArray());
            } else {
                this.gStackForm = new FormGroup({});
                this.gStackForm.setControl( '0', this.createStackFormArray());
            }
            this.subscribeStackFormChanges();

            for ( let i = 0; i < this.widget.query.settings.visual.stacks.length; i++ ) {
                const stack = this.widget.query.settings.visual.stacks[i];
                this.stacks[stack.id] = stack;
            }
        }
    }

    subscribeStackFormChanges() {
        setTimeout(() => {
            this.stackSubs = this.gStackForm.valueChanges.subscribe(data=>{
                console.log("stack form changes...", data[0]);
                this.widgetChange.emit( { action: 'SetStackedBarStackVisuals', payload: { data: data[0]}} );
            });
         }, 100);
    }

    openColorPopup(index) {
        this.showColorPickerIndex = index !== this.showColorPickerIndex ? index : -1;
    }

    selectColor(index, color) {
        this.gStackForm.controls['0']['controls'][index]['controls'].color.setValue(color.hex);
        this.showColorPickerIndex = -1;
    }

    setAggregator(gIndex, index, value) {
        const visuals = [];
        const queries = this.widget.query.groups[gIndex].queries;
        console.log(gIndex, index, value);
        for ( let i = 0; i < queries.length; i++ ) {
            visuals.push( {...queries[i].settings.visual} );
        }
        visuals[index].aggregator = value;
        this.widgetChange.emit( {'action': 'SetStackedBarVisualization', payload: { gIndex: gIndex, data: visuals }});
    }

    swapStack(gIndex, index, newValue ) {
        const visuals = [];
        const queries = this.widget.query.groups[gIndex].queries;
        console.log(gIndex, index, newValue);
        for ( let i = 0; i < queries.length; i++ ) {
            visuals.push( {...queries[i].settings.visual} );
        }
        const oldValue = this.widget.query.groups[gIndex].queries[index].settings.visual.stack;
        const swapIndex = visuals.findIndex(d => d.stack === newValue);
        visuals[index].stack = newValue;
        visuals[swapIndex].stack = oldValue;
        this.widgetChange.emit( {'action': 'SetStackedBarVisualization', payload: { gIndex: gIndex, data: visuals }});
    }

    deleteGroup( gIndex ) {
        this.widgetChange.emit( {'action': 'DeleteGroup', payload: { gIndex: gIndex }});
    }

    deleteGroupQuery( gIndex, index ) {
        this.widgetChange.emit( {'action': 'DeleteGroupQuery', payload: { gIndex: gIndex, index: index }});
    }

    toggleGroup( gIndex ) {
        this.widgetChange.emit( {'action': 'ToggleGroup', payload: { gIndex: gIndex }});
    }

    toggleGroupQuery( gIndex, index ) {
        this.widgetChange.emit( {'action': 'ToggleGroupQuery', payload: { gIndex: gIndex, index: index }});
    }

    openTimeSeriesMetricDialog(mgroupId) {
        mgroupId = mgroupId ? mgroupId : 'new';
        console.log('%cMGROUP', 'background: purple; color: white;', mgroupId);
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

    createStackFormArray(): FormArray {
                return new FormArray(this.widget.query.settings.visual.stacks.map(item => new FormGroup({
                    id: new FormControl(item.id),
                    label : new FormControl(item.label),
                    color : new FormControl(item.color)
                })));
    }

    ngOnDestroy() {
        this.stackSubs.unsubscribe();
    }

}

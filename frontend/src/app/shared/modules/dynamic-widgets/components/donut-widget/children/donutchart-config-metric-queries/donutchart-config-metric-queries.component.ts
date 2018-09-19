import { Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';

import {MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';

import { FormArray, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import {SearchMetricsDialogComponent} from '../../../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import {ExpressionDialogComponent} from '../../../../../sharedcomponents/components/expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';

@Component({
  selector: 'donutchart-config-metric-queries',
  templateUrl: './donutchart-config-metric-queries.component.html',
  styleUrls: ['./donutchart-config-metric-queries.component.scss']
})
export class DonutchartConfigMetricQueriesComponent implements OnInit, OnChanges {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.donutchart-config-metric-queries-configuration') private _tabClass = true;

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
    showColorPickerIndex = -1;
    gForms: FormGroup;
    subscription: Subscription;

    constructor(public dialog: MatDialog, private fb: FormBuilder) { }

    ngOnInit() {
        
        //this.gForms.addControl('0', this.createFormArray());
        

        
        
    }

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
        setTimeout(()=>{
            this.subscription = this.gForms.valueChanges.subscribe(data => {
                const gid = this.widget.query.groups[0].id;
                console.log(data, "updated... data222....")
                this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: 0, data: data[0] }});
            });
         }, 100);
    }

    openColorPopup(index) {
        console.log("color index=", index);
        this.showColorPickerIndex = index !== this.showColorPickerIndex ? index : -1;
    }

    selectColor(index, color) {
        //console.log("set color =",  index, color);
        //console.log(this.gForms.controls[0]['controls'][index]['controls'])
        this.gForms.controls['0']['controls'][index]['controls'].color.setValue(color.hex);
    }

    openTimeSeriesMetricDialog() {
        const mgroupId = this.widget.query.groups.length ? this.widget.query.groups[0].id : 'new';
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

    openMetricExpressionDialog() {
        alert('TODO: link up metric expression dialog');
    }

    openCustomValueDialog() {
        alert('TODO: create and link up custom value dialog');
    }

    createFormArray(queries): FormArray {
        console.log("create", queries.length)
                return new FormArray(queries.map(item => new FormGroup({
                    aggregator: new FormControl(item.settings.visual.aggregator),
                    stackLabel : new FormControl(item.settings.visual.stackLabel),
                    color : new FormControl(item.settings.visual.color)
                })));
    }

}

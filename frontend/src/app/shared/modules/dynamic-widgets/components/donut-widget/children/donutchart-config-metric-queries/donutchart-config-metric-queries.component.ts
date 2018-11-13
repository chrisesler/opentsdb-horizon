import { Component, OnInit, HostBinding, Input, Output, EventEmitter} from '@angular/core';

import {MatDialog, MatDialogConfig, MatDialogRef, DialogPosition} from '@angular/material';

import {
    SearchMetricsDialogComponent
} from '../../../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';

import {
    ExpressionDialogComponent
} from '../../../../../sharedcomponents/components/expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'donutchart-config-metric-queries',
  templateUrl: './donutchart-config-metric-queries.component.html',
  styleUrls: []
})
export class DonutchartConfigMetricQueriesComponent implements OnInit {
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


    constructor(public dialog: MatDialog) { }

    ngOnInit() {
    }

    // ngOnChanges( changes: SimpleChanges) {
        /*
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
        */
    // }

    /*
    subscribeFormChanges() {
        setTimeout(()=>{
            this.subscription = this.gForms.valueChanges.subscribe(data => {
                const gid = this.widget.query.groups[0].id;
                console.log(data, "updated... data222....")
                this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: 0, data: data[0] }});
            });
         }, 100);
    }
    */

    openColorPopup(index) {
        this.showColorPickerIndex = index !== this.showColorPickerIndex ? index : -1;
    }

    selectColor(index, color) {
        // console.log("set color =",  index, color);
        // console.log(this.gForms.controls[0]['controls'][index]['controls'])
        // this.gForms.controls['0']['controls'][index]['controls'].color.setValue(color.hex);
        this.setVisualization('color', index, color.hex);
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

    /*
    createFormArray(queries): FormArray {
        console.log("create", queries.length)
                return new FormArray(queries.map(item => new FormGroup({
                    aggregator: new FormControl(item.settings.visual.aggregator),
                    stackLabel : new FormControl(item.settings.visual.stackLabel),
                    color : new FormControl(item.settings.visual.color)
                })));
    }
    */

    setVisualization(key, index, value) {
        console.log(key, index, value, 'setvisualization....');
        const visuals = [];
        const gIndex = 0;
        const queries = this.widget.query.groups[gIndex].queries;
        for ( let i = 0; i < queries.length; i++ ) {
            visuals.push( {...queries[i].settings.visual} );
        }
        visuals[index][key] = value;
        this.widgetChange.emit( {'action': 'SetVisualization', payload: { gIndex: gIndex, data: visuals }});
    }

    deleteQuery( index ) {
        this.widgetChange.emit( {'action': 'DeleteQuery', payload: { index: index }});
    }

    toggleQuery( index ) {
        this.widgetChange.emit( {'action': 'ToggleQuery', payload: { index: index }});
    }

    toggleGroup( gIndex ) {
        this.widgetChange.emit( {'action': 'ToggleGroup', payload: { index: gIndex }});
    }

}

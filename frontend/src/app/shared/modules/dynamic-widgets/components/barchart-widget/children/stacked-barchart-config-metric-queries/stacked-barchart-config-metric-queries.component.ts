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
    selectAllToggle: String = 'none'; // none/all/some

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
                this.stackSubs.unsubscribe();
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
            this.updateTempUIState(changes.widget.currentValue);
        }
    }

    // to add or remove the local tempUI state
    updateTempUIState(widget: any) {
        for (let i = 0; i < widget.query.groups.length; i++) {
            const group = widget.query.groups[i];
            group.settings.tempUI = {
                selected: 'none',
                collapsed: false
            };

            for (let j = 0; j < group.queries.length; j++) {
                group.queries[j].settings.selected = false;
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

    toggleGroupSelected(group: any, event: MouseEvent) {
        console.log('TOGGLE::GroupSelected', group, event);
        event.stopPropagation();

        // some or none are selected, then we select them all
        if (group.settings.tempUI.selected === 'some' || group.settings.tempUI.selected === 'none') {
            group.settings.tempUI.selected = 'all';
            group.queries.forEach(function(metric) {
                metric.settings.selected = true;
            });
        } else {
            group.settings.tempUI.selected = 'none';
            group.queries.forEach(function(metric) {
                metric.settings.selected = false;
            });
        }

        // update master checkbox
        const groupStates = {
            all: 0,
            none: 0,
            some: 0
        };

        for (let i = 0; i < this.widget.query.groups; i++) {
            let g = this.widget.query.groups[i];
            if (g.settings.tempUI.selected === 'all') {
                groupStates.all++;
            } else if (g.settings.tempUI.selected === 'some') {
                groupStates.some++;
            } else {
                groupStates.none++;
            }
        }

        this.selectAllToggle = (groupStates.some > 0 || groupStates.all < this.widget.query.groups.length) ?
            'some' : (groupStates.none === this.widget.query.groups.length) ? 'none' : 'all';
    }

    toggleMetricSelected(metric: any, group: any, event: MouseEvent) {
        console.log('TOGGLE::MetricSelected', group, event);
        event.stopPropagation();

        metric.settings.selected = !metric.settings.selected;

        const selectedGroupMetrics = group.queries.filter(function(m) {
            return m.settings.selected;
        });

        // the 'some' case
        if (selectedGroupMetrics.length > 0 && selectedGroupMetrics.length < group.queries.length) {
            group.settings.tempUI.selected = 'some';
            // if this is some, then the master level is some as well
            this.selectAllToggle = 'some';
        // the 'all'case
        } else if (selectedGroupMetrics.length === group.queries.length) {
            group.settings.tempUI.selected = 'all';

            const selectedGroups = this.widget.query.groups.filter(function(g) {
                return g.settings.tempUI.selected === 'all';
            });

            this.selectAllToggle = (selectedGroups.length === this.widget.query.groups.length) ? 'all' : 'some';

        // the 'none' case
        } else {
            group.settings.tempUI.selected = 'none';

            const selectedGroups = this.widget.query.groups.filter(function(g) {
                return g.settings.tempUI.selected !== 'none';
            });

            this.selectAllToggle = (selectedGroups.length > 0) ? 'some' : 'none';
        }
    }

    toggleGroupCollapsed(group: any, event: MouseEvent) {
        console.log('TOGGLE::GroupCollapsed', group, event);
        event.stopPropagation();
        group.collapsed = !group.collapsed;
    }

    batchSelectAllToggle(event: MouseEvent) {
        console.log('BATCH::SelectAllToggle', this.selectAllToggle);
        event.stopPropagation();
        let group, metric;
        if (this.selectAllToggle === 'none' || this.selectAllToggle === 'some') {
            this.selectAllToggle = 'all';
            // mark all groups as selected
            for (group of this.widget.query.groups) {
                group.settings.tempUI.selected = 'all';
                for (metric of group.queries) {
                    metric.settings.selected = true;
                }
            }
        } else {
            this.selectAllToggle = 'none';
            // mark all groups as un-selected
            for (group of this.widget.query.groups) {
                group.settings.tempUI.selected = 'none';
                for (metric of group.queries) {
                    metric.settings.selected = false;
                }
            }
        }
    }

    batchDeleteMetrics(event: MouseEvent) {
        console.log('BATCH::DeleteMetrics', event);
        event.stopPropagation();
        this.widgetChange.emit({action: 'DeleteMetrics', payload: { data: JSON.parse(JSON.stringify(this.widget.query.groups)) }});
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

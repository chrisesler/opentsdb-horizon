import {
    Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';

import {
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

import {
    ExpressionDialogComponent
} from '../expression-dialog/expression-dialog.component';

import { Subscription } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-metric-queries',
    templateUrl: './widget-config-metric-queries.component.html',
    styleUrls: []
})
export class WidgetConfigMetricQueriesComponent implements OnInit, OnDestroy, OnChanges {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.metric-queries-configuration') private _tabClass = true;

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
 
    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
        console.log('editting widget', this.widget);    
    }

    ngOnChanges(changes: SimpleChanges) {
        // when editing mode is loaded, we need to temporary adding default UI state
        // to editing widget
        if (changes.widget.currentValue && changes.widget.firstChange) {
            this.addRemoveTempUIState(true, changes.widget.currentValue);
        }          
    }

    // to add or remove the local tempUI state
    addRemoveTempUIState(add: boolean, widget: any) {
        for (let i = 0; i < widget.query.groups.length; i++) {
            let group = widget.query.groups[i];
            if (add) {
                group.settings.tempUI = {
                    selected: 'none',
                    collapsed: false
                }
            } else {
                delete group.settings.tempUI;
            }
            for (let j = 0; j < group.queries.length; j++) {
                let metric = group.queries[j];
                if(add) {
                    metric.settings.selected = false;
                } else {
                    delete metric.settings.selected;
                }
            }
        }
    }

    ngOnDestroy() {
        if (this.searchDialogSub) {
            this.searchDialogSub.unsubscribe();
        }
        this.searchMetricsDialog = undefined;

        if (this.metricExpressionDialogSub) {
            this.metricExpressionDialogSub.unsubscribe();
        }
        this.metricExpressionDialog = undefined;
    }

    // opens the dialog window to search and add metrics
    openTimeSeriesMetricDialog(mgroupId: string) {
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
            console.log('return', this.modGroup);
        });
    }

    openMetricExpressionDialog(mgroupId: string, groupData: any) {
        console.log('%cMGROUP', 'background: purple; color: white;', mgroupId, groupData);
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'metric-expression-dialog-backdrop';
        dialogConf.panelClass = 'metric-expression-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.data = { mgroupId: mgroupId, groupQueries: groupData};

        this.metricExpressionDialog = this.dialog.open(ExpressionDialogComponent, dialogConf);
        this.metricExpressionDialog.updatePosition({top: '48px'});

        this.metricExpressionDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('openMetricExpressionDialog::afterClosed', dialog_out);
        });
    }


    toggle_displayGroupsIndividually(event: any) {
        console.log('TOGGLE::DisplayGroupsIndividually', event);
    }

    toggle_groupSelected(group: any, event: MouseEvent) {
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

    toggle_metricSelected(metric: any, group: any, event: MouseEvent) {
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

    toggle_groupCollapsed(group: any, event: MouseEvent) {
        console.log('TOGGLE::GroupCollapsed', group, event);
        event.stopPropagation();
        group.collapsed = !group.collapsed;
    }

    toggle_queryGroupVisibility(group: any, event: MouseEvent) {
        console.log('TOGGLE::QueryGroupVisibility', group, event);
        event.stopPropagation();
        group.visible = !group.visible;
    }

    clone_queryGroup(group: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY Group ', group);
        event.stopPropagation();
        // do something
    }

    delete_queryGroup(group: any, event: MouseEvent) {
        console.log('DELETE QUERY Group ', group);
        event.stopPropagation();
        // do something
    }

    toggle_queryItemVisibility(item: any, event: MouseEvent) {
        console.log('TOGGLE QUERY ITEM VISIBILITY', item);
        event.stopPropagation();
        item.visible = !item.visible;
    }

    clone_queryItem(item: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    delete_queryItem(item: any, event: MouseEvent) {
        console.log('DELETE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    /**
     * Batch Events
     */

    batch_selectAllToggle(event: MouseEvent) {
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

    batch_groupMetrics(event: MouseEvent) {
        console.log('BATCH::GroupMetrics');
        event.stopPropagation();
        // get the selected items, then group them
    }

    batch_splitMetrics(event: MouseEvent) {
        console.log('BATCH::SplitMetrics');
        event.stopPropagation();
        // get the selected items, then split them into seperate groups
    }

    batch_deleteMetrics(event: MouseEvent) {
        console.log('BATCH::DeleteMetrics');
        event.stopPropagation();
        // get the selected items, then delete them
    }

    /**
     * Other
     */

    addTimeSeriesExpression() {
        console.log('ADD TIME SERIES EXPRESSION');
        // do something
    }

}

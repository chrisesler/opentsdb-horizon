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
    @Input() fakeGroups: Array<any>;
    @Input() fakeMetrics: Array<object>;
    @Input() valueIterationOptions: Array<any>;

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
    // TODO: REMOVE FAKE GROUPS
    // fakeGroups: Array<any> = [
    //     {
    //         id: 'group-0',
    //         label: 'Untitled Group',
    //         collapsed: false,
    //         visible: true,
    //         colorFamily: 'green',
    //         selectedState: 'none', // none,all,some
    //         metrics: [
    //             {
    //                 id: 0,
    //                 type: 'metric',
    //                 alias: 'M1',
    //                 label: 'Metric_namespace.app-name.whatever.some_metric',
    //                 metric: 'Metric_namespace.app-name.whatever.some_metric',
    //                 color: 'green',
    //                 collapsed: false,
    //                 visible: true,
    //                 selectedState: false,
    //                 tags: [
    //                     {
    //                         key: 'colo',
    //                         value: 'bf1'
    //                     },
    //                     {
    //                         key: 'hostgroup',
    //                         value: 'lala-01'
    //                     },
    //                     {
    //                         key: '_aggregate',
    //                         value: 'SUM'
    //                     }
    //                 ],
    //                 functions: [],
    //                 configuration: {
    //                     visualAppearance: {
    //                         visualization: 'line',
    //                         color: 'green',
    //                         lineWeight: '2px',
    //                         lineType: 'solid',
    //                         logScale: false
    //                     }
    //                 }
    //             },
    //             {
    //                 id: 1,
    //                 type: 'metric',
    //                 alias: 'M2',
    //                 label: 'Metric_namespace.app-name.something.some_metric',
    //                 metric: 'Metric_namespace.app-name.something.some_metric',
    //                 color: 'amber',
    //                 collapsed: false,
    //                 visible: true,
    //                 selectedState: false,
    //                 tags: [
    //                     {
    //                         key: 'colo',
    //                         value: 'bf1'
    //                     },
    //                     {
    //                         key: 'hostgroup',
    //                         value: 'hg-01'
    //                     }
    //                 ],
    //                 functions: [],
    //                 configuration: {
    //                     visualAppearance: {
    //                         visualization: 'line',
    //                         color: 'amber',
    //                         lineWeight: '2px',
    //                         lineType: 'solid',
    //                         logScale: false
    //                     }
    //                 }
    //             },
    //             {
    //                 id: 2,
    //                 type: 'expression',
    //                 alias: 'E1',
    //                 label: 'expression-name',
    //                 expression: '( m1 / m2 ) * 12',
    //                 color: 'fuchsia',
    //                 collapsed: false,
    //                 visible: true,
    //                 selectedState: false,
    //                 tags: [
    //                     {
    //                         key: 'colo',
    //                         value: '*'
    //                     },
    //                     {
    //                         key: 'hostgroup',
    //                         value: '*'
    //                     }
    //                 ],
    //                 functions: [],
    //                 configuration: {
    //                     visualAppearance: {
    //                         visualization: 'line',
    //                         color: 'fuschia',
    //                         lineWeight: '2px',
    //                         lineType: 'solid',
    //                         logScale: false
    //                     }
    //                 }
    //             }
    //         ]
    //     },
    //     {
    //         id: 'group-1',
    //         label: 'Untitled Group 2',
    //         collapsed: false,
    //         visible: true,
    //         colorFamily: 'green',
    //         selectedState: 'none', // none/all/some
    //         metrics: [
    //             {
    //                 id: 3,
    //                 type: 'metric',
    //                 alias: 'M1',
    //                 label: 'Metric_namespace.app-name.whatever.some_metric',
    //                 metric: 'Metric_namespace.app-name.whatever.some_metric',
    //                 color: 'green',
    //                 collapsed: false,
    //                 visible: true,
    //                 selectedState: false,
    //                 tags: [
    //                     {
    //                         key: 'colo',
    //                         value: 'bf1'
    //                     },
    //                     {
    //                         key: 'hostgroup',
    //                         value: 'lala-01'
    //                     },
    //                     {
    //                         key: '_aggregate',
    //                         value: 'SUM'
    //                     }
    //                 ],
    //                 functions: [],
    //                 configuration: {
    //                     visualAppearance: {
    //                         visualization: 'line',
    //                         color: 'green',
    //                         lineWeight: '2px',
    //                         lineType: 'solid',
    //                         logScale: false
    //                     }
    //                 }
    //             }
    //         ]
    //     }
    // ];

    // TODO: REMOVE FAKE METRICS
    // fakeMetrics: Array<object> = [
    //     {
    //         id: 0,
    //         type: 'metric',
    //         alias: 'M1',
    //         label: 'Metric_namespace.app-name.whatever.some_metric',
    //         metric: 'Metric_namespace.app-name.whatever.some_metric',
    //         color: 'green',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: 'bf1'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: 'lala-01'
    //             },
    //             {
    //                 key: '_aggregate',
    //                 value: 'SUM'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'green',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     },
    //     {
    //         id: 1,
    //         type: 'metric',
    //         alias: 'M2',
    //         label: 'Metric_namespace.app-name.something.some_metric',
    //         metric: 'Metric_namespace.app-name.something.some_metric',
    //         color: 'amber',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: 'bf1'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: 'hg-01'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'amber',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     },
    //     {
    //         id: 1,
    //         type: 'expression',
    //         alias: 'E1',
    //         label: 'expression-name',
    //         expression: 'm1 + m2 / m2',
    //         color: 'fuchsia',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: '*'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: '*'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'fuschia',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     }
    // ];

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
        console.log('editting widget', this.widget);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('changes', changes);
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

    /**
     * Behaviors
     */

    toggle_displayGroupsIndividually(event: any) {
        console.log('TOGGLE::DisplayGroupsIndividually', event);
    }

    /**
     * Individual Events
     */

    toggle_groupSelected(group: any, event: MouseEvent) {
        console.log('TOGGLE::GroupSelected', group, event);
        event.stopPropagation();

        // some or none are selected, then we select them all
        if (group.selectedState === 'some' || group.selectedState === 'none') {
            group.selectedState = 'all';
            group.metrics.forEach(function(metric) {
                metric.selectedState = true;
            });
        } else {
            group.selectedState = 'none';
            group.metrics.forEach(function(metric) {
                metric.selectedState = false;
            });
        }

        // update master checkbox
        const groupStates = {
            all: 0,
            none: 0,
            some: 0
        };

        let g;
        // tslint:disable-next-line:forin
        for (g in this.fakeGroups) {
            if (this.fakeGroups[g].selectedState === 'all') {
                groupStates.all++;
            } else if (this.fakeGroups[g].selectedState === 'some') {
                groupStates.some++;
            } else {
                groupStates.none++;
            }
        }

        // tslint:disable-next-line:max-line-length
        this.selectAllToggle = (groupStates.some > 0 || groupStates.all < this.fakeGroups.length) ? 'some' : (groupStates.none === this.fakeGroups.length) ? 'none' : 'all';

    }

    toggle_metricSelected(metric: any, group: any, event: MouseEvent) {
        console.log('TOGGLE::MetricSelected', group, event);
        event.stopPropagation();

        metric.selectedState = !metric.selectedState;

        const selectedGroupMetrics = group.metrics.filter(function(m) {
            return m.selectedState;
        });

        // the 'some' case
        if (selectedGroupMetrics.length > 0 && selectedGroupMetrics.length < group.metrics.length) {
            group.selectedState = 'some';
            // if this is some, then the master level is some as well
            this.selectAllToggle = 'some';
        // the 'all'case
        } else if (selectedGroupMetrics.length === group.metrics.length) {
            group.selectedState = 'all';

            const selectedGroups = this.fakeGroups.filter(function(g) {
                return g.selectedState === 'all';
            });

            this.selectAllToggle = (selectedGroups.length === this.fakeGroups.length) ? 'all' : 'some';

        // the 'none' case
        } else {
            group.selectedState = 'none';

            const selectedGroups = this.fakeGroups.filter(function(g) {
                return g.selectedState !== 'none';
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
            for (group of this.fakeGroups) {
                console.log('fake groups', group);
                group.selectedState = 'all';
                for (metric of group.metrics) {
                    metric.selectedState = true;
                }
            }
        } else {
            this.selectAllToggle = 'none';
            // mark all groups as un-selected
            for (group of this.fakeGroups) {
                console.log('fake groups', group);
                group.selectedState = 'none';
                for (metric of group.metrics) {
                    metric.selectedState = false;
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

import {
    Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy
} from '@angular/core';

import {
    MatMenu, MatMenuTrigger,
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

import { Subscription } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-metric-queries',
    templateUrl: './widget-config-metric-queries.component.html',
    styleUrls: []
})
export class WidgetConfigMetricQueriesComponent implements OnInit, OnDestroy {
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

    /** Local variables */

    modGroup: any; // current group that is adding metric
    mgroupId = undefined;

    // TODO: REMOVE FAKE GROUPS
    fakeGroups: Array<object> = [
        {
            id: 'group-0',
            label: 'Untitled Group',
            collapsed: false,
            visible: true,
            colorFamily: 'green',
            metrics: [
                {
                    id: 0,
                    type: 'metric',
                    alias: 'M1',
                    label: 'Metric_namespace.app-name.whatever.some_metric',
                    metric: 'Metric_namespace.app-name.whatever.some_metric',
                    color: 'green',
                    collapsed: false,
                    visible: true,
                    tags: [
                        {
                            key: 'colo',
                            value: 'bf1'
                        },
                        {
                            key: 'hostgroup',
                            value: 'lala-01'
                        },
                        {
                            key: '_aggregate',
                            value: 'SUM'
                        }
                    ],
                    functions: [],
                    configuration: {
                        visualAppearance: {
                            visualization: 'line',
                            color: 'green',
                            lineWeight: '2px',
                            lineType: 'solid',
                            logScale: false
                        }
                    }
                },
                {
                    id: 1,
                    type: 'metric',
                    alias: 'M2',
                    label: 'Metric_namespace.app-name.something.some_metric',
                    metric: 'Metric_namespace.app-name.something.some_metric',
                    color: 'amber',
                    collapsed: false,
                    visible: true,
                    tags: [
                        {
                            key: 'colo',
                            value: 'bf1'
                        },
                        {
                            key: 'hostgroup',
                            value: 'hg-01'
                        }
                    ],
                    functions: [],
                    configuration: {
                        visualAppearance: {
                            visualization: 'line',
                            color: 'amber',
                            lineWeight: '2px',
                            lineType: 'solid',
                            logScale: false
                        }
                    }
                },
                {
                    id: 2,
                    type: 'expression',
                    alias: 'E1',
                    label: 'expression-name',
                    expression: '( m1 / m2 ) * 12',
                    color: 'fuchsia',
                    collapsed: false,
                    visible: true,
                    tags: [
                        {
                            key: 'colo',
                            value: '*'
                        },
                        {
                            key: 'hostgroup',
                            value: '*'
                        }
                    ],
                    functions: [],
                    configuration: {
                        visualAppearance: {
                            visualization: 'line',
                            color: 'fuschia',
                            lineWeight: '2px',
                            lineType: 'solid',
                            logScale: false
                        }
                    }
                }
            ]
        },
        {
            id: 'group-1',
            label: 'Untitled Group 2',
            collapsed: false,
            visible: true,
            colorFamily: 'green',
            metrics: [
                {
                    id: 3,
                    type: 'metric',
                    alias: 'M1',
                    label: 'Metric_namespace.app-name.whatever.some_metric',
                    metric: 'Metric_namespace.app-name.whatever.some_metric',
                    color: 'green',
                    collapsed: false,
                    visible: true,
                    tags: [
                        {
                            key: 'colo',
                            value: 'bf1'
                        },
                        {
                            key: 'hostgroup',
                            value: 'lala-01'
                        },
                        {
                            key: '_aggregate',
                            value: 'SUM'
                        }
                    ],
                    functions: [],
                    configuration: {
                        visualAppearance: {
                            visualization: 'line',
                            color: 'green',
                            lineWeight: '2px',
                            lineType: 'solid',
                            logScale: false
                        }
                    }
                }
            ]
        }
    ];

    // TODO: REMOVE FAKE METRICS
    fakeMetrics: Array<object> = [
        {
            id: 0,
            type: 'metric',
            alias: 'M1',
            label: 'Metric_namespace.app-name.whatever.some_metric',
            metric: 'Metric_namespace.app-name.whatever.some_metric',
            color: 'green',
            collapsed: false,
            visible: true,
            tags: [
                {
                    key: 'colo',
                    value: 'bf1'
                },
                {
                    key: 'hostgroup',
                    value: 'lala-01'
                },
                {
                    key: '_aggregate',
                    value: 'SUM'
                }
            ],
            functions: [],
            configuration: {
                visualAppearance: {
                    visualization: 'line',
                    color: 'green',
                    lineWeight: '2px',
                    lineType: 'solid',
                    logScale: false
                }
            }
        },
        {
            id: 1,
            type: 'metric',
            alias: 'M2',
            label: 'Metric_namespace.app-name.something.some_metric',
            metric: 'Metric_namespace.app-name.something.some_metric',
            color: 'amber',
            collapsed: false,
            visible: true,
            tags: [
                {
                    key: 'colo',
                    value: 'bf1'
                },
                {
                    key: 'hostgroup',
                    value: 'hg-01'
                }
            ],
            functions: [],
            configuration: {
                visualAppearance: {
                    visualization: 'line',
                    color: 'amber',
                    lineWeight: '2px',
                    lineType: 'solid',
                    logScale: false
                }
            }
        },
        {
            id: 1,
            type: 'expression',
            alias: 'E1',
            label: 'expression-name',
            expression: 'm1 + m2 / m2',
            color: 'fuchsia',
            collapsed: false,
            visible: true,
            tags: [
                {
                    key: 'colo',
                    value: '*'
                },
                {
                    key: 'hostgroup',
                    value: '*'
                }
            ],
            functions: [],
            configuration: {
                visualAppearance: {
                    visualization: 'line',
                    color: 'fuschia',
                    lineWeight: '2px',
                    lineType: 'solid',
                    logScale: false
                }
            }
        }
    ];

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
    }

    ngOnDestroy() {
        if (this.searchDialogSub) {
            this.searchDialogSub.unsubscribe();
        }
        this.searchMetricsDialog = undefined;
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
            this.modGroup = dialog_out.mgroup;
            console.log('return', this.modGroup);
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

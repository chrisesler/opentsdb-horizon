import {
    Component, OnInit, HostBinding, Input, Output, EventEmitter
} from '@angular/core';

import {
    MatMenu, MatMenuTrigger,
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-metric-queries',
    templateUrl: './widget-config-metric-queries.component.html',
    styleUrls: []
})
export class WidgetConfigMetricQueriesComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.metric-queries-configuration') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: any;

    /** Local variables */

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

    /**
     * Services
     */

    // none yet

    /**
     * Behaviors
     */

    toggleQueryItemVisibility(item: any, event: MouseEvent) {
        console.log('TOGGLE QUERY ITEM VISIBILITY', item);
        event.stopPropagation();
        item.visible = !item.visible;
    }

    duplicateQueryItem(item: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    deleteQueryItem(item: any, event: MouseEvent) {
        console.log('DELETE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    openTimeSeriesMetricDialog() {

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
        dialogConf.data = {
            lala: true,
            wtf: 'isthat',
            iCanCount: 2,
            basket: [1, 2, 3, 4, 5]
        };

        this.searchMetricsDialog = this.dialog.open(SearchMetricsDialogComponent, dialogConf);
        this.searchMetricsDialog.updatePosition({top: '48px'});
        this.searchDialogSub = this.searchMetricsDialog.componentInstance.onDialogApply.subscribe((data: any) => {
            console.log('SUBSCRIPTION DATA', data);
        });

        this.searchMetricsDialog.beforeClose().subscribe((result: any) => {
            console.log('DIALOG BEFORE CLOSE', result);
        });

        this.searchMetricsDialog.afterClosed().subscribe((result: any) => {
            console.log('DIALOG AFTER CLOSED', result);
            this.searchMetricsDialog.componentInstance.onDialogApply.unsubscribe();
            this.searchMetricsDialog = null;
        });
    }

    addTimeSeriesExpression() {
        console.log('ADD TIME SERIES EXPRESSION');
        // do something
    }

}

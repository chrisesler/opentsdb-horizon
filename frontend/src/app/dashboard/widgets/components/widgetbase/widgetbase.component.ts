import {
    Component,
    OnInit,
    OnChanges,
    Input,
    Output,
    ViewChild,
    HostBinding,
    EventEmitter,
    SimpleChanges
} from '@angular/core';

import { MatMenu, MatMenuTrigger } from '@angular/material';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

import { SearchMetricsDialogComponent } from '../../../components/search-metrics-dialog/search-metrics-dialog.component';

import Dygraph from 'dygraphs';

@Component({
    selector: 'app-widget-base',
    templateUrl: './widgetbase.component.html',
    styleUrls: ['./widgetbase.component.scss']
})
export class WidgetbaseComponent implements OnInit, OnChanges {
    @HostBinding('class.widget-panel-content') private _hostClass = true;

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    @Input() editMode: boolean;
    @Input() widget: any;

    // Available Widget Types
    availableWidgetTypes: Array<object> = [
        {
            label: 'Bar Graph',
            type: 'WidgetBarGraphComponent',
            iconClass: 'widget-icon-bar-graph'
        },
        {
            label: 'Area Graph',
            type: 'WidgetAreaGraphComponent',
            iconClass: 'widget-icon-area-graph'
        },
        {
            label: 'Line Chart',
            type: 'LineChartComponent',
            // TODO: need to eventually switch to WidgetLineChartComponent
            // type: 'WidgetLineChartComponent',
            iconClass: 'widget-icon-line-chart'
        },
        {
            label: 'Big Number',
            type: 'WidgetBigNumberComponent',
            iconClass: 'widget-icon-big-number'
        },
        {
            label: 'Donut Chart',
            type: 'WidgetDonutChartComponent',
            iconClass: 'widget-icon-donut-chart'
        }
    ];

    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: any;

    g: any;
    labels: any;


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
            functions: []
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
            functions: []
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
            functions: []
        }
    ];

    constructor(
        public dialog: MatDialog
    ) { }

    ngOnInit() {
        console.log('WBASE :: onInit', this.widget);
        

     
    this.g = new Dygraph(document.getElementById("graphdiv"),
    `Date,A,B
    2016/01/01,10,20
    2016/07/01,20,10
    2016/12/31,40,30
    `, {
      fillGraph: true
    });
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('***** CHANGES *******', changes);
    }

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
        // do something
    }

    selectWidgetType(wtype: any, event: any) {
        console.log('SELECT WIDGET TYPE', wtype, event);
    }


}

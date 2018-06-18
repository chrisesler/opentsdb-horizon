import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';
import { SearchMetricsDialogComponent } from '../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/dashboard.state';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'linebar-widget',
    templateUrl: './linebar-widget.component.html',
    styleUrls: []
})
export class LinebarWidgetComponent implements OnInit, OnChanges, OnDestroy {

    @HostBinding('class.widget-panel-content') private _hostClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    private searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    private searchDialogSub: Observable<any>;
    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;

    chartType = 'line';
    options: any;
    data: any = [
        [1, null, 3],
        [2, 2, null],
        [3, null, 7],
        [4, 6, null],
        [5, null, 5],
        [6, 4, null]
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
        private dialog: MatDialog,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'resizeWidget':
                        break;
                    case 'updatedWidget':
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            console.log('adatatata', message.payload.config);
                        }

                        break;
                }
            }
        });
        // initial request data
        this.requestData();
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.config
            });
        }
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
        this.searchMetricsDialog.updatePosition({ top: '48px' });
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

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

    /**
     * Behaviors
     */

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: true
        });
    }

}

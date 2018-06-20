import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';
import { SearchMetricsDialogComponent } from '../../../sharedcomponents/components/search-metrics-dialog/search-metrics-dialog.component';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/dashboard.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';

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

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    private searchDialogSub: Observable<any>;
    private listenSub: Subscription;
    private isDataLoaded: boolean = false;
    private isStackedGraph: boolean = true;
    // properties to pass to dygraph chart directive
    chartType = 'line';

    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true, 
        drawPoints: false,
        labelsDivWidth: 0,
        legend: "never",
        stackedGraph: this.isStackedGraph,
        hightlightCircleSize: 1,
        strokeWidth: 1,
        strokeBorderWidth: this.isStackedGraph ? null : 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            strockeBorderWidth: 1,
            hightlightCircleSize: 5
        }
    };
    data: any = [[0]];
    size: any;
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

// TODO: should we save normalizedData or rawdata in widget config

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'resizeWidget':
                        // we   get the size to update the graph size 
                        this.size = { width: message.payload.width, height: message.payload.height };             
                        break;
                    case 'updatedWidget':
                        console.log('updateWidget', message); 
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            console.log('widget data', this.widget.id, message.payload.config);
                            this.data = this.transformToDygraph(this.widget.config.rawdata);
                            //this.data = this.transformToDygraph(message.payload.config.rawdata);
                        }
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);   
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            this.data = this.transformToDygraph(this.widget.config.rawdata);
                            // resize
                            let nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
                            let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
                            this.size = { width: nWidth, height: 460 };
                        }                    
                        break;
                }
            }
        });
        // initial request data
        if(!this.editMode) {
            this.requestData();
        }
    }

    // for now here, we need to make a global services to tranform data
    // convert data to dygraph format
    transformToDygraph(result: any): any {
        let normalizedData = [];
        let dpsHash = {};
        
        // generate a hash for all the keys, might have missing time 
        // from multiple metric
        for (let k in result) {
            let g = result[k];
            // build lable
            let label = Object.values(g.tags).join('-');
            // only pushing in if not exits, since we use same reference for view/edit
            if(!this.options.labels.includes(label)) {
                this.options.labels.push(label);
            }
            for (let date in g.dps) {
                dpsHash[date] = true
            }       
        }
        // console.log('dpsHash', dpsHash);
        let dpsHashKey = Object.keys(dpsHash);
        dpsHash = undefined;
        // sort time in case  new insert somewhere
        dpsHashKey.sort((a: any,b: any) => {
            return a - b;
        });

        for (let idx =0, len = dpsHashKey.length; idx < len; idx++) {
            let dpsMs: any = dpsHashKey[idx];
            normalizedData[idx] = [new Date(dpsMs * 1000)];
            for (let k in result) {
                let g = result[k];
                (g.dps[dpsMs] !== undefined) ? normalizedData[idx].push(g.dps[dpsMs]) : normalizedData[idx].push(null);                
            }
        }
        console.log('normalizedData', this.options.labels, normalizedData);
        //return normalizedData;
        return Object.assign(normalizedData);
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


    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: { editMode: false, widgetId: ''}
        });
    }

}

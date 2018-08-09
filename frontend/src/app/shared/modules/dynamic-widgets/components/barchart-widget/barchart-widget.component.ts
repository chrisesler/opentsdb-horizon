import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { UtilsService } from '../../../../../core/services/utils.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';

@Component({
  selector: 'app-barchart-widget',
  templateUrl: './barchart-widget.component.html',
  styleUrls: ['./barchart-widget.component.scss']
})
export class BarchartWidgetComponent implements OnInit, OnChanges, OnDestroy {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.linechart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    private isStackedGraph: boolean = true;
    // properties to pass to  chartjs chart directive

    options: any  = {
        scales: {
            yAxes : [
                {
                    ticks: {
                        beginAtZero: true
                    }
                }
            ],
            xAxes : [
                {
                    type: 'category'
                }
            ]
        },
        // not part of chartjs config. this config will be used for bar, doughnut and pie charts
        labels : [ ],
        // contains stack series details like label, color, datasetIndex
        stackSeries : []
    };
    data: any = [ ];
    width = '100%';
    height = '100%';

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService,
        private util: UtilsService
    ) { }

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if ( message.action === 'resizeWidget' ) {
                // we get the size to update the graph size
                this.width = message.payload.width * this.widget.gridPos.w - 20 + 'px';
                this.height = message.payload.height * this.widget.gridPos.h - 60 + 'px';
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        console.log('updateWidget', message);
                            this.isDataLoaded = true;
                            const gid = Object.keys(message.payload)[0];
                            const stacked = this.widget.query.groups.length > 1 ? true : false;
                            const config = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
                            console.log('bar widget==>', config.queries, gid , message);
                            this.data = this.dataTransformer.yamasToChartJS('bar', this.options, config.queries, this.data, message.payload, stacked);
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                            this.isDataLoaded = true;
                            //this.data = this.dataTransformer.yamasToChartJS('bar', this.options, message.payload.rawdata);
                            // resize
                            let nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
                            let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
                            this.width = nWidth - 20 + 'px';
                            this.height = nHeight - 60 + 'px';
                        break;
                }
            }
        });
        // when the widget first loaded in dashboard, we request to get data
        // when in edit mode first time, we request to get cached raw data.
        if (!this.editMode) {
            this.requestData();
        } else {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getWidgetCachedData'
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

    requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.query
            });
        }
    }

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: true
        });
    }
}

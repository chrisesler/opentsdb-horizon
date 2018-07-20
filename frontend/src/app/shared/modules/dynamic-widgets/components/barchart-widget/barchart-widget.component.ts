import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/dashboard.state';

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
                    type: 'category',
                    labels: []
                }
            ]
        }
    };
    data: any = [ { data: [] } ];
    width = '100%';
    height = '100%';

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService
    ) { }

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'resizeWidget':
                        // we get the size to update the graph size
                        this.width = message.payload.width - 20 + 'px';
                        this.height = message.payload.height - 60 + 'px';
                        break;
                    case 'updatedWidget':
                        console.log('updateWidget', message);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            console.log('widget data', this.widget, message.payload.config);
                            this.data = this.dataTransformer.yamasToChartJS(this.options, this.widget.config.rawdata);
                        }
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            this.data = this.dataTransformer.yamasToChartJS(this.options, this.widget.config.rawdata);
                            // resize
                            let nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
                            let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
                            this.width = nWidth - 20 + 'px';
                            this.height = nHeight - 60 + 'px';
                        }
                        break;
                }
            }
        });
        // initial request data
        if (!this.editMode) {
            this.requestData();
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
                payload: this.widget.config
            });
        }
    }

}

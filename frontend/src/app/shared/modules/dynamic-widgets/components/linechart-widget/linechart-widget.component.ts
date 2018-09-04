import {
    Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input,
    OnDestroy, ViewChild, ElementRef
} from '@angular/core';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'linechart-widget',
    templateUrl: './linechart-widget.component.html',
    styleUrls: []
})
export class LinechartWidgetComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.linechart-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    private isStackedGraph: boolean = false;
    // properties to pass to dygraph chart directive
    chartType = 'line';

    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true,
        drawPoints: false,
        labelsDivWidth: 0,
        legend: 'follow',
        logscale: true,
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
    size: any = {};

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService
    ) { }

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {

            if (message.action === 'resizeWidget') {
                // we get the size to update the graph size
                this.size = { width: message.payload.width * this.widget.gridPos.w,
                                height: message.payload.height * this.widget.gridPos.h
                            };
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            const rawdata = message.payload;
                            this.data = this.dataTransformer.yamasToDygraph(this.options, this.data, rawdata);
                        }
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
        console.log('***** CHANGES *******', changes);
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

    ngAfterViewInit() {
        // console.log('TEST', this.widgetOutputElement.nativeElement.getBoundingClientRect());
        if (this.editMode) {
            // update graph content size
            const nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
            // let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
            const nHeight = 280;
            this.size = { width: nWidth, height: nHeight };
        }

    }

    /**
     * Services
     */

    requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.query
            });
        }
    }
    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: 'dashboard'
        });
    }

}

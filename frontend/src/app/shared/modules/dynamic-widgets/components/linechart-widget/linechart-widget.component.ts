import { Component, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';

import { Subscription } from 'rxjs/Subscription';
import { WidgetModel } from '../../../../../dashboard/state/dashboard.state';
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

    constructor(
        private interCom: IntercomService,
        private dataTransformer: DatatranformerService
    ) { }

// TODO: should we save normalizedData or rawdata in widget config

    ngOnInit() {
        // subscribe to event stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'resizeWidget':
                        // we get the size to update the graph size
                        this.size = { width: message.payload.width, height: message.payload.height };
                        break;
                    case 'updatedWidgetGroup':
                        console.log('update widget group', message, this.widget);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true; // need to handle the case that it's partial of groups
                            let grawdata = this.widget.rawdata[message.payload];
                            this.data = this.dataTransformer.yamasToDygraph(this.options, this.data, grawdata); 
                            // console.log('datata-' + this.widget.id, new Date().getMilliseconds(), this.options, this.data);                                                    
                        }
                        break;
                    // this case might be removed since we now get data by group
                    // even in case that it has only one group.
                    case 'updatedWidget':
                        console.log('updateWidget', message);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            // console.log('widget data', this.widget.id, message.payload.config);
                            //this.data = this.dataTransformer.yamasToDygraph(this.options, this.widget.data.rawdata);
                        }
                        break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            this.data = this.dataTransformer.yamasToDygraph(this.options, this.data, this.widget.data.rawdata);
                            // resize
                            let nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
                            let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
                            this.size = { width: nWidth + 20, height: nHeight - 60 };
                        }
                        break;
                }
            }
        });
        // initial request data
        // todo: need to implement cache to not query if the same data
        if (!this.editMode) {
            this.requestData();
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
        console.log('TEST', this.widgetOutputElement.nativeElement.getBoundingClientRect());
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

    /**
     * Behaviors
     */

    // request send to update state to close edit mode
    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: { editMode: false, widgetId: ''}
        });
    }

}

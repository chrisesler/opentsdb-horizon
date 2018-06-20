import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

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
    @HostBinding('class.linebar-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    @ViewChild('widgetoutput') private widgetOutputElement: ElementRef;

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;
    // tslint:disable-next-line:no-inferrable-types
    private isStackedGraph: boolean = true;
    // properties to pass to dygraph chart directive
    chartType = 'line';

    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true,
        drawPoints: false,
        labelsDivWidth: 0,
        legend: 'never',
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
        private interCom: IntercomService
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
                    case 'updatedWidget':
                        console.log('updateWidget', message);
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            console.log('widget data', this.widget.id, message.payload.config);
                            this.data = this.transformToDygraph(this.widget.config.rawdata);
                            // this.data = this.transformToDygraph(message.payload.config.rawdata);
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

    /**
     * Utils
     */

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
        dpsHashKey.sort((a: any, b: any) => {
            return a - b;
        });

        for (let idx = 0, len = dpsHashKey.length; idx < len; idx++) {
            let dpsMs: any = dpsHashKey[idx];
            normalizedData[idx] = [new Date(dpsMs * 1000)];
            for (let k in result) {
                let g = result[k];
                (g.dps[dpsMs] !== undefined) ? normalizedData[idx].push(g.dps[dpsMs]) : normalizedData[idx].push(null);                
            }
        }
        console.log('normalizedData', this.options.labels, normalizedData);
        // return normalizedData;
        return Object.assign(normalizedData);
    }

    /**
     * Services
     */

    requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.config
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

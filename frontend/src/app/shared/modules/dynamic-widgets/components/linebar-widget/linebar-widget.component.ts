import { Component, OnInit, OnChanges, SimpleChanges, HostBinding, Input, OnDestroy } from '@angular/core';
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

    private listenSub: Subscription;
    // tslint:disable-next-line:no-inferrable-types
    private isDataLoaded: boolean = false;

    // properties to pass to dygraph chart directive
    chartType = 'line';
    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true,
        drawPoints: true,
        labelsDivWidth: 0
    };
    data: any = [[0]];
    size: any;

    constructor(
        private interCom: IntercomService
    ) { }

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
                        if (this.widget.id === message.id) {
                            this.isDataLoaded = true;
                            console.log('widget data', this.widget.id, message.payload.config);
                            this.transformToDygraph(message.payload.config.rawdata);
                        }

                        break;
                }
            }
        });
        // initial request data
        this.requestData();
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
    transformToDygraph(result: any) {
        let normalizedData = [];
        let dpsHash = {};
        for (let k in result) {
            let g = result[k];
            console.log('kkk', g);
            
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
                payload: this.widget.config
            });
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

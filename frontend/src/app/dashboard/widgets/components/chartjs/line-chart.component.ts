import {
    Component,
    OnInit,
    OnChanges,
    OnDestroy,
    KeyValueDiffers,
    ElementRef,
    Input,
    Output,
    HostBinding,
    EventEmitter,
    SimpleChanges,
    HostListener
} from '@angular/core';

import { ChartBase } from './chartbase';
import { IntercomService, IMessage } from '../../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';

// refactor the model location later
import { WidgetModel } from '../../../state/dashboard.state';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'line-chart',
    templateUrl: './chartbase.component.html',
    styleUrls: ['./chartbase.component.scss']
})
export class LineChartComponent extends ChartBase implements OnInit, OnDestroy, OnChanges {
    @HostBinding('class.widget-panel-content') private _hostClass = true;

    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    listenSub: Subscription;
    lineDefaultOptions: object = {
        elements: {
            line: {
                tension: 0,
                borderWidth: 1,
                bezierCurve: false,
                fill: true
            },
            point: {
                radius: 0,
                borderWidth: 0
            }
        },
        zoom: {
            mode: 'x|y',
            enabled: true
        },
        threshold: {
            draw: false,
            maxLines: 2,
            thresholds: []
        },
        scales: {
            xAxes: [{
                type: 'time',
                display: true
            }],
            yAxes: [{
                type: 'linear',
                position: 'left',
            }]
        },

    };
    thresholds: Array<any> = [];

    constructor(element: ElementRef, differs: KeyValueDiffers, private interCom: IntercomService) {
        super(element, differs);
        this.type = 'line';
        this.defaultOptions = Object.assign(this.defaultOptions, this.lineDefaultOptions);
    }

    onThresholdSet( e ) {
        const res = e.detail;
        this.thresholds = [];
        for ( let k in res ) {
            this.thresholds.push( {id: res[k].id, scaleId: res[k].scaleId, value: res[k].value});
        }
        console.log('got thresholds=', this.thresholds);
    }

    ngOnInit() {
        super.ngOnInit();
        if ( this.editMode && this.options.threshold ) {
            this.setThresholdEditMode();
        }
        // subscribe to stream
        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            // console.log('message', message, this.widget);
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'resizeWidget':
                        this.setSize(message.payload.width - 30 + 'px', message.payload.height - 60 + 'px');
                        break;
                    case 'updatedWidget': 
                        if(this.widget.id === message.id) {                    
                            this.widget = message.payload;
                            // now we need to update chart with new data
                            if(message.payload.config.rawdata[0].dps) {
                                // first let set the label
                                //console.log('rawdata', Object.keys(message.payload.config.rawdata[0].dps));
                                                                
                                this.labels = Object.keys(message.payload.config.rawdata[0].dps);
                                for (let i = 0; i < message.payload.config.rawdata.length; i++) {
                                    let d = { data: Object.values(message.payload.config.rawdata[i].dps)};
                                    this.dataset.push(d);
                                }  
                                
                                // update data:
                                this.chart.data = {
                                    labels: this.labels,
                                    datasets: this.dataset
                                };

                                this.updateDatasets(this.chart.data.datasets);
                                console.log('this chart', this.chart);
                                this.chart.update();
                            }
                        }
                        break;
                }
            }
        });
        // custom component 
        this.interCom.requestSend({
            id: this.widget.id,
            action: 'getQueryData',
            payload: this.widget.config,
        });
    }

    // transform data for chartjs
    transformData() {
        if(this.widget.config.rawdata[0].dps) {
            // first let set the label
            //console.log('rawdata', Object.keys(this.widget.config.rawdata[0].dps));
            
            
            this.labels = Object.keys(this.widget.config.rawdata[0].dps);
            for (let i = 0; i < 10; i++) {
                let d = { data: Object.values(this.widget.config.rawdata[i].dps)};
                this.dataset.push(d);
            }  
            // update data:
            this.chart.data = {
                labels: this.labels,
                dataset: this.dataset
            };
            this.chart.update(0);
            
        }
    }

    setThresholdEditMode() {
        this.options.threshold.draw = true;
    }

    setThresholds() {
        console.log("thresholds...",  this.thresholds);
        this.options.threshold.thresholds = JSON.parse(JSON.stringify(this.thresholds));
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('widget chanages', changes);
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }
}

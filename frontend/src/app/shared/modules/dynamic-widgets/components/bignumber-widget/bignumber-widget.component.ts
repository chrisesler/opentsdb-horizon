import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { WidgetModel } from '../../../../../dashboard/state/widgets.state';
import {
    WidgetConfigAlertsComponent,
    WidgetConfigAxesComponent,
    WidgetConfigGeneralComponent,
    WidgetConfigLegendComponent,
    WidgetConfigMetricQueriesComponent,
    WidgetConfigQueryInspectorComponent,
    WidgetConfigTimeComponent,
    WidgetConfigVisualAppearanceComponent
} from '../../../sharedcomponents/components';
import { UnitNormalizerService, IBigNum } from '../../services/unit-normalizer.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'bignumber-widget',
    templateUrl: './bignumber-widget.component.html',
    styleUrls: []
})

export class BignumberWidgetComponent implements OnInit {
    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.bignumber-widget') private _componentClass = true;

    /** Inputs */
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    // tslint:disable:no-inferrable-types
    // tslint:disable:prefer-const
    private listenSub: Subscription;
    private isDataLoaded: boolean = false;
    selectedMetric: any;
    fontSizePercent: string = '100%';

    constructor(private interCom: IntercomService, public util: UtilsService, public UN: UnitNormalizerService) { }

    ngOnInit() {

        this.listenSub = this.interCom.responseGet().subscribe((message: IMessage) => {
            if ( message.action === 'resizeWidget' ) {
                // we get the size to update the big number
                this.fontSizePercent = this.calcFontSizePercent(message.payload.width * this.widget.gridPos.w);
                // console.log(message.payload.height * this.widget.gridPos.h + 'px');
            }
            if (message && (message.id === this.widget.id)) {
                switch (message.action) {
                    case 'updatedWidgetGroup':
                    this.isDataLoaded = true;
                    let metric;

                    // get the 'first' metric
                    for (const [id, _metrics] of Object.entries(message.payload)) {
                        metric = _metrics[0];
                        break;
                    }

                    const dps = metric['dps'];
                    let currentValueTS: number = 0;
                    let lastValueTS: number = 0;
                    let currentValue: number = 0;
                    let lastValue: number = 0;

                    // get current value
                    for (let key in dps) {
                        if (dps.hasOwnProperty(key)) {
                            if (parseInt(key, 10) > currentValueTS) {
                                currentValueTS = parseInt(key, 10);
                            }
                        }
                    }
                    currentValue = dps[currentValueTS];

                    // get last value
                    for (let key in dps) {
                        if (dps.hasOwnProperty(key)) {
                            if (parseInt(key, 10) > lastValueTS && parseInt(key, 10) < currentValueTS) {
                                lastValueTS = parseInt(key, 10);
                            }
                        }
                    }
                    lastValue = dps[lastValueTS];

                    let bigNumberMetric: IBigNumberMetric = {
                        bigNumber: currentValue,

                        prefix: '',
                        prefixSize: 's', // s m l
                        prefixAlignment: 'top', // top middle bottom

                        postfix: '',
                        postfixSize: 's',
                        postfixAlignment: 'top',

                        unit: 'ms', // auto
                        unitSize: 'm',
                        unitAlignment: 'top',
                        unitUndercased: true,

                        caption: '{{tag.host}} Latency',
                        captionSize: 's',

                        precision: 3,

                        textColor: '#ffffff',
                        backgroundColor: '#400080',

                        sparkLineEnabled: false,
                        changedIndicatorEnabled: false,
                        changeIndicatorCompareValue: currentValue - lastValue
                    };

                    metric['configuration'] = {
                        bigNum: bigNumberMetric
                    };

                    // change 'tags' from map to an array
                    if (metric['tags']) {
                        const tags: string[] = this.transform(metric['tags']);
                        metric['tagss'] = tags;
                    }

                    // set the metric
                    this.selectedMetric = metric;

                break;
                    case 'viewEditWidgetMode':
                        console.log('vieweditwidgetmode', message, this.widget);
                            // this.isDataLoaded = true;
                            // //this.data = this.dataTransformer.yamasToChartJS('donut', this.options, message.payload.rawdata);
                            // // resize
                            // let nWidth = this.widgetOutputElement.nativeElement.offsetWidth;
                            // let nHeight = this.widgetOutputElement.nativeElement.offsetHeight;
                            // this.width = nWidth - 20 + 'px';
                            // this.height = nHeight - 60 + 'px';
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

   requestData() {
        if (!this.isDataLoaded) {
            this.interCom.requestSend({
                id: this.widget.id,
                action: 'getQueryData',
                payload: this.widget.query
            });
        }
    }

    transform(map: Map<any, any>): any[] {
        let ret = [];

        Object.keys(map).forEach(function (key) {
            ret.push({
                key: key.toString(),
                value: map[key].toString()});

        });
        return ret;
    }

     bigNumToChangeIndicatorValue(bigNum: IBigNum): string {
        if (bigNum.changeIndicatorHasUnit) {
            return bigNum.num + bigNum.unit;
        } else {
            return bigNum.num;
        }
     }

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: { editMode: false, widgetId: ''}
        });
    }

    calcFontSizePercent(widgetWidth: number): string {
       const defaultWidth: number = 340;
       const fontScale: number = widgetWidth / defaultWidth;
       return fontScale * 100 + '%';
    }

    // tslint:disable-next-line:member-ordering
    valueIterationOptions: Array<any> = [
        {
            label: 'max',
            value: 'max'
        },
        {
            label: 'min',
            value: 'min'
        },
        {
            label: 'average',
            value: 'average'
        },
        {
            label: 'latest',
            value: 'latest'
        }
    ];
}

interface IBigNumberMetric {
    bigNumber: number;
    value?: string; // max, min, average, latest
    comparedTo?: number;

    prefix?: string;
    prefixSize?: string;
    prefixAlignment?: string;
    prefixUndercased?: boolean;

    postfix?: string;
    postfixSize?: string;
    postfixAlignment?: string;
    postfixUndercased?: boolean;

    unit: string;
    unitSize: string;
    unitAlignment: string;
    unitUndercased?: boolean;

    caption?: string;
    captionSize?: string;

    precision: number;

    textColor: string;
    backgroundColor: string;

    sparkLineEnabled: boolean;
    changedIndicatorEnabled?: boolean;
    changeIndicatorCompareValue?: number;
    // changeIndicatorCompareOperator: string;
}

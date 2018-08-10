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
import { UnitNormalizerService } from '../../services/unit-normalizer.service';
import { UtilsService } from '../../../../../core/services/utils.service';

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

    /** Outputs */

    /** Local variables */
    // tslint:disable:no-inferrable-types
    selectedMetric: any;
    numberOfMetrics: number = 1;
    fakeMetrics: Array<any> = new Array<any>();
    _clientHeight: number = 300;
    fontSizePercent: string = '150%';

    constructor(private interCom: IntercomService, public utils: UtilsService, public UN: UnitNormalizerService) { }

    ngOnInit() {

        // Data (Binary) - kbytes
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'kbytes', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'kbytes', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Data (Decimal) - decbytes
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'decbytes', 3));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'decbytes');
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Data Rate - MBs
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'MBs', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'MBs', 2);
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // Throughput
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i * i), 'rps', 20));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i * i), 'rps', 20 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // TIME
        // console.log('Grafana:');
        // for (let i = 0; i < 20; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(1.234 * Math.pow(10, i), 'ms', 4));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 20; i++) {
        //     // let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'ms', 4);
        //     let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'ms', 4 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // SHORT
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(-1.234 * Math.pow(10, i), 'short', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(-1.234 * Math.pow(10, i), 'short', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        // USD
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(1.234 * Math.pow(10, i), 'currencyUSD', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(1.234 * Math.pow(10, i), 'usd', 2 );
        //     console.log(' ' + bigNum.unit + bigNum.num);
        // }

        // Unrecognized unit defaults to 'short' + unit
        // console.log('Grafana:');
        // for (let i = 0; i < 10; i++) {
        //     console.log(' ' + this.UN.kbnPreciseNumber(0.1234 * Math.pow(10, i), 'xyz', 2));
        // }
        // console.log('Zack\'s:');
        // for (let i = 0; i < 10; i++) {
        //     let bigNum = this.UN.getBigNumber(0.1234 * Math.pow(10, i), 'xyz', 2 );
        //     console.log(' ' + bigNum.num + ' ' + bigNum.unit);
        // }

        for (let i = 0; i < this.numberOfMetrics; i++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234 * Math.pow(10, i),

                prefix: '-',
                prefixSize: 'l',
                prefixAlignment: 'top',
                postfix: 'per hour',
                postfixSize: 'm',
                postfixAlignment: 'bottom',

                unit: 'short', // short
                unitSize: 'm',
                unitAlignment: 'bottom',

                caption: 'Monitoring Revenue',
                captionSize: 's',

                precision: 3,

                textColor: '#ffffff',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0',

                sparkLineEnabled: false,
                changedIndicatorEnabled: false
            };


            this.fakeMetrics.push(
                {
                    id: i,
                    type: 'metric',
                    alias: 'M1',
                    label: 'Metric_namespace.app-name.whatever.some_metric_' + String(i + 1),
                    metric: 'Metric_namespace.app-name.whatever.some_metric_' + String(i + 1),
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
                    functions: [],
                    configuration: {
                        visualAppearance: {
                            visualization: 'line',
                            color: 'green',
                            lineWeight: '2px',
                            lineType: 'solid',
                            logScale: false
                        },
                        bigNum: bigNumberMetric
                    }
                }
            );
        }

        this.selectedMetric = this.fakeMetrics[0];
    }

    // setAllMetricsToUnSelected() {
    //     // tslint:disable-next-line:prefer-const
    //     for (let metric of this.fakeMetrics) {
    //         metric['configuration']['bigNum']['selected'] = false;
    //         this.selectedMetric = null;
    //     }
    // }

    // setMetricToSelected(metric: any) {
    //     this.setAllMetricsToUnSelected();
    //     // tslint:disable-next-line:prefer-const
    //     for (let _metric of this.fakeMetrics) {
    //         if (_metric === metric) {
    //             _metric['configuration']['bigNum']['selected'] = true;
    //             this.selectedMetric = metric;
    //         }
    //     }
    // }

    // setSelectedMetric() {
    //     // tslint:disable-next-line:prefer-const
    //     for (let _metric of this.fakeMetrics) {
    //         if (_metric['configuration']['bigNum']['selected']) {
    //             this.selectedMetric = _metric;
    //         }
    //     }
    // }

    /**
     * Services
     */

    // None yet

    /**
     * Behaviors
     */

    closeViewEditMode() {
        this.interCom.requestSend(<IMessage>{
            action: 'closeViewEditMode',
            payload: { editMode: false, widgetId: ''}
        });
    }

    calcFontSizePercent(widgetWidth: number, numOfBigNumbers: number): string {
       const defaultWidth: number = 690;
       const fontScaleMultiple: number = 1.5;
       const numOfCols: number = numOfBigNumbers < 4 ? numOfBigNumbers : 2;
       const fontScale: number = (fontScaleMultiple * widgetWidth) / (numOfCols * defaultWidth);
       return fontScale + '%';
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

    // tslint:disable-next-line:member-ordering
    fakeGroups: Array<any> = [
        {
            id: 'group-0',
            label: 'Untitled Group',
            collapsed: false,
            visible: true,
            colorFamily: 'green',
            selectedState: 'none', // none,all,some
            metrics: this.fakeMetrics,
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

    postfix?: string;
    postfixSize?: string;
    postfixAlignment?: string;

    unit: string;
    unitSize: string;
    unitAlignment: string;

    caption?: string;
    captionSize?: string;

    precision: number;

    textColor: string;
    backgroundColor: string;

    sparkLineEnabled: boolean;
    changedIndicatorEnabled?: boolean;
    // changeIndicatorCompareValue: number;
    // changeIndicatorCompareValue: string;
}

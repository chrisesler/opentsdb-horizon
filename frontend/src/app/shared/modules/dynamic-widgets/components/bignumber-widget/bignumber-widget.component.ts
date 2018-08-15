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

        // console.log(this.widget);

        for (let i = 0; i < this.numberOfMetrics; i++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234567 * Math.pow(10, i),

                prefix: '',
                prefixSize: 'l',
                prefixAlignment: 'top',

                postfix: '',
                postfixSize: 'm',
                postfixAlignment: 'bottom',

                unit: 'auto', // short
                unitSize: 'm',
                unitAlignment: 'middle',

                caption: 'Monitoring Revenue',
                captionSize: 's',

                precision: 3,

                textColor: '#ffffff',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0',

                sparkLineEnabled: false,
                changedIndicatorEnabled: false,
                changeIndicatorCompareValue: 1234 * Math.pow(10, i)
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

    /**
     * Services
     */

    // None yet

    /**
     * Behaviors
     */

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

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
import kbn from './kbn';

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
    numberOfMetrics: number = 4; // 1:150%   2:75%   3:50%   4:75%
    fakeMetrics: Array<any> = new Array<any>();
    _clientHeight: number = 300;
    fontSizePercent: string = '75%';

    constructor(private interCom: IntercomService) { }

    ngOnInit() {
        for (let i = 0; i < this.numberOfMetrics; i++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234 * Math.pow(10, i),
                precision: 3,
                unit: 'currencyUSD', // short
                prefix: '',
                postfix: 'per hour',
                caption: 'Monitoring Revenue',
                prefixSize: 'l',
                postfixSize: 'm',
                captionSize: 's',
                textColor: '#ffffff',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0',
                shorthand: 'm' + String(i + 1),
                alias: 'app-name.whatever.some_metric_' + String(i + 1),
                showAlias: true
            };
            bigNumberMetric.backgroundColorTransparent = this.hexToTransparentHex(bigNumberMetric.backgroundColor);

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
    }

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

    hexToTransparentHex(hex: string): string {
        return hex + '80'; // 80 is 50% in hex
    }

    calcFontSizePercent(widgetWidth: number, numOfBigNumbers: number): string {
       const defaultWidth: number = 690;
       const fontScaleMultiple: number = 1.5;
       const numOfCols: number = numOfBigNumbers < 4 ? numOfBigNumbers : 2;
       const fontScale: number = (fontScaleMultiple * widgetWidth) / (numOfCols * defaultWidth);
       return fontScale + '%';
    }

    preciseNumber(desc: string, value: number, precision: number) {
        const numDigitsBeforeDecimal = Math.abs(value).toFixed().toString() === '0' ? 0 : Math.abs(value).toFixed().toString().length;
        return kbn.valueFormats[desc](value, precision - numDigitsBeforeDecimal, precision - numDigitsBeforeDecimal);
    }

    parseKeywords(metric: any, inputString: string): string {
        const regExp = /{{([^}}]+)}}/g; // get chars between {{}}
        const matches = inputString.match(regExp);
        if (matches) {
            let tagValues = new Array<string>();
            let captureGroupToValueMap = {};
            for (let i = 0; i < matches.length; i++) {
                const captureGroup = matches[i];
                const captureGroupSplit = captureGroup.split('.');
                const keyword = captureGroupSplit[0].substring(2).toLowerCase().trim();
                const tagKey = captureGroupSplit[1].substring(0, captureGroupSplit[1].length - 2).toLowerCase().trim();
                captureGroupToValueMap[captureGroup] = captureGroup;

                // get tag values
                if (keyword === 'tag' && tagKey) {
                    for (let keyValueCombo of metric['tags']) {
                        if (keyValueCombo['key'].toLowerCase() === tagKey) {
                            captureGroupToValueMap[captureGroup] = keyValueCombo['value'];
                        }
                    }
                }

                // set tag values in string
                for (const [_captureGroup, tagValue] of Object.entries(captureGroupToValueMap)) {
                    inputString = inputString.replace(_captureGroup, tagValue.toString());
                }
            }
        }
        return inputString;
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
    precision: number;
    unit: string;

    value?: string; // max, min, average, latest
    comparedTo?: number;

    prefix?: string;
    postfix?: string;
    caption?: string;

    prefixSize?: string;
    postfixSize?: string;
    captionSize?: string;

    textColor: string;
    backgroundColor: string;
    backgroundColorTransparent?: string;
    shorthand?: string;
    alias?: string;
    showAlias?: boolean;
}

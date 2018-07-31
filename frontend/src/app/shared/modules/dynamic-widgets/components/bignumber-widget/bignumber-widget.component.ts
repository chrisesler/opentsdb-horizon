import { Component, OnInit, HostBinding, Input } from '@angular/core';
import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';
import { WidgetModel } from '../../../../../dashboard/state/dashboard.state';
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
    fakeMetrics: Array<any> = new Array<any>();
    numberOfMetrics: number = 3;
    _clientHeight: number = 300;

    constructor(private interCom: IntercomService) { }

    ngOnInit() {
        for (let i = 0; i < this.numberOfMetrics; i ++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234 + i * 10000,
                prefix: '$',
                postfix: 'per hour',
                caption: 'Monitoring Revenue',
                prefixSize: 'l',
                postfixSize: 'm',
                captionSize: 's',
                textColor: '#ffffff',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0',
                shorthand: 'm' + String(i + 1)
            };
            bigNumberMetric.backgroundColorTransparent = this.hexToTransparentHex(bigNumberMetric.backgroundColor);

            this.fakeMetrics.push(
                {
                    id: i,
                    type: 'metric',
                    alias: 'M1',
                    label: 'Metric_namespace.app-name.whatever.some_metric_' + i,
                    metric: 'Metric_namespace.app-name.whatever.some_metric_' + i,
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


        console.log('**');
        console.log(this.widget);
        console.log(this.widget.clientSize);
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

    value?: string; //max, min, average, latest
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
}

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
import { KBNService } from '../../services/kbn.service';
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
    numberOfMetrics: number = 4;
    fakeMetrics: Array<any> = new Array<any>();
    _clientHeight: number = 300;
    fontSizePercent: string = '150%';

    constructor(private interCom: IntercomService, public utils: UtilsService, public kbn: KBNService) { }

    ngOnInit() {
        for (let i = 0; i < this.numberOfMetrics; i++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234 * Math.pow(10, i),
                precision: 3,
                unit: 'short', // short
                prefix: '-',
                postfix: 'per hour',
                caption: 'Monitoring Revenue',
                prefixSize: 'l',
                postfixSize: 'm',
                captionSize: 's',
                textColor: '#ffffff',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0',
                selected: false,
                shorthand: 'm' + String(i)
            };

            if (i === 1) {
                bigNumberMetric.selected = true;
            }

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

        this.setMetricToSelected(this.fakeMetrics[1]);
    }

    setAllMetricsToUnSelected() {
        // tslint:disable-next-line:prefer-const
        for (let metric of this.fakeMetrics) {
            metric['configuration']['bigNum']['selected'] = false;
            this.selectedMetric = null;
        }
    }

    setMetricToSelected(metric: any) {
        console.log('inside setMetricToSelected');
        this.setAllMetricsToUnSelected();
        // tslint:disable-next-line:prefer-const
        for (let _metric of this.fakeMetrics) {
            if (_metric === metric) {
                _metric['configuration']['bigNum']['selected'] = true;
                this.selectedMetric = metric;
            }
        }
    }

    setSelectedMetric() {
        // tslint:disable-next-line:prefer-const
        for (let _metric of this.fakeMetrics) {
            if (_metric['configuration']['bigNum']['selected']) {
                this.selectedMetric = _metric;
            }
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
    precision: number;
    unit: string;
    selected: boolean;
    shorthand: string;

    value?: string; // max, min, average, latest
    comparedTo?: number;

    prefix?: string;
    postfix?: string;
    caption?: string;

    prefixSize?: string;
    postfixSize?: string;
    captionSize?: string;

    prefixAlignment?: string;
    postfixAlignment?: string;
    captionAlignment?: string;

    textColor: string;
    backgroundColor: string;
}

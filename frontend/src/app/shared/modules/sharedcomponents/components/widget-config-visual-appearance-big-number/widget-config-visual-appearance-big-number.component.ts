import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-visual-appearance-big-number',
    templateUrl: './widget-config-visual-appearance-big-number.component.html',
    styleUrls: []
})
export class WidgetConfigVisualAppearanceBigNumberComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.visual-appearance-configuration-big-number') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Local variables */

    selectedMetric: object;
    // // TODO: REMOVE FAKE METRICS
    // fakeMetrics: Array<object> = [
    //     {
    //         id: 0,
    //         type: 'metric',
    //         alias: 'M1',
    //         label: 'Metric_namespace.app-name.whatever.some_metric',
    //         metric: 'Metric_namespace.app-name.whatever.some_metric',
    //         color: 'green',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: 'bf1'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: 'lala-01'
    //             },
    //             {
    //                 key: '_aggregate',
    //                 value: 'SUM'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'green',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     },
    //     {
    //         id: 1,
    //         type: 'metric',
    //         alias: 'M2',
    //         label: 'Metric_namespace.app-name.something.some_metric',
    //         metric: 'Metric_namespace.app-name.something.some_metric',
    //         color: 'amber',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: 'bf1'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: 'hg-01'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'amber',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     },
    //     {
    //         id: 1,
    //         type: 'expression',
    //         alias: 'E1',
    //         label: 'expression-name',
    //         expression: 'm1 + m2 / m2',
    //         color: 'fuchsia',
    //         collapsed: false,
    //         visible: true,
    //         tags: [
    //             {
    //                 key: 'colo',
    //                 value: '*'
    //             },
    //             {
    //                 key: 'hostgroup',
    //                 value: '*'
    //             }
    //         ],
    //         functions: [],
    //         configuration: {
    //             visualAppearance: {
    //                 visualization: 'line',
    //                 color: 'fuschia',
    //                 lineWeight: '2px',
    //                 lineType: 'solid',
    //                 logScale: false
    //             }
    //         }
    //     }
    // ];

    setSelectedMetric(metric) {
        this.selectedMetric = metric;
    }

    constructor() { }

    ngOnInit() {
    }

}

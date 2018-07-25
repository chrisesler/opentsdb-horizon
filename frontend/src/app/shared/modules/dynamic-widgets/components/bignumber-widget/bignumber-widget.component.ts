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
    bigNumberConfig: IBigNumberConfig = new IBigNumberConfig();
    numberOfMetrics: number = 4;

    constructor(private interCom: IntercomService) { }

    ngOnInit() {

        // tslint:disable-next-line:prefer-const
        let _bigNumberMetrics: IBigNumberMetric[] = new Array<IBigNumberMetric>();

        for (let i = 0; i < this.numberOfMetrics; i++) {

            // tslint:disable-next-line:prefer-const
            let bigNumberMetric: IBigNumberMetric = {
                bigNumber: 1234 + i * 10000,
                metricName: 'UDB_REST_API.OpenRemote',
                prefix: '$',
                postfix: 'per hour',
                caption: 'Monitoring Revenue',
                prefixSize: 'l',
                postfixSize: 'm',
                captionSize: 's',
                textColor: '#' + i + '00000',
                backgroundColor: '#' + String(4 + i) + '0' + String(i) + '0' + String(8 - i) + '0'
            };
            bigNumberMetric.backgroundColorTransparent = this.hexToTransparentHex(bigNumberMetric.backgroundColor);
            bigNumberMetric.backgroundLuma = this.hexToLuma(bigNumberMetric.backgroundColor);
            _bigNumberMetrics[i] = bigNumberMetric;
        }

        this.bigNumberConfig = {
            clientHeight: 300 + 'px',
            bigNumberMetrics: _bigNumberMetrics
        };

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
            payload: true
        });
    }

    hexToLuma(hex: string): number {
        const bigint = parseInt(hex.substring(1), 16);
        // tslint:disable:no-bitwise
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    }

    hexToTransparentHex(hex: string): string {
        return hex + '80'; // 80 is 50% in hex
    }
}

class IBigNumberConfig {
    clientHeight: string;
    bigNumberMetrics: IBigNumberMetric[];
}

class IBigNumberMetric {
    bigNumber: number;
    metricName?: string;

    prefix?: string;
    postfix?: string;
    caption?: string;

    prefixSize?: string;
    postfixSize?: string;
    captionSize?: string;

    textColor: string;
    backgroundColor: string;

    // calculate from background color
    backgroundColorTransparent?: string;
    backgroundLuma?: number;
}

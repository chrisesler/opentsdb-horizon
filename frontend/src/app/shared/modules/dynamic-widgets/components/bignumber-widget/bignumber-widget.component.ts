import { Component, OnInit, HostBinding, Input } from '@angular/core';

// import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

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
    bigNumber: string = '3567';

    prefix: string = '$'; // this.widget.config.visualization.prefix.value;
    postfix: string = 'per hour';
    caption: string = 'Monitoring Revenue';

    prefixSize: string = 'l';
    postfixSize: string = 'm';
    captionSize: string = 's';

    textColor: string = '#000000';
    backgroundColor: string = '#40008B';

    metricName: string = 'UDB_REST_API.OpenRemote';

    clientHeight: string = 226 + 'px'; // this.widget.clientSize.height;

    backgroundColorTransparent: string = this.hexToTransparentHex(this.backgroundColor);
    backgroundLuma: number = this.hexToLuma(this.backgroundColor);

    constructor(private interCom: IntercomService) { }

    ngOnInit() {
        console.log('**');
        console.log(this.widget);
        // console.log(this.widget.clientSize);
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

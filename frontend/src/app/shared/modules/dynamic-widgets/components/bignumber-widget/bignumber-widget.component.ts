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
    bigNumber: string = '3567';
    prefix: string = '$'; //this.widget.config.visualization.prefix.value;
    postfix: string = 'per hour';
    caption: string = 'gross';

    prefixSize: string = 'l';
    postfixSize: string = 'm';
    captionSize: string = 's';

    textColor: string = '#000000';
    backgroundColor: string = '#40008B';

    metricName: string = 'UDB_REST_API.OpenRemote';
    backgroundLuma: number = this.getLuma(this.backgroundColor);

    constructor(private interCom: IntercomService) { }

    ngOnInit() {

        console.log('**' + this.backgroundLuma);

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

    getLuma(hex: string) {
        const bigint = parseInt(hex.substring(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
    }

}

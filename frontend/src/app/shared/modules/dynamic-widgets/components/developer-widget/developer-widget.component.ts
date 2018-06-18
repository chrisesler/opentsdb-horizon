import { Component, OnInit, HostBinding, Input } from '@angular/core';

import { MatDialog, MatDialogConfig, MatDialogRef, DialogPosition } from '@angular/material';

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
    selector: 'developer-widget',
    templateUrl: './developer-widget.component.html',
    styleUrls: []
})
export class DeveloperWidgetComponent implements OnInit {
    @HostBinding('class.widget-panel-content') private _hostClass = true;

    /** Inputs */
    @Input() editMode: boolean;
    @Input() widget: WidgetModel;

    /** Outputs */

    /** Local variables */

    // NOTE: widget types should only be temporary here, as they should be added to some starting point widget
    // Available Widget Types
    availableWidgetTypes: Array<object> = [
        {
            label: 'Bar Graph',
            type: 'WidgetBarGraphComponent',
            iconClass: 'widget-icon-bar-graph'
        },
        {
            label: 'Area Graph',
            type: 'WidgetAreaGraphComponent',
            iconClass: 'widget-icon-area-graph'
        },
        {
            label: 'Line Chart',
            type: 'LineChartComponent',
            // TODO: need to eventually switch to WidgetLineChartComponent
            // type: 'WidgetLineChartComponent',
            iconClass: 'widget-icon-line-chart'
        },
        {
            label: 'Big Number',
            type: 'WidgetBigNumberComponent',
            iconClass: 'widget-icon-big-number'
        },
        {
            label: 'Donut Chart',
            type: 'WidgetDonutChartComponent',
            iconClass: 'widget-icon-donut-chart'
        },
        {
            label: 'Statuses',
            type: 'WidgetStatusComponent',
            iconClass: 'widget-icon-statuses'
        }
    ];

    constructor(private interCom: IntercomService) { }

    ngOnInit() {
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


}

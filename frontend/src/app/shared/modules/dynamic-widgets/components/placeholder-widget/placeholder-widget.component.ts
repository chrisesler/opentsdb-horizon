import { Component, OnInit, HostBinding, Input } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'placeholder-widget',
    templateUrl: './placeholder-widget.component.html',
    styleUrls: ['./placeholder-widget.component.scss']
})
export class PlaceholderWidgetComponent implements OnInit {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @Input() editMode: boolean;
    @Input() widget: any;

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


    ngOnInit() {
        console.log('WBASE :: onInit', this.widget);
    }

    selectWidgetType(wtype: any, event: any) {
        console.log('SELECT WIDGET TYPE', wtype, event);
    }

}

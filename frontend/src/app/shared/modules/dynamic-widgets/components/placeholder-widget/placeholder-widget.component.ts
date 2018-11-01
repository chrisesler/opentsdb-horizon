import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'placeholder-widget',
    templateUrl: './placeholder-widget.component.html',
    styleUrls: ['./placeholder-widget.component.scss']
})
export class PlaceholderWidgetComponent implements OnInit {

    @HostBinding('class.widget-panel-content') private _hostClass = true;
    @HostBinding('class.placeholder-widget') private _componentClass = true;

    @Input() editMode: boolean;
    @Input() widget: any;
    @Output() loadNewWidget = new EventEmitter<any>();

    // Available Widget Types
    availableWidgetTypes: Array<object> = [
        {
            label: 'Bar Graph',
            type: 'BarchartWidgetComponent',
            iconClass: 'widget-icon-bar-graph'
        },/*
        {
            label: 'Area Graph',
            type: 'WidgetAreaGraphComponent',
            iconClass: 'widget-icon-area-graph'
        },*/
        {
            label: 'Line Chart',
            type: 'LinechartWidgetComponent',
            iconClass: 'widget-icon-line-chart'
        },
        {
            label: 'Big Number',
            type: 'BignumberWidgetComponent',
            iconClass: 'widget-icon-big-number'
        },
        {
            label: 'Donut Chart',
            type: 'DonutWidgetComponent',
            iconClass: 'widget-icon-donut-chart'
        }/*,
        {
            label: 'Statuses',
            type: 'WidgetStatusComponent',
            iconClass: 'widget-icon-statuses'
        }*/
    ];


    ngOnInit() {
        console.log('WBASE :: onInit', this.widget);
    }

    selectWidgetType(wtype: any, event: any) {
        console.log('SELECT WIDGET TYPE', wtype, event);
        this.loadNewWidget.emit(wtype);
    }

}

import {
    Component,
    OnInit,
    OnChanges,
    Input,
    Output,
    ViewChild,
    HostBinding,
    EventEmitter,
    SimpleChanges
} from '@angular/core';

import { MatMenu, MatMenuTrigger } from '@angular/material';
import { Event } from '@angular/router';

@Component({
    selector: 'app-widget-base',
    templateUrl: './widgetbase.component.html',
    styleUrls: ['./widgetbase.component.scss']
})
export class WidgetbaseComponent implements OnInit, OnChanges {
    @HostBinding('class.widget-panel-content') private _hostClass = true;

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    @Input() editMode: boolean;
    @Input() widget: any;

    fakeMetrics: Array<object> = [
        {
            id: 0,
            type: 'metric',
            alias: 'M1',
            label: 'Metric_namespace.app-name.whatever.some_metric',
            metric: 'Metric_namespace.app-name.whatever.some_metric',
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
            functions: []
        },
        {
            id: 1,
            type: 'metric',
            alias: 'M2',
            label: 'Metric_namespace.app-name.something.some_metric',
            metric: 'Metric_namespace.app-name.something.some_metric',
            color: 'amber',
            collapsed: false,
            visible: true,
            tags: [
                {
                    key: 'colo',
                    value: 'bf1'
                },
                {
                    key: 'hostgroup',
                    value: 'hg-01'
                }
            ],
            functions: []
        },
        {
            id: 1,
            type: 'expression',
            alias: 'E1',
            label: 'expression-name',
            expression: 'm1 + m2 / m2',
            color: 'fuchsia',
            collapsed: false,
            visible: true,
            tags: [
                {
                    key: 'colo',
                    value: '*'
                },
                {
                    key: 'hostgroup',
                    value: '*'
                }
            ],
            functions: []
        }
    ];

    constructor() { }

    ngOnInit() {
        console.log('WBASE :: onInit', this.widget);
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('***** CHANGES *******', changes);
    }

    toggleQueryItemVisibility(item: any, event: MouseEvent) {
        console.log('TOGGLE QUERY ITEM VISIBILITY', item);
        event.stopPropagation();
        item.visible = !item.visible;
    }

    duplicateQueryItem(item: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    deleteQueryItem(item: any, event: MouseEvent) {
        console.log('DELETE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

}

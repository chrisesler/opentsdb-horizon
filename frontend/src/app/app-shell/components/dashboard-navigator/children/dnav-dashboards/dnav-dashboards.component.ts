import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    HostListener,
    ViewChild
} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-dashboards',
    templateUrl: './dnav-dashboards.component.html',
    styleUrls: ['./dnav-dashboards.component.scss']
})
export class DnavDashboardsComponent implements OnInit {

    @HostBinding('class.dnav-dashboards') private _hostClass = true;

    @Input() dashboards: any[] = [];

    @Output() dashboardAction: EventEmitter<any> = new EventEmitter();

    // tslint:disable-next-line:no-inferrable-types
    bulkEdit: boolean = false;

    constructor() { }

    ngOnInit() {
    }

    /** Events */

    // create new dashboard
    createDashboard() {
        this.dashboardAction.emit({
            action: 'createDashboard'
        });
    }

    // bulk editing
    editDashboards() {

    }

}

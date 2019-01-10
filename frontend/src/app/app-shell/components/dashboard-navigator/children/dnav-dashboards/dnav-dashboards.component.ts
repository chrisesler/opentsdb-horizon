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

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-dashboards',
    templateUrl: './dnav-dashboards.component.html',
    styleUrls: []
})
export class DnavDashboardsComponent implements OnInit {

    @HostBinding('class.dnav-dashboards') private _hostClass = true;

    @Input() dashboards: any[] = [];
    @Input() resourceType: any = ''; // personal<string> | namespace<string>

    @Output() dashboardAction: EventEmitter<any> = new EventEmitter();

    // tslint:disable-next-line:no-inferrable-types
    bulkEdit: boolean = false;

    constructor(
        private interCom: IntercomService
    ) { }

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

    dashboardItemEvent(event: any) {
        this.dashboardAction.emit(event);
    }

}

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
    // tslint:disable-next-line:no-inferrable-types
    @Input() activeMediaQuery: string = '';

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

    dashboardItemAction(dashboard: any, event: any) {

        switch (event.action) {
            case 'navigateTo':
            case 'openNewTab':
                this.dashboardAction.emit(event);
                break;
            case 'deleteDashboard':
                this.dashboardAction.emit({
                    action: 'deleteDashboard',
                    data: {
                        source: dashboard
                    }
                });
                break;
            case 'moveDashboard':
                this.dashboardAction.emit({
                    action: 'moveDashboard',
                    data: {
                        source: dashboard,
                        destination: event.destination
                    }
                });
                break;
            default:
                this.dashboardAction.emit({
                    ...event,
                    dashboard
                });
                break;
        }
    }

}

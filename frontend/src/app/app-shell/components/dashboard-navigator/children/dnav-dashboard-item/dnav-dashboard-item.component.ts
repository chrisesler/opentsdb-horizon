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

import {
    MatMenuTrigger
} from '@angular/material';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-dashboard-item',
    templateUrl: './dnav-dashboard-item.component.html',
    styleUrls: []
})
export class DnavDashboardItemComponent implements OnInit {

    @HostBinding('class.dnav-dashboard-item') private _hostClass = true;
    @HostBinding('class.dnav-menu-opened') private menuOpened = false;

    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    @Input() dashboard: any = {};

    @Output() dashboardAction: EventEmitter<any> = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    /** Menu Events */

    clickMore(event) {
        event.stopPropagation();
        this.menuTrigger.toggleMenu();
    }

    menuState(state: boolean) {
        console.log('MENU STATE', state);
        this.menuOpened = state;
    }


    /** Host Events */
    @HostListener('click', ['$event'])
    onclick(event) {
        console.log('HOST CLICK', event);
    }



}

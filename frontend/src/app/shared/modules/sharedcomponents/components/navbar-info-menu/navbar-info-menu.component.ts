import { Component, OnInit, HostBinding, ViewChild, Input } from '@angular/core';

import { MatMenuTrigger, MenuPositionX  } from '@angular/material';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'navbar-info-menu',
    templateUrl: './navbar-info-menu.component.html',
    styleUrls: []
})
export class NavbarInfoMenuComponent implements OnInit {

    @HostBinding('class.navbar-info-menu') private _hostClass = true;

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    @Input() xPosition: MenuPositionX = 'before';

    constructor() { }

    ngOnInit() {
    }

}

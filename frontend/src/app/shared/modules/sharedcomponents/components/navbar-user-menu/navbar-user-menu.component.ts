import { Component, OnInit, HostBinding, ViewChild } from '@angular/core';

import { MatMenuTrigger } from '@angular/material';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'navbar-user-menu',
    templateUrl: './navbar-user-menu.component.html',
    styleUrls: []
})
export class NavbarUserMenuComponent implements OnInit {

    @HostBinding('class.navbar-user-menu') private _hostClass = true;

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    constructor() { }

    ngOnInit() {
    }

}

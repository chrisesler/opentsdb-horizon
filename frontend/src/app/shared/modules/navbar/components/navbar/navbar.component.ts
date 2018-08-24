import { Component, OnInit, Input, Output, EventEmitter, HostBinding, ViewChild } from '@angular/core';

import { Router } from '@angular/router';

import { CdkService } from '../../../../../core/services/cdk.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

    @HostBinding('class.app-navbar') private _hostClass = true;

    @Input() theme: string;
    @Output() themeChange = new EventEmitter<string>();

    @Output() sidenavToggle: EventEmitter<any> = new EventEmitter();

    constructor(
        private router: Router,
        public cdkService: CdkService
    ) { }

    ngOnInit() { }

    toggleSidenav() {
        this.sidenavToggle.emit(true);
    }

}

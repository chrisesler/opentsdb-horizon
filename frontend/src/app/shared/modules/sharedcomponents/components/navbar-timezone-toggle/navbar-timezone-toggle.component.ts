import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'navbar-timezone-toggle',
    templateUrl: './navbar-timezone-toggle.component.html',
    styleUrls: []
})
export class NavbarTimezoneToggleComponent implements OnInit {

    @HostBinding('class.navbar-timezone-toggle') private _hostClass = true;

    // tslint:disable-next-line:no-inferrable-types
    @Input() timezone: string = '';

    /** Local variables */
    // tslint:disable-next-line:no-inferrable-types
    selectedTimezone: string = '';

    constructor() {}

    ngOnInit() {
        this.selectedTimezone = this.timezone;
    }

    changeTimezone(tz: string) {
        if (this.selectedTimezone !== tz) {
            this.selectedTimezone = tz;
        }
    }

}

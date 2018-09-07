import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'activity-panel',
    templateUrl: './activity-panel.component.html',
    styleUrls: []
})
export class ActivityPanelComponent implements OnInit {
    @HostBinding('class.activity-panel') private _hostClass = true;

    constructor() { }

    ngOnInit() {
    }

}

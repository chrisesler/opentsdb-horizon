import { Component, OnInit, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'data-explorer',
    templateUrl: './data-explorer.component.html',
    styleUrls: []
})
export class DataExplorerComponent implements OnInit {

    @HostBinding('class.data-explorer-component') private _hostClass = true;

    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.is-open') explorerOpen: boolean = false;

    @Input() data: any;

    constructor() { }

    ngOnInit() {
    }

    toggleExplorerOpen() {
        this.explorerOpen = !this.explorerOpen;
    }

}

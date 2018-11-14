import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    Output
} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'test-navigator',
    templateUrl: './test-navigator.component.html',
    styleUrls: []
})
export class TestNavigatorComponent implements OnInit {

    @HostBinding('class.test-navigator') private _hostClass = true;

    @Input() activeNavSection: any = '';
    @Input() drawerMode: any = 'over';

    @Output() toggleDrawer: EventEmitter<any> = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    toggleDrawerMode() {
        // console.log('TOGGLE 1');
        this.toggleDrawer.emit(true);
    }

}

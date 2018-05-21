import {
    Component,
    OnInit,
    OnChanges,
    Input,
    Output,
    HostBinding,
    EventEmitter
} from '@angular/core';

import { locateHostElement } from '@angular/core/src/render3/instructions';

@Component({
    selector: 'app-wsample',
    templateUrl: './wsample.component.html',
    styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit {
    @HostBinding('class.widget-panel-content') private hostClass = true;

    @Input() editMode: boolean;
    @Input() widget: any;

    constructor() { }

    ngOnInit() { }

}

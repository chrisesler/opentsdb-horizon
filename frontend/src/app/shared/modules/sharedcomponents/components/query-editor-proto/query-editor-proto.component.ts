import {
    Component,
    HostBinding,
    OnInit
} from '@angular/core';

@Component({
    selector: 'app-query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: []
})
export class QueryEditorProtoComponent implements OnInit {

    @HostBinding('class.query-editor-proto') private _hostClass = true;

    constructor() { }

    ngOnInit() {
    }

}

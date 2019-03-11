import {
    Component,
    HostBinding,
    Input,
    OnInit
} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: []
})
export class QueryEditorProtoComponent implements OnInit {

    @HostBinding('class.query-editor-proto') private _hostClass = true;

    @Input() type;
    @Input() query: any = {
        namespace: 'udb',
        metrics: [],
        filters: [],
        settings: {
            visual: {
                visible: true
            }
        }
    };
    @Input() label = '';
    @Input() edit = [];

    editNamespace = false;

    constructor() { }

    ngOnInit() {
    }

    addFunction() {
        // do something
    }

}
